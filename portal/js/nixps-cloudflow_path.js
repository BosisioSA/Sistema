/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global $, console*/

var CLOUDFLOW_SCHEME_NAME = "cloudflow://";

/**
 * @brief represents a cloudflow path
 */
function cloudflow_path(p_path_string, p_is_dir) 
{
	if (p_path_string instanceof cloudflow_path) {
		this.m_path_string = p_path_string.m_path_string;
	}
	else {
		if (typeof p_path_string !== "string") {
			throw new Error("p_path_string invalid");
		}

		if (p_path_string.indexOf(CLOUDFLOW_SCHEME_NAME) !== 0) {
			throw new Error('invalid cloudflow path: ' + p_path_string);
		}

		this.m_path_string = p_path_string;
	}

	if (p_is_dir === true) {
		if (this.m_path_string[this.m_path_string.length - 1] !== "/") {
			this.m_path_string += "/";
		}
	}
}

/**
 * @brief returns the parent path
 */
cloudflow_path.prototype.to_parent_path = function() 
{
	if (this.m_path_string === CLOUDFLOW_SCHEME_NAME) 
	{
		return this;
	}

	var l_search_from = this.m_path_string.length - 1;
	if (this.is_directory()) 
	{
		l_search_from -= 1;
	}

	var l_last_slash = this.m_path_string.lastIndexOf('/', l_search_from);
	if (l_last_slash < CLOUDFLOW_SCHEME_NAME.length) 
	{
		return new cloudflow_path(CLOUDFLOW_SCHEME_NAME);	
	}
	return new cloudflow_path(this.m_path_string.substring(0, l_last_slash + 1));
};

/**
 * @brief returns true if the path represents a directory
 */
cloudflow_path.prototype.is_directory = function()
{
	return this.m_path_string[this.m_path_string.length-1] === '/';
};

/**
 * @brief returns true if the path represents a file
 */
cloudflow_path.prototype.is_file = function()
{
	return ! this.is_directory();
};

/**
 * @brief returns the name of the last component in the path
 */
cloudflow_path.prototype.get_name = function() 
{
	var l_search_from = this.m_path_string.length - 1;
	if (this.is_directory()) 
	{
		l_search_from -= 1;
	}
	var l_last_slash = this.m_path_string.lastIndexOf('/', l_search_from);

	if (this.m_path_string === "cloudflow://") 
	{
		return "/";
	}

	if (this.is_directory())
	{
		return this.m_path_string.substring(l_last_slash + 1, this.m_path_string.length - 1); 
	}
	return this.m_path_string.substring(l_last_slash + 1); 
};

/**
 * @brief returns the child path with pathname
 */
cloudflow_path.prototype.to_path = function(p_path)
{
	if (typeof p_path !== "string") {
		throw new Error("p_path invalid");
	}

	if (p_path.length === 0) {
		throw new Error("p_path invalid");
	}

	if (p_path[p_path.length - 1] !== '/') {
		p_path += "/";
	}

	if (this.is_directory()) {
		return new cloudflow_path(this.m_path_string + p_path);
	}

	throw new Error('cannot go to path, this is a filename');
};

/**
 * @brief returns the child file with filename
 */
cloudflow_path.prototype.to_file = function(p_filename)
{
	if (typeof p_filename !== "string") {
		throw new Error("p_filename invalid");
	}

	if (p_filename.length === 0) {
		throw new Error("p_filename invalid");
	}

	if (p_filename[p_filename.length - 1] === '/') {
		throw new Error("p_filename invalid");
	}

	return new cloudflow_path(this.m_path_string + p_filename);
};

/**
 * @brief returns the full path as a string
 */
cloudflow_path.prototype.get_full_path = function()
{
	return this.m_path_string;
};
