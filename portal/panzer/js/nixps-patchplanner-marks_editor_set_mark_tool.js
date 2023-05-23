/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/
/*global panzer_filelist*/
/*global panzer_layout_edition_sheet*/
/*global console*/
/*global api*/
/*global namespace, nixps*/

(function() {

	namespace('nixps.patchplanner');

	nixps.patchplanner.marks_editor_set_mark_tool = function(pEditorInstance, pMainMark) {
		this.mEditor = pEditorInstance;
		this.mMainMark = false;
		if (typeof pMainMark === "boolean") {
			this.mMainMark = pMainMark;
		}
		this.register();
	};


	nixps.patchplanner.marks_editor_set_mark_tool.prototype = {

		register: function() {
			var sheet = this.mEditor.element.find(':nixps-patchplanner-editor_sheet');
			sheet.css({
				cursor: 'crosshair'
			});

			sheet.on('click.setmarktool', _.bind(this.click, this));
			this.mEditor.element.on('click.setmarktool', _.bind(this.unregister, this));
		},

		unregister: function() {
			var sheet = this.mEditor.element.find(':nixps-patchplanner-editor_sheet');
			sheet.css({
				cursor: 'default'
			});

			sheet.off('click.setmarktool');
			this.mEditor.element.off('click.setmarktool');
		},

		click: function(pEvent) {
			var x = pEvent.offsetX;
			var y = pEvent.offsetY;

			var zoom = this.mEditor.options.zoom;

			var tx = x / zoom;
			var ty = y / zoom;

			var mL = this.mEditor.options.marginLeft;
			var mT = this.mEditor.options.marginTop;
			var mR = this.mEditor.options.marginRight;
			var mB = this.mEditor.options.marginBottom;
			var width = this.mEditor.getWidth();
			var height = this.mEditor.getHeight();

			var distanceLeft = 0;
			var distanceRight = 0;
			var distanceMiddle = (height / 2.0) - ty;

			var rightMark = this.mEditor.element.find(':nixps-patchplanner-editor_right_mark');
			var leftMark = this.mEditor.element.find(':nixps-patchplanner-editor_left_mark');

			if ((leftMark.length === 0) || (rightMark.length === 0)) {
				if (tx < width / 2.0) {
					// Left side has been selected
					distanceLeft = mL - tx;
					distanceRight = distanceLeft;
				}
				else {
					// Right side has been selected
					distanceRight = tx - (width - mR);
					distanceLeft = distanceRight;
				}
			}
			else {
				distanceRight = rightMark.editor_right_mark('option', 'distance_right');
				distanceLeft = leftMark.editor_left_mark('option', 'distance_left');
			}

			if (this.mMainMark === true) {
				this.mEditor.addMark(distanceLeft, distanceRight, distanceMiddle, true);
			}
			else {
				this.mEditor.addMark(distanceLeft, distanceRight, distanceMiddle);
			}


			this.unregister();
		}
	};


})();