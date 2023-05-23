/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, _, namespace, nixps */

(function() {

	namespace("nixps.layout");

	/**
	 * @brief object model for a layout sheet
	 * @warn doesn't copy the json
	 */
	nixps.layout.sheet = function(p_sheet_json) 
	{
		if (arguments.length === 2) 
		{
			var width = arguments[0];
			var height = arguments[1];

			if ((typeof width !== 'number') || (typeof height !== 'number'))
			{
				throw new Error('invalid parameter');
			}

			this.m_json = {
				width: width,
				height: height,
				objects: []
			};
		} 
		else if (arguments.length === 1) 
		{
			if ($.isPlainObject(p_sheet_json)) 
			{
				this.m_json = p_sheet_json;
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

	nixps.layout.sheet.prototype = {

		constructor: nixps.layout.sheet,

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
		 * @brief returns the width of the sheet
		 */
		get_width: function() 
		{
			return this.m_json.width;
		},

		/**
		 * @brief returns the height of the sheet
		 */
		get_height: function() 
		{
			return this.m_json.height;
		},


		/**
		 * @brief returns the sheet contents
		 */
		get_objects: function()
		{
			return this.m_json.objects;
		},


		/** 
		 * @brief sets the sheet size
		 */
		set_size: function(p_width, p_height) {
			if ((typeof p_width !== 'number') 
				|| (typeof p_height !== 'number')
				|| (p_width < 0)
				|| (p_height < 0)) {
				throw new Error('invalid height, width');
			}

			this.m_json.width = p_width;
			this.m_json.height = p_height;
		},

		/**
		 * @brief adds a resource object to the sheet (shortcut)
		 */
		add_resource_object: function(p_id, p_resource_id, p_left, p_bottom, p_scale_h, p_scale_v, p_rotation)
		{
			this.m_json.objects.push({
				id: p_id,
				type: 'resource',
				resource: p_resource_id, 
				left: p_left,
				bottom: p_bottom,
				scale_v: p_scale_v,
				scale_h: p_scale_h,
				rotation: p_rotation
			});
		},


		/**
		 * @brief adds a resource object to the sheet (shortcut)
		 */
		add_resource_object_with_options: function(p_id, p_resource_id, p_options)
		{
			this.m_json.objects.push($.extend({
				id: p_id,
				type: 'resource',
				resource: p_resource_id
			}, p_options));
		},


		/**
		 * @brief adds a rectangle to the sheet
		 */
		add_rectangle_object_with_options: function(p_id, p_options)
		{
			this.m_json.objects.push($.extend({
				id: p_id,
				type: 'rectangle'
			}, p_options));
		},


		/**
		 * @brief returns the array of resource objects
		 */
		get_resource_objects: function()
		{
			return this.m_json.objects;
		},


		/**
		 * @brief removes the objects that refer to other resource ids
		 */
		keep_only_resource_ids: function(p_resource_ids)
		{
			this.m_json.objects = _.filter(this.m_json.objects, function(p_object)
			{
				return _.contains(p_resource_ids, p_object.resource);
			});
		},


		/**
		 * @brief removes the objects in the array
		 */
		remove_resource_ids: function(p_resource_ids)
		{
			this.m_json.objects = _.reject(this.m_json.objects, function(p_object)
			{
				return _.contains(p_resource_ids, p_object.resource);
			});
		},


		/**
		 * @brief returns true if the sheets has a label with id
		 */
		has_id: function(p_id) 
		{
			return _.contains(_.map(this.m_json.objects, function(p_object) {
				return p_object.id;
			}), p_id);
		},


		/**
		 * @brief returns true if the sheets has a resource id
		 */
		has_resource_id: function(p_resource_id) 
		{
			return _.contains(_.map(this.m_json.objects, function(p_object) {
				return p_object.resource;
			}), p_resource_id);
		},


		/**
		 * @brief removes all objects of the sheet
		 */
		clear_objects: function()
		{
			this.m_json.objects = [];
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
