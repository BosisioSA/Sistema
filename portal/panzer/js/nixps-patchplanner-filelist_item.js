/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window, jQuery, cloudflow_path */

/*global panzer_layout_edition_sheet, _*/
/*global nixps, namespace */

(function( $ ) {

    $.widget("nixps-patchplanner.filelist_item", {

        options: {
        	/**
        	 * @brief the cloudflow path of the item
        	 */
        	path: null
        },


        _create: function() {
        	if (! this.options.path instanceof cloudflow_path) {
        		throw new Error('invalid parameter');
        	}

        	this.element.attr('tabindex', '1');
            this.element.attr('path', this.options.path.get_full_path());
        	this.element.addClass('element');
            this.element.addClass(this.widgetFullName);

            var that = this;
            nixps.patchplanner.util.has_asset_thumb(this.options.path).then(function(pHasThumb) {
                if (pHasThumb) {
                    that._createAssetView();
                }
                else {
                    that.disable();
                    that._createWaitingView();
                    that._delay(that._checkMetadataProgress, 3000);
                }
            }).fail(function() {
                that.disable();
                that._createWaitingView();
                that._delay(that._checkMetadataProgress, 3000);
            });

        	this._on(this.element, {
        		'dblclick': function(pEvent) {
        			this._trigger('dblclick', pEvent);
        		},
        		'click .infoicon': this._infoIconClickedHandler,
        		'dblclick .infoicon': function() {
        			return false;
        		},
        		'click .closebutton': this._closeButtonClickedHandler,
        		'dblclick .closebutton': function() {
        			return false;
        		}
        	});

            this._on(true, this.element, {
                'click': function(pEvent) {
                    this._trigger('click', pEvent);
                },
                'filelist_itemmetadatafinished': this._metadataFinishedHandler
            });
        },


        select: function(pSelected) {
            if (pSelected) {
                this.element.addClass('selected');
            }
            else {
                this.element.removeClass('selected');
            }
        },


        _createAssetView: function() {
            this.element.empty();

            var session = new nixps.patchplanner.Session();
            var layoutDocument = session.load_layout_document();
            var jobSettings = new nixps.patchplanner.job_settings(this.options.path, layoutDocument.get_file_data(this.options.path));
            var distortionUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('distortion');
            var noUnit = new nixps.cloudflow.Unit({ unit: '' });

            var distortionDisplay = distortionUnit.toString(jobSettings.get_distortion() * 100);
            var jobDecorator = layoutDocument.get_job_decorator(this.options.path);
            var mountingMethod = layoutDocument.get_settings().mounting_method;
            $.template(
                "filelist_item",
                "<div class='content'>" +
                    "<div class='fileicon'>" +
                        "<div class='thumb'>" +
                            "<img class='filethumb' style='max-width: 140px; max-height: 140px; pointer-events: none;' src='${thumb}'></img>" +
                            "<div class='overlay'></div>" +
                            "<div class='distortion'>${distortion}</div>" +
                            "<div class='markbadge'><img src='/portal/images/patchplanner/mark_badge.png'/></div>" +
                        "</div>" +
                        "<div class='namewrapper'>" +
                            "<div class='name'>${name}</div>" +
                        "</div>" +
                    "</div>" +
                    "<div class='infoiconholder'>" +
                        "<div class='infoicon ui-icon ui-icon-info'></div>" +
                        "<img class='closebutton' style='display: none; z-index: 520; cursor:pointer;' src='/portal/images/patchplanner/lipje.png'></img>" +
                    "</div>" +
                "</div>"
            );

            var templateParameters = {
                thumb: '',
                name: decodeURI(this.options.path.get_name()),
                distortion: distortionDisplay
            };

            $.tmpl("filelist_item", templateParameters).appendTo(this.element);

            this.element.find('.markbadge').css({
                position: 'absolute',
                left: -7,
                top: -7,
                padding: 3,
                width: 18,
                height: 13
            });

            this.element.find('.markbadge img').css({
                width: 12,
                height: 12,
                'margin-top': 0
            });

            if (jobSettings.get_distortion() >= 1) {
                this.element.find('.distortion').removeClass('valid').addClass('invalid');
            }
            else {
                this.element.find('.distortion').removeClass('invalid').addClass('valid');
            }

            if (jobDecorator.get_mark_ids().length === 0) {
                this.element.find('.markbadge').removeClass('valid').addClass('invalid');
            }
            else {
                this.element.find('.markbadge').removeClass('invalid').addClass('valid');
            }

            // Remove the mark badge in case we mount with the mirror method
            if (mountingMethod === "mirror" || mountingMethod === "drillmount") {
                this.element.find('.markbadge').remove();
            }

            var that = this;
            nixps.patchplanner.util.get_asset_thumb_url(this.options.path).then(function(pThumbURL) {
                that.element.find('.thumb img.filethumb').attr('src', pThumbURL);
            });

            this.enable();
        },

        _createWaitingView: function() {
            this.element.empty();

            $.template(
                "filelist_item",
                "<div class='content'>" +
                    "<div class='fileicon'>" +
                        "<div class='thumb' style='background: #fff url(${thumb}) no-repeat center center; height: 140px; width: 140px;'></div>" +
                        "<div class='namewrapper'>" +
                            "<div class='name'>${name}</div>" +
                        "</div>" +
                    "</div>" +
                "</div>"
            );

            var templateParameters = {
                thumb: '/portal/images/wait_filelist_item.gif',
                name: decodeURI(this.options.path.get_name())
            };

            $.tmpl("filelist_item", templateParameters).appendTo(this.element);
        },


        _metadataFinishedHandler: function() {
            this.enable();
            this._createAssetView();
            api_async.proofscope.render(this.options.path.get_full_path().substr('cloudflow://'.length), function(){}, function(){});
        },


        /**
         * @brief checks the asset progress (metadata / renderer)
         */
        _checkMetadataProgress: function() {
            var that = this;

            nixps.patchplanner.util.has_asset_thumb(this.options.path).then(function(pHasThumb) {
                if (pHasThumb) {
                    that._trigger('metadatafinished');                    
                }
                else {
                    that._delay(that._checkMetadataProgress, 2000);
                }
            }).fail(function(pError) {
                that._delay(that._checkMetadataProgress, 2000);
            });
        },


        /** 
         * @brief handler when the info icon is clicked
         */
        _infoIconClickedHandler: function() {
            // Hide the other close buttons
            $(':nixps-patchplanner-filelist_item .closebutton').hide();
            $(':nixps-patchplanner-filelist_item .infoicon').show();

			// Hide the info icon and show the close button, show the info panel
			this.element.find('.infoicon').hide();
			var closebutton = this.element.find('.closebutton');
			closebutton.css('display', 'block');
			this._trigger('infoiconclicked');

			return false;
        },


        /**
         * @brief handler when the close button is clicked
		 */
		_closeButtonClickedHandler: function() {
          	this.element.find('.closebutton').hide();
            this.element.find('.infoicon').show();
            this._trigger('closebuttonclicked');

            return false;
		}


    });

}(jQuery));