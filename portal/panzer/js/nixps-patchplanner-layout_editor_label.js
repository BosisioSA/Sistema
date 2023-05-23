/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/
/*global panzer_filelist*/
/*global panzer_layout_edition_sheet*/
/*global console*/
/*global _*/

/**
 * A jQuery UI plugin for the editor labels
 */
(function( $ ) {

	$.widget("nixps-patchplanner.editor_label", {
		options: {
			/**
			 * @brief the id to identify the label
			 */
			id: '',

			/**
			 * @brief the reference id
			 */
			refid: '',

			/**
			 * @brief url of image to show
			 */
			url: function(p_label, p_zoom) {},

			/**
			 * @brief the rotation of the label 0,90,180,270
			 */
			rotation: 0,

			/**
			 * @brief scaling factor
			 */
			scaling: 1.0,

			/**
			 * @brief the left margin of the label
			 */
			ptleftmargin: 45,

			/**
			 * @brief the right margin of the label
			 */
			ptrightmargin: 45,

			/**
			 * @brief the top margin of the label
			 */
			pttopmargin: 45,

			/**
			 * @brief the bottom margin of the label
			 */
			ptbottommargin: 45, 

			/**
			 * @brief the label distortion
			 */
			distortion: 1.0,

			/**
			 * @brief the original left position of the label on the layout
			 */
			ptleft: 0,

			/**
			 * @brief the original top position of the label on the layout
			 */
			pttop: 0,

			/**
			 * @brief the original width (unrotated) of the label
			 */
			ptwidth: 0,

			/**
			 * @brief the original height (unrotated) of the label
			 */
			ptheight: 0,

			/**
			 * @brief a boolean or a function returning a boolean indicating that the label should snap or not
			 */
			snap: false,
			/**
			 * @brief the cut gutter
			 */
			gutter: 0
		},

		_create: function() {
			// if (this.options.ptleft < 0) {
			// 	throw new Error('invalid left');
			// }

			// if (this.options.pttop < 0) {
			// 	throw new Error('invalid top');
			// }

			if (this.options.ptwidth < 0) {
				throw new Error('invalid width');
			}

			if (this.options.ptheight < 0) {
				throw new Error('invalid height');
			}

			if ((typeof this.options.id !== 'string' ) || (this.options.id.length === 0)) {
				throw new Error('invalid id');
			}

			if ((typeof this.options.refid !== 'string' ) || (this.options.refid.length === 0)) {
				throw new Error('invalid refid');
			}

			if (typeof this.options.url !== 'function' ) {
				throw new Error('invalid url');
			}

			if ((typeof this.options.rotation !== 'number') || ((this.options.rotation % 90) !== 0)) {
				throw new Error('invalid rotation');
			}

			// this.element.css('background-color', 'lightgray');

			this.element.addClass(this.widgetFullName);
			this.element.css('position', 'absolute');
			this.element.css('z-index', 2000);
			this.element.css('border', '1px solid transparent');
			this.element.draggable({
				containment: '.constraintLayer'
			});
			this.element.attr('labelid', this.options.id);
			this.element.attr('refid', this.options.refid);

			var i = 1;
			for(i = 1; i <= 8; i *= 2) {
				var image = $("<img>");
				image.css({
					width: '100%',
					height: '100%',
					position: 'absolute',
					zIndex: i * 10
				});
				image.attr('zoom', i);
				image.appendTo(this.element);
				image.on('load', function() {
					$(this).trigger('imgload');
				});
				image.on('error', function() {
					$(this).trigger('imgerror');
				});
				if (i !== 1) {
					image.hide();
				}
			}

			this._on(this.element, {
				"dragstart": this._dragstartHandler,
				"drag": this._dragHandler,
				"dragstop": this._dragstopHandler
			});

			this._on(true, this.element, {
				"drag": function(pEvent, pUI) {
					this._trigger("drag",pEvent, pUI);
				},
				"dragstop": function(pEvent, pUI) {
					this._trigger("dragstop",pEvent, pUI);
				},
				"dragstart": function(pEvent, pUI) {
					this._trigger("dragstart",pEvent, pUI);
				},
				"click": function(pEvent) {
					this._trigger("click",pEvent);
				},
				"imgload img": function(pEvent) {
					$(pEvent.target).attr('loaded', true);

					if ($(pEvent.target).attr('zoom') === '1') {
						this._newDimensionsHandler();
					}
				},
				"imgerror img": function(pEvent) {
					this._delay(_.partial(this._updateImage, parseInt($(pEvent.target).attr('zoom'), 10)) , 3000);
				},
				"editor_labelnewdimensions": this._newDimensionsHandler
			});

			this._updateView();
		},

		
		/**
		 * @brief handles changes in label dimensions
		 */
		_newDimensionsHandler: function() {
			var width = this.element.width();

			var image = this.element.find('img[zoom=1]');
			var factor = Math.ceil(width / image[0].naturalWidth);
			if (isNaN(factor) || (! isFinite(factor))) {
				factor = 1;
			};

			var zoomLevels = [1, 2, 4, 8];
			var bestZoom = 1;
			var possibleZooms = _.filter(zoomLevels, function(pZoom) {
				return (pZoom >= factor);
			});

			if (possibleZooms.length === 0) {
				bestZoom = 8;
			}
			else {
				bestZoom = _.first(possibleZooms);
			}

			this.element.find('img').hide();
			var zoomIndex = _.indexOf(zoomLevels, bestZoom);
			if (zoomIndex > 0) {
				var lowerBackground = this.element.find('img[zoom=' + zoomLevels[zoomIndex-1] + ']');
				if (lowerBackground.attr('loaded') !== 'true') {
					this._updateImage(parseInt(lowerBackground.attr('zoom'), 10));
				}
				lowerBackground.show();

			}
			var background = this.element.find('img[zoom=' + bestZoom + ']');
			if (background.attr('loaded') !== 'true') {
				this._updateImage(parseInt(background.attr('zoom'), 10));
			}
			background.show();				
		},


		/**
		 * @brief updates the image of the label
		 */
		_updateImage: function(pZoom) {
			if (this.options.url(this.element) === false) {
				this._delay(_.partial(this._updateImage, pZoom), 1000);
			}
			else {
				var that = this;
				this.element.find('img[zoom=' + pZoom + ']').each(function(pIndex, pImage) {
					$(pImage).attr('src', that.options.url(that.element, $(pImage).attr('zoom')));
				});
			}
		},


		/**
		 * @brief returns the total view size, with margins
		 */
		getViewSize: function() {
			var width = this._transformToView(this.options.ptwidth + this.options.ptleftmargin + this.options.ptrightmargin, 0).x;
			var height = this._transformToView(this.options.ptheight + this.options.pttopmargin + this.options.ptbottommargin, 0).x;

			if (((this.options.rotation / 90) % 2) === 1) {
				return {
					width: height,
					height: width
				};
			}

			return {
				width: width,
				height: height
			};
		},


		/**
		 * @brief returns the view left margin
		 */
		getViewLeftMargin: function() {
			if (this.options.rotation ===  90) {
				return this._transformToView(this.options.ptbottommargin, 0).x * this.options.distortion;
			}
			else if (this.options.rotation === 270) {
				return this._transformToView(this.options.pttopmargin, 0).x * this.options.distortion;
			}
			else if (this.options.rotation === 180) {
				return this._transformToView(this.options.ptrightmargin, 0).x;
			}

			return this._transformToView(this.options.ptleftmargin, 0).x;
		},


		/**
		 * @brief returns the view top margin
		 */
		getViewTopMargin: function() {
			if (this.options.rotation === 90) {
				return this._transformToView(this.options.ptleftmargin, 0).x;
			}
			else if (this.options.rotation === 270) {
				return this._transformToView(this.options.ptrightmargin, 0).x;
			}
			else if (this.options.rotation === 180) {
				return this._transformToView(this.options.ptbottommargin, 0).x;
			}

			return this._transformToView(this.options.pttopmargin, 0).x * this.options.distortion;
		},


		/**
		 * @brief returns the view horizontal margin
		 */
		getViewHorizontalMargin: function() {
			if (((this.options.rotation / 90) % 2) === 1) {
				return this._transformToView(this.options.pttopmargin + this.options.ptbottommargin, 0).x * this.options.distortion;
			}

			return this._transformToView(this.options.ptleftmargin + this.options.ptrightmargin, 0).x;
		},


		/**
		 * @brief returns the view vertical margin
		 */
		getViewVerticalMargin: function() {
			if (((this.options.rotation / 90) % 2) === 1) {
				return this._transformToView(this.options.ptleftmargin + this.options.ptrightmargin, 0).x;
			}

			return this._transformToView(this.options.pttopmargin + this.options.ptbottommargin, 0).x * this.options.distortion;
		},


		/**
		 * @brief sets the scaling of the label
		 */
		setScaling: function(p_scaling) {
			this.options.scaling = p_scaling;
			this._updateView();
		},


		/**
		 * @brief sets the label rotation
		 */
		setRotation: function(p_rotation) {
			if ((p_rotation !== 0) && (p_rotation !== 90) && (p_rotation !== 180) && (p_rotation !== 270)) {
				throw new Error('invalid parameter');
			}
			this.options.rotation = p_rotation;
			this._trigger('changed');
			this._updateView();
			this._delay(this.reload, 1000);
		},


		/**
		 * @brief sets the view position relative the top left of the layout
		 */
		setViewPosition: function(p_left, p_top) {
			this.element.css({
				left: p_left,
				top: p_top
			});

			this._updateModel();

			this._trigger('positionchanged');
		},

		moveViewWithDelta: function(p_left_delta, p_top_delta)
		{
			this.element.css({
				left: this.element.position().left + p_left_delta,
				top: this.element.position().top + p_top_delta
			});

			this._updateModel();

			this._trigger('positionchanged');
		},


		/**
		 * @brief sets the pdf box for the patch
		 */
		setPTPosition: function(p_left_pt, p_top_pt) {
			this.options.ptleft = p_left_pt;
			this.options.pttop = p_top_pt;

			this._updateView();

			this._trigger('positionchanged');
		},


		/**
		 * @brief returns true if the label is selected
		 */
		isSelected: function()
		{
			return this.element.hasClass('selected');
		},

		/**
		 * @brief controls the label selection
		 */
		setSelected: function(p_selected) {
			if (this.element.hasClass('selected') && p_selected) {
				return;
			}
			if (! this.element.hasClass('selected') && ! p_selected) {
				return;
			}

			if (p_selected) {
				this.element.css('border', '1px solid blue');
				this.element.addClass('selected');
			}
			else {
				this.element.css('border', '1px solid transparent');
				this.element.removeClass('selected');
			}

			this._trigger('selectionchanged');
		},

		_dragstartHandler: function(p_event, p_ui) {
			var labels = $(':nixps-patchplanner-editor_label').not(this.element);

			if (this.options.snap()) {
				//var settings = new nixps.patchplanner.CloudflowSettings();
				var gutter = this.options.gutter;//settings.getCutGutter();
				this.mConstraints = new nixps.patchplanner.label_constraints(labels, gutter);
				this.mConstraints.process();
			}

			this.oldPos = p_ui.position;
		},


		/**
		 * @brief the drag handler
		 */
		_dragHandler: function(p_event, p_ui) {
			if (this.options.snap()) {
				// Determine the direction
				this.newPos = p_ui.position;

				var directionX = this.newPos.left - this.oldPos.left;
				var directionY = this.newPos.top - this.oldPos.top;

				this.oldPos = p_ui.position;

				this._updateModel();

				//var settings = new nixps.patchplanner.CloudflowSettings();
				var gutter =  this.options.gutter;//settings.getCutGutter();
				console.log(gutter);
				var constraints = this.mConstraints.checkConstraints(this.element);

				var toppt = this._transformToPT(p_ui.position.top, 0).x;
				var leftpt = this._transformToPT(p_ui.position.left, 0).x;
				var rightpt = leftpt + this.options.ptwidth + this.options.ptleftmargin + this.options.ptrightmargin; 
				var bottompt = toppt + (this.options.ptheight + this.options.pttopmargin + this.options.ptbottommargin) * this.options.distortion;
				if (((this.options.rotation / 90) % 2) === 1) {
					rightpt = leftpt + (this.options.ptheight + this.options.pttopmargin + this.options.ptbottommargin) * this.options.distortion;
					bottompt = toppt + this.options.ptwidth + this.options.ptleftmargin + this.options.ptrightmargin;
				}

				var difftop = constraints.top - toppt + gutter;
				var diffbottom = bottompt + gutter - constraints.bottom;
				var diffleft = constraints.left - leftpt + gutter;
				var diffright = rightpt + gutter - constraints.right; 

				// Start the correction
				if ((difftop > 0) && (diffbottom > 0) && Number.isFinite(difftop) && Number.isFinite(diffbottom)) {
					// Direction decides
					if (directionY > 0) {
						// Correct bottom
						p_ui.position.top = this._transformToView(constraints.bottom - (bottompt - toppt) - gutter, 0).x;
					}
					else {
						// Correct top
						p_ui.position.top = this._transformToView(constraints.top + gutter, 0).x;
					}
				}
				else if ((difftop > 0) && Number.isFinite(difftop) && (directionY < 0)) {
					p_ui.position.top = this._transformToView(constraints.top + gutter, 0).x;
				}
				else if ((diffbottom > 0) && Number.isFinite(diffbottom) && (directionY > 0)) {
					p_ui.position.top = this._transformToView(constraints.bottom - (bottompt - toppt) - gutter, 0).x;
				}

				if ((diffleft > 0) && (diffright > 0) && Number.isFinite(diffleft) && Number.isFinite(diffright)) {
					if (directionX > 0) {
						p_ui.position.left = this._transformToView(constraints.right - (rightpt - leftpt) - gutter, 0).x;
					}
					else {
						p_ui.position.left = this._transformToView(constraints.left + gutter, 0).x;
					}
				}
				else if ((diffright > 0) && Number.isFinite(diffright) && (directionX > 0)) {
					p_ui.position.left = this._transformToView(constraints.right - (rightpt - leftpt) - gutter, 0).x;
				}
				else if ((diffleft > 0) && Number.isFinite(diffleft) && (directionX < 0)) {
					p_ui.position.left = this._transformToView(constraints.left + gutter, 0).x;
				}
			}

			this._updateModel();
		},

		
		/**
		 * @brief the dragstop handler
		 */
		_dragstopHandler: function(p_event, p_ui) {
			this._updateModel();
		},


		/**
		 * @brief transforms the view coordinates to PDF coordinates (relative to crop box)
		 */
		_transformToPT: function(p_view_x, p_view_y) {
			return {
				x: p_view_x / this.options.scaling,
				y: p_view_y / this.options.scaling
			};
		},


		/**
		 * @brief transforms the PDF coordinates (relative to crop box) to view coordinates
		 */
		_transformToView: function(p_x_pt, p_y_pt) {
			return {
				x: p_x_pt * this.options.scaling,
				y: p_y_pt * this.options.scaling
			};
		},


		/**
		 * @brief updates the view from the model
		 */
		_updateView: function() {
			var horizontalMargin = this.getViewHorizontalMargin();
			var verticalMargin = this.getViewVerticalMargin();

			var top = this.options.pttop;
			var left = this.options.ptleft;
			var right = this.options.ptleft + this.options.ptwidth;
			var bottom = this.options.pttop + this.options.ptheight;

			var top_left = this._transformToView(left, top);
			var bottom_right = this._transformToView(right, bottom);

			var width = Math.abs(bottom_right.x - top_left.x);
			var height = Math.abs(bottom_right.y - top_left.y) * this.options.distortion;

			if (((this.options.rotation / 90) % 2) === 1) {
				var newWidth = height + horizontalMargin;
				var newHeight = width + verticalMargin;

				this.element.css({
					left: top_left.x - this.getViewLeftMargin(),
					top: top_left.y - this.getViewTopMargin(),
					width: newWidth,
					height: newHeight
				});

				if ((this.element.width() !== newWidth)
					|| (this.element.height() !== newHeight)) {
					this._trigger('newdimensions');
				}
			}
			else {
				var newWidth = width + horizontalMargin;
				var newHeight = height + verticalMargin;

				this.element.css({
					left: top_left.x - this.getViewLeftMargin(),
					top: top_left.y - this.getViewTopMargin(),
					width: newWidth,
					height: newHeight
				});

				if ((this.element.width() !== newWidth)
					|| (this.element.height() !== newHeight)) {
					this._trigger('newdimensions');
				}
			}
		},


		/** 
		 * @brief updates the model from the view
		 */
		_updateModel: function() {
			var horizontalMargin = this.getViewLeftMargin();
			var verticalMargin = this.getViewTopMargin();

			var left = this.element.position().left + horizontalMargin;
			var top = this.element.position().top + verticalMargin;

			var top_left = this._transformToPT(left, top);

			this.options.ptleft = top_left.x;
			this.options.pttop = top_left.y;
		},


		_setOption: function(p_key, p_value) {
			return this._superApply(arguments);
		},


		_destroy: function() {
			// Use the destroy method to reverse everything your plugin has applied
			return this._super();
		},

		disable: function() {
			this._super();
			this.element.draggable('disable');
		},

		enable: function() {
			this._super();
			this.element.draggable('enable');
		},

		getBoundaryInPT: function() {
			if (((this.options.rotation / 90) % 2) === 1) {
				return {
					left: this.options.ptleft - (this.options.ptbottommargin * this.options.distortion),
					top: this.options.pttop - this.options.ptleftmargin,
					width: (this.options.ptheight + this.options.pttopmargin + this.options.ptbottommargin) * this.options.distortion,
					height: (this.options.ptwidth + this.options.ptleftmargin + this.options.ptrightmargin)
				};
			}

			return {
				left: this.options.ptleft - this.options.ptleftmargin,
				top: this.options.pttop - (this.options.pttopmargin * this.options.distortion),
				width: (this.options.ptwidth + this.options.ptleftmargin + this.options.ptrightmargin),
				height: (this.options.ptheight + this.options.pttopmargin + this.options.ptbottommargin) * this.options.distortion
			};
		},

		reload: function() {
			this.element.find('img').removeAttr('loaded');
			this._newDimensionsHandler();
		}
	});

}) (jQuery);
