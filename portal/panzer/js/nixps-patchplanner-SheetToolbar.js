/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window, jQuery, cloudflow_path */

/*global panzer_layout_edition_sheet, _*/
/*global nixps, namespace */

(function( $ ) {

    $.widget("nixps-patchplanner.SheetToolbar", {

        options: {

        	sheetName: ''
        	
        },


        _create: function() {
        	this.element.addClass(this.widgetFullName);

			this.element.append('<span class="apptitle">Patch Sheet</span>');

			var buttons = $('<span>').addClass('buttons');
			buttons.appendTo(this.element);

			var newButton = $("<button>").addClass('newButton').text('New...');
			newButton.button();
			newButton.appendTo(this.element);

			var openButton = $("<button>").addClass('openButton').text('Open...');
			openButton.button();
			openButton.appendTo(this.element);

			// var copyButton = $("<button>").addClass('needsproject copyButton').text('Copy sheet');
			// copyButton.button({
			// 	disabled: true
			// });
			// copyButton.appendTo(this.element);

			var sheetSizeButton = $("<button>").addClass('needsproject sizeButton').text('Sheet size');
			sheetSizeButton.button({
				disabled: true
			});
			sheetSizeButton.appendTo(this.element);

			var spacer = $('<div>');
			spacer.css({
				display: 'inline-block'
			});
			spacer.width(15);
			spacer.appendTo(this.element);

			var calculateButton = $("<button>").addClass('needsproject calculateButton').text("Calculate layout");
			calculateButton.button({
				disabled: true
			});
			calculateButton.appendTo(this.element);

			var exportButton = $("<button>").addClass("needsproject exportButton").text("Export to PDF");
			exportButton.button({
				disabled: true
			});
			exportButton.appendTo(this.element);

			var projectName = $("<span class='projectname'></span>");
			projectName.appendTo(this.element);

			this._on(this.element, {
				'click .newButton': this._newButtonHandler,
				'click .openButton': this._openButtonHandler,
				'click .copyButton': this._copyButtonHandler,
				'click .sizeButton': this._sizeButtonHandler,
				'click .calculateButton': this._calculateButtonHandler,
				'click .exportButton': this._exportButtonHandler
			});

			this.option('sheetName', this.options.sheetName);
		},


		_newButtonHandler: function() {
			this._trigger('new');
		},


		_openButtonHandler: function() {
			this._trigger('open');
		},


		_copyButtonHandler: function() {
			this._trigger('copy');
		},


		_sizeButtonHandler: function() {
			this._trigger('size');
		},


		_calculateButtonHandler: function() {
			this._trigger('calculate');
		},


		_exportButtonHandler: function() {
			this._trigger('export');
		},


		_setOption: function(key, value) {
			if (key === "sheetName") {
				this._super(key, value);
				if (typeof value === "string") {
					this.element.find('.projectname').text(value);
				}
			}
		}

    });

}(jQuery));