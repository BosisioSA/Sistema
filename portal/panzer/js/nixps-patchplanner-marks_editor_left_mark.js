/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/
/*global panzer_filelist*/
/*global panzer_layout_edition_sheet*/
/*global console*/


/**
 * A jQuery UI plugin for the editor labels
 */
(function( $ ) {

	$.widget("nixps-patchplanner.editor_left_mark", $["nixps-patchplanner"]["editor_mark"], {
		options: {
			/**
			 * @brief the url of the mark to display
			 */
			mark_path: null,

			/**
			 * @brief the left distance of the mark
			 */
			distance_left: 23,

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
			free_vertical_move: false,

			/**
			 * @brief the mark number
			 */
			mark_number: NaN
		},
		_draw:function(){
			var editor = this._getParentInstance();
			var marginLeft = editor.options.marginLeft;
			var marginTop = editor.options.marginTop;
			var marginBottom = editor.options.marginBottom;
			var height = editor.getHeight();

			this.setPTPosition(marginLeft - this.options.distance_left - this.markinfo.width / 2.0,
				(height - marginTop - marginBottom ) / 2.0 + marginTop - this.markinfo.height / 2.0 - this.options.distance_middle);

		},
		_create: function() {
			this._super();

			if ((typeof this.options.distance_left !== "number")
				|| (typeof this.options.distance_middle !== "number")) {
 				throw new Error('invalid mark distance');
			}

			this._draw();

			this.element.append($('<div>').addClass('marknumber').css({
				position: 'absolute',
				right: this.element.width(),
				top: this.element.height() - 4,
				color: 'black',
				'font-size': 9,
				'background-color': 'white'
			}));
			if (! isNaN(this.options.mark_number)) {
				this.element.find('.marknumber').text(this.options.mark_number);
			}

			this._on(true, this.element, {
				"drag": this._dragHandler
			});
		},


		_dragHandler: function(pEvent) {
			this._updateModel();

			var editor = this._getParentInstance();
			var marginLeft = editor.options.marginLeft;
			var marginTop = editor.options.marginTop;
			var marginRight = editor.options.marginRight;
			var marginBottom = editor.options.marginBottom;
			var width = editor.getWidth();
			var height = editor.getHeight();

			var distance_middle = this.options.distance_middle;
			var distance_left = this.options.distance_left;

			this.options.distance_middle = - ( this.options.pttop + this.options.ptheight / 2.0) + (height - marginTop - marginBottom ) / 2.0 + marginTop ;
			this.options.distance_left = marginLeft - (this.options.ptleft + this.options.ptwidth / 2.0);

			var reference = this.options.refid;
			var brother = this.element.parent().find(':nixps-patchplanner-editor_right_mark[refid=' + reference + "]");

			var brother_right = brother.editor_right_mark('option', 'distance_right');
			var brother_right_adjust = brother_right + (distance_left - this.options.distance_left);

			var brother_middle = brother.editor_right_mark('option', 'distance_middle');
			var brother_middle_adjust = brother_middle + (this.options.distance_middle - distance_middle);

			if(pEvent.ctrlKey){
				brother_right_adjust = brother_right + (this.options.distance_left - distance_left);
				brother_middle_adjust = brother_middle + (distance_middle - this.options.distance_middle);
			}
			if(this.options.free_vertical_move){
				brother.editor_right_mark('option', 'distance_right',brother_right_adjust);
			}

			brother.editor_right_mark('option', 'distance_middle',brother_middle_adjust);

			if (!this.options.free_horizontal_move) {
				var that = this;
				this.element.parent().find(':nixps-patchplanner-editor_left_mark').not(this.element).each(function(pIndex, pMark) {
					var middle = $(pMark).editor_left_mark('option', 'distance_middle');
					$(pMark).editor_left_mark('setPTPosition', marginLeft - that.options.distance_left - that.markinfo.width / 2.0, (height - marginTop - marginBottom) / 2.0 + marginTop - that.markinfo.height / 2.0 - middle);
					$(pMark).editor_left_mark('option', 'distance_left', that.options.distance_left);
				});
				this.element.parent().find(':nixps-patchplanner-editor_left_mark').not(this.element).css('left', this.element.position().left);
			}
		},

	//|| pKey === 'distance_right'
		_setOption: function(pKey, pValue) {
			this._super(pKey, pValue);

			if (pKey === 'mark_number') {
				if ((typeof pValue === "number") && (!isNaN(pValue))) {
					this.element.find('.marknumber').text(pValue);				
				}
				else {
					this.element.find('.marknumber').text("");
				}
				return;
			}
			if (  pKey === 'distance_left' ) {
				this._draw();
			}
		}
		
	});

}) (jQuery);
