/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/
/*global panzer_filelist*/
/*global panzer_layout_edition_sheet*/
/*global console*/


/**
 * A jQuery UI plugin for the editor labels
 */
(function( $ ) {

	$.widget("nixps-patchplanner.editor_item", {
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
			 * @brief view scaling
			 */
			scaling: 1.0,

			/**
			 * @brief selected (true / false)
			 */
			selected: false
		},

		_create: function() {
			if (this.options.ptwidth < 0) {
				throw new Error('invalid width');
			}

			if (this.options.ptheight < 0) {
				throw new Error('invalid height');
			}

			if ((typeof this.options.id !== 'string') || (this.options.id.length === 0)) {
				throw new Error('invalid id');
			}

			if ((typeof this.options.refid !== 'string') || (this.options.refid.length === 0)) {
				throw new Error('invalid refid');
			}

			this.element.addClass(this.widgetFullName);
			this.element.css('position', 'absolute');
			this.element.css('z-index', 2000);
			this.element.css('border', '1px solid transparent');
			this.element.draggable({
				containment: 'parent'
			});
			this.element.attr('labelid', this.options.id);
			this.element.attr('refid', this.options.refid);

			this._on(this.element, {
				"dragstop": this._dragstopHandler
			});

			this._on(true, this.element, {
				"drag": function(pEvent, pUI) {
					this._trigger("drag", pEvent, pUI);
				},
				"dragstop": function(pEvent, pUI) {
					this._trigger("dragstop",pEvent, pUI);
				},
				"dragstart": function(pEvent, pUI) {
					this._trigger("dragstart",pEvent, pUI);
				},
				"click": function(pEvent) {
					this._trigger("click",pEvent);
				}
			});

			this._updateView();
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

			this.options.selected = p_selected;
			this.element.addClass('selected');
			this._updateView();
			this._trigger('selectionchanged');
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
			this.element.attr('id', this.options.id);
			this.element.attr('refid', this.options.refid);

			if (this.options.selected) {
				this.element.css('border', '1px solid blue');
				this.element.addClass('selected');
			}
			else {
				this.element.css('border', '1px solid transparent');
				this.element.removeClass('selected');
			}

			var top = this.options.pttop;
			var left = this.options.ptleft;
			var right = this.options.ptleft + this.options.ptwidth;
			var bottom = this.options.pttop + this.options.ptheight;

			var top_left = this._transformToView(left, top);
			var bottom_right = this._transformToView(right, bottom);

			var newWidth = Math.abs(bottom_right.x - top_left.x);
			var newHeight = Math.abs(bottom_right.y - top_left.y);

			this.element.css({
				left: top_left.x,
				top: top_left.y,
				width: Math.floor(newWidth),
				height: Math.floor(newHeight)
			});

			if ((this.element.width() !== newWidth)
				|| (this.element.height() !== newHeight)) {
				this._trigger('newdimensions');
			}
		},


		/** 
		 * @brief updates the model from the view
		 */
		_updateModel: function() {
			var left = this.element.position().left;
			var top = this.element.position().top;

			var top_left = this._transformToPT(left, top);

			this.options.ptleft = top_left.x;
			this.options.pttop = top_left.y;
		},


		_setOption: function(p_key, p_value) {
			this._superApply(arguments);

			if ((p_key === 'ptleft')
				|| (p_key === 'pttop')) {
				this._updateView();
				this._trigger('positionchanged');
				return;
			}

			if (p_key === 'scaling') {
				this._updateView();
				this._trigger('scalingchanged');
				return;
			}

			if ((p_key === 'refid')
				|| (p_key === 'id')) {
				this._updateView();
				return;
			}

		},


		_destroy: function() {
			// Use the destroy method to reverse everything your plugin has applied
			return this._super();
		}
	});

}) (jQuery);
