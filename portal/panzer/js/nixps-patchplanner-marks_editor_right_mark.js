/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/
/*global panzer_filelist*/
/*global panzer_layout_edition_sheet*/
/*global console*/


/**
 * A jQuery UI plugin for the editor labels
 */
(function( $ ) {

	$.widget("nixps-patchplanner.editor_right_mark", $["nixps-patchplanner"]["editor_mark"], {
		options: {
			/**
			 * @brief the url of the mark to display
			 */
			mark_path: null,

			/**
			 * @brief the right distance of the mark
			 */
			distance_right: 23,

			/** 
			 * @brief the middle distance of the mark
			 */
			distance_middle: 0,

			/** 
			 * @brief if true, marks move freely in horizontal direction
			 */
			free_horizontal_move: false,
			/**
			 * @brief if true, marks move freely in vertical direction
			 */
			free_vertical_move: false
		},
		_draw:function(){
			var editor = this._getParentInstance();
			var marginTop = editor.options.marginTop;
			var marginRight = editor.options.marginRight;
			var marginBottom = editor.options.marginBottom;
			var width = editor.getWidth();
			var height = editor.getHeight();

			this.setPTPosition(width - marginRight + this.options.distance_right - this.markinfo.width / 2.0,
				(height - marginTop - marginBottom ) / 2.0 + marginTop - this.markinfo.height / 2.0 - this.options.distance_middle);

		},
		_create: function() {
			this._super();

			if ((typeof this.options.distance_right !== "number") 
				|| (typeof this.options.distance_middle !== "number")) {
				throw new Error('invalid mark distances');
			}
			this._draw();

			this._on(true, this.element, {
				"drag": this._dragHandler
			});
		},

		_dragHandler: function(pEvent) {
			this._updateModel();

			var editor = this._getParentInstance();
			var marginRight = editor.options.marginRight;
			var marginTop = editor.options.marginTop;
			var marginBottom = editor.options.marginBottom;
			var width = editor.getWidth();
			var height = editor.getHeight();
			var distance_right = this.options.distance_right;
			var distance_middle = this.options.distance_middle;
			this.options.distance_middle = - (this.options.pttop + this.options.ptheight / 2.0) + (height - marginTop - marginBottom ) / 2.0 + marginTop;
			this.options.distance_right = (this.options.ptleft + this.options.ptwidth / 2.0) - (width - marginRight);

			var reference = this.options.refid;
			var brother = this.element.parent().find(':nixps-patchplanner-editor_left_mark[refid=' + reference + "]");
			var brother_middle = brother.editor_left_mark('option', 'distance_middle');
			var brother_middle_adjust = brother_middle + (this.options.distance_middle - distance_middle);

			var brother_left = brother.editor_left_mark('option', 'distance_left');
			var brother_left_adjust = brother_left + (distance_right - this.options.distance_right);

			if(pEvent.ctrlKey){
				brother_left_adjust = brother_left + (this.options.distance_right - distance_right);
				brother_middle_adjust = brother_middle + (distance_middle - this.options.distance_middle);
			}
			if(this.options.free_vertical_move){
				brother.editor_left_mark('option', 'distance_left', brother_left_adjust);
			}

			brother.editor_left_mark('option', 'distance_middle', brother_middle_adjust);

			if (! this.options.free_horizontal_move) {
				var that = this;
				this.element.parent().find(':nixps-patchplanner-editor_right_mark').not(this.element).each(function(pIndex, pMark) {
					var middle = $(pMark).editor_right_mark('option', 'distance_middle');
					$(pMark).editor_right_mark('setPTPosition', width - marginRight + that.options.distance_right - that.markinfo.width / 2.0, (height - marginTop - marginBottom) / 2.0 + marginTop - that.markinfo.height / 2.0 - middle);
					$(pMark).editor_right_mark('option', 'distance_right', that.options.distance_right);
				});
				this.element.parent().find(':nixps-patchplanner-editor_right_mark').not(this.element).css('left', this.element.position().left);
			}

		},
		_setOption: function(pKey, pValue) {
			this._super(pKey, pValue);

			if ( pKey === 'distance_right' ) {
				this._draw();
			}
		}
	});

}) (jQuery);
