/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, _, namespace, nixps, cloudflow_path */

(function() {

	namespace("nixps.layout");

	/**
	 * @brief object model for a layout resource
	 *        can be constructed either with a valid file resource json or cloudflow file url
	 * @warn doesn't copy the json
	 */
	nixps.layout.generic_resource_element = function(p_argument) 
	{
		if (arguments.length === 1) 
		{
			if ($.isPlainObject(p_argument))
			{
				this.m_json = p_argument;
			}
			else 
			{
				throw new Error("invalid json");
			}	
		}
		else 
		{
			throw new Error("invalid parameters supplied");
		}
	};

	nixps.layout.generic_resource_element.prototype = {

		constructor: nixps.layout.generic_resource_element,

		/**
		 * @brief [private] validates a blob key
		 */
		_validate_blob_key: function(p_key) {
			if ((typeof p_key !== 'string') || (p_key.length === 0))
			{
				throw new Error('invalid blob key');
			}
		},


		/**
		 * @brief adds a metadata blob to the layout format, the blob must be an object
		 */
		set_metadata_blob: function(p_key, p_blob) {
			this._validate_blob_key(p_key);

			if ($.isPlainObject(p_blob) === false) {
				throw new Error('invalid blob');
			}

			this.m_json[p_key] = p_blob;
		},


		/**
		 * @brief returns the metadata blob with the given name
		 */
		get_metadata_blob: function(p_key) {
			this._validate_blob_key(p_key);

			if ($.isPlainObject(this.m_json[p_key]) === false) {
				throw new Error('no such blob');
			}

			return this.m_json[p_key];
		},


		/**
		 * @brief sets the json object for the resource element
		 */
		set_json: function(p_json)
		{
			if (! $.isPlainObject(p_json)) 
			{
				throw new Error('invalid parameter');
			}

			return this.m_json;
		},

		/**
		 * @brief returns the json representation
		 */
		to_json: function()
		{
			return $.extend(true, {}, this.m_json);
		}
	};
	
}());
