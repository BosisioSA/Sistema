/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en, _, cloudflow_path */
/*global namespace, nixps, api_sync*/
/*global panzer_filelist*/

(function() {

	namespace("nixps.patchplanner");

	/**
	 * @brief creates the job settings
	 * @param pFile the cloudflow path of the file to which the settings apply
	 * @param pJSON the json parameters saved in the job, optional.  
	 *				If not provided the job settings are initialized with the default values.
	 */
	nixps.patchplanner.SheetSettings = function(pSheetSettings) {
		this.mJSON = pSheetSettings;

		if (($.isPlainObject(pSheetSettings) === false)
			|| (typeof pSheetSettings.margin_left !== "number") 
			|| (typeof pSheetSettings.margin_right !== "number") 
			|| (typeof pSheetSettings.margin_top !== "number")
			|| (typeof pSheetSettings.margin_bottom !== "number")
			|| (typeof pSheetSettings.default_width !== "number")
			|| (typeof pSheetSettings.default_height !== "number"))
		{
			throw new Error('invalid settings');
		}
	};

	nixps.patchplanner.SheetSettings.prototype = {

		/**
		 * @brief returns the sheet margins
		 */
		getMargins: function() {
			return {
				left: this.mJSON.margin_left,
				right: this.mJSON.margin_right,
				top: this.mJSON.margin_top,
				bottom: this.mJSON.margin_bottom
			};
		},


		/** 
		 * @brief returns the default width
		 */
		getDefaultWidth: function() {
			return this.mJSON.default_width;
		},


		/**
		 * @brief returns the y offset
		 */
		getDefaultHeight: function() {
			return this.mJSON.default_height;
		}
		
	};

}());