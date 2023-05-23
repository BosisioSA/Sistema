/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, nixps, namespace, _ */

(function() {
	
	namespace("nixps.patchplanner");


	nixps.patchplanner.PatchInfo = function() {
		var settings = new nixps.patchplanner.CloudflowSettings();

		var placementInfo = api_sync.printplanner.get_patch_placement_info(settings.getJobsPath().getFullPath(), settings.getPatchSheetsPath().getFullPath());

		if (placementInfo.error !== undefined) {
			throw new Error('error in response');
		}

		this.placementInfo = placementInfo;
	};


	nixps.patchplanner.PatchInfo.prototype = {

		constructor: nixps.patchplanner.PatchInfo,


		/**
		 * @brief returns the job info for that patch id
		 */
		getJobPatchInfo: function(pPatchId) {
			if ((typeof pPatchId !== "string") || (pPatchId.length === 0)) {
				throw new Error('invalid parameter');
			}

			for(var i = 0; i < this.placementInfo.jobs.length; i++) {
				var job = this.placementInfo.jobs[i];
				var patches = job.patches;
				for(var j = 0; j < patches.length; j++) {
					var patch = patches[j];
					if (patch.patch_id === pPatchId) {
						return patch;
					}
				}
			}

			throw new Error('no such patch');
		},


		/**
		 * @brief returns the complete job list
		 */
		getJobsWithMOM: function() {
			var jobList = _.map(_.filter(this.placementInfo.jobs, function(job) {
				return (job.has_mom === true);
			}), function(job) {
				return job.job_name;
			});

			if ($.isArray(jobList)) {
				return jobList.sort();
			}

			return [];
		},


		/**
		 * @brief returns the complete job list
		 */
		getJobs: function() {
			var jobList = _.map(this.placementInfo.jobs, function(job) {
				return job.job_name;
			});

			if ($.isArray(jobList)) {
				return jobList.sort();
			}

			return [];
		},


		/**
		 * @brief returns the complete job list
		 */
		getSheets: function() {
			var sheetList= _.map(this.placementInfo.sheets, function(sheet) {
				return sheet.sheet_name;
			});

			if ($.isArray(sheetList)) {
				return sheetList.sort();
			}

			return [];
		},


		/**
		 * @brief returns the available patches for that job on that sheet
		 */
		getAvailablePatchesForJob: function(pJobName, pSheetName) {
			if ((typeof pJobName !== "string") || (pJobName.length === 0)) {
				throw new Error('invalid parameter');
			}

			var job = _.find(this.placementInfo.jobs, function(job) {
				return job.job_name === pJobName;
			});

			if ($.isPlainObject(job) === false) {
				throw new Error('no such job');
			}

			var patches = job.patches;
			return _.map(_.filter(patches, function(patch) {
				return (patch.sheets.length === 0) || (patch.sheets.indexOf(pSheetName) >= 0);
			}), function(patch) {
				return patch.patch_id;
			});
		},


		/**
		 * @return the associated job names given the patch ids
		 */
		getJobsForPatchIds: function(pPatchIds) {
			var jobs = this.placementInfo.jobs;
			return _.compact(_.uniq(_.map(pPatchIds, function(id) {
				var jobinfo = _.find(jobs, function(job) {
					return _.find(job.patches, function(patch) {
						return patch.patch_id === id;
					}) !== undefined;
				});

				if (jobinfo !== undefined) {
					return jobinfo.job_name;
				}

				return false;
			})));
		},


		/**
		 * @brief returns the sheet names on which this job is placed
		 */
		getSheetsForJob: function(pJobName) {
			if ((typeof pJobName !== "string") || (pJobName.length === 0)) {
				throw new Error('invalid parameter');
			}

			var job = _.find(this.placementInfo.jobs, function(job) {
				return job.job_name === pJobName;
			});

			if ($.isPlainObject(job) === false) {
				throw new Error('no such job');
			}

			var patches = job.patches;
			var sheets = {};
			for(var i = 0; i < patches.length; i++) {
				var patch = patches[i];
				var sheetsForPatch = patch.sheets;

				for(var j = 0; j < sheetsForPatch.length; j++) {
					var sheetName = sheetsForPatch[j];
					if (sheets[sheetName] === undefined) {
						sheets[sheetName] = 1;
					}
					else {
						sheets[sheetName]++;
					}
				}
			}

			return sheets;
		},


		/**
		 * @brief returns the sheet names on which this job is placed
		 */
		getJobsForSheet: function(pSheetName) {
			if ((typeof pSheetName !== "string") || (pSheetName.length === 0)) {
				throw new Error('invalid parameter');
			}

			var sheet = _.find(this.placementInfo.sheets, function(sheet) {
				return sheet.sheet_name === pSheetName;
			});

			if ($.isPlainObject(sheet) === false) {
				throw new Error('no such job');
			}

			var patches = sheet.patches;
			var jobs = {};
			for(var i = 0; i < patches.length; i++) {
				var patch = patches[i];
				var jobName = patch.job;

				if ((typeof jobName === "string") && (jobName.length > 0)) {
					if (jobs[jobName] === undefined) {
						jobs[jobName] = 1;
					}
					else {
						jobs[jobName]++;
					}
				}
			}

			return jobs;
		},


		/** 
		 * @brief returns the amount of patches placed for that sheet
		 */
		getPlacedPatchCountForSheet: function(pSheetName) {
			if ((typeof pSheetName !== "string") || (pSheetName.length === 0)) {
				throw new Error('invalid parameter');
			}

			var sheet = _.find(this.placementInfo.sheets, function(sheet) {
				return sheet.sheet_name === pSheetName;
			});

			if ($.isPlainObject(sheet) === false) {
				throw new Error('no such sheet');
			}

			return _.size(sheet.patches);
		},


		/**
		 * @brief returns the amount of patches placed for that job
		 */
		getPlacedPatchCountForJob: function(pJobName) {
			if ((typeof pJobName !== "string") || (pJobName.length === 0)) {
				throw new Error('invalid parameter');
			}

			var job = _.find(this.placementInfo.jobs, function(job) {
				return job.job_name === pJobName;
			});

			if ($.isPlainObject(job) === false) {
				throw new Error('no such job');
			}

			return _.filter(job.patches, function(patch) {
				return (patch.sheets.length > 0);
			}).length;
		},


		/**
		 * @brief returns the amount of patches for that job
		 */
		getPatchCountForJob: function(pJobName) {
			if ((typeof pJobName !== "string") || (pJobName.length === 0)) {
				throw new Error('invalid parameter');
			}

			var job = _.find(this.placementInfo.jobs, function(job) {
				return job.job_name === pJobName;
			});

			if ($.isPlainObject(job) === false) {
				throw new Error('no such job');
			}

			return job.patches.length;			
		}

	};

})();