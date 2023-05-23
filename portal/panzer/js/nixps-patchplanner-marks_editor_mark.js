/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/
/*global panzer_filelist*/
/*global panzer_layout_edition_sheet*/
/*global console*/
/*global api*/


/**
 * A jQuery UI plugin for the editor labels
 */
(function( $ ) {

	$.widget("nixps-patchplanner.editor_mark", $["nixps-patchplanner"]["editor_item"], {
		options: {
			/**
			 * @brief the url of the mark to display
			 */
			mark_path: null,

			/** 
			 * @brief the middle distance of the mark
			 */
			distance_middle: 0,

			/**
			 * @brief the parent editor selector
			 */
			parentName: 'nixps-patchplanner-marks_editor'
		},

		_create: function() {
			if ((! (this.options.mark_path instanceof cloudflow_path)) && (! (this.options.mark_path instanceof nixps.cloudflow.URLPath))) {
				throw new Error('invalid mark_path');
			}

			if (typeof this.options.distance_middle !== "number") {
				throw new Error('invalid distance_middle');
			}	

			this.markinfo = this._getMarkInfo(this.options.mark_path);
			this.options.ptwidth = this.markinfo.width;
			this.options.ptheight = this.markinfo.height;

			this._super();

			var image = $('<img>');
			image.attr('src', this.markinfo.url);
			image.css({
				width: '100%',
				height: '100%',
				position: 'absolute',
				left: 0,
				top: 0
			});
			this.element.append(image);

			this._on(this.element, {
				'editor_left_markscalingchanged': this._scalingChangedHandler,
				'editor_right_markscalingchanged': this._scalingChangedHandler,
				'dragstart': this._editor_markDragStartHandler,
				'drag': this._editor_markDragHandler,
				'click': this._editor_markSelectHandler
			});

			this.element.draggable('option', 'cursorAt', {
				left: Math.round(this.element.width() / 2.0),
				top: Math.round(this.element.height() / 2.0)
			});
		},


		_editor_markDragStartHandler: function(pEvent, pUI) {
			this.startPosition = pUI.position;
			this._editor_markSelectHandler();
		},


		_editor_markSelectHandler: function() {
			this.element.parent().find(":nixps-patchplanner-editor_left_mark").editor_left_mark('setSelected', false);
			this.element.parent().find(":nixps-patchplanner-editor_right_mark").editor_right_mark('setSelected', false);
			var reference = this.options.refid;
			var rightMark = this.element.parent().find(':nixps-patchplanner-editor_right_mark[refid=' + reference + "]");
			var leftMark = this.element.parent().find(':nixps-patchplanner-editor_left_mark[refid=' + reference + "]");

			leftMark.editor_left_mark('setSelected', true);
			rightMark.editor_right_mark('setSelected', true);
		},


		_editor_markDragHandler: function(pEvent, pUI) {
			if (pEvent.shiftKey) { 
				var currentPosition = pUI.position;

				if (Math.abs(this.startPosition.left - currentPosition.left) > Math.abs(this.startPosition.top - currentPosition.top)) {
					pUI.position.top = this.startPosition.top;
				}
				else {
					pUI.position.left = this.startPosition.left;	
				}
			}
		},


		/**
		 * @brief handler when view is updated
		 */
		_scalingChangedHandler: function() {
			this.element.draggable('option', 'cursorAt', {
				left: Math.round(this.element.width() / 2.0),
				top: Math.round(this.element.height() / 2.0)
			});
		},


		/**
		 * @brief gets the mark info
		 */
		_getMarkInfo: function(pURL) {
			if ((! (pURL instanceof cloudflow_path)) && (! (pURL instanceof nixps.cloudflow.URLPath))) {
				throw new Error('invalid parameter');
			}

			var apiresult = api.asset.list(['cloudflow.part', 'equal to', pURL.get_full_path()]);
			if (($.isArray(apiresult.results) === false) || (apiresult.results.length !== 1)) {
				throw new Error('asset not found');
			}
			var l_asset = apiresult.results[0];

			return {
				url: l_asset.thumb,
				width: l_asset.metadata.page_boxes.crop.size.width,
				height: l_asset.metadata.page_boxes.crop.size.height
			};
		},


		/** 
		 * @brief handles option changes
		 */
		_setOption: function(pKey, pValue) {
			this._superApply(arguments);

			if (pKey === 'distance_middle') {
				var editor = this._getParentInstance();
				var marginTop = editor.options.marginTop;
				var marginBottom = editor.options.marginBottom;
				var height = editor.getHeight();
				this.setPTPosition(this.options.ptleft, (height - marginTop - marginBottom) / 2.0 + marginTop - this.markinfo.height / 2.0 - pValue);
			}

		},


		/**
		 * @brief gets the mark distances of a marks pair to be stored in the layout document
		 */
		getDistances: function() {
			var editor = this._getParentInstance();
			var marginRight = editor.options.marginRight;
			var width = editor.getWidth();
			var reference = this.options.refid;

			if (this.widgetFullName === "nixps-patchplanner-editor_left_mark") {
				var brother = this.element.parent().find(':nixps-patchplanner-editor_right_mark[refid=' + reference + "]");
				var right = brother.editor_right_mark('option', 'distance_right');
				var right_middle = brother.editor_right_mark('option', 'distance_middle');
				var left = this.options.distance_left;
				var middle = this.options.distance_middle;
				return {
					left: left,
					right: right,
					middle: middle,
					right_middle:right_middle,
					left_middle:middle
				};
			}
			else if (this.widgetFullName === "nixps-patchplanner-editor_right_mark") {
				var brother = this.element.parent().find(':nixps-patchplanner-editor_left_mark[refid=' + reference + "]");
				var left = brother.editor_left_mark('option', 'distance_left');
				var right = this.options.distance_right;
				var middle = this.options.distance_middle;
				return {
					left: left,
					right: right,
					middle: middle
				};
			}
		},

		/**
		 * @brief returns the parent instance
		 */
		_getParentInstance: function() {
			var parent = this.element.parents(':' + this.options.parentName);
			return parent.data(this.options.parentName);
		}
	});

}) (jQuery);
