/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window, jQuery, cloudflow_path */

/*global panzer_layout_edition_sheet, _*/
/*global nixps, namespace */

(function( $ ) {

    $.widget("nixps-patchplanner.OpenDialog", $.ui.dialog, {

        options: {
        	title: 'Open...',

        	minWidth: 375,

        	minHeight: 400,

        	position: {
        		my: 'center center-125px',

        		at: 'center',

        		of: window
        	},

        	modal: true

        },


        _create: function() {
        	this._super();
        	this.element.addClass(this.widgetFullName);

			var template = "<div>"
				+ "<ul>"
					+ "<li><a href='#tabs" + this.uuid + "-1'>Jobs</a></li>"
					+ "<li><a href='#tabs" + this.uuid + "-2'>Sheets</a></li>"
				+ "</ul>"
				+ "<div style='position: absolute; left: 0; right: 0; top: 35px; bottom: 0;' id='tabs" + this.uuid + "-1'>"
					+ "<div class='jobList'></div>"
					+ "<div class='buttons'>"
						+ "<button class='openJobButton'>Open Job</button>"
						+ "<button class='cancelButton'>Cancel</button>"
					+ "</div>"
				+ "</div>"
				+ "<div style='position: absolute; left: 0; right: 0; top: 35px; bottom: 0;' id='tabs" + this.uuid + "-2'>"
					+ "<div class='sheetList'></div>"
					+ "<div class='buttons'>"
						+ "<button class='openSheetButton'>Open Sheet</button>"
						+ "<button class='cancelButton'>Cancel</button>"
					+ "</div>"
				+ "</div>"
			+ "</div>";

			

			var tabs = $(template)
			tabs.appendTo(this.element);
			tabs.tabs();

			var patchInfo = new nixps.patchplanner.PatchInfo();

			this.element.find('button').button();
			this.element.find('.jobList').JobList({
				filterMOM: false,
				patchInfo: patchInfo,
				showDeleteButton: true
			}).css({
				position: 'absolute',
				left: 1,
				right: 1,
				top: 1,
				bottom: 30
			});
			this.element.find('.sheetList').SheetList({
				patchInfo: patchInfo,
				showDeleteButton: true
			}).css({
				position: 'absolute',
				left: 1,
				right: 1,
				top: 1,
				bottom: 30
			});

			this._on(this.element, {
				"click .openJobButton": this._openJobClickedHandler,
				"click .openSheetButton": this._openSheetClickedHandler,
				"click .cancelButton": this._cancelClickedHandler,
				"opendialogclose": this._closeDialogHandler,
				"joblistremove": this._removeJobHandler,
				"sheetlistremove": this._removeSheetHandler
			});
		},


		_removeJobHandler: function(pEvent, pData) {
			var job = pData.jobname;
			var result = confirm("Are you sure to remove the job: " + job);
			if (result === true) {
				var settings = new nixps.patchplanner.CloudflowSettings();
				var jobPath = settings.getJobsPath().toChild(job);
				var momPath = settings.getMOMOutputPath().toFile(job + ".xml");
				api.file.delete_folder(jobPath.getFullPath());
				api.file.delete_file(momPath.getFullPath());
				var patchInfo = new nixps.patchplanner.PatchInfo();
				this.element.find(':nixps-patchplanner-JobList').JobList('option', 'patchInfo', patchInfo);
				this.element.find(':nixps-patchplanner-SheetList').SheetList('option', 'patchInfo', patchInfo);

				var session = new nixps.patchplanner.Session();
				if (session.isJobSession() && (session.getProjectName() === job)) {
					session.setProjectName("");
					location.reload();
				}				
			}
		},


		_removeSheetHandler: function(pEvent, pData) {
			var sheet = pData.sheetname;
			var result = confirm("Are you sure to remove the sheet: " + sheet);
			if (result === true) {
				var settings = new nixps.patchplanner.CloudflowSettings();
				var patchSheetPath = settings.getPatchSheetsPath().toFile(sheet + ".json");
				api.file.delete_file(patchSheetPath.getFullPath());
				var patchInfo = new nixps.patchplanner.PatchInfo();
				this.element.find(':nixps-patchplanner-JobList').JobList('option', 'patchInfo', patchInfo);
				this.element.find(':nixps-patchplanner-SheetList').SheetList('option', 'patchInfo', patchInfo);

				var session = new nixps.patchplanner.Session();
				if (session.getProjectName() === sheet) {
					session.setProjectName("");
					location.reload();
				}				
			}
		},


		_openSheetClickedHandler: function() {
			var sheet = this.element.find('.sheetList').SheetList('getSelectedSheet');
			this._trigger('opensheet', null, {
				name: sheet
			});
			this.close();
		},


		_openJobClickedHandler: function() {
			var job = this.element.find('.jobList').JobList('getSelectedJob');
			this._trigger('openjob', null, {
				name: job
			});
			this.close();
		},


		_cancelClickedHandler: function() {
			this.close();
		},


		_closeDialogHandler: function() {
			this.destroy();
			this.element.remove();
		}

    });

}(jQuery));