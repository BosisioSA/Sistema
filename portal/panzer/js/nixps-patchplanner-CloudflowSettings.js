/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en, _*/
/*global namespace, nixps, api, cloudflow_path, window */
/*global panzer_filelist*/
(function() {

	namespace('nixps.patchplanner');


	var settings = null;
	var defaults = null;
	var preferences = null;

	/**
	 * @brief abstraction for the cloudflow settings for patchplanner
	 */
	nixps.patchplanner.CloudflowSettings = function(override) {
		if ($.isPlainObject(defaults) === false) {
	        var command = { "method" : "request.config", "name" : "servers" };
	        $.ajax({
				type: 'POST',
				url: "/portal.cgi",
				data: JSON.stringify(command),
				success: function(data) { 
					defaults = data;
				},
				dataType: "json",
				async: false
			});
			this.validateSettings(defaults); 
		}
		if ($.isPlainObject(preferences) === false) {
			preferences = api.preferences.get_for_realm('system', '', 'com.nixps.patchplanner', '').preferences;
		}
		//deep copy defaults
		settings = jQuery.extend(true, {}, defaults);
		//allow some defaults to be overriden
        if(settings && override && $.isPlainObject(override)){
        	
        	if(override.output){
        		settings.preferences.patchplanner.output = override.output;	
        	}
        	if(override.cut_gutter){
        		settings.preferences.patchplanner.cut_gutter = override.cut_gutter;
        	}
        	if(override.layout_direction){
        		settings.preferences.patchplanner.layout_direction = override.layout_direction;
        	}
        	//settings.preferences.patchplanner.output_patch_sizes = override.output_patch_sizes;
        	//settings.preferences.patchplanner.momsettings = override.momsettings;
        	//settings.preferences.patchplanner.mounting =override.mounting;
        	this.validateSettings(settings);
        }
	};
 
	nixps.patchplanner.CloudflowSettings.prototype = {

		constructor: nixps.patchplanner.CloudflowSettings,

		/**
		 * @brief validates the patchplanner settings
		 */
		validateSettings: function(settings){
			if (($.isPlainObject(settings) === false)
	        	|| ($.isPlainObject(settings.preferences) === false)
	        	|| ($.isPlainObject(settings.preferences.patchplanner) === false)
	        	|| ($.isPlainObject(settings.preferences.patchplanner.momsettings) === false)
	        	|| ($.isPlainObject(settings.preferences.patchplanner.sheetsettings) === false)
				|| (typeof settings.preferences.patchplanner.job_marks_path !== "string")
				|| (typeof settings.preferences.patchplanner.font_path !== "string")
				|| (typeof settings.preferences.patchplanner.jobs_path !== "string")
				|| (typeof settings.preferences.patchplanner.marks_path !== "string")
				|| (typeof settings.preferences.patchplanner.mirror_proofs_output_path !== "string")
				|| (typeof settings.preferences.patchplanner.drill_mount_output_path !== "string")
				|| (typeof settings.preferences.patchplanner.mom_output_path !== "string")
				|| (typeof settings.preferences.patchplanner.patch_sheets_path !== "string")
				|| (typeof settings.preferences.patchplanner.pdf_output_path !== "string")
				|| (typeof settings.preferences.patchplanner.output !== "string"))	        	
	        {
	        	defaults = null;
	        	throw new Error('invalid settings');
	        }
		},
		/**
		 * @brief returns the patchplanner settings
		 */
		getSettings: function(){
			return settings.preferences.patchplanner;
		},
		/**
		 * @brief returns the root of the patchplanner fonts path
		 */
		getFontPath: function() {
			return new nixps.cloudflow.URLPath(settings.preferences.patchplanner.font_path, true);
		},


		/**
		 * @brief returns the root of the patchplanner marks path
		 */
		getMarksPath: function() {
			return new nixps.cloudflow.URLPath(settings.preferences.patchplanner.marks_path, true);
		},


		/**
		 * @brief returns the root of the patchplanner mom output path
		 */
		getMOMOutputPath: function() {
			return new nixps.cloudflow.URLPath(settings.preferences.patchplanner.mom_output_path, true);
		},


		/**
		 * @brief returns the root of the patchplanner mom output path
		 */
		getMirrorProofsOutputPath: function() {
			return new nixps.cloudflow.URLPath(settings.preferences.patchplanner.mirror_proofs_output_path, true);
		},

		/**
		 * @brief returns the root of the patchplanner drill_mount_output_path
		 */
		getDrillMountOutputPath:function(){
			return new nixps.cloudflow.URLPath(settings.preferences.patchplanner.drill_mount_output_path, true);
		},
		/**
		 * @brief returns the root of the patchplanner jobs path
		 */
		getJobsPath: function() {
			return new nixps.cloudflow.URLPath(settings.preferences.patchplanner.jobs_path, true);
		},


		/**
		 * @brief returns the root of the patchplanner patch sheets path
		 */
		getPatchSheetsPath: function() {
			return new nixps.cloudflow.URLPath(settings.preferences.patchplanner.patch_sheets_path, true);
		},


		/**
		 * @brief returns the root of the patchplanner pdf output path
		 */
		getPDFOutputPath: function() {
			return new nixps.cloudflow.URLPath(settings.preferences.patchplanner.pdf_output_path, true);
		},


		/**
		 * @brief returns the root of the patchplanner pdf overview path
		 */
		getPDFOverviewOutputPath: function() {
			return new nixps.cloudflow.URLPath(settings.preferences.patchplanner.pdf_overview_output_path, true);
		},


		/**
		 * @brief returns the slugline font path
		 */
		getSluglineFontPath: function() {
			return this.getFontPath().toFile('SourceCodePro-Regular.otf');
		},


		/**
		 * @brief returns the default mark path
		 */
		getDefaultMarkPath: function() {
			return this.getMarksPath().toFile('Default.pdf');
		},


		/**
		 * @brief returns the default mark path
		 */
		getDefaultJobMarkPath: function() {
			return this.getJobMarksPath().toFile('Default.pdf');
		},


		/**
		 * @brief returns the job marks path
		 */
		getJobMarksPath: function() {
			return new nixps.cloudflow.URLPath(settings.preferences.patchplanner.job_marks_path, true);
		},


		/**
		 * @brief returns the patchplanner output format 'normal', 'hpgl', ...
		 */
		getOutputFormat: function() {
			return settings.preferences.patchplanner.output;
		},


		/**
		 * @brief returns the sheet settings
		 */
		getSheetSettings: function() {
			return new nixps.patchplanner.SheetSettings(settings.preferences.patchplanner.sheetsettings);
		},


		/**
		 * @brief return the mom settings
		 */
		getMOMSettings: function() {
			return new nixps.patchplanner.MOMSettings(settings.preferences.patchplanner.momsettings);
		},


		/**
		 * @brief return the default mount method
		 */
		getDefaultMountMethod: function() {
			if (settings.preferences.patchplanner.mounting === 'mirror') {
				return "mirror";
			}
			else if (settings.preferences.patchplanner.mounting === 'mirrormom') {
				return "mirrormom";
			}
			else if (settings.preferences.patchplanner.mounting === 'drillmount') {
				return "drillmount";
			}
			else if (settings.preferences.patchplanner.mounting === 'heaford') {
				return "heaford";
			}

			return "mom";
		},


		/**
		 * @brief returns the cut gutter, a gutter around the label that doesn't change with distortion
		 */
		getCutGutter: function() {
			if ('zund' === this.getOutputFormat().toLowerCase()
				|| 'hpgl' === this.getOutputFormat().toLowerCase()) {
				if (typeof settings.preferences.patchplanner.cut_gutter === "number") {
					return settings.preferences.patchplanner.cut_gutter;
				}

				// Default value when none is defined
				return 0;
			}

			// Value when non-zund or non-konsberg is selected
			return 0;
		},


		/** 
		 * @brief returns the layout direction
		 */
		getLayoutStart: function() {
			var ppsettings = settings.preferences.patchplanner;

			if (typeof ppsettings.layout_direction !== "string") {
				return "top";
			}

			return ppsettings.layout_direction;
		},

		
		/**
		 * @brief returns true if the patch sizes must be exported
		 */
		outputPatchSizes: function() {
			var ppsettings = settings.preferences.patchplanner;
			return ppsettings.output_patch_sizes === true;
		},

		/**
		 * True if we need to archive automatically
		 */
		archiveAutomatically: function () {
			return settings.preferences.patchplanner.archive_automatically === true;
		},

		/**
		 * Returns the archive folder
		 */
		getArchiveFolder: function () {
			return new nixps.cloudflow.URLPath(settings.preferences.patchplanner.archive_path);
		},

		/**
		 * Get archive timeout (days)
		 */
		getArchiveTimeout: function () {
			return settings.preferences.patchplanner.archive_timeout;
		},

		/**
		 * Get patch decorator settigns
		 */
		getPatchDecoratorPreferences: function () {
			return preferences.patch_decorator_preferences || {};
		}
	};

})();

