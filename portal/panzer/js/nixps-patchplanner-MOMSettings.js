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
	nixps.patchplanner.MOMSettings = function(pMOMSettings) {
		this.mJSON = pMOMSettings;

		if (($.isPlainObject(pMOMSettings) === false)
			|| (typeof pMOMSettings.reference_box !== "string")
			|| (typeof pMOMSettings.origin_x !== "number") 
			|| (typeof pMOMSettings.origin_y !== "number") 
			|| (typeof pMOMSettings.offset_x !== "number")
			|| (typeof pMOMSettings.offset_y !== "number"))
		{
			throw new Error('invalid settings');
		}
	};

	nixps.patchplanner.MOMSettings.prototype = {

		/**
		 * @brief returns the reference box
		 */
		getReferenceBox: function() {
			return this.mJSON.reference_box;
		},


		/** 
		 * @brief returns x offset
		 */
		getOffsetX: function() {

			return this.mJSON.offset_x;
		},


		/**
		 * @brief returns the y offset
		 */
		getOffsetY: function() {
			return this.mJSON.offset_y;
		},


		/**
		 * @brief returns the origin x
		 */
		getOriginX: function() {
			return this.mJSON.origin_x;
		},


		/**
		 * @brief returns the origin y
		 */
		getOriginY: function() {
			return this.mJSON.origin_y;
		},


		/**
		 * @brief returns the orientation
		 */
		getOrientation: function() {
			return (this.mJSON.pdf_coordinates) ? "left" : "right";
		},


		/**
		 * @brief returns the json representation
		 */
		toJSON: function() {
			return $.extend(true, {}, this.mJSON);
		}
		
	};

}());