/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, _, namespace, nixps */

(function() {

	namespace("nixps.layout");

	/**
	 * @brief object model for a layout document
	 * @warn copies the json
	 */
	nixps.layout.document = function(p_layout_document_json) 
	{
		if (arguments.length === 0) 
		{
			this.m_json = {};	
		} 
		else if (arguments.length === 1) 
		{
			if ($.isPlainObject(p_layout_document_json)) 
			{
				this.m_json = $.extend(true, {}, p_layout_document_json);
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

	nixps.layout.document.prototype = {

		constructor: nixps.layout.document,

		/** 
		 * @brief [private] validates a resource id
		 */
		_validate_resource_id: function(p_id)
		{
			if ((typeof p_id !== 'string') || (p_id.length === 0))
			{
				throw new Error('invalid id');
			}
		},


		/** 
		 * @brief [private] validates a resource element id
		 */
		_validate_resource_element_id: function(p_id)
		{
			if ((typeof p_id !== 'string') || (p_id.length === 0))
			{
				throw new Error('invalid id');
			}

			var parts = p_id.split('.');

			if (parts.length !== 2) 
			{
				throw new Error('invalid element id, must have one .');
			}

			if (isNaN(parts[1]) === true) 
			{
				throw new Error('invalid part id, must be a number');
			}
		},


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
		 * @brief adds a sheet to the layout document
		 * @return the index of the added sheet
		 */
		add_sheet: function(p_sheet)
		{
			if (! (p_sheet instanceof nixps.layout.sheet))
			{
				throw new Error('invalid parameter');
			}

			if (this.m_json.sheets === undefined)
			{
				this.m_json.sheets = [];
			}

			this.m_json.sheets.push(p_sheet.to_json());
			return this.m_json.sheets.length - 1;
		},


		/**
		 * @brief returns the amount of sheets
		 */
		get_sheet_count: function()
		{
			if (this.m_json.sheets === undefined)
			{
				return 0;
			}

			return this.m_json.sheets.length;
		},

		/**
		 * @brief clears the sheets
		 */
		clear_sheets: function()
		{
			this.m_json.sheets = [];
		},

		/**
		 * @brief removes a sheet
		 */
		remove_sheet: function(p_index)
		{
			if (typeof p_index !== 'number') 
			{
				throw new Error('invalid parameter');
			}

			if (this.m_json.sheets === undefined) 
			{
				return;
			}

			if ((p_index > -1) && (p_index < this.m_json.sheets.length)) {
    			this.m_json.splice(p_index, 1);
			}
		},


		/**
		 * @brief returns the sheet of a document
		 */
		get_sheet: function(p_index)
		{
			if (typeof p_index !== 'number') 
			{
				throw new Error('invalid parameter');
			}

			if (this.m_json.sheets === undefined) 
			{
				throw new Error('invalid parameter');
			}

			if ((p_index < 0) || (p_index > (this.m_json.sheets.length - 1))) 
			{
				throw new Error('invalid parameter');
			}

			return new nixps.layout.sheet(this.m_json.sheets[p_index]);
		},

		/**
		 * @brief adds a resource in the layout document
		 */
		add_resource: function(p_id, p_resource) 
		{
			this._validate_resource_id(p_id);

			if (! (p_resource instanceof nixps.layout.resource))
			{
				throw new Error('invalid parameter');
			}

			if (this.has_resource(p_id))
			{
				throw new Error('resource already exists');
			}

			if (this.m_json.resources === undefined)
			{
				this.m_json.resources = {};
			}

			this.m_json.resources[p_id] = p_resource.to_json();
		},

		/**
		 * @brief lists the resources ids in the layout document
		 */
		get_resources: function()
		{
			if (this.m_json.resources === undefined)
			{
				return [];
			}

			return _.keys(this.m_json.resources);
		},

		/**
		 * @brief removes a resource with id from the layout document
		 */
		remove_resource: function(p_id)
		{
			this._validate_resource_id(p_id);

			if (this.has_resource(p_id)) 
			{
				delete this.m_json.resources[p_id];
			}
		},

		/**
		 * @brief returns the resource given the id
		 */
		get_resource: function(p_id)
		{
			this._validate_resource_id(p_id);

			if (! this.has_resource(p_id))
			{
				throw new Error("resource does not exist: " + p_id);
			}

			return new nixps.layout.resource(this.m_json.resources[p_id]);
		},


		/**
		 * @brief returns true if the document has a resource with that id
		 */
		has_resource: function(p_id)
		{
			this._validate_resource_id(p_id);

			if (this.m_json.resources === undefined)
			{
				return false;
			}

			return _.has(this.m_json.resources, p_id);
		},


		/**
		 * @brief returns true if the resource element exists
		 */
		has_resource_element: function(p_element_id) 
		{
			this._validate_resource_element_id(p_element_id);

			var parts = p_element_id.split('.');

			if (this.has_resource(parts[0]) === false) {
				return false;
			}

			var resource = this.get_resource(parts[0]);

			return resource.has_resource_element(parseInt(parts[1]));
		},


		/**
		 * @brief returns the resource element given an id of format resource_id.index
		 */
		get_resource_element: function(p_element_id) 
		{
			this._validate_resource_element_id(p_element_id);

			var parts = p_element_id.split('.');
			var resource = this.get_resource(parts[0]);

			return resource.get_resource_element(parseInt(parts[1]));
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
		 * @brief returns the json representation of the layout document
		 */
		to_json: function()
		{
			return $.extend(true, {}, this.m_json);
		}
	};
	
}());
