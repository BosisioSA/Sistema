/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true, newcap: true*/
/*globals $, _, jsPlumb, console, api_sync, window */

///////////////////////////////////////////////////////////////////////////////////////
// PREFERENCES TAB
///////////////////////////////////////////////////////////////////////////////////////

(function() {

	/**
	 * @brief creates a combo box for the given units array
	 */
	function getSelector(units, pLanguagePrefix) {
		var selector = $('<select>').addClass('unitselector');
		selector.css({
			width: 75
		});

		for(var i = 0; i < units.length; i++) {
			var unit = units[i];
			if (unit.length > 0) {
				selector.append($("<option>").attr('value', unit)._t(pLanguagePrefix + unit));
			} else {
				selector.append($("<option>").attr('value', unit).text(''));
			}
		}

		return selector;
	}

	/**
	 * @brief creates a unit row given the definition name
	 */
	function createUnitRow(pDefinitionName) {
		var unitPreferences = new nixps.cloudflow.SystemUnitPreferences();
		var unit = unitPreferences.getDefinition(pDefinitionName);

		/**
		 * @brief creates the combo boxes for each type of unit
		 */
		var lengthUnitSelector = getSelector((new nixps.cloudflow.KnownUnits()).getLengthUnits(), 'nixps-units.length.display-');
		var resolutionUnitSelector = getSelector((new nixps.cloudflow.KnownUnits()).getResolutionUnits(), 'nixps-units.resolution.display-');
		var rulingUnitSelector = getSelector((new nixps.cloudflow.KnownUnits()).getRulingUnits(), 'nixps-units.ruling.display-');
		var scalingUnitsSelector = getSelector((new nixps.cloudflow.KnownUnits()).getScalingUnits(), 'nixps-units.distortion.display-');


		var accuracy = $('<div>').css({
			display: 'inline-block',
			'margin-left': 50
		});
		accuracy.append($('<label>').css({
			'text-align': 'right'
		})._t('nixps-cloudflow-user_preferences.units.precision').append(':'));
		accuracy.append($('<input>').attr('type', 'number').addClass('unitaccuracy').css({
			'width': 50
		}));

		selector = lengthUnitSelector.clone();
		if (pDefinitionName === "resolution") {
			selector = resolutionUnitSelector.clone();
		} else if (pDefinitionName === "ruling") {
			selector = rulingUnitSelector.clone();
		} else if (pDefinitionName === "distortion" || pDefinitionName === "scaling") {
			selector = scalingUnitsSelector.clone();
		}

		selector.attr("name", pDefinitionName);
		selector.val(unit.getShortName());

		var row = $("<tr class='unitdefinition'>"+
			"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
			"<td width='*' class='name'>" + $.i18n._('nixps-cloudflow-user_preferences.units.' + pDefinitionName).toUpperCase() + "</td>"+
			"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
			"<td class='description'></td>" +
		"</tr>");
		row.find('.description').append(selector);

		var accuracyInput = accuracy.clone();
		accuracyInput.find('input').attr('name', pDefinitionName);
		accuracyInput.find('input').val(unit.getAccuracy());

		row.find('.description').append(accuracyInput);

		return row;
	}


	/**
	 * @brief saves the unit preferences
	 */
	function saveSystemUnits(units) {
		return $.Deferred(function(pDefer) {
			api_async.preferences.save_for_realm(units, "system", "", "", "units", function() {
				pDefer.resolve();
			}, function() {
				pDefer.reject();
			});
		});
	}


	function saveWorkflowSettings(pWorkflowSettings) {
		return $.Deferred(function(pDefer) {
			api_async.preferences.save_for_realm(pWorkflowSettings, "system", "", "", "workflow", function() {
				pDefer.resolve();
			}, function() {
				pDefer.reject();
			});
		});
	}

	function saveAssetSettings(pAssetSettings) {
		return $.Deferred(function(pDefer) {
			api_async.preferences.save_for_realm(pAssetSettings, "system", "", "workspace", "assetview", function(){
				pDefer.resolve();
			}, function(pError) {
				console.error(pError);
				pDefer.reject(pError);
			});
		});
	}

	function savePackzflowSettings(pPackzflowSettings) {
		return $.Deferred(function(pDefer) {
			api_async.preferences.save_for_realm(pPackzflowSettings, "system", "", "com.packz.packzflow", "", function(){
				pDefer.resolve();
			}, function(pError) {
				console.error(pError);
				pDefer.reject(pError);
			});
		});
	}

	/**
	 * @brief gets all off the prerelease settings
	 */
	function getPrereleasePreferences() {
		return $.Deferred(function(pDefer) {
			api_async.preferences.get_for_realm("system", "", "com.nixps.general.prerelease", "", function(preferences) {
				pDefer.resolve(preferences);
			}, function() {
				pDefer.reject();
			});
		});
	}

	function savePrereleasePreferences(pPrereleaseFlags) {
		return $.Deferred(function(pDefer) {
			api_async.preferences.get_for_realm("system", "", "com.nixps.general.prerelease", "", function(preferences) {
				$.extend(preferences.preferences, pPrereleaseFlags);
				api_async.preferences.save_for_realm(preferences.preferences, "system", "", "com.nixps.general.prerelease", "", function(){
					pDefer.resolve();
				}, function(pError) {
					console.error(pError);
					pDefer.reject(pError);
				});
			}, function() {
				pDefer.reject();
			});
		});
	}

	/**
	 * @brief gets all off the RIP settings
	 */
	function getRIPPreferences() {
		return $.Deferred(function(pDefer) {
			api_async.preferences.get_for_realm("system", "", "com.nixps.rip", "", function(preferences) {
				pDefer.resolve(preferences);
			}, function() {
				pDefer.reject();
			});
		});
	}

	/**
	 * @brief gets all of the MARS preferences
	 */
	function getMARSPreferences () {
		return $.Deferred(function(pDefer) {
			api_async.preferences.get_for_realm('system', '', 'com.nixps.mars', '', function(preferences) {
				pDefer.resolve(preferences);
			}, function() {
				pDefer.reject();
			});
		});
	}

	function getAssetPreferences() {
		return $.Deferred(function(pDefer) {
			api_async.preferences.get_for_realm("system", "", "workspace", "", function(preferences) {
				pDefer.resolve(preferences);
			}, function() {
				pDefer.reject();
			});
		});
	}

	/**
	 * @brief gets all of the workflow settings
	 */
	function getWorkflowPreferences() {
		return $.Deferred(function(pDefer) {
			api_async.preferences.get_for_realm("system", "", "", "workflow", function(preferences) {
				pDefer.resolve(preferences);
			}, function() {
				pDefer.reject();
			});
		});
	}

	/**
	 * @brief gets all of the packzflow settings
	 */
	function getPackzflowPreferences() {
		return $.Deferred(function(pDefer) {
			api_async.preferences.get_for_realm("system", "", "com.packz.packzflow", "", function(preferences) {
				pDefer.resolve(preferences);
			}, function() {
				pDefer.reject();
			});
		});
	}

	/**
	 * @brief gets all of the Proofscope settings
	 */
	function getProofscopePreferences() {
		return $.Deferred(function(pDefer) {
			api_async.preferences.get_for_realm("system", "", "com.nixps.proofscope", "", function(preferences) {
				pDefer.resolve(preferences);
			}, function() {
				pDefer.reject();
			});
		});
	}


	/**
	 * @brief saves a Proofscope preference
	 */
	function saveProofscopeOptionPreference(pName, pValue) {
		if (typeof pName !== "string" || pName.length === 0) {
			throw new Error('invalid proofscope setting name');
		}

		return $.Deferred(function(pDefer) {
			api_async.preferences.save_for_realm(pValue, "system", "", "com.nixps.proofscope", "options." + pName, function(preferences) {
				pDefer.resolve(preferences);
			}, function() {
				pDefer.reject();
			});
		});

	}


	/**
	 * @brief saves the unit preferences to the system preferences
	 */
	function savePreferences() {
		var unitPreferences = {};
		$('#pref-table').find('.unitdefinition').each(function() {
			var definitionRow = $(this);
			var select = definitionRow.find('select');
			var accuracy = definitionRow.find('input');
			var accuracyInt = parseInt(accuracy.val(), 10);

			if (! isNaN(accuracyInt) && (accuracyInt >= 0)) {
				unitPreferences[select.attr('name')] = {
					unit: select.val(),
					accuracy: accuracyInt
				};
			}
		});

		saveSystemUnits(unitPreferences);
	}

	function saveRIPPreferences(pKey, pValue) {
		return $.Deferred(function(pDefer) {
			api_async.preferences.save_for_realm(pValue, "system", "", "com.nixps.rip", pKey, pDefer.resolve, pDefer.reject);
		});
	}

	/**
	 * Returns the preferences for the MARS application
	 */
	function getMARSPreferences () {
		return $.Deferred(function (pDefer) {
			api_async
				.preferences
				.get_for_realm('system', '', 'com.nixps.mars', '', function (result) {
					pDefer.resolve(result.preferences);
				}, pDefer.reject);
		});
	}

	/**
	 * Saves the preferences for the MARS application
	 */
	function saveMARSPreferences (preferences) {
		return $.Deferred(function (pDefer) {
			api_async
				.preferences
				.save_for_realm(preferences, 'system', '', 'com.nixps.mars', '', function (result) {
					pDefer.resolve(result.preferences);
				}, pDefer.reject);
		});
	}

	/**
	 * @brief adapts the system preferences according to the legacy setting
	 * @return true if the settings have been adapted in the ui, false if not
	 */
	function adaptPreferencesFromLegacy() {
		var legacyUnit = config_pane.m_json_blob.preferences.int_units;
		var unitPreferences = new nixps.cloudflow.SystemUnitPreferences();
		var lengthUnit = unitPreferences.getDefinition('length');

		if (legacyUnit === 1) {
			// kMM
			if (lengthUnit.isImperial()) {
				$('#pref-table .unitselector[name="length"]').val("mm");
				return true;
			}
		}
		else if (legacyUnit === 2) {
			// kInch
			if (lengthUnit.isMetric()) {
				$('#pref-table .unitselector[name="length"]').val("in");
				return true;
			}
		}

		return false;
	}

	window.settings_tab = {

		//
		// General Methods
		//
		setup_ui: function(pPrereleaseFlags)
		{
			$('#config-navs').append("<li id='tabs-settings-tab'><a href='#tabs-settings'>" + $.i18n._('nixps-cloudflow-settings.title') + "</a></li>");
			$('#config-tabs').append("<div id='tabs-settings' class='tab'><table id='pref-table' class='tsw-table' style='margin-right:0px; margin-left:0px; width:100%'></table></div>");
		},

		enable_handlers: function()
		{
		},

		portal_setup_worker: function(worker_name)
		{
			var l_file_store = ''
			if (worker_name === "indexer")
			{
				l_file_store = 'PP_FILE_STORE';
			}
			var l_worker_dict =
			{
				"app": worker_name,
				"file_store": l_file_store,
				"active": true,
				"running": false,
				"keep_alive": 0
			};
			return l_worker_dict;
		},

		portal_setup_workserver: function(file_path, max_procs)
		{
			var milli = new Date();
			var l_workserver_dict =
			{
				"last_modification": Math.round(milli.getTime()),
				"active": true,
				"running": false,
				"keep_alive": 0,
				"workers": new Object(),
				"file_store_mapping": { 'PP_FILE_STORE' : file_path } ,
				"render_count" : max_procs
			};

			l_workserver_dict.workers['wk_indexer'] = settings_tab.portal_setup_worker('indexer');
			l_workserver_dict.workers['wk_garbagecollector'] = settings_tab.portal_setup_worker('garbagecollector');
			l_workserver_dict.workers['wk_metadata'] = settings_tab.portal_setup_worker('metadata');
			l_workserver_dict.workers['wk_preview_1'] = settings_tab.portal_setup_worker('preview');
			l_workserver_dict.workers['wk_preview_2'] = settings_tab.portal_setup_worker('preview');
			l_workserver_dict.workers['wk_quantumcombined_1'] = settings_tab.portal_setup_worker('quantumcombined');
			l_workserver_dict.workers['wk_quantumcombined_2'] = settings_tab.portal_setup_worker('quantumcombined');
			l_workserver_dict.workers['wk_quantumpackz'] = settings_tab.portal_setup_worker('quantumpackz');
			l_workserver_dict.workers['wk_quantumrip'] = settings_tab.portal_setup_worker('quantumrip');
			l_workserver_dict.workers['wk_quantumdata'] = settings_tab.portal_setup_worker('quantumdata');
			l_workserver_dict.workers['wk_quantumjava'] = settings_tab.portal_setup_worker('quantumjava');
			l_workserver_dict.workers['wk_javawebappshost'] = settings_tab.portal_setup_worker('javaWebAppsHost');
			l_workserver_dict.workers['wk_quantumshare'] = settings_tab.portal_setup_worker('quantumshare');
			l_workserver_dict.workers['wk_postgresql'] = settings_tab.portal_setup_worker('postgresql');
			for (var i = 0; i < max_procs; i++)
			{
				l_workserver_dict.workers['wk_renderer_'+(i+1)] = settings_tab.portal_setup_worker('renderer');
			}

			var l_all_workservers_dict =
			{
				'PP_WORK_SERVER' : l_workserver_dict
			};

			return l_all_workservers_dict;
		},

		portal_check: function()
		{
			var l_ws_dict = config_pane.m_json_blob.work_servers;
			if (l_ws_dict == undefined || l_ws_dict.length != 1 || !'PROOFSCOPE_PORTAL' in l_ws_dict)
			{
				console.log("Rewriting work_servers configuration");

				// Write the FileStore
				config_pane.m_json_blob.file_stores = new Object();
				config_pane.m_json_blob.file_stores['PP_FILE_STORE'] = "Cloudflow Filestore";

				// Write the WorkServer
				config_pane.m_json_blob.work_servers = settings_tab.portal_setup_workserver('', 4);
			}
		},

		add_ad_section: function(parent_tr, index, prereleaseFlags)
		{
			parent_tr.after("<tr id2='active_directory_tr_" + index + "_server' class='active_directory_tr'>" +
								"<td width='35px'><img src='portal/images/config_worker.svg'/></td>" +
								"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.active_directory.server').toUpperCase() + "</td>" +
								"<td class='running'><img src='portal/images/empty.png' height='26'/></td>" +
								"<td class='description'><input id='active_directory-" + index + "-server' class='active_directory-server' value='' autocorrect='off' autocapitalize='off' size='60'>" +
								"&nbsp;<span id='active_directory_add_" + index + "' index='" + index + "' class='fa fa-plus-square fa-lg arrayinput_add active_directory_add' title='" + $.i18n._('nixps-cloudflow-preferences.active_directory.add') + "'></span>" +
								"&nbsp;<span id='active_directory_remove_" + index + "' index='" + index + "' class='fa fa-minus-square fa-lg arrayinput_remove active_directory_remove' title='" + $.i18n._('nixps-cloudflow-preferences.active_directory.remove') + "'></span>" +
								"</td>" +
							"</tr>",
							"<tr id2='active_directory_tr_" + index + "_domain' class='active_directory_tr'>" +
								"<td width='35px'><img src='portal/images/config_worker.svg'/></td>" +
								"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.active_directory.domain').toUpperCase() + "</td>" +
								"<td class='running'><img src='portal/images/empty.png' height='26'/></td>" +
								"<td class='description'><input id='active_directory-" + index + "-domain' class='active_directory-domain' value='' autocorrect='off' autocapitalize='off' placeholder='@domain.local' size='60'></td>" +
							"</tr>",
							"<tr id2='active_directory_tr_" + index + "_dn' class='active_directory_tr'>" +
								"<td width='35px'><img src='portal/images/config_worker.svg'/></td>" +
								"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.active_directory.distinguished_names').toUpperCase() + "</td>" +
								"<td class='running'><img src='portal/images/empty.png' height='26'/></td>" +
								"<td class='description' style='height:100px'><textarea style='height:auto' id='active_directory-" + index + "-dn' class='active_directory-dn' autocorrect='off' autocapitalize='off' cols='62' rows='5' placeholder='cn=Users,ou=my-org,dc=my-domain,dc=com'></textarea></td>" +
							"</tr>",
							"<tr id2='active_directory_tr_" + index + "_scope' class='active_directory_tr'>" +
								"<td width='35px'><img src='portal/images/config_worker.svg'/></td>" +
								"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.active_directory.default_scope').toUpperCase() + "</td>" +
								"<td class='running'><img src='portal/images/empty.png' height='26'/></td>" +
								"<td class='description'><select id='active_directory-" + index + "-scope' class='active_directory-scope'></select></td>" +
							"</tr>");

			var update_f = function ()
			{
				var ext_auth = [];
				var elements = parent_tr.parent().find('.active_directory-server');

				for (var elt_index = 0; elt_index < elements.length; ++elt_index)
				{
					var server_element = $(elements[elt_index]);

					if (server_element.val() !== '')
					{
						var ad_index = server_element.attr('id').replace(/active_directory-([0-9]*)-server/, "$1");
						var server = server_element.val();
						var domain = $('#active_directory-' + ad_index + '-domain').val();
						var dn =  $('#active_directory-' + ad_index + '-dn').val().split(/[\r]?\n/);
						for (var i = dn.length - 1; i >= 0; --i) {
							var item = dn[i].replace(/^\s+/, '').replace(/[\s,]+$/, '');
							if (item === '') {
								dn.splice(i, 1);
							} else {
								dn[i] = item;
							}
						}
						var scope = $('#active_directory-' + ad_index + '-scope').val();

						ext_auth.push({'type': 'ad', 'server': server, 'dn': dn, 'domain': domain, 'scope': scope});
					}
				}

				config_pane.m_json_blob.preferences.ext_auth = ext_auth;

				if (ext_auth.length === 0)
				{
					delete config_pane.m_json_blob.preferences.ext_auth;
				}

				config_pane.touch();
			};

			$('#active_directory-' + index + '-server').focusout(update_f);
			$('#active_directory-' + index + '-domain').focusout(update_f);
			$('#active_directory-' + index + '-dn').focusout(update_f);
			$('#active_directory-' + index + '-scope').change(update_f);

			var add_f = function ()
			{
				var index = $(this).attr('index');
				var new_index = $('tr.active_directory_tr').length;
				window.settings_tab.add_ad_section($('tr[id2=active_directory_tr_' + index + '_scope]'), new_index, prereleaseFlags);
				$('#active_directory-' + new_index + '-scope').append($($('.active_directory-scope')[0]).children().clone());
				$('.active_directory_remove').show();
				$('#active_directory-' + new_index + '-server').focus();				
			};

			var remove_f = function ()
			{
				var index = $(this).attr('index');
				$('tr[id2=active_directory_tr_' + index + '_server]').remove();
				$('tr[id2=active_directory_tr_' + index + '_domain]').remove();
				$('tr[id2=active_directory_tr_' + index + '_dn]').remove();
				$('tr[id2=active_directory_tr_' + index + '_scope]').remove();
				update_f();

				if ($('.active_directory_tr').length <= 4)
				{
					$('.active_directory_remove').hide();
				}
			};

			$('#active_directory_add_' + index).click(add_f);
			$('#active_directory_remove_' + index).click(remove_f);

			if ($('.active_directory_tr').length <= 4)
			{
				$('.active_directory_remove').hide();
			}
			else
			{
				$('.active_directory_remove').show();
			}

			if (prereleaseFlags.preferences.multiple_ad_servers !== true)
			{
				$('.active_directory_add').hide();
			}
		},

		set_metadata_portal: function(json_blob)
		{
			$.when(getPrereleasePreferences(),
				getRIPPreferences(),
				getWorkflowPreferences(),
				getProofscopePreferences(),
				getAssetPreferences(),
				getPackzflowPreferences(),
				getMARSPreferences(),
				nixps.cloudflow.License.get())
				.then(function(prereleaseFlags,
					ripPreferences,
					workflowPreferences,
					proofscopePreferences,
					pAssetPreferences,
					pPackzflowPreferences,
					pMARSPreferences,
					pLicense) {
				$('#pref-table').empty();

				// PREFERENCES
				$('#pref-table').append("<tr class='ws_entry'>"+
									  "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.general.title').toUpperCase() + "</td>"+
									  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
									  "<td></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.general.webserver_url').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='web_server_value' autocorrect='off' autocapitalize='off' value='' size='40'></td></tr>");

				// METADATA
				$('#pref-table').append("<tr class='ws_entry'>"+
										"<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.metadata.title').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.metadata.process_max_pages').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><select id='process_max_pages_popup'><option value='all' selected>" + $.i18n._('nixps-cloudflow-preferences.metadata.process_max_pages-process_all') + "</option>"+
										"<option value='max_pages'>" + $.i18n._('nixps-cloudflow-preferences.metadata.process_max_pages-process_if_less_of_equal_pages_than') + "</option></select>"+
										"<input id='process_max_pages' value=''/> "+
										"</td></tr>");

				// PROOFSCOPE
				$('#pref-table').append("<tr class='ws_entry'>"+
									  "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.proofscope.title').toUpperCase() + "</td>"+
									  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
									  "<td></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.proofscope.auto_render').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='auto_render' type='checkbox' value='auto_render'/> " + $.i18n._('nixps-cloudflow-preferences.enabled') + "</td></tr>");
				$('#pref-table').append("<tr class='deepZoom'>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.proofscope.deep_zoom').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='deep_zoom' type='checkbox' value='deep_zoom'/> " + $.i18n._('nixps-cloudflow-preferences.enabled') + "</td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.proofscope.jpeg_quality').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='jpeg_quality' autocorrect='off' autocapitalize='off' value='75' size='40'></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.proofscope.antialias').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='antialias' type='checkbox' value='antialias'/> " + $.i18n._('nixps-cloudflow-preferences.enabled') + "</td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.proofscope.download_low_res').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><select id='low_res'><option value=0 selected>" + $.i18n._('nixps-cloudflow-preferences.proofscope.download_low_res-none') + "</option>"+
										"<option value=1>" + $.i18n._('nixps-cloudflow-preferences.proofscope.download_low_res-downsampled') + "</option>"+
										"<option value=2>" + $.i18n._('nixps-cloudflow-preferences.proofscope.download_low_res-rasterized') + "</option>"+
										"<span id='low_res_dpi'>&nbsp;<input id='low_res_resolution' autocorrect='off' autocapitalize='off'  value='75' size='10' /> " +
										$.i18n._('nixps-cloudflow-preferences.proofscope.download_low_res-dpi') + "</span></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.proofscope.download_notes').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='download_notes_report_button' type='checkbox' value='download_notes_report_button'/> " + $.i18n._('nixps-cloudflow-preferences.enabled') + "</td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.proofscope.text_layer_support').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='enable_text_selection' type='checkbox' value='enable_text_selection'/> " + $.i18n._('nixps-cloudflow-preferences.enabled') + "</td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.proofscope.show_notes_history_filter').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='show_notes_history_filter' type='checkbox' value='show_notes_history_filter'/> " + $.i18n._('nixps-cloudflow-preferences.enabled') + "</td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.proofscope.show_notes_history').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='show_notes_history' type='checkbox' value='show_notes_history'/> " + $.i18n._('nixps-cloudflow-preferences.enabled') + "</td></tr>");

				$('#pref-table').append("<tr class='ws_entry'>"+
									  "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.maintenance.title').toUpperCase() + "</td>"+
									  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
									  "<td></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.proofscope.cleanup').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'" + " style='height:64px; line-height:26px'" + ">"+
										"<input id='cleanup_size_toggle' type='checkbox' value='cleanup_size'/> "+
										$.i18n._('nixps-cloudflow-preferences.proofscope.cleanup_size_1') + "<input id='cleanup_size_value' value=''/> "+
										$.i18n._('nixps-cloudflow-preferences.proofscope.cleanup_size_2') + "<br>"+
										"<input id='cleanup_age_toggle' type='checkbox' value='cleanup_age'/> "+
										$.i18n._('nixps-cloudflow-preferences.proofscope.cleanup_age_1') + "<input id='cleanup_age_value' value=''/> "+
										$.i18n._('nixps-cloudflow-preferences.proofscope.cleanup_age_2') +
										"</td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.maintenance.empty-trash').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'" + " style='height:64px; line-height:26px'" + ">"+
										"<input id='empty_trash_toggle' type='checkbox' value='cleanup'/> "+
										$.i18n._('nixps-cloudflow-preferences.maintenance.empty-trash.prefix') + "<input id='empty_trash_value' value=''/> "+
										$.i18n._('nixps-cloudflow-preferences.maintenance.empty-trash.suffix') +
										"</td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.maintenance.remove-old-data').toUpperCase() + "</td>" +
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>" +
										"<td class='description'" + " style='height:64px; line-height:26px'" + ">" +
										"<input id='remove-old-approvals_toggle' type='checkbox' value='cleanup'/> "+
										$.i18n._('nixps-cloudflow-preferences.maintenance.remove-old-approvals.prefix') + "<input id='remove-old-approvals_value' value=''/> "+
										$.i18n._('nixps-cloudflow-preferences.maintenance.remove-old-approvals.suffix') + "<br>" +
										"<input id='remove-old-jackets_toggle' type='checkbox' value='cleanup'/> "+
										$.i18n._('nixps-cloudflow-preferences.maintenance.remove-old-jackets.prefix') + "<input id='remove-old-jackets_value' value=''/> "+
										$.i18n._('nixps-cloudflow-preferences.maintenance.remove-old-jackets.suffix') + "<br>" +
										"<input id='remove-old-notes_toggle' type='checkbox' value='cleanup'/> "+
										$.i18n._('nixps-cloudflow-preferences.maintenance.remove-old-notes.prefix') + "<input id='remove-old-notes_value' value=''/> "+
										$.i18n._('nixps-cloudflow-preferences.maintenance.remove-old-notes.suffix') +
										"</td></tr>");


				if (config_pane.m_json_blob.work_servers.PP_WORK_SERVER !== undefined && config_pane.m_json_blob.work_servers.PP_WORK_SERVER.file_store_mapping.PP_FILE_STORE !== undefined)
				{
					// we only display the file store preferences if 'the' PP_WORK_SERVER is defined and if 'the' PP_FILE_STORE mapping is defined
					// for that server.
					if (config_pane.m_json_blob.work_servers.PP_WORK_SERVER.file_store_mapping.PP_FILE_STORE.length == 0)
					{
						// and we only display if the mapping is empty. If not, you have to go to the work-servers tab ...
						// FILESTORE

						// As these items only show up on the setup page, it's no point in localizing them

						$('#pref-table').append("<tr class='ws_entry'>"+
											  "<td colspan='2' class='header'>FILE STORE</td>"+
											  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
											  "<td></td></tr>");
						$('#pref-table').append("<tr>"+
												"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
												"<td width='*' class='name' >LOCATION</td>"+
												"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
												"<td class='description'><input id='proofscope_file_store' autocorrect='off' autocapitalize='off' value='' size='40'></td></tr>");
						$('#pref-table').append("<tr>"+
												"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
												"<td width='25%' class='name' >CHECK FILESTORE</td>"+
												"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
												"<td class='description'><input id='proofscope_file_store_test_file' value='' autocorrect='off' autocapitalize='off' placeholder='a file in the file store' size='40'><a class='green-button' id='check-file-store'>CHECK</a><img id='check-file-store-loading' src='portal/images/loading10.gif'/></td>"+
												"</tr>");
						$('#pref-table').append("<tr>"+
												"<td colspan=4><span id='check_file_store_result' style='color: red'></span></td>"+
												"</tr>");
					}
				}

				// LOG LEVEL
				$('#pref-table').append("<tr class='ws_entry'>"+
										"<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.logging.title').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name'>" + $.i18n._('nixps-cloudflow-preferences.logging.level').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><select id='log_level'>" +
										"<option value=2>" + $.i18n._('nixps-cloudflow-preferences.logging.level-info') + "</option>"+
										"<option value=5 selected>" + $.i18n._('nixps-cloudflow-preferences.logging.level-warning') + "</option>"+
										"<option value=1>" + $.i18n._('nixps-cloudflow-preferences.logging.level-error') + "</option>" +
										"<option value=9>" + $.i18n._('nixps-cloudflow-preferences.logging.level-debug') + "</option></select></td></tr>");
				$('#pref-table').append("<tr class='meta-row'>"+
										"<td colspan='4'><div class='meta-arrow' style='display: block;'>"+
										"<img class='meta-arrow-image' src='portal/images/dashboard_fold_arrow.png'>"+
										$.i18n._('nixps-cloudflow-preferences.logging.level-debug-warning').replace('[', '<i>').replace(']', '</i>')+
										"</div></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.logging.webtrace').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><select id='web_trace'><option value=0>" + $.i18n._('nixps-cloudflow-preferences.logging.webtrace-disabled') + "</option>"+
										"<option value=1>" + $.i18n._('nixps-cloudflow-preferences.logging.webtrace-slow') + "</option>"+
										"<option value=2 selected>" + $.i18n._('nixps-cloudflow-preferences.logging.webtrace-all') + "</option></select></td></tr>");

				// INTERNATIONAL SETTINGS
				$('#pref-table').append("<tr class='ws_entry'>"+
										"<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.international.title').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td></td></tr>");
				$('#pref-table').append("<tr style='display: none;'>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.international.units').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><select id='int_units'><option value=1 selected>" + $.i18n._('nixps-cloudflow-preferences.international.units-metric') + "</option>"+
										"<option value=2>" + $.i18n._('nixps-cloudflow-preferences.international.units-imperial') + "</option></select></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.international.language').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><div class='languageSelector'></td></tr>");

				var unitPreferences = new nixps.cloudflow.SystemUnitPreferences();
				var definitions = unitPreferences.getDefinitions();
				for(var i = 0; i < definitions.length; i++) {
					var definitionName = definitions[i];
					$('#pref-table').append(createUnitRow(definitionName));
				}

				$('#pref-table .languageSelector').TranslatedLanguagesSelector();

				// MAIL
				$('#pref-table').append("<tr class='ws_entry'>"+
									  "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.mail.title').toUpperCase() + "</td>"+
									  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
									  "<td></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.mail.address').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'>"+
										"  <input id='smtp_server' autocorrect='off' autocapitalize='off' value='' placeholder='" + $.i18n._('nixps-cloudflow-preferences.mail.address-placeholder') + "' size='35'/>"+
										"  <input id='smtp_port' autocorrect='off' autocapitalize='off' type='text' value='25' size='5'/>"+
										"  <input id='smtp_ssl' type='checkbox' value='ssl'/> " + $.i18n._('nixps-cloudflow-preferences.mail.ssl') +
										"</td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.mail.username').toUpperCase() + "/" + $.i18n._('nixps-cloudflow-preferences.mail.password').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<input type='text' name='username' style='display:none'/> <input type='password' name='password' style='display:none'/>"+
										"<td class='description'>&nbsp;<button type='button' class='colored-button' id='smtp_change_button'>" + $.i18n._("nixps-cloudflow-preferences.mail.credentials-buttontext") + "</button></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.mail.sender').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='smtp_from' type='email' autocorrect='off' autocapitalize='off' value='noreply@proofscope.com' size='40'></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.mail.test').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='smtp_to' type='email' autocorrect='off' autocapitalize='off' value='' placeholder='" + $.i18n._('nixps-cloudflow-preferences.mail.test-placeholder') + "' size='40'>"+
										"<a class='green-button' id='send-test-mail'>" + $.i18n._('nixps-cloudflow-preferences.mail.test-button').toUpperCase() + "</a><img id='send-test-mail-loading' src='portal/images/loading10.gif'/></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td colspan=4><span id='smtp_send_email_result' style='color: red'></span></td>"+
										"</tr>");

				// SITE
				$('#pref-table').append("<tr class='ws_entry'>"+
					"<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.site.title').toUpperCase() + "</td>"+
					"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
					"<td></td></tr>");
				$('#pref-table').append("<tr>"+
					"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
					"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.site.name').toUpperCase() + "</td>"+
					"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
					"<td class='description'><input id='site_name' old='' value='' autocorrect='off' autocapitalize='off' placeholder='" + $.i18n._('nixps-cloudflow-preferences.site.name-placeholder') + "' size='60'></td></tr>");
				$('#pref-table').append("<tr>"+
					"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
					"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.site.description').toUpperCase() + "</td>"+
					"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
					"<td class='description'><input id='site_description' value='' autocorrect='off' autocapitalize='off' placeholder='" + $.i18n._('nixps-cloudflow-preferences.site.description-placeholder') + "' size='60'></td></tr>");
				$('#pref-table').append("<tr>"+
					"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
					"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.site.url').toUpperCase() + "</td>"+
					"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
					"<td class='description'><input id='site_url' value='' autocorrect='off' autocapitalize='off' size='60'></td></tr>");

				// RIP
				$('#pref-table').append("<tr class='ws_entry'>"+
									  "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.rip.title').toUpperCase() + "</td>"+
									  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
									  "<td></td></tr>");
				$('#pref-table').append("<tr>"+
						 "<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
						 "<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.editmode.title').toUpperCase() + "</td>"+
						 "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
						 "<td class='description'><select class='editModeSelector'>" +
							 "<option value='free'>" + $.i18n._('nixps-cloudflow-preferences.editmode.free') + "</option>" +
							 "<option value='editlock'>"  + $.i18n._('nixps-cloudflow-preferences.editmode.editlock') + "</option>" +
						 "</select>" +
						 "</td></tr>");
				// $('#pref-table').append("<tr>"+
				// 	"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
				// 	"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.rip.curve_recipes').toUpperCase() + "</td>"+
				// 	"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
				// 	"<td class='description'><input id='curve_recipes' type='checkbox' value='curve_recipes'/> " + $.i18n._('nixps-cloudflow-preferences.enabled') + "</td></tr>");


					// ASSET VIEWER
				$('#pref-table').append("<tr class='ws_entry'>"+
									  "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.assetviewer.title').toUpperCase() + "</td>"+
									  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
									  "<td></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.assetviewer.limit').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='assetviewer_limit' type='number' min='0' step='1'></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.assetviewer.url_encoding').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><label><input id='assetviewer_urlencoding' type='checkbox' value='assetviewer_urlencoding'> " + $.i18n._('nixps-cloudflow-preferences.assetviewer.url_encoding_text') + "</label></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.assetviewer.pagebuilder').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><label><input id='assetviewer_pagebuilder_editbutton' type='checkbox' value='assetviewer_pagebuilder_editbutton'> " + $.i18n._('nixps-cloudflow-preferences.assetviewer.pagebuilder_editbutton_text') /*+ " (" + $.i18n._('nixps-cloudflow-preferences.assetviewer.betaversion') + ") "*/ + "</label></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.assetviewer.selecting').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><label><input id='assetviewer_selecting' type='checkbox' value='assetviewer_selecting'> " + $.i18n._('nixps-cloudflow-preferences.assetviewer.selecting_text') + "</label></td></tr>");
				
				// JOBs
				var jobsPart = $('<div>').addClass("settingspart_jobs").SettingPart({
					applicationID: "com.nixps.jobs",
					subkey: "",
					title: $.i18n._('nixps-cloudflow-preferences.jobs.title').toUpperCase(),
					layoutJSON: { "type": "bootstrapGrid", "parameters": [
						[
						  {
							"content": "workersvg",
							"width": {"md": 1}
						  },
						  {
							"content": "overviewpageurl",
							"width": {"md": 11}
						  }
						],[
						  {
							"content": "workersvg_move_on_top",
							"width": {"md": 1}
						  },
						  {
							"content": "typemapping",
							"width": {"md": 11}
						  }
						] ]},
					formJSON: {
						elements: [{
								"type": "component",
								"element": {
									"id": "workersvg",
									"type": "Image",
									"options": {
										"url": "portal/images/config_worker.svg",
										"width": "auto",
										"height": "auto"
									}
								}
							},{
								"type": "field",
								"element": {
									key: "overviewpageurl",
									label: "${nixps-cloudflow-preferences.jobs.overviewpage_url}",
									"component": {
										"id": "overviewpageurl",
										"type": "Input",
										"options": {
											type: "text",
											autocorrect: "off",
											placeholder: "${nixps-cloudflow-preferences.jobs.placeholder_overviewpage_url}",
											size: 60
										}
									}
								}
							},{
								"type": "component",
								"element": {
									"id": "workersvg_move_on_top",
									"type": "Image",
									"options": {
										"url": "portal/images/config_worker.svg",
										"width": "auto",
										"height": "auto"
									}
								}
							},{
								"type": "field",
								"element": {
									key: "typemapping",
									label: "${nixps-cloudflow-preferences.jobs.typemapping}",
									"component": {
										"id": "typemapping",
										"type": "ProjectTypeURLMapping",
										"options": {}
									}
								}
							} ]
						}
				});
				$('#pref-table').append($("<tr>").append($('<td colspan="4">').append(jobsPart)));


				// QUANTUM
				$('#pref-table').append("<tr class='ws_entry'>"+
									  "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.quantum.title').toUpperCase() + "</td>"+
									  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
									  "<td></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.quantum.addons').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='quantum_addons' value='' autocorrect='off' autocapitalize='off' placeholder='" + $.i18n._('nixps-cloudflow-preferences.quantum.addons-placeholder') + "' size='60'></td></tr>");

				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.quantum.system_flows').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='quantum_system_flows' type='checkbox' value='quantum_system_flows'/> " + $.i18n._('nixps-cloudflow-preferences.quantum.system_flows.view') + "</td></tr>");

				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.quantum.preview_by_workflow').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='preview_by_workflow' type='checkbox' value='preview_by_workflow'/> " + $.i18n._('nixps-cloudflow-preferences.quantum.preview_by_workflow.do') + "</td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.quantum.support_distortion').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='always_undistorted_tiles' type='checkbox' value='always_undistorted_tiles'/> " + $.i18n._('nixps-cloudflow-preferences.quantum.support_distortion.do') + "</td></tr>");
                $('#pref-table').append("<tr>"+
                                        "<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
                                        "<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.editmode_quantum.title').toUpperCase() + "</td>"+
                                        "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                                        "<td class='description'><select id='quantum_lock'>" +
                                            "<option value='free'>" + $.i18n._('nixps-cloudflow-preferences.editmode.free') + "</option>" +
                                            "<option value='editlock'>"  + $.i18n._('nixps-cloudflow-preferences.editmode.editlock') + "</option>" +
                                        "</select>" +
                                        "</td></tr>");
				// PACKZFLOW
				$('#pref-table').append("<tr class='ws_entry'>"+
									  "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.packzflow.title').toUpperCase() + "</td>"+
									  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
									  "<td></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.packzflow.inksbookautoload').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='packzflow_inksbook_autoload' type='checkbox' value='packzflow_inksbook_autoload'/> " + $.i18n._('nixps-cloudflow-preferences.packzflow.packzflow_inksbook_autoload') + "</td></tr>");

				// MARS
				$('#pref-table').append("<tr class='ws_entry'>"+
					"<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.mars.title').toUpperCase() + "</td>"+
					"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
					"<td></td></tr>");
				$('#pref-table').append("<tr class='marsCustomerSettings'>"+
					"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
					"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.mars.show_mars_ui').toUpperCase() + "</td>"+
					"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
					"<td class='description'><input id='show_mars_ui' type='checkbox'> " + $.i18n._('nixps-cloudflow-preferences.enabled') + "</td></tr>");
				$('#pref-table').append("<tr class='marsSettings'>"+
					"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
					"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.mars.server_url').toUpperCase() + "</td>"+
					"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
					"<td class='description'><input id='mars_server_url' type='text' value='' autocorrect='off' autocapitalize='off' size='60' placeholder='" + $.i18n._('nixps-cloudflow-preferences.mars.server_url_placeholder') + "'/></td></tr>");
				$('#pref-table').find('.marsSettings').hide();
				$('#pref-table').find('.marsCustomerSettings').hide();

				if (pLicense.check('mars') === true) {
					$('#pref-table').find('.marsSettings').show();
				} else {
					$('#pref-table').find('.marsCustomerSettings').show();
				}

				// GOOGLE LOGIN
				$('#pref-table').append("<tr class='ws_entry'>"+
									  "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.google.title').toUpperCase() + "</td>"+
									  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
									  "<td></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.google.client_id').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='google-client_id' value='' autocorrect='off' autocapitalize='off' placeholder='xxxxx-xxxxx.apps.googleusercontent.com' size='60'></td></tr>");
				$('#pref-table').append("<tr>"+
										"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
										"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.google.secret').toUpperCase() + "</td>"+
										"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										"<td class='description'><input id='google-client_secret' value='' autocorrect='off' autocapitalize='off' placeholder='" + $.i18n._('nixps-cloudflow-preferences.google.secret-placeholder').toUpperCase() + "' size='60'></td></tr>");

				// ACTIVE DIRECTORY LOGIN
				$('#pref-table').append("<tr class='ws_entry' id2='active_directory_tr_title'>"+
									  "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.active_directory.title').toUpperCase() + "</td>"+
									  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
									  "<td></td></tr>");

				var ad_count = 0;
				var parent_tr = $('[id2=active_directory_tr_title]');

				if ((json_blob !== undefined) && (json_blob.ext_auth !== undefined))
				{
					for (var index = 0; index < json_blob.ext_auth.length; ++index)
					{
						if (json_blob.ext_auth[index].type == 'ad')
						{
							ad_count += 1;
						}
					}
				}

				for (var index = 0; (index == 0) || (index < ad_count); ++index)
				{
					window.settings_tab.add_ad_section(parent_tr, index, prereleaseFlags);
					parent_tr = $('[id2=active_directory_tr_' + index + '_scope]');
				}

				if ($.isPlainObject(proofscopePreferences) === true
					&& $.isPlainObject(proofscopePreferences.preferences) === true
					&& $.isPlainObject(proofscopePreferences.preferences.options) === true) {
					if (typeof proofscopePreferences.preferences.options.showNoteFromTextTool === "boolean") {
						$('#enable_text_selection').prop('checked', proofscopePreferences.preferences.options.showNoteFromTextTool === true);
					}

					$('#show_notes_history_filter').prop('checked', proofscopePreferences.preferences.options.showNotesHistoryFilter === true);
					$('#show_notes_history').prop('checked', proofscopePreferences.preferences.options.showNotesHistory === true);
				}

				if (config_pane.m_json_blob.preferences.deep_zoom === true) {
					api_async.preferences.save_for_realm(true, 'system', '', 'com.nixps.proofscope', 'deepZoom');
					proofscopePreferences.preferences.deepZoom = true;
				}

				if ($.isPlainObject(proofscopePreferences) === true
					&& $.isPlainObject(proofscopePreferences.preferences) === true
					&& proofscopePreferences.preferences.deepZoom === true) {
					$('#pref-table').find('.deepZoom').addClass('deepZoomEnabled');
				}

				// CHECK JSON BLOB
				if (json_blob != undefined)
				{
					if (json_blob.web_server != undefined)
						$("#web_server_value").attr("value", json_blob.web_server);
					if (json_blob.smtp_server != undefined)
						$("#smtp_server").attr("value", json_blob.smtp_server);
					if (json_blob.smtp_from != undefined)
						$("#smtp_from").attr("value", json_blob.smtp_from);
					if (json_blob.smtp_login != undefined)
						$("#smtp_login").attr("value", json_blob.smtp_login);
					if (json_blob.smtp_port != undefined)
						$("#smtp_port").attr("value", json_blob.smtp_port);
					if (json_blob.smtp_ssl != undefined)
						$("#smtp_ssl").attr("checked", json_blob.smtp_ssl);
					if (json_blob.log_level != undefined)
						$("#log_level").val(json_blob.log_level);
					if (json_blob.web_trace != undefined)
						$("#web_trace").val(json_blob.web_trace);
					if (json_blob.low_res != undefined)
						$("#low_res").val(json_blob.low_res);
					if (json_blob.low_res == undefined || json_blob.low_res == 0)
						$("#low_res_dpi").hide();
					if (json_blob.low_res_dpi != undefined)
						$("#low_res_resolution").val(json_blob.low_res_dpi);
					if (json_blob.jpeg_quality != undefined)
						$("#jpeg_quality").val(json_blob.jpeg_quality);
					if (json_blob.deep_zoom != undefined)
						$("#deep_zoom").attr("checked", json_blob.deep_zoom);
					if (json_blob.antialias != undefined)
						$("#antialias").attr("checked", json_blob.antialias);
					if (json_blob.download_notes_report_button != undefined)
						$("#download_notes_report_button").attr("checked", json_blob.download_notes_report_button);
					if (json_blob.int_units != undefined)
						$("#int_units").val(json_blob.int_units);
					if (json_blob.auto_render != undefined)
						$("#auto_render").attr("checked", json_blob.auto_render);
					if (json_blob.quantum_addons != undefined)
						$("#quantum_addons").attr("value", json_blob.quantum_addons);
					if (json_blob.process_max_pages === undefined || json_blob.process_max_pages === -1) {
						$("#process_max_pages_popup").val("all");
						$("#process_max_pages").val(1);
						$("#process_max_pages").hide();
					} else {
						$("#process_max_pages_popup").val("max_pages");
						$("#process_max_pages").val(json_blob.process_max_pages);
						$("#process_max_pages").show();
					}

					var sites = config_pane.m_json_blob.sites;
					var my_site = undefined;
					var has_other_sites = false;
					if (sites !== undefined) {
						for (var site_name in sites) {
							if ((sites[site_name].private_key !== undefined) && (sites[site_name].private_key !== "")) {
								$('#site_name').val(site_name);
								$('#site_name').attr('orig', site_name);
								my_site = sites[site_name];
							} else {
								has_other_sites = true;
							}
						}
					}

					if (my_site === undefined) {
						$('#site_name').val('');
						$('#site_description').val('');
						$('#site_description').attr('disabled', '');
						$('#site_url').val(json_blob.web_server);
						$('#site_url').attr('disabled', '');
					} else {
						$('#site_description').val(my_site.description);
						$('#site_url').val(my_site.url);
						if (has_other_sites === true) {
							$('#site_name').attr('disabled', '');
						}
					}

					// RIP
					if (!$.isEmptyObject(ripPreferences) && !$.isEmptyObject(ripPreferences.preferences) &&
							typeof ripPreferences.preferences.editmode === "string" && ripPreferences.preferences.editmode.length > 0) {
						$('.editModeSelector').val(ripPreferences.preferences.editmode);
					}

					// if ($.isPlainObject(prereleaseFlags) && $.isPlainObject(prereleaseFlags.preferences) ) {
					// 	if ( prereleaseFlags.preferences.curve_recipes === undefined )
					// 		prereleaseFlags.preferences.curve_recipes = true;
					// 	if ( typeof prereleaseFlags.preferences.curve_recipes === "string"
					// 		&& prereleaseFlags.preferences.curve_recipes === 'both')
					// 		prereleaseFlags.preferences.curve_recipes = true;
					// 	if ( typeof prereleaseFlags.preferences.curve_recipes === "boolean" )
					// 		$('#curve_recipes').prop("checked", prereleaseFlags.preferences.curve_recipes);
					// 	else {
					// 		$('#curve_recipes').prop("checked", true);
					// 		savePrereleasePreferences({ curve_recipes : true });
					// 	}
					// } else {
					// 	$('#curve_recipes').prop("checked", false);
					// 	savePrereleasePreferences({ curve_recipes : false });
					// }

					// ASSET VIEWER
					if (!$.isEmptyObject(pAssetPreferences) && !$.isEmptyObject(pAssetPreferences.preferences) &&
							!$.isEmptyObject(pAssetPreferences.preferences.assetview) ) {
						if (typeof pAssetPreferences.preferences.assetview.assetLimit === "number" && pAssetPreferences.preferences.assetview.assetLimit > 0) {
							// if there is a good valid value available
							$('#assetviewer_limit').val(pAssetPreferences.preferences.assetview.assetLimit);
						} else {
							// default value
							$('#assetviewer_limit').val(200);
						}
						if (typeof pAssetPreferences.preferences.assetview.urlEncode === "boolean") {
							// if there is a good valid value available
							$('#assetviewer_urlencoding').prop('checked', pAssetPreferences.preferences.assetview.urlEncode);
						} else {
							// default value
							$('#assetviewer_urlencoding').prop('checked', true);
						}
						if (typeof pAssetPreferences.preferences.assetview.pagebuilder_editbutton === "boolean") {
							// if there is a good valid value available
							$('#assetviewer_pagebuilder_editbutton').prop('checked', pAssetPreferences.preferences.assetview.pagebuilder_editbutton);
						} else {
							// default value
							$('#assetviewer_pagebuilder_editbutton').prop('checked', false);
						}
						if (typeof pAssetPreferences.preferences.assetview.select_when_browsing === "boolean") {
							$('#assetviewer_selecting').prop('checked', pAssetPreferences.preferences.assetview.select_when_browsing);
						} else {
							$('#assetviewer_selecting').prop('checked', false);
						}
					} else {
						// default value
						$('#assetviewer_limit').val(200);
						$('#assetviewer_urlencoding').prop('checked', true);
						$('#assetviewer_pagebuilder_editbutton').prop('checked', false);
						$('#assetviewer_selecting').prop('checked', false);
					}

					// quantum
					if ($.isPlainObject(workflowPreferences) === true
						&& $.isPlainObject(workflowPreferences.preferences) === true
						&& typeof workflowPreferences.preferences.view_system_flows === "boolean") {
						$('#quantum_system_flows').prop("checked", workflowPreferences.preferences.view_system_flows);
					}
					if ($.isPlainObject(prereleaseFlags) === true
						&& $.isPlainObject(prereleaseFlags.preferences) === true
						&& typeof prereleaseFlags.preferences.preview_as_blue_collar === "boolean") {
						$('#preview_by_workflow').prop("checked", prereleaseFlags.preferences.preview_as_blue_collar);
					}
					if ($.isPlainObject(prereleaseFlags) === true
						&& $.isPlainObject(prereleaseFlags.preferences) === true
						&& typeof prereleaseFlags.preferences.always_undistorted_tiles === "boolean") {
						$('#always_undistorted_tiles').prop("checked", prereleaseFlags.preferences.always_undistorted_tiles);
					}
                    if ($.isPlainObject(workflowPreferences) === true
						&& $.isPlainObject(workflowPreferences.preferences) === true
						&& workflowPreferences.preferences.editor_lock === true) {
						$('#quantum_lock').val("editlock");
					}
                    
					// packzflow
					if ($.isPlainObject(pPackzflowPreferences) === true
							&& $.isPlainObject(pPackzflowPreferences.preferences) === true
							&& $.isPlainObject(pPackzflowPreferences.preferences.inkBooks) === true
							&& typeof pPackzflowPreferences.preferences.inkBooks.loadShared === "boolean") {
						$('#packzflow_inksbook_autoload').prop("checked", pPackzflowPreferences.preferences.inkBooks.loadShared);
					} else {
						// default enabling
						$('#packzflow_inksbook_autoload').prop("checked", true);
					}

					// MARS
					var serverURL = pMARSPreferences.serverURL;
					var showUI = pMARSPreferences.showUI || false;
					$('#mars_server_url').val(serverURL);
					$('#show_mars_ui').prop('checked', showUI);
					if (showUI || pLicense.check('mars') === true) {
						$('.marsSettings').show();
					} else {
						$('.marsSettings').hide();
					}

					// google login support
					if ((json_blob.oauth2 !== undefined) && (json_blob.oauth2.google !== undefined))
					{
						if (json_blob.oauth2.google.client_id !== undefined)
							$('#google-client_id').val(json_blob.oauth2.google.client_id);
						if (json_blob.oauth2.google.client_secret !== undefined)
							$('#google-client_secret').val(json_blob.oauth2.google.client_secret);
					}

					if (json_blob.language !== undefined) {
						$('#pref-table .languageSelector').TranslatedLanguagesSelector('option', 'value', json_blob.language);
					}

					// maintenance
					if (json_blob.max_size !== undefined) {
						$('#cleanup_size_toggle').attr("checked", "");
						$('#cleanup_size_value').val(json_blob.max_size);
					}

					if (json_blob.tile_max_age !== undefined) {
						$('#cleanup_age_toggle').attr("checked", "");
						$('#cleanup_age_value').val(json_blob.tile_max_age);
					}

					if ((json_blob.empty_trash_delay === undefined) || (json_blob.empty_trash_delay === 0)) {
						$("#empty_trash_toggle").prop("checked", false);
						$("#empty_trash_value").val('');
					} else {
						$("#empty_trash_toggle").prop("checked", true);
						$("#empty_trash_value").val(json_blob.empty_trash_delay);
					}

					if ((json_blob.remove_old_approvals === undefined) || (json_blob.remove_old_approvals === 0)) {
						$("#remove-old-approvals_toggle").prop("checked", false);
						$("#remove-old-approvals_value").val('');
					} else {
						$("#remove-old-approvals_toggle").prop("checked", true);
						$("#remove-old-approvals_value").val(json_blob.remove_old_approvals);
					}

					if ((json_blob.remove_old_jackets === undefined) || (json_blob.remove_old_jackets === 0)) {
						$("#remove-old-jackets_toggle").prop("checked", false);
						$("#remove-old-jackets_value").val('');
					} else {
						$("#remove-old-jackets_toggle").prop("checked", true);
						$("#remove-old-jackets_value").val(json_blob.remove_old_jackets);
					}

					if ((json_blob.remove_old_notes === undefined) || (json_blob.remove_old_notes === 0)) {
						$("#remove-old-notes_toggle").prop("checked", false);
						$("#remove-old-notes_value").val('');
					} else {
						$("#remove-old-notes_toggle").prop("checked", true);
						$("#remove-old-notes_value").val(json_blob.remove_old_notes);
					}

					// active directory
					$('#active_directory-0-scope').empty();
					(new Scopes()).done(function(pScopes) {
						var select = $('#active_directory-0-scope');
						$.each(pScopes.scopes, function(key, value){
							select.append($('<option>').attr('value', key).text(value.name));
						});
						if (json_blob.ext_auth !== undefined) {
							var ad_index = 0;
							for (var index = 0; index < json_blob.ext_auth.length; ++index) {
								var auth = json_blob.ext_auth[index];
								if (auth.type == 'ad') {
									if (ad_index > 0) {
										var select = $('#active_directory-' + ad_index + '-scope');
										$.each(pScopes.scopes, function(key, value){
											select.append($('<option>').attr('value', key).text(value.name));
										});				
									}
									$('#active_directory-' + ad_index + '-server').val(auth.server);
									$('#active_directory-' + ad_index + '-domain').val(auth.domain);
									if ($.isArray(auth.dn) === true && auth.dn.length > 0) {
										$('#active_directory-' + ad_index + '-dn').val(auth.dn.join('\n'));
									}
									$('#active_directory-' + ad_index + '-scope').val(auth.scope);
									++ad_index;
								}
							}
						}
					});
					//$('select.scopeSelector option').clone().appendTo('#active_directory-scope');
				}
				else
				{
					config_pane.m_json_blob.preferences = new Object();
				}
				if (config_pane.m_json_blob.work_servers.PP_WORK_SERVER != undefined)
				{
					// PP_FILE_STORE is not always there (can be renamed ...)
					if (config_pane.m_json_blob.work_servers.PP_WORK_SERVER.file_store_mapping.PP_FILE_STORE !== undefined)
					{
						$("#proofscope_file_store").attr("value", config_pane.m_json_blob.work_servers.PP_WORK_SERVER.file_store_mapping.PP_FILE_STORE);
					}
				}


				// Checks if the legacy units are different of the default system units.
				// if so the default system preference is set to the legacy unit (legacy = 1 -> preference = 'mm', legacy = 2 -> preference = 'in')
				// If the unit needed to be adapted, save the configuration
				if (adaptPreferencesFromLegacy() === true) {
					config_pane.touch();
				}


				$("#send-test-mail").click(function()
				{
					var l_test_dict =
					{
						"method"		 : "portal.send_test_mail",
						"smtp_to"		: $("#smtp_to").val()
					}

					$('#send-test-mail').hide();
					$('#send-test-mail-loading').show();

					$.post("/portal.cgi", JSON.stringify(l_test_dict), function(data)
					{
						$('#send-test-mail-loading').hide();
						$('#send-test-mail').show();

						$("#smtp_send_email_result").empty();
						if (data.error != undefined)
						{
							$("#smtp_send_email_result").css('color', 'red');
							$("#smtp_send_email_result").append($.i18n._('nixps-cloudflow-preferences.mail.test-failed', [data.error]) + ".</br>");
						}
						else
						{
							$("#smtp_send_email_result").css('color', 'green');
							$("#smtp_send_email_result").append($.i18n._('nixps-cloudflow-preferences.mail.test-success') + "<br>");
						}
					});
				});

				$("#check-file-store").click(function()
				{
					var l_test_dict =
					{
						"method"		 : "portal.check_file_store",
						"path"		   : $("#proofscope_file_store").val(),
						"test_file"	  : $("#proofscope_file_store_test_file").val()
					}

					$('#check-file-store').hide();
					$('#check-file-store-loading').show();

					$.post("/portal.cgi", JSON.stringify(l_test_dict), function(data)
					{
						$('#check-file-store-loading').hide();
						$('#check-file-store').show();

						$("#check_file_store_result").empty();
						if (data.error != undefined)
						{
							$("#check_file_store_result").css('color', 'red');
							$("#check_file_store_result").append("Check failed ("+ data.error +").</br>");
						}
						else
						{
							$("#check_file_store_result").css('color', 'green');
							$("#check_file_store_result").append("File Store settings ok.<br/>");
						}
					});
				});

				$("#web_server_value").focusout(function()
				{
					config_pane.m_json_blob.preferences.web_server = $("#web_server_value").attr("value");
					config_pane.touch();
				});

				$("#smtp_server").focusout(function()
				{
					config_pane.m_json_blob.preferences.smtp_server = $("#smtp_server").attr("value");
					if ($("#smtp_server").val() == "smtp.gmail.com")
					{
						config_pane.m_json_blob.preferences.smtp_port = 465;
						$("#smtp_port").val("465");
						config_pane.m_json_blob.preferences.smtp_ssl = true;
						$("#smtp_ssl").attr('checked', true);
					}
					config_pane.touch();
				});

				$("#smtp_from").off("focusout").focusout(function()
				{
					config_pane.m_json_blob.preferences.smtp_from = $("#smtp_from").attr("value");
					config_pane.touch();
				});

				$("#smtp_port").off("focusout").focusout(function()
				{
					config_pane.m_json_blob.preferences.smtp_port = $("#smtp_port").attr("value");
					config_pane.touch();
				});

				$("#smtp_ssl").change(function()
				{
					config_pane.m_json_blob.preferences.smtp_ssl = $("#smtp_ssl").is(":checked");
					config_pane.touch();
				});

				$("#smtp_change_button").click(function(){
						var dialog = $("<div>").append("<input type='text' name='username' style='display:none'/> <input type='password' name='password' style='display:none'/>");
						dialog.append($('<div>').append($('<label>')._t('nixps-cloudflow-preferences.mail.username'))
																		.append("<input id='smtp_login' value='' autocomplete='new-password' autocorrect='off' autocapitalize='off' placeholder='" + $.i18n._('nixps-cloudflow-preferences.mail.username-placeholder') + "' size='40'>"));
						dialog.append($('<div>').css({"marginTop": 5}).append($('<label>')._t('nixps-cloudflow-preferences.mail.password'))
																		.append("<input id='smtp_password' type='password' value='' autocomplete='new-password' placeholder='" + $.i18n._('nixps-cloudflow-preferences.mail.password-placeholder') + "' size='40'>"));
						dialog.dialog({
							autoOpen: true,
							modal: true,
							width: 370,
							title: $.i18n._("nixps-cloudflow-preferences.mail.credentials"),
							buttons: [
									{
											"text" : $.i18n._("nixps-cloudflow-pagemanager.cancel"),
											"click": function() {
													$(this).dialog("close");
											}
									},
									{
											"text": $.i18n._("nixps-cloudflow-pagemanager.save"),
											"click": function(){
													var password = $("#smtp_password").attr("value");
													var username = $("#smtp_login").attr("value");
													if (typeof password === "string" && password.length > 0 && 
															typeof username === "string" && username.length > 0) {
															config_pane.m_json_blob.preferences.smtp_password = password;
															config_pane.m_json_blob.preferences.smtp_login = username;
															config_pane.touch();
															$(this).dialog("close");
													}
											}
									}
							],
							close: function(){
									$(this).remove();
							}
						})
				});

				$("#log_level").change(function()
				{
					config_pane.m_json_blob.preferences.log_level = parseInt($("#log_level").val());
					config_pane.touch();
				});

				$("#web_trace").change(function()
				{
					config_pane.m_json_blob.preferences.web_trace = parseInt($("#web_trace").val());
					config_pane.touch();
				});

				$("#low_res").change(function()
				{
					config_pane.m_json_blob.preferences.low_res = parseInt($("#low_res").val());
					if (config_pane.m_json_blob.preferences.low_res == undefined || config_pane.m_json_blob.preferences.low_res == 0 || config_pane.m_json_blob.preferences.low_res == 3)
						$("#low_res_dpi").hide();
					else
						$("#low_res_dpi").show();
					config_pane.touch();
				});

				$("#low_res_resolution").change(function()
				{
					config_pane.m_json_blob.preferences.low_res_dpi = parseFloat($("#low_res_resolution").val());
					config_pane.touch();
				});

				$("#jpeg_quality").change(function()
				{
					config_pane.m_json_blob.preferences.jpeg_quality = parseFloat($("#jpeg_quality").val());
					config_pane.touch();
				});

				$("#int_units").change(function()
				{
					config_pane.m_json_blob.preferences.int_units = parseInt($("#int_units").val());
					config_pane.touch();
				});

				$('#pref-table .languageSelector').change(function() {
					config_pane.m_json_blob.preferences.language = $('#pref-table .languageSelector').TranslatedLanguagesSelector('option', 'value');
					config_pane.touch();
				});


				var update_site_function = function () {
					if ($('#site_name').val() !== '') {
						api_async.site.setup({name: $('#site_name').val(), url: $('#site_url').val(), description: $('#site_description').val()});
						$('#site_url').attr('disabled', null);
						$('#site_description').attr('disabled', null);
					} else if ($('#site_name').attr('orig') !== '') {
						$('#site_name').val($('#site_name').attr('orig'));
					} else {
						$('#site_url').attr('disabled', '');
						$('#site_description').attr('disabled', '');
					}
				};

				$('#site_name').focusout(update_site_function);
				$('#site_description').focusout(update_site_function);
				$('#site_url').focusout(update_site_function);

		/*
				$("#download_setting").change(function()
				{
					config_pane.m_json_blob.preferences.download_setting = parseInt($("#download_setting").val());
					config_pane.touch();
				})
		*/
				$('.editModeSelector').on('change', function(pEvent) {
					var selector = $(pEvent.target);
					saveRIPPreferences('editmode', selector.val());
				});
				$("#curve_recipes").change(function() {
					savePrereleasePreferences({
						curve_recipes : $("#curve_recipes").is(":checked")
					});
				});

				function saveMARSSettings () {
					var url = $('#mars_server_url').val();
					if (typeof url === 'string') {
						url = url.trim();
					}

					var showUI = $('#show_mars_ui').prop('checked');
					if (showUI || pLicense.check('mars') === true) {
						$('.marsSettings').show();
					} else {
						$('.marsSettings').hide();
					}
					saveMARSPreferences({
						serverURL: url,
						showUI: showUI
					});
				}

				$('#mars_server_url').on('change', saveMARSSettings);
				$('#show_mars_ui').on('click', saveMARSSettings);

				$("#antialias").change(function()
				{
					config_pane.m_json_blob.preferences.antialias = $("#antialias").is(":checked");
					config_pane.touch();
				});

				$("#deep_zoom").change(function()
				{
					config_pane.m_json_blob.preferences.deep_zoom = $("#deep_zoom").is(":checked");
					config_pane.touch();
				});

				$("#download_notes_report_button").change(function()
				{
					config_pane.m_json_blob.preferences.download_notes_report_button = $("#download_notes_report_button").is(":checked");
					config_pane.touch();
				});

				$("#process_max_pages_popup, #process_max_pages").change(function()
				{
					if ($("#process_max_pages_popup").val() === "all") {
						config_pane.m_json_blob.preferences.process_max_pages = -1;
						$("#process_max_pages").hide();
					} else {
						config_pane.m_json_blob.preferences.process_max_pages = parseInt($("#process_max_pages").val());
						$("#process_max_pages").show();
					}
					config_pane.touch();
				});

				$("#enable_text_selection").change(function()
				{
					saveProofscopeOptionPreference("showNoteFromTextTool", $(this).prop('checked') === true);
				});

				$("#show_notes_history_filter").change(function()
				{
					saveProofscopeOptionPreference("showNotesHistoryFilter", $(this).prop('checked') === true);
				});

				$("#show_notes_history").change(function()
				{
					saveProofscopeOptionPreference("showNotesHistory", $(this).prop('checked') === true);
				});

				$("#proofscope_file_store").focusout(function()
				{
					if (config_pane.m_json_blob.work_servers.PP_WORK_SERVER.file_store_mapping.PP_FILE_STORE != $("#proofscope_file_store").attr("value"))
					{
						config_pane.m_json_blob.work_servers.PP_WORK_SERVER.file_store_mapping.PP_FILE_STORE = $("#proofscope_file_store").attr("value");
						config_pane.modified_work_server("PP_WORK_SERVER");
						config_pane.touch();

						// Update work servers UI
						work_servers_tab.set_metadata(config_pane.m_json_blob.work_servers, prereleaseFlags);
						work_servers_tab.enable_handlers();
					}
				});


				$("#auto_render").change(function() {
					config_pane.m_json_blob.preferences.auto_render = $("#auto_render").is(":checked");
					if (config_pane.m_json_blob.preferences.auto_render === true) {
						$('#cleanup_size_toggle').removeAttr('checked');
						$('#cleanup_size_value').val('');
						delete config_pane.m_json_blob.preferences.max_size;
						$('#cleanup_age_toggle').removeAttr('checked');
						$('#cleanup_age_value').val('');
						delete config_pane.m_json_blob.preferences.tile_max_age;
					}
					config_pane.touch();
				});

				// MAINTENANCE
				$('#cleanup_size_toggle').change(function() {
					if ($("#cleanup_size_toggle").is(":checked")) {
						config_pane.m_json_blob.preferences.auto_render = false;
						$("#auto_render").removeAttr('checked');
						$('#cleanup_size_value').focus();
					} else {
						$('#cleanup_size_value').val('');
						delete config_pane.m_json_blob.preferences.max_size;
					}
					config_pane.touch();
				});

				$('#cleanup_size_value').keyup(function() {
					if (($('#cleanup_size_value').val() === '') || (parseInt($('#cleanup_size_value').val(), 10) <= 0)){
						delete config_pane.m_json_blob.preferences.max_size;
						$("#cleanup_size_toggle").removeAttr('checked');
					} else {
						config_pane.m_json_blob.preferences.max_size = parseInt($('#cleanup_size_value').val(), 10);
						config_pane.m_json_blob.preferences.auto_render = false;
						$('#cleanup_size_toggle').attr('checked', '');
						$("#auto_render").removeAttr('checked');
					}
				});

				$('#cleanup_size_value').focusout(function() {
					if (($('#cleanup_size_value').val() === '') || (parseInt($('#cleanup_size_value').val(), 10) <= 0)){
						delete config_pane.m_json_blob.preferences.max_size;
						$("#cleanup_size_toggle").removeAttr('checked');
					} else {
						config_pane.m_json_blob.preferences.max_size = parseInt($('#cleanup_size_value').val(), 10);
						config_pane.m_json_blob.preferences.auto_render = false;
						$('#cleanup_size_toggle').attr('checked', '');
						$("#auto_render").removeAttr('checked');
					}
					config_pane.touch();
				});

				$('#cleanup_age_toggle').change(function() {
					if ($("#cleanup_age_toggle").is(":checked")) {
						config_pane.m_json_blob.preferences.auto_render = false;
						$("#auto_render").removeAttr('checked');
						$('#cleanup_age_value').focus();
					} else {
						$('#cleanup_age_value').val('');
						delete config_pane.m_json_blob.preferences.tile_max_age;
					}
					config_pane.touch();
				});

				$('#cleanup_age_value').keyup(function() {
					if (($('#cleanup_age_value').val() === '') || (parseInt($('#cleanup_age_value').val(), 10) <= 0)){
						delete config_pane.m_json_blob.preferences.tile_max_age;
						$("#cleanup_age_toggle").removeAttr('checked');
					} else {
						config_pane.m_json_blob.preferences.tile_max_age = parseInt($('#cleanup_age_value').val(), 10);
						config_pane.m_json_blob.preferences.auto_render = false;
						$('#cleanup_age_toggle').attr('checked', '');
						$("#auto_render").removeAttr('checked');
					}
				});

				$('#cleanup_age_value').focusout(function() {
					if (($('#cleanup_age_value').val() === '') || (parseInt($('#cleanup_age_value').val(), 10) <= 0)){
						delete config_pane.m_json_blob.preferences.tile_max_age;
						$("#cleanup_age_toggle").removeAttr('checked');
					} else {
						config_pane.m_json_blob.preferences.tile_max_age = parseInt($('#cleanup_age_value').val(), 10);
						config_pane.m_json_blob.preferences.auto_render = false;
						$('#cleanup_age_toggle').attr('checked', '');
						$("#auto_render").removeAttr('checked');
					}
					config_pane.touch();
				});

				$('#empty_trash_toggle').change(function () {
					if (! $('#empty_trash_toggle').prop('checked')) {
						$('#empty_trash_value').val('');
						config_pane.m_json_blob.preferences.empty_trash_delay = 0;
						config_pane.touch();
					}
				});

				$('#empty_trash_value').keyup(function () {
					if (($('#empty_trash_value').val() === '') || (parseInt($('#empty_trash_value').val(), 10) <= 0)){
						$('#empty_trash_toggle').prop('checked', false);
						config_pane.m_json_blob.preferences.empty_trash_delay = 0;
					} else {
						$('#empty_trash_toggle').prop('checked', true);
						config_pane.m_json_blob.preferences.empty_trash_delay = parseInt($('#empty_trash_value').val(), 10) <= 0;
					}
				});

				$('#empty_trash_value').focusout(function () {
					if (($('#empty_trash_value').val() === '') || (parseInt($('#empty_trash_value').val(), 10) <= 0)){
						$('#empty_trash_toggle').prop('checked', false);
						config_pane.m_json_blob.preferences.empty_trash_delay = 0;
					} else {
						$('#empty_trash_toggle').prop('checked', true);
						config_pane.m_json_blob.preferences.empty_trash_delay = parseInt($('#empty_trash_value').val(), 10);
					}
					config_pane.touch();
				});

				$('#remove-old-approvals_toggle').change(function () {
					if (! $('#remove-old-approvals_toggle').prop('checked')) {
						$('#remove-old-approvals_value').val('');
						config_pane.m_json_blob.preferences.remove_old_approvals = 0;
						config_pane.touch();
					}
				});

				$('#remove-old-approvals_value').keyup(function () {
					if (($('#remove-old-approvals_value').val() === '') || (parseInt($('#remove-old-approvals_value').val(), 10) <= 0)){
						$('#remove-old-approvals_toggle').prop('checked', false);
						config_pane.m_json_blob.preferences.remove_old_approvals = 0;
					} else {
						$('#remove-old-approvals_toggle').prop('checked', true);
						config_pane.m_json_blob.preferences.remove_old_approvals = parseInt($('#remove-old-approvals_value').val(), 10) <= 0;
					}
				});

				$('#remove-old-approvals_value').focusout(function () {
					if (($('#remove-old-approvals_value').val() === '') || (parseInt($('#remove-old-approvals_value').val(), 10) <= 0)){
						$('#remove-old-approvals_toggle').prop('checked', false);
						config_pane.m_json_blob.preferences.remove_old_approvals = 0;
					} else {
						$('#remove-old-approvals_toggle').prop('checked', true);
						config_pane.m_json_blob.preferences.remove_old_approvals = parseInt($('#remove-old-approvals_value').val(), 10);
					}
					config_pane.touch();
				});

				$('#remove-old-jackets_toggle').change(function () {
					if (! $('#remove-old-jackets_toggle').prop('checked')) {
						$('#remove-old-jackets_value').val('');
						config_pane.m_json_blob.preferences.remove_old_jackets = 0;
						config_pane.touch();
					}
				});

				$('#remove-old-jackets_value').keyup(function () {
					if (($('#remove-old-jackets_value').val() === '') || (parseInt($('#remove-old-jackets_value').val(), 10) <= 0)){
						$('#remove-old-jackets_toggle').prop('checked', false);
						config_pane.m_json_blob.preferences.remove_old_jackets = 0;
					} else {
						$('#remove-old-jackets_toggle').prop('checked', true);
						config_pane.m_json_blob.preferences.remove_old_jackets = parseInt($('#remove-old-jackets_value').val(), 10) <= 0;
					}
				});

				$('#remove-old-jackets_value').focusout(function () {
					if (($('#remove-old-jackets_value').val() === '') || (parseInt($('#remove-old-jackets_value').val(), 10) <= 0)){
						$('#remove-old-jackets_toggle').prop('checked', false);
						config_pane.m_json_blob.preferences.remove_old_jackets = 0;
					} else {
						$('#remove-old-jackets_toggle').prop('checked', true);
						config_pane.m_json_blob.preferences.remove_old_jackets = parseInt($('#remove-old-jackets_value').val(), 10);
					}
					config_pane.touch();
				});

				$('#remove-old-notes_toggle').change(function () {
					if (! $('#remove-old-notes_toggle').prop('checked')) {
						$('#remove-old-notes_value').val('');
						config_pane.m_json_blob.preferences.remove_old_notes = 0;
						config_pane.touch();
					}
				});

				$('#remove-old-notes_value').keyup(function () {
					if (($('#remove-old-notes_value').val() === '') || (parseInt($('#remove-old-notes_value').val(), 10) <= 0)){
						$('#remove-old-notes_toggle').prop('checked', false);
						config_pane.m_json_blob.preferences.remove_old_notes = 0;
					} else {
						$('#remove-old-notes_toggle').prop('checked', true);
						config_pane.m_json_blob.preferences.remove_old_notes = parseInt($('#remove-old-notes_value').val(), 10) <= 0;
					}
				});

				$('#remove-old-notes_value').focusout(function () {
					if (($('#remove-old-notes_value').val() === '') || (parseInt($('#remove-old-notes_value').val(), 10) <= 0)){
						$('#remove-old-notes_toggle').prop('checked', false);
						config_pane.m_json_blob.preferences.remove_old_notes = 0;
					} else {
						$('#remove-old-notes_toggle').prop('checked', true);
						config_pane.m_json_blob.preferences.remove_old_notes = parseInt($('#remove-old-notes_value').val(), 10);
					}
					config_pane.touch();
				});

				// ASSET VIEWER
				$('#assetviewer_limit, #assetviewer_urlencoding, #assetviewer_pagebuilder_editbutton, #assetviewer_selecting').on('change input', function(pEvent, pData) {
					var assetSettings = {
						urlEncode: $('#assetviewer_urlencoding').is(':checked'),
						pagebuilder_editbutton: $("#assetviewer_pagebuilder_editbutton").is(":checked"),
						select_when_browsing: $("#assetviewer_selecting").is(":checked")
					};
					var assetLimit = parseInt($("#assetviewer_limit").val());
					// in case val() is undefined or something else, the parseInt make NaN,
					// this will not pas the next test
					if (typeof assetLimit === "number" && assetLimit > 0) {
						assetSettings.assetLimit = assetLimit;
					} else {
						console.error("asset limit is not a positive number");
					}
					saveAssetSettings(assetSettings);
				});

				$("#quantum_addons").focusout(function() {
					config_pane.m_json_blob.preferences.quantum_addons = $("#quantum_addons").attr("value");
					config_pane.touch();
				});

				$("#quantum_system_flows, #quantum_lock").change(function() {
					saveWorkflowSettings({
						view_system_flows : $("#quantum_system_flows").is(":checked"),
                        editor_lock: $("#quantum_lock").val() === "editlock"
					});
				});

				$("#preview_by_workflow").change(function() {
					previewByWorkflow = $("#preview_by_workflow").is(":checked");
					var flags = {
						preview_as_blue_collar: previewByWorkflow
					};
					if (previewByWorkflow === true) {
						if ($.isPlainObject(prereleaseFlags) === true
							&& $.isPlainObject(prereleaseFlags.preferences) === true) {
							if (typeof prereleaseFlags.preferences.renderer_as_blue_collar !== "boolean") {
								flags["renderer_as_blue_collar"] = true;
								prereleaseFlags.preferences.renderer_as_blue_collar = true;
							}
							if (typeof prereleaseFlags.preferences.always_undistorted_tiles !== "boolean") {
								flags["always_undistorted_tiles"] = true;
								prereleaseFlags.preferences.always_undistorted_tiles = true;
								$('#always_undistorted_tiles').prop("checked", true);
							}
						}
					}
					savePrereleasePreferences(flags);
				});

				$("#always_undistorted_tiles").change(function() {
					savePrereleasePreferences({
						always_undistorted_tiles : $("#always_undistorted_tiles").is(":checked")
					});
				});
               

				$("#packzflow_inksbook_autoload").change(function()
				{
					savePackzflowSettings({
						inkBooks: {
							loadShared: $("#packzflow_inksbook_autoload").is(":checked")
						}
					});
				});

				$("#google-client_id").focusout(function ()
				{
					if (config_pane.m_json_blob.preferences.oauth2 === undefined)
						config_pane.m_json_blob.preferences.oauth2 = {};
					if (config_pane.m_json_blob.preferences.oauth2.google === undefined)
						config_pane.m_json_blob.preferences.oauth2.google = {};
					config_pane.m_json_blob.preferences.oauth2.google.client_id = $('#google-client_id').attr("value");
					config_pane.touch();
				});

				$("#google-client_secret").focusout(function ()
				{
					if (config_pane.m_json_blob.preferences.oauth2 === undefined)
						config_pane.m_json_blob.preferences.oauth2 = {};
					if (config_pane.m_json_blob.preferences.oauth2.google === undefined)
						config_pane.m_json_blob.preferences.oauth2.google = {};
					config_pane.m_json_blob.preferences.oauth2.google.client_secret = $('#google-client_secret').attr("value");
					config_pane.touch();
				});

				$('#pref-table .unitselector, #pref-table .unitaccuracy').on('change', function() {
					savePreferences();

					var lengthUnit = $("#pref-table .unitselector[name='length']").val();
					var isLengthMetric = (new nixps.cloudflow.KnownUnits()).isMetric(lengthUnit);
					if (isLengthMetric === true) {
						// kMM
						config_pane.m_json_blob.preferences.int_units = 1;
					}
					else {
						// kInch
						config_pane.m_json_blob.preferences.int_units = 2;
					}
					config_pane.touch();
				});
			});
		},

		set_metadata_nucleus: function(json_blob)
		{
			$('#pref-table').empty();
			$('#pref-table').append("<tr class='ws_entry'>"+
								  "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-preferences.title').toUpperCase() + "</td>"+
								  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
								  "<td></td></tr>");

			$('#pref-table').append("<tr>"+
									"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
									"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-preferences.general.webserver_url').toUpperCase() + "</td>"+
									"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
									"<td class='description'><input id='web_server_value' autocorrect='off' autocapitalize='off' value='' size='40'></td></tr>");
		},

		set_metadata: function(json_blob)
		{
			if (sContext == "portal")
			{
				settings_tab.set_metadata_portal(json_blob);
			}
			else
			{
				settings_tab.set_metadata_nucleus(json_blob);
			}
		}
	}

}());
