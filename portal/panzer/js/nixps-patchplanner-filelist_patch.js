/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window, jQuery, cloudflow_path */

/*global panzer_layout_edition_sheet, _*/
/*global nixps, namespace */

(function( $ ) {

    $.widget("nixps-patchplanner.filelist_patch", {

        options: {
        	/**
        	 * @brief the resource id of the patch
        	 */
        	id: null,


        	/**
        	 * @brief the patch
        	 */
        	patch: null,


            /**
             * @brief true if the item is place
             */
            placed: false,


            /**
             * @brief the sheet on which the item is placed
             */
            sheet: ""
        },


        _create: function() {
        	if ((typeof this.options.id !== 'string') || (this.options.id.length === 0)) {
        		throw new Error('invalid parameter');
        	}

        	if (! (this.options.patch instanceof nixps.layout.file_resource_element)) {
        		throw new Error('invalid parameter');
        	}

        	this.element.attr('tabindex', '1');
            this.element.attr('patchid', this.options.id);
            this.element.attr('patchindex', this.options.patch.get_data().index);
            this.element.addClass('element');

            $.template(
            	"filelist_patch",
				"<div class='content'>" +
				    "<div class='fileicon'>" +
                        "<div class='thumb'>" +
                            "<div class='separator'>" +
    				            "<img src='' style='max-width: 139px; max-height: 139px;'></img>" +
                                "<div class='sheetName'></div>" +
                            "</div>" +
                        "</div>" +
				        "<div class='namewrapper'>" +
				            "<div class='name'>${index}</div>" +
				        "</div>" +
				    "</div>" +
				"</div>"
			);

            $.tmpl("filelist_patch", {
                index: this.options.patch.get_data().index
            }).appendTo(this.element);

            var that = this;
            nixps.patchplanner.util.get_asset_patch_url(this.options.patch).then(function(pURL) {
                that.element.find('.thumb').find('img').attr('src', pURL);
            });

            var patch = this.options.patch;
            var page = patch.get_page();
            var url = patch.get_file().get_full_path();
            var sepname = patch.get_separation();
            nixps.patchplanner.util.getSeparationDefinition(url, page, sepname).then(function (s) {
                if ($.isPlainObject(s) === false) {
                    return;
                }

                var cmyk = s.previews.cmyk;
                var webColor = nixps.patchplanner.util.getWebColorFromCMYK(cmyk);
                that.element.find('.thumb').css({
                    'border-left': '7px solid ' + webColor
                });
            });

            this.element.find('.thumb').find('img').on('error', function() {
                that._trigger('imgerror');
            });

            this.element.draggable({
                appendTo: '#layout',
                containment: '#layout .layoutcontent',
                revert: 'invalid',
                zIndex: 5000,
                delay: 500,
                cursorAt: { top: 15 , left: 30 },

                helper: function()
                {
                    var l_$element = $(this);
                    var l_$helper = $("<div class='#layout .draggingelement'>");
                    var l_$img = $("<img class='thumb'>");
                    l_$img.attr('src', l_$element.find('.thumb > img').attr('src'));
                    l_$img.css('max-width', 60);
                    l_$img.css('max-height', 60);
                    l_$helper.append(l_$img);
                    var l_$text = $("<div class='icontext'></div>");
                    l_$text.css('text-align', 'center');
                    l_$text.text(l_$element.find('.name').text());
                    l_$helper.append(l_$text);

                    return l_$helper;
                }
            });

        	this._on(true, this.element, {
        		'click': function(pEvent) {
        			this._trigger('click', pEvent);
        		},
        		'dblclick': function(pEvent) {
        			this._trigger('dblclick', pEvent);
        		},
                'imgerror img': function(pEvent) {
                    this._delay(function() { $(pEvent.target).attr('src', this.options.thumb); }, 3000);
                }
        	});

            this._setPlaced(this.options.placed, this.options.sheetName);
        },


        /**
         * @brief sets the label in placed state
         */
        _setPlaced: function(pPlaced, pSheetName) {
            if ((pPlaced !== true) && (pPlaced !== false)) {
                throw new Error('invalid parameter');
            }

            if (pPlaced) {
                if (this.element.find('.placedoverlay').length === 0) {
                    var overlay = $('<div>');
                    overlay.addClass('placedoverlay');

                    overlay.css({
                        'background': 'rgba(105,197,114,0.8) url(/portal/images/patch_placed.png) no-repeat center center',
                        'position': 'absolute',
                        'left': 1,
                        'right': 0,
                        'top': 0,
                        'bottom': 0,
                        'opaque': 0.5
                    });

                    this.element.find('.thumb').append(overlay);
                    this.element.draggable('option', 'disabled', true);
                }

                var sheetName = this.element.find('.sheetName');
                if ((typeof pSheetName === "string") && (pSheetName.length > 0)) {
                    sheetName.text(pSheetName);
                    sheetName.show();
                }
                else {
                    sheetName.hide();
                }
            }
            else {
                this.element.find('.placedoverlay').remove();
                this.element.draggable('option', 'disabled', false);
                var sheetName = this.element.find('.sheetName');
                sheetName.hide();
            }
        },


        /**
         * @brief sets the selected flag on the item
         */
        select: function(pSelected) {
            if (pSelected) {
                this.element.addClass('selected');
            }
            else {
                this.element.removeClass('selected');
            }
        },


        /**
         * @brief sets the option
         */
        _setOption: function(pKey, pValue) {
            if (pKey === 'placed') {
                this._setPlaced(pValue, this.options.sheetName);
            }
            if (pKey === 'patch') {
                var index = this.options.patch.get_data().index;
                this.element.attr('patchindex', index);
                this.element.find('.namewrapper .name').text(index);
            }
            if (pKey === "sheetName") {
                this._setPlaced(this.options.placed, pValue);
            }

            this._superApply(arguments);
        }
    });

}(jQuery));
