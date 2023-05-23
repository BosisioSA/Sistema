/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global $, console, nixps, namespace, cloudflow_path, s */


(function() {

	namespace("nixps.cloudflow");


	function needsEncoding(str) {
	    for (var i = 0, n = str.length; i < n; i++) {
    	    if (str.charCodeAt(i) > 255) { 
    	    	return true; 
    	    }
    	}
    	return false;
	}


	function fixEncoding(str) {
		return str.replace(/\%[ABCDEF0123456789][ABCDEF0123456789]/g, function(c) {
			return c.toLowerCase();
		});
	}


	function encodeSpaces(str) {
		return str.replace(/\ /g, function(c) {
			return '%20';
		});
	}


	/** 
	 * @brief The supported url schemes
	 */
	var SUPPORTED_SCHEMES = [
		"cloudflow", 
		"file"
	];

	/**
	 * @brief returns the scheme name of a path
	 */
	function getSchemeName(pString) {
		if ((typeof pString !== "string") || s.isBlank(pString)) {
			throw new Error('invalid parameter');
		}

		return s.strLeft(pString, "://");
	}

	/**
	 * @brief represents a url path
	 * @param pPathString the path string to represent
	 * @brief pIsDir consider the given path string as directory, else autodetect with the last slash
	 */
	nixps.cloudflow.URLPath = function(pPathString, pIsDir) {
		if (pPathString instanceof cloudflow_path) {
			this.mPathString = p_path_string.m_path_string;
		}
		else if (pPathString instanceof nixps.cloudflow.URLPath) {
			this.mPathString = p_path_string.mPathString;
		}
		else {
			if (typeof pPathString !== "string") {
				throw new Error("path string invalid");
			}

			if (SUPPORTED_SCHEMES.indexOf(getSchemeName(pPathString)) < 0) {
				throw new Error('unsupported url scheme: ' + getSchemeName(pPathString));
			}

			this.mPathString = pPathString;
		}

		if (pIsDir === true) {
			if (s.endsWith(this.mPathString, "/") === false) {
				this.mPathString += "/";
			}
		}
	}


	nixps.cloudflow.URLPath.prototype = {

		constructor: nixps.cloudflow.URLPath,


		/**
		 * @brief returns the scheme name
		 */
		getSchemeName: function() {
			return this.mPathString.substring(0, this.mPathString.indexOf("://"));
		},


		/**
		 * @brief returns the parent path
		 */
		toParent: function() {
			var schemeName = this.getSchemeName();

			// Don't go further up
			if (s.endsWith(this.mPathString, "://")) {
				return this;
			}

			var tempPath;
			if (this.isDirectory()) {
				tempPath = s.strLeftBack(s.strLeftBack(this.mPathString, "/"), "/");
			}
			else {
				tempPath = s.strLeftBack(this.mPathString, "/");
			}

			if (tempPath.length < this.getSchemeName().length + 3 /* :// */) 
			{
				return new nixps.cloudflow.URLPath(this.getSchemeName() + "://");
			}
			return new nixps.cloudflow.URLPath(tempPath);
		},


		/**
		 * @brief returns true if the path represents a directory
		 */
		isDirectory: function() {
			return s.endsWith(this.mPathString, "/");
		},


		/**
		 * @brief returns true if the path represents a directory
		 */
		isFile: function() {
			return this.isDirectory() === false;
		},


		/**
		 * @brief returns the name of the last component in the path
		 */
		getName: function() {
			if ((this.getSchemeName() + "://") === this.mPathString) {
				return "/";
			}

			if (this.isDirectory()) {
				return s.strRightBack(s.strLeftBack(this.mPathString, "/"), "/");
			}

			return s.strRightBack(this.mPathString, "/");
		},


		/**
		 * @brief returns the child path with pathname
		 */
		toChild: function(pPath) {
			if ((typeof pPath !== "string") || s.isBlank(pPath)) {
				throw new Error("invalid child name");
			}

			if (this.isDirectory()) {
				if (s.endsWith(pPath, "/") === false) {
					return new nixps.cloudflow.URLPath(this.mPathString + pPath + '/');
				}

				return new nixps.cloudflow.URLPath(this.mPathString + pPath);
			}

			throw new Error('cannot go to path, this is a file path');
		},


		/**
		 * @brief returns the child file with filename
		 */
		toFile: function(pFileName)
		{
			if ((typeof pFileName !== "string") 
				|| s.isBlank(pFileName) 
				|| (pFileName.indexOf('/') >= 0)) {
				throw new Error("invalid file name name");
			}

			if (! this.isDirectory()) {
				throw new Error('path is not a directory')
			}


			return new nixps.cloudflow.URLPath(this.mPathString + pFileName);
		},


		/**
		 * @brief returns the full path as a string
		 */
		getFullPath: function() {
			var encodedParts = [];
			var parts = this.mPathString.split('/');
			for(var i = 0; i < parts.length; i++) {
				if (i === 0) {
					encodedParts.push(encodeSpaces(parts[i]));
				}
				else {
					var part = parts[i];
					if (needsEncoding(part) === true) {
						part = encodeURIComponent(part);
					}
					part = fixEncoding(part);
					part = encodeSpaces(part);
					encodedParts.push(part);
				}
			}

			return encodedParts.join('/');
		}

	},

	nixps.cloudflow.URLPath.prototype.to_parent_path = nixps.cloudflow.URLPath.prototype.toParent;
	nixps.cloudflow.URLPath.prototype.is_directory = nixps.cloudflow.URLPath.prototype.isDirectory;
	nixps.cloudflow.URLPath.prototype.is_file = nixps.cloudflow.URLPath.prototype.isFile;
	nixps.cloudflow.URLPath.prototype.get_name = nixps.cloudflow.URLPath.prototype.getName;
	nixps.cloudflow.URLPath.prototype.to_path = nixps.cloudflow.URLPath.prototype.toChild;
	nixps.cloudflow.URLPath.prototype.to_file = nixps.cloudflow.URLPath.prototype.toFile;
	nixps.cloudflow.URLPath.prototype.get_full_path = nixps.cloudflow.URLPath.prototype.getFullPath;

}());


