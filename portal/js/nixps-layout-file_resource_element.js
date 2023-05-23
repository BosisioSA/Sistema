/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, _, namespace, nixps, cloudflow_path */

(function() {

	namespace("nixps.layout");

	/**
	 * @brief object model for a layout resource
	 *        can be constructed either with a valid file resource json or cloudflow file url
	 * @warn doesn't copy the json
	 */
	nixps.layout.file_resource_element = function(p_argument) 
	{
		if (arguments.length === 1) 
		{
			if ($.isPlainObject(p_argument) && _.has(p_argument, "url")) 
			{
				this.m_json = p_argument;
			}
			else if (((p_argument instanceof nixps.cloudflow.URLPath) || (p_argument instanceof cloudflow_path)) && (p_argument.is_file()))
			{
				this.m_json = {
					url: p_argument.get_full_path()
				};
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

	nixps.layout.file_resource_element.prototype = {

		constructor: nixps.layout.file_resource_element,

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
		 * @brief sets the resource file
		 */
		set_file: function(p_file) 
		{
			if (((! (p_file instanceof cloudflow_path)) && (! (p_file instanceof nixps.cloudflow.URLPath))) || (! p_file.is_file())) {
				throw new Error("invalid parameter");
			}

			this.m_json.url = p_file.get_full_path();
		},
		

		/**
		 * @brief returns the cloudflow path for this file resource
		 */
		get_file: function()
		{
			return new nixps.cloudflow.URLPath(this.m_json.url);
		},


		/**
		 * @brief returns the data associated with that file element
		 */
		get_data: function() {
			if (this.m_json.data) {
				return this.m_json.data;
			}

			return {};
		},


		/** 
		 * @brief sets the data associated with that file element
		 */
		set_data: function(p_data) {
			if (! $.isPlainObject(p_data)) {
				throw new Error('invalid parameter');
			}

			this.m_json.data = p_data;
		},

		/**
		 * @brief sets the clip box
		 */
		set_clip_box: function(p_reference_box, p_x, p_y, p_width, p_height)
		{
			if (_.indexOf(["artbox" , "bleedbox", "cropbox", "mediabox", "trimbox"], p_reference_box) < 0)
			{
				throw new Error('invalid parameter');
			}

			if ((typeof p_x !== 'number') || (typeof p_y !== 'number') || (typeof p_width !== 'number') || (typeof p_height !== 'number'))
			{
				throw new Error('invalid parameter');
			}

			this.m_json.box = p_reference_box;
			this.m_json.x = p_x;
			this.m_json.y = p_y;
			this.m_json.width = p_width;
			this.m_json.height = p_height;
		},

		/**
		 * @brief returns the refrence box for the clip box
		 */
		get_reference_box: function() 
		{
			if (this.m_json.box === undefined)
			{
				throw new Error('no reference box');
			}

			return this.m_json.box;
		},


		/**
		 * @brief returns true if the resource element has a clip box
		 */
		has_clip_box: function()
		{
			if ((this.m_json.x === undefined) || (this.m_json.y === undefined) || (this.m_json.width === undefined) || (this.m_json.height === undefined))
			{
				return false;
			}

			return true;
		},


		/**
		 * @brief returns the clip box
		 */
		get_clip_box: function() 
		{
			if ((this.m_json.x === undefined) || (this.m_json.y === undefined) || (this.m_json.width === undefined) || (this.m_json.height === undefined))
			{
				throw new Error("no clip box");
			}

			return {
					x: this.m_json.x, 
					y: this.m_json.y,
					width: this.m_json.width,
					height: this.m_json.height
				};
		},

		/**
		 * @brief sets the separation
		 */
		set_separation: function(p_separation_name) 
		{
			if ((typeof p_separation_name !== 'string') || (p_separation_name.length === 0))
			{
				throw new Error("invalid parameter");
			}

			this.m_json.separations = [ p_separation_name ];
		},

		/**
		 * @brief returns the separation
		 */
		get_separation: function()
		{
			if ((this.m_json.separations === undefined) || (this.m_json.separations.length === 0))
			{
				throw new Error("no separation");
			}

			return this.m_json.separations[0];
		},

		/**
		 * @brief sets the page
		 */
		set_page: function(p_page) 
		{
			if ((typeof p_page !== 'number') || (p_page < 0))
			{
				throw new Error("invalid parameter");
			}

			this.m_json.page = p_page;
		},

		/**
		 * @brief returns the separation
		 */
		get_page: function()
		{
			if (this.m_json.page === undefined)
			{
				throw new Error("no page");
			}

			return this.m_json.page;
		},

		/**
		 * @brief sets the decorator
		 */
		set_decorator: function(p_decorator)
		{
			if ((typeof p_decorator !== 'string') || (p_decorator.length === 0)) {
				throw new Error('invalid parameter');
			}

			this.m_json.decorator = p_decorator;
		},


		/**
		 * @brief gets the decorator
		 */
		get_decorator: function()
		{
			if (this.m_json.decorator === undefined)
			{
				throw new Error('no decorator');
			}

			return this.m_json.decorator;
		},


		/**
		 * @brief sets the data of the file resource
		 */
		set_data: function(p_data) {
			if (! $.isPlainObject(p_data)) {
				throw new Error('invalid parameter');
			}

			this.m_json.data = p_data;
		},


		/**
		 * @brief returns the data for that resource
		 */
		get_data: function() {
			if (this.m_json.data === undefined)
			{
				return {};
			}

			return this.m_json.data;

		},


		/**
		 * @brief sets the file mirror attribute
		 */
		set_mirror: function(p_mirror) {
			if (p_mirror !== "both"
				&& p_mirror !== "vertical"
				&& p_mirror !== "horizontal"
				&& p_mirror !== "none") {
				throw new Error('invalid mirror parameter passed');
			}

			this.m_json.mirror = p_mirror;
		},


		/**
		 * @brief returns the mirror attribute
		 */
		get_mirror: function() {
			if (this.m_json.mirror !== "both"
				&& this.m_json.mirror !== "vertical"
				&& this.m_json.mirror !== "horizontal"
				&& this.m_json.mirror !== "none") {
				return "none";
			}

			return this.m_json.mirror;			
		},


		/**
		 * @brief returns the rotation
		 */
		get_rotation: function() {
			if (typeof this.m_json.rotation !== "number") {
				return 0;
			}

			return this.m_json.rotation;
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
