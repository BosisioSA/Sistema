/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, _, namespace, nixps */

(function() {

	namespace("nixps.layout");

	/**
	 * @brief object model for a layout resource
	 * @warn doesn't copy the json
	 */
	nixps.layout.resource = function(p_layout_resource_json) 
	{
		if (arguments.length === 0) 
		{
			this.m_json = [];	
		} 
		else if (arguments.length === 1) 
		{
			if ($.isArray(p_layout_resource_json)) 
			{
				this.m_json = p_layout_resource_json;
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

	nixps.layout.resource.prototype = {

		constructor: nixps.layout.resource,

		/**
		 * @brief validates the resource index
		 */
		_validate_resource_index: function(p_unknown)
		{
			if (typeof p_unknown !== 'number') 
			{
				throw new Error('invalid parameter');
			}

			if ((p_unknown < 0) || (p_unknown >= this.m_json.length))
			{
				throw new Error('invalid parameter');	
			}
		},

		/**
		 * @brief adds a resource in the layout document
		 */
		add_resource_element: function(p_resource_element) 
		{
			if (! p_resource_element instanceof nixps.layout.file_resource_element) 
			{
				throw new Error('invalid parameter');
			}

			this.m_json.push(p_resource_element.to_json());			
		},

		/**
		 * @brief removes a resource with id from the layout document
		 */
		remove_resource_element: function(p_index)
		{
			if (typeof p_index !== 'number') 
			{
				throw new Error('invalid parameter');
			}

			if ((p_index > -1) && (p_index < this.m_json.length)) {
    			this.m_json.splice(p_index, 1);
			}
		},


		/**
		 * @brief returns true if there is such an id
		 */
		has_resource_element: function(p_index) 
		{
			if (typeof p_index !== 'number') 
			{
				throw new Error('invalid parameter');
			}

			return (p_index >= 0) && (p_index < this.m_json.length);
		},


		/**
		 * @brief returns the resource given the id
		 */
		get_resource_element: function(p_index)
		{
			this._validate_resource_index(p_index);
			
			var resource_json = this.m_json[p_index];

			if (_.has(resource_json, "url"))
			{
				return new nixps.layout.file_resource_element(resource_json);
			}

			return new nixps.layout.generic_resource_element(resource_json);
		},

		/**
		 * @brief returns the resource count
		 */
		count: function() 
		{
			return this.m_json.length;
		},

		/**
		 * @brief returns the json representation of the layout document
		 */
		to_json: function()
		{
			return $.extend(true, [], this.m_json);
		}
	};
	
}());
