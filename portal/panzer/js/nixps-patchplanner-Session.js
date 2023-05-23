/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, gVariables, gJacketID, layout_document, cloudflow_path, api_sync, namespace, nixps */


(function() {

	namespace("nixps.patchplanner");

	window.CACHED_DOCUMENT = null;

	/**
	 * @brief Initializes a session based on gVariables and gJackedID, modifies both variables
	 * A session is determin
	 */
	nixps.patchplanner.Session = function() {
		// The project name and session flag go together.  They determine if the sheet
		// editor is in MOM or Sheet mode.  
		this.mProjectName = $.cookie('patchplanner.projectName', {path: '/'});
		this.mJobSession = $.cookie('patchplanner.jobSession', {path: '/'}) === "true";

		this.mPatchscopeAssetURL = $.cookie('patchplanner.patchscopeAssetURL', {path: '/'});
		this.mApplicationPaths = new nixps.patchplanner.CloudflowSettings();
	};

	nixps.patchplanner.Session.prototype = {

		/**
		 * @brief true if the session has a project
		 */
		hasProjectName: function() {
			return typeof this.mProjectName === "string" && this.mProjectName.length > 0;
		},


		/**
		 * @brief sets the project name
		 */
		setProjectName: function(projectName) {
			this.mProjectName = projectName;
			$.cookie("patchplanner.projectName", projectName, {path: '/'});
			window.CACHED_DOCUMENT = null;
		},


		/**
		 * @brief returns the current project name
		 */
		getProjectName: function()
		{
			if (! this.hasProjectName()) 
			{
				throw new Error("session has no project");
			}

			return this.mProjectName;
		},


		/**
		 * @brief sets the project name
		 */
		setJobSession: function(pIsJobSession) {
			if ((pIsJobSession !== true) && (pIsJobSession !== false)) {
				throw new Error('invalid parameter');
			}

			this.mJobSession = pIsJobSession;
			$.cookie("patchplanner.jobSession", pIsJobSession, {path: '/'});
			window.CACHED_DOCUMENT = null;
		},


		/**
		 * @brief returns the job session flag
		 */
		isJobSession: function() {
			return this.mJobSession === true;
		},


		/** 
		 * @brief clears the patchscope asset to edit
		 */
		clear_patchscope_asset_url: function()
		{
			this.mPatchscopeAssetURL = "";
			$.cookie("patchplanner.patchscopeAssetURL", "", {path: '/'});
		},


		/**
		 * @brief sets the patchscope asset to edit
		 */
		set_patchscope_asset_url: function(p_asset_url)
		{
			if ((typeof p_asset_url !== "string") || (p_asset_url.length === 0))
			{
				throw new Error('invalid asset url');
			}

			var l_asset_url = p_asset_url;

			// strip of the cloudflow prefix (necessary for asset api)
			if (l_asset_url.search("cloudflow://") === 0) 
			{
				l_asset_url = p_asset_url.substr("cloudflow://".length);
			}

			if (l_asset_url.length === 0)
			{
				throw new Error('invalid asset url');
			}

			this.mPatchscopeAssetURL = l_asset_url;
			$.cookie("patchplanner.patchscopeAssetURL", l_asset_url, {path: '/'});
		},


		/**
		 * @brief returns the patchscope asset to edit
		 */
		get_patchscope_asset_url: function()
		{
			if ((typeof this.mPatchscopeAssetURL !== "string")
				|| (this.mPatchscopeAssetURL.length === 0)) 
			{
				throw new Error('no patchscope asset url in session');
			}

			return this.mPatchscopeAssetURL;
		},


		/**
		 * @brief returns the asset path
		 */
		get_patchscope_asset_path: function()
		{
			if ((typeof this.mPatchscopeAssetURL !== "string")
				|| (this.mPatchscopeAssetURL.length === 0)) 
			{
				throw new Error('no patchscope asset url in session');
			}

			return new nixps.cloudflow.URLPath('cloudflow://' + this.mPatchscopeAssetURL);
		},


		/**
		 * @brief returns the patchscope job id
		 */
		get_patchscope_job_id: function() {
			var path = new nixps.cloudflow.URLPath("cloudflow://" + this.get_patchscope_asset_url());
			return path.toParent().getName();
		},


		/**
		 * @brief loads the layout document associated with the session
		 */
		load_layout_document: function() {
			if (! this.hasProjectName()) {
				throw new Error("session has no project");
			}

			if (window.CACHED_DOCUMENT instanceof nixps.patchplanner.layout_document) {
				return window.CACHED_DOCUMENT;
			}

			var projectName = this.getProjectName();
			var cloudflowPath = this.mApplicationPaths.getPatchSheetsPath();
			if (this.isJobSession()) {
				cloudflowPath = this.mApplicationPaths.getJobsPath().toChild(this.getProjectName());
			}
			cloudflowPath = cloudflowPath.toFile(projectName + ".json");

			var layoutJSON = api_sync.file.read_json_from_url(cloudflowPath.getFullPath());
			var layoutDocument = new nixps.patchplanner.layout_document(layoutJSON);
			window.CACHED_DOCUMENT = layoutDocument;
			return layoutDocument;
		},


		/**
		 * @brief returns the layout document cloudflow path
		 */
		get_layout_document_path: function() {
			var projectName = this.getProjectName();
			var cloudflowPath =  this.mApplicationPaths.getPatchSheetsPath();
			if (this.isJobSession()) {
				cloudflowPath = this.mApplicationPaths.getJobsPath().toChild(projectName);
			}
			cloudflowPath = cloudflowPath.toFile(projectName + ".json");

			return cloudflowPath;
		},


		/**
		 * @brief saves the layout document
		 */
		saveLayoutDocument: function(pLayoutDocument) {
			if (this.hasProjectName() === false) {
				throw new Error("session has no project");
			}

			if ((pLayoutDocument instanceof nixps.patchplanner.layout_document) === false) {
				throw new Error("invalid layout_document");
			}

			var projectName = this.getProjectName();
			var cloudflowPath  = this.mApplicationPaths.getPatchSheetsPath();
			if (this.isJobSession()) {
				api_sync.file.create_folder(this.mApplicationPaths.getJobsPath().getFullPath(), this.getProjectName());
				cloudflowPath = this.mApplicationPaths.getJobsPath().toChild(this.getProjectName());
			}
			cloudflowPath = cloudflowPath.toFile(projectName + ".json");

			api_sync.file.write_string(cloudflowPath.getFullPath(), JSON.stringify(pLayoutDocument.to_json()));
			window.CACHED_DOCUMENT = pLayoutDocument;
			api_async.printplanner.invalidate_cache(cloudflowPath.getFullPath());
		},


		/**
		 * @brief returns true if the job has zero patches
		 */
		has_zero_patches: function(pJobPath) {
			if ((! (pJobPath instanceof nixps.cloudflow.URLPath)) || (! pJobPath.isFile())) {
				throw new Error("invalid parameter");
			}

			var answer = api_sync.file.fileExists(pJobPath.getFullPath() + ".zeropatches.json");
			return answer.result;
		},


		/**
		 * @brief returns the zero patches for a job
		 */
		get_zero_patches: function(pJobPath) {
			if ((! (pJobPath instanceof nixps.cloudflow.URLPath)) || (! pJobPath.isFile())) {
				throw new Error("invalid parameter");
			}

			var patches = api_sync.file.read_json_from_url(pJobPath.getFullPath() + ".zeropatches.json");
			if ($.isPlainObject(patches)) {
				return patches.patches;
			}

			return [];
		},


		/** 
		 * @brief sets the zero patches for a job
		 */
		set_zero_patches: function(pJobPath, pZeroPatches) {
			if ((! (pJobPath instanceof nixps.cloudflow.URLPath)) || (! pJobPath.isFile())) {
				throw new Error("invalid parameter");
			}

			if ($.isPlainObject(pZeroPatches) === false) {
				throw new Error('invalid parameter');
			}

			return api_sync.file.write_string(pJobPath.getFullPath() + ".zeropatches.json", JSON.stringify(pZeroPatches));
		},


		/**
		 * @brief returns true if the mom file is present for that job
		 */
		isJobMOMPresent: function() {
			if (this.hasProjectName() === false) {
				throw new Error('no project name');
			}

			if (this.isJobSession() === false) {
				throw new Error("not a job session");
			}

			// Load the layout document
			var layoutDocument = this.load_layout_document();

			// Load the filelist, should be exactly one file
			var fileList = layoutDocument.get_filelist();
			if (fileList.length !== 1) {
				return false;
			}

			// Export the mom for the file
			var fileEntry = fileList[0];
			var filePath = fileEntry.getFullPath();
			var fileSettings = layoutDocument.get_file_data(fileEntry);
			var mountMethod = layoutDocument.get_settings().mounting_method;
			layoutDocument.set_settings($.extend(layoutDocument.get_settings(), fileSettings));
			//|| mountMethod === 'drillmount'
			if (mountMethod === 'mirror' ) {
				// The path of the mom output file
				var mirrorOutputFile = this.mApplicationPaths.getJobsPath().toChild(this.getProjectName()).toFile(fileSettings.slugline_base_name + "_mount.pdf");
				// var mirrorOutputFile = this.mApplicationPaths.getMOMOutputPath().toFile(fileSettings.slugline_base_name + "_mount.pdf");

				var answer = api_sync.file.fileExists(mirrorOutputFile.getFullPath());
				return answer.result;
			}

			// The path of the mom output file
			var momOutputFile = this.mApplicationPaths.getJobsPath().toChild(this.getProjectName()).toFile(fileSettings.slugline_base_name + ".xml");
			// var momExportFile = this.mApplicationPaths.getMOMOutputPath().toFile(fileSettings.slugline_base_name + ".xml");

			var answer = api_sync.file.fileExists(momOutputFile.getFullPath());
			return answer.result;
		},


		/**
		 * @brief loads the layout document associated with the session
		 */
		getPDFFromJob: function(pJobName) {
			if ((typeof pJobName !== 'string') || (pJobName.length === 0)) {
				throw new Error('invalid job name');
			}

			var cloudflowPath = this.mApplicationPaths.getJobsPath().toChild(pJobName).toFile(pJobName + ".json");

			var layoutJSON = api_sync.file.read_json_from_url(cloudflowPath.getFullPath());
			var layoutDocument = new nixps.patchplanner.layout_document(layoutJSON);

			var filelist = layoutDocument.get_filelist();
			
			if (filelist.length !== 1) {
				throw new Error('the job sheet can contain only one pdf file');
			}

			return filelist[0];
		},


		getAvailablePatchesForJob: function(pJobName) {
			if ((typeof pJobName !== 'string') || (pJobName.length === 0)) {
				throw new Error('invalid job name');
			}

			var jobCloudflowPath = this.mApplicationPaths.getJobsPath().toChild(pJobName).toFile(pJobName + ".json");
			var layoutJSON = api_sync.file.read_json_from_url(jobCloudflowPath.getFullPath());
			var layoutDocument = new nixps.patchplanner.layout_document(layoutJSON);
			var filelist = layoutDocument.get_filelist();
			var pdfPath = filelist[0];
			var jobPatchIds = layoutDocument.get_patchids(pdfPath);

			

			return jobPatchIds;
		}

	};

}());

