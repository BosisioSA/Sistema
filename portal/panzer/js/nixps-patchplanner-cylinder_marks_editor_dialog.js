/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/
/*global panzer_filelist*/
/*global panzer_layout_edition_sheet*/
/*global console*/
/*global api*/


/**
 * A jQuery UI plugin that shows a dialog with the marks editor
 */
(function($) {

	$.widget("nixps-patchplanner.cylinder_marks_editor_dialog", $.ui.dialog, {

		options: {
			/**
			 * @brief non-draggable overlay
			 */
			draggable: false,

			/** 
			 * @brief sets the dialog title
			 */
			title: "Edit Cylinder Registration Marks",

			/**
			 * @brief sets the dialog class
			 */
			dialogClass: "marks_editor_dialog",

			/**
			 * @brief dialog is part of the patchplanner application
			 */
			appendTo: '#layout.patchplanner',

			/** 
			 * @brief don't open the dialog automatically (appendTo is executed to late)
			 */
			autoOpen: false,

			/**
			 * @brief the path of the file to edit cylinder marks
			 */
			file: null
		},

		_create: function() {
			this._super();

			var session = new nixps.patchplanner.Session();
			var layoutDocument = session.load_layout_document();
			// var decorator = layoutDocument.get_decorator(this.options.patchid);
			// var margins = decorator.get_margins();

			this.widget().find('.ui-dialog-content').css({
				position: 'absolute',
				left: 2,
				right: 2,
				top: 32,
				bottom: 2,
				padding: 0
			});

			// Create the layout editor
			var marksEditor = $('<div class="marks_editor">').appendTo(this.element).cylinder_marks_editor({
				showToolbar: false,
				patchid: this.options.patchid,
                unit: (new nixps.cloudflow.UnitPreferences()).getDefinition('length'),
                file: this.options.file
			});

			// Create the toolbar
			var toolbar = $('<div>');
			toolbar.css({
				position: 'absolute',
				left: 0,
				right: 0,
				top: 0,
				height: 20,
				padding: 5
			});
			toolbar.addClass('marks_toolbar');
			toolbar.addClass('edittoolbar');
			toolbar.appendTo(this.element);

			var zoomtool = $('<select class="zoom">');
			zoomtool.append('<option value="0.05">5%</option>');
			zoomtool.append('<option value="0.10">10%</option>');
			zoomtool.append('<option value="0.25">25%</option>');
			zoomtool.append('<option value="0.50">50%</option>');
			zoomtool.append('<option value="1.00" selected="true">100%</option>');
			zoomtool.append('<option value="2.00">200%</option>');
			zoomtool.appendTo(toolbar);
			zoomtool.css({
				'margin-right': 20
			});

			zoomtool.on('change', function() {
				marksEditor.cylinder_marks_editor("option", "zoom", parseFloat($(this).val()));
			});

			var addMarkButton = $('<button>Add mark</button>');
			addMarkButton.addClass('addmarkbutton');
			addMarkButton.button({
				text: false,
				icons: {
					primary: 'ui-icon-circle-plus',
					secondary: 'ui-icon-circle-plus'
				}
			});
			addMarkButton.appendTo(toolbar);

			var removeMarkButton = $('<button>Remove mark</button>');
			removeMarkButton.addClass('removemarkbutton');
			removeMarkButton.button({
				text: false,
				icons: {
					primary: 'ui-icon-trash',
					secondary: 'ui-icon-trash'
				}
			});
			removeMarkButton.appendTo(toolbar);

			this._delay(function() {
				this.window.trigger('resize');
			});

			this._on(this.element, {
				"cylinder_marks_editor_dialogclose": this._closeHandler,
				"click .addmarkbutton": this._addMarkHandler,
				"click .removemarkbutton": this._removeMarkHandler
			});

			this.element.css({
				'overflow': 'hidden'
			});
		},


		/**
		 * @brief the close handler
		 */
		_closeHandler: function() {
			var marksEditor = $(this.element.find('.marks_editor'));
			marksEditor.cylinder_marks_editor('saveMarks');

			var labels = $(":nixps-patchplanner-editor").editor('getWithRefID', this.options.patchid);
			labels.editor_label('reload');

			this.element.remove();
		},


		/** 
		 * @brief add mark button click handler
		 */
		_addMarkHandler: function() {
			this.element.find(':nixps-patchplanner-cylinder_marks_editor').cylinder_marks_editor('setTool', nixps.patchplanner.marks_editor_set_mark_tool);
		},


		/**
		 * @brief remove mark button click handler
		 */
		_removeMarkHandler: function() {
			this.element.find(':nixps-patchplanner-cylinder_marks_editor').cylinder_marks_editor('removeSelection');
		}

	});

})(jQuery);