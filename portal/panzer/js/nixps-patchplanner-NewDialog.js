/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window, jQuery, cloudflow_path */

/*global panzer_layout_edition_sheet, _*/
/*global nixps, namespace */

(function( $ ) {

    $.widget("nixps-patchplanner.NewDialog", $.ui.dialog, {

        options: {

        	title: 'New...',

        	minWidth: 375,

        	minHeight: 200,

        	maxWidth: 375,

        	maxHeight: 200,

        	modal: true,

        	position: {
        		my: 'center center-125px',

        		at: 'center',

        		of: window
        	}

        },


        _create: function() {
        	this._super();
        	this.element.addClass(this.widgetFullName);

			var template = "<div>"
				+ "<ul>"
					+ "<li><a href='#tabs" + this.uuid + "-1'>Job</a></li>"
					+ "<li><a href='#tabs" + this.uuid + "-2'>Sheet</a></li>"
				+ "</ul>"
				+ "<div id='tabs" + this.uuid + "-1'>"
					+ "<label>Job Name:</label>"
					+ "<input name='jobName'>"
					+ "<div class='buttons'>"
						+ "<button class='createJob'>Create</button>"
						+ "<button class='cancelCreate'>Cancel</button>"
					+ "</div>"
				+ "</div>"
				+ "<div id='tabs" + this.uuid + "-2'>"
					+ "<label>Sheet Name:</label>"
					+ "<input name='sheetName'>"
					+ "<div class='buttons'>"
						+ "<button class='createSheet'>Create</button>"
						+ "<button class='cancelCreate'>Cancel</button>"
					+ "</div>"
				+ "</div>"
			+ "</div>";

			var tabs = $(template);
			tabs.appendTo(this.element);
			tabs.tabs();

			this.element.find('.createJob,.createSheet,.cancelCreate').button();

			this._on(this.element, {
				'click .createSheet': this._createSheetHandler,
				'click .createJob': this._createJobHandler,
				'click .cancelCreate': this._cancelCreateHandler,
				'newdialogclose': this._closeHandler
			});
		},


		_createSheetHandler: function() {
			this._trigger('createsheet', null, {
				name: this.element.find('[name=sheetName]').val()
			});
			this.close();
		},


		_createJobHandler: function() {
			this._trigger('createjob', null, {
				name: this.element.find('[name=jobName]').val()
			});
			this.close();
		},


		_cancelCreateHandler: function() {
			this.close();
		},


		_closeHandler: function() {
			this.destroy();
			this.element.remove();
		}

    });

}(jQuery));