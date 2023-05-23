/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en, _*/
/*global namespace, nixps, api, cloudflow_path */
/*global panzer_filelist*/
(function() {

	namespace('nixps.patchplanner');


	/**
	 * @brief abstraction for the cloudflow settings for patchplanner
	 */
	nixps.patchplanner.cloudflow_settings = function() {
	};


	nixps.patchplanner.cloudflow_settings.prototype = {

		constructor: nixps.patchplanner.cloudflow_settings,


		/**
		 * @brief returns the root of the patchplanner application path
		 */
		get_app_path: function() {
			return new cloudflow_path("cloudflow://PP_FILE_STORE/");
		},


		/**
		 * @brief returns the root of the patchplanner application path
		 */
		get_output: function() {
			return new cloudflow_path("cloudflow://PP_FILE_STORE/");
		},


		/**
		 * @brief returns the current unit
		 */
		get_unit: function() {
			return nixps.patchplanner.units.inch;
		}
	};

})();