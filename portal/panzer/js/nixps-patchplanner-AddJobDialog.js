/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window, jQuery, cloudflow_path */

/*global panzer_layout_edition_sheet, _*/
/*global nixps, namespace */

(function( $ ) {

    $.widget("nixps-patchplanner.AddJobDialog", $.ui.dialog, {

        options: {
        	title: 'Add Job...',

            position: {
                my: 'center center-125px',
                at: 'center',
                of: window
            },

            minWidth: 375,

            minHeight: 500,

            maxWidth: 375,

            maxHeight: 500,

            modal: true

        },


        _create: function() {
        	this._super();
            this.element.addClass(this.widgetFullName);

        	var jobList = $('<div>');
        	jobList.appendTo(this.element).JobList({
                patchInfo: new nixps.patchplanner.PatchInfo()                
            });

            var buttons = $('<div>').addClass('buttons').appendTo(this.element);
            buttons.append($("<button>").text('Add').addClass('addButton').button({
                'disabled': true
            }));
            buttons.append($("<button>").text('Cancel').addClass('cancelButton').button());

            this._on(this.element, {
                'addjobdialogclose': this._closeDialogHandler,
                'joblistselectionchanged': this._selectionChangedHandler,
                'click .addButton': this._addButtonHandler,
                'click .cancelButton': this._cancelButtonHandler
            });
		},


        _selectionChangedHandler: function(pEvent, pData) {
            this.element.find('.addButton').button("enable");
        },


        _addButtonHandler: function() {
            var jobList = this.element.children('.nixps-patchplanner-JobList');
            this._trigger('jobadded', null, {
                jobname: jobList.JobList('getSelectedJob'),
                patchInfo: new nixps.patchplanner.PatchInfo()
            });

            this.close();
        },


        _cancelButtonHandler: function() {
            this.close();
        },


        _closeDialogHandler: function() {
            this.destroy();
            this.element.remove();
        }


    });

}(jQuery));