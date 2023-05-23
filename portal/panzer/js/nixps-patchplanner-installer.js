/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en*/
/*global namespace, nixps*/
/*global panzer_filelist*/
/*global api*/


(function() {

	namespace("nixps.patchplanner");

	/** 
	 * @brief the different directories that must be specified
	 */
	var directories = [
		"job_marks_path",
		"font_path",
		"marks_path",
		"mom_output_path",
		"mirror_proofs_output_path",
		"drill_mount_output_path",
		"pdf_output_path",
		"pdf_overview_output_path",
		"jobs_path",
		"patch_sheets_path"
	];



	/**
	 * @brief catchable installer error
	 */
	nixps.patchplanner.RequirementsError = function() {};


	nixps.patchplanner.installer = function(p_patchplanner_directories) 
	{
		if ($.isPlainObject(p_patchplanner_directories) === false) {
			throw new Error('invalid patchplanner directories');
		}

		this.m_patchplanner_directories = {};

		for(var i = 0; i < directories.length; i++) {
			var directory = p_patchplanner_directories[directories[i]]
			this.m_patchplanner_directories[directories[i]] = directory;
		}
	};

	nixps.patchplanner.installer.prototype = {

		/**
		 * @brief installs the patchplanner application in the root folder
		 */
		install: function() {
			var that = this;

			var result = this.check_install_requirements();
			if (result === false) {
				throw new nixps.patchplanner.RequirementsError();
			}

			var setup = {};
			_.each(_.pairs(this.m_patchplanner_directories), function(pair) {
				setup[pair[0]] = pair[1];
			});

			api.printplanner.install_patchplanner(setup);
		},


		/**
		 * @brief returns an array of performed checks 
		 */
		check_install: function() {
			var patchplanner_directories = this.m_patchplanner_directories;
			return $.Deferred(function(pDefer) {
				api_async.printplanner.check_patchplanner_install(patchplanner_directories, function(result) {
					pDefer.resolve(result);
				}, function(error) {
					pDefer.reject(error);
				});
			});
		},


		/**
		 * @brief checks if patchplanner can run on this installation, returns a boolean
		 */
		check_install_no_details: function() {
			var patchplanner_directories = this.m_patchplanner_directories;
			return $.Deferred(function(pDefer) {
				api_async.printplanner.check_patchplanner_install(patchplanner_directories, function(results) {
					var paths = _.keys(results);

					for(var i = 0; i < paths.length; i++) {
						var pathResult = results[paths[i]];
						var resultKeys = _.keys(pathResult);
						for(var j = 0; j < resultKeys.length; j++) {
							if (pathResult[resultKeys[j]] !== "ok") {
								pDefer.resolve(false);
							}
						}
					}

					pDefer.resolve(true);
				}, function(error) {
					pDefer.reject(error);
				});
			});
		},


		/**
		 * @brief checks if patchplanner can run on this installation, returns a boolean
		 */
		check_install_requirements: function() {
			var patchplanner_directories = this.m_patchplanner_directories;
			return $.Deferred(function(pDefer) {
				api_async.printplanner.check_patchplanner_install(patchplanner_directories, function(results) {
					var paths = _.keys(results);

					for(var i = 0; i < paths.length; i++) {
						if ((results[paths[i]].valid !== "ok") && (results[paths[i]].valid !== "does not exist")) {
							pDefer.resolve(false);
						}
					}

					pDefer.resolve(true);
				}, function(error) {
					pDefer.reject(error);
				});
			});
		}

	};
}());
