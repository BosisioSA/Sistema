/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window, jQuery, cloudflow_path */

/*global panzer_layout_edition_sheet, _*/
/*global nixps, namespace */

(function( $ ) {

    $.widget("nixps-patchplanner.JobToolbar", {

        options: {

        	/**
        	 * @brief the name of the job under edit
        	 */
        	jobName: '',

        	/**
        	 * @brief sets mom exported
        	 */
        	momExported: false
        	
        },


        _create: function() {
        	this.element.addClass(this.widgetFullName);

			this.element.append('<span class="apptitle">Job Configuration</span>');

			var buttons = $('<span>').addClass('buttons');
			buttons.appendTo(this.element);

			var newButton = $("<button>").addClass('newButton').text('New...');
			newButton.button();
			newButton.appendTo(this.element);

			var openButton = $("<button>").addClass('openButton').text('Open...');
			openButton.button();
			openButton.appendTo(this.element);

			var spacer = $('<div>');
			spacer.css({
				display: 'inline-block'
			});
			spacer.width(15);
			spacer.appendTo(this.element);

			var exportButton = $("<button>").addClass("needsproject exportButton").text("Commit Job Patching");
			exportButton.button({
				disabled: true
			});
			exportButton.appendTo(this.element);

			var settingsButton = $("<button>").addClass('settingsButton').text("Settings...");
			settingsButton.button();
			settingsButton.appendTo(this.element);

			var projectName = $("<span class='projectname'></span>");
			projectName.appendTo(this.element);

			var momExported = $("<span class='momexported'>Job Committed</span>");
			momExported.appendTo(this.element);

			this._on(this.element, {
				'click .newButton': this._newButtonHandler,
				'click .openButton': this._openButtonHandler,
				'click .exportButton': this._exportButtonHandler,
				'click .settingsButton': this._settingsButtonHandler
			});

			this.option('jobName', this.options.jobName);
			this.option('momExported', this.options.momExported);
		},


		_newButtonHandler: function() {
			this._trigger('new');
		},


		_openButtonHandler: function() {
			this._trigger('open');
		},


		_exportButtonHandler: function() {
			this._trigger('export');
		},


		_settingsButtonHandler: function() {
			this._trigger('settings');
		},


		_setOption: function(key, value) {
			if (key === "jobName") {
				this._super(key, value);
				if (typeof value === "string") {
					this.element.find('.projectname').text(value);
				}
			}
			else if (key === 'momExported') {
				this._super(key, value);
				if (value === true) {
					this.element.find('.momexported').show();
					this.element.find('.exportButton').button('disable');
				}
				else {
					this.element.find('.momexported').hide();
					this.element.find('.exportButton').button('enable');
				}
			}
		}

    });

}(jQuery));