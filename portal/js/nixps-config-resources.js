/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true, newcap: true*/
/*globals $, _, jsPlumb, console, api_sync, window */

///////////////////////////////////////////////////////////////////////////////////////
// RESOURCES TAB
///////////////////////////////////////////////////////////////////////////////////////

(function() {

	function createInputRow(pName, pValue) {
		var row = $("<tr>"
			+	"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"
			+	"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-resources.' + pName).toUpperCase() + "</td>"
			+	"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"
			+	"<td class='description'><input id='resources_" + pName + "' name='" + pName + "' value='' placeholder='" + $.i18n._('nixps-cloudflow-resources.' + pName) + "' size='60'>"
			+ "</td></tr>");

		row.find('input').attr('value', pValue);

		return row;

	}

	function createMetaRow(pName) {
		return $("<tr class='meta-row'>" 
			+ "<td colspan='4'><div class='meta-arrow' style='display: block;'>"
			+ "<img class='meta-arrow-image' src='portal/images/dashboard_fold_arrow.png'>"
			+ "<table class='results " + pName + "'><tbody></tbody></table>"
		+ "</div></td></tr>");
	}

	window.resources_tab = {

		//
		// General Methods
		//
		setup_ui: function(pPrereleaseFlags)
		{
			this.resourceInfo = {
				central_resources_path: {
					value : "cloudflow://PP_FILE_STORE/Resources/",
					fullPath : "cloudflow://PP_FILE_STORE/Resources/",
					exists : false
				},
				curve_path: {
					type : "CloudflowCurve",
					value : "CloudflowCurve/",
					fullPath : "CloudflowCurve/",
					exists : false,
					count : 0
				},
				font_path: {
					type : "Font",
					value : "Font/",
					fullPath : "Font/",
					exists : false,
					count : 0
				},
				icc_profile_path: {
					type : "ICCProfile",
					value : "ICCProfile/",
					fullPath : "ICCProfile/",
					exists : false,
					count : 0
				},
				packz_all_resources_path: {
					type : "PACKZAllResources",
					value : "PACKZAllResources/",
					fullPath : "PACKZAllResources/",
					exists : false,
					count : 0
				}
			};

			$('#config-navs').append("<li id='tabs-resources-tab'><a href='#tabs-resources'>" + $.i18n._('nixps-cloudflow-resources.title') + "</a></li>");
			$('#config-tabs').append("<div id='tabs-resources' class='tab'><table id='resources-pref-table' class='tsw-table' style='margin-right:0px; margin-left:0px; width:100%'></table></div>");

			var that = this;
			api_async.preferences.get_for_realm("system", "", "com.nixps.server", "resources", function(pResult) {
				if ('preferences' in pResult) {
					if ('base_path' in pResult.preferences === true) {
						that.resourceInfo.central_resources_path.value = pResult.preferences.base_path;
						that.resourceInfo.central_resources_path.fullPath = pResult.preferences.base_path;
					}
					if ('paths' in pResult.preferences === true) {
						var resourcePaths = pResult.preferences.paths;
						for (var resourceKey in that.resourceInfo) {
							if (resourceKey !== 'central_resources_path') {
								var resourceType = that.resourceInfo[resourceKey].type;
								if (resourceType in resourcePaths && resourcePaths[resourceType] !== '') {
									that.resourceInfo[resourceKey].value = resourcePaths[resourceType];
								}
							}
						}
					}
				}

				// RESOURCES
				for (var resourceKey in that.resourceInfo) {
					var inputRow = $('#resources-pref-table').append(createInputRow(resourceKey, that.resourceInfo[resourceKey].value));
					$('#resources-pref-table').append(createMetaRow(resourceKey));
				}

				that.updateTable();
				that.enable_handlers();
				that.check_install();
			});

		},

		updateTable: function() {
			var tableBody = $('#tabs-resources table.results tbody');
			tableBody.empty();

			var fullPathRow = $('<tr>').append($('<td>').addClass('fullpathtitle')).append($('<td>').addClass('fullpath'));
			var tableRow = $('<tr>').append($('<td>').addClass('yesno')).append($('<td>').addClass('description'));

			for (var resourceKey in this.resourceInfo) {
				var resourceInfo = this.resourceInfo[resourceKey];
				tableBody = $('#tabs-resources table.results.' + resourceKey).find('tbody');

				if (resourceKey !== 'central_resources_path') {
					var row = fullPathRow.clone();
					row.children('.fullpathtitle')._t('nixps-cloudflow-resources.fullpath.title');
					row.children('.fullpath').text(resourceInfo.fullPath);
					row.appendTo(tableBody);
				}

				if ('exists' in resourceInfo === true) {
					var row = tableRow.clone();

					if (resourceInfo.exists === true) {
						row.children('.yesno')._t('nixps-cloudflow-resources.check.success');
						row.children('.yesno').addClass('yes');
					} else {
						row.children('.yesno')._t('nixps-cloudflow-resources.check.failed');
						row.children('.yesno').addClass('no');
					}

					row.children('.description')._t('nixps-cloudflow-resources.folder_exists');
					row.appendTo(tableBody);
					if (resourceInfo.exists === true && 'count' in resourceInfo === true) {
						var row = tableRow.clone();
						row.children('.yesno').text(resourceInfo.count);
						row.children('.yesno').addClass('yes');
						row.children('.description')._t('nixps-cloudflow-resources.found_resources');
						row.appendTo(tableBody);
					}

				}
			}
		},

		check_install: function() {

			var basePath = $('#resources-pref-table').find('#resources_central_resources_path').attr('value');

			var resourcePreferences = {
				base_path : basePath,
				paths : {}
			};

			var that = this;
			var doSave = false;
			for (var resourceKey in this.resourceInfo) {
				var resourceInfo = this.resourceInfo[resourceKey];

				var inputID = '#resources_' + resourceKey;
				var value = $('#resources-pref-table').find(inputID).attr('value');
				if (typeof value !== "string") {
					doSave = false; // one is not a string -> do not save
					continue;
				}
				resourceInfo.value = value;

				if (resourceKey === 'central_resources_path') {
					resourceInfo.fullPath = basePath;
				} else {
					resourcePreferences.paths[resourceInfo.type] = resourceInfo.value;
					try {
						new nixps.cloudflow.URLPath($(this).val(), true).getFullPath();
						resourceInfo.fullPath = resourceInfo.value;
					} catch (pException) {
						resourceInfo.fullPath = basePath + resourceInfo.value;
					}
				}
				// we have at least seen one valid input field... let the save go
				doSave = true;
				api_async.file.does_exist(resourceInfo.fullPath, (function(pResourceInfo) {
					return function(pResult) {
						pResourceInfo.exists = pResult.exists && pResult.is_folder;
						pResourceInfo.fullPath = pResult.url;
						if (pResourceInfo.exists == true) {
							if ('type' in pResourceInfo === true) {
								api_async.resource.enumerate(pResourceInfo.type, function(pResult) {
									pResourceInfo.count = pResult.resource_locators.length;
									if (pResourceInfo.type === 'PACKZAllResources' && pResourceInfo.count !== 0) {
										pResourceInfo.count = 1;
									}
									that.updateTable();
								});
							} else {
								that.updateTable();
							}
						} else {
							that.updateTable();
						}
					};
				}(resourceInfo)), function(){});
			}
			if (doSave === true) {
	            api_async.preferences.save_for_realm(resourcePreferences, "system", "", "com.nixps.server", "resources")
			}
		},
		
		enable_handlers: function()
		{
			var that = this;
			var checkInstall = _.throttle(_.bind(that.check_install, that), 1000);
			var inputids = '';

			for (var resourceKey in this.resourceInfo) {
				var inputID = '#resources_' + resourceKey;
				if (inputids === '') {
					inputids = inputID;
				} else {
					inputids += ', ' + inputID;
				}
			}

			$(inputids).on('blur', function(pEvent) {
				$(inputids).each(function() {
					var targetfield = $(this).attr('name');
				});
			});

			$(inputids).on('keyup', function(pEvent) {
				$(inputids).each(function() {
					var targetfield = $(this).attr('name');
				});
				checkInstall();
			});

		},


		set_metadata: function(p_blob)
		{
		}

	};

}());

