/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true, newcap: true*/
/*globals $, _, jsPlumb, console, api_sync, window */

var config_pane =
{
	m_json_blob: undefined,
	m_dirty: false,
	m_req_version: undefined,
	m_disabled_apps: {},
	m_supported_apps: [
		"indexer",
		"metadata",
		"preview",
		"renderer",
		"notification",
		"eventhandler",
		"garbagecollector",
		"quantumcombined",
		"quantumpackz",
		"quantumrip",
		"quantumdata",
		"quantumjava",
		"javaWebAppsHost",
		"sharescheduler",
		"quantumshare",
		"updater",
		"postgresql"
	],
	m_checked_apps:
	{
		"quantumpackz" : ["quantumpackz"],
		"quantumrip" : ["quantumrip"],
		"renderer": ["proofscope", "proofscope_dot"],
		"sharescheduler": ["share"],
		"quantumshare": ["share"]
	},

	//
	// General Methods
	//
	setup_ui: function(pPrereleaseFlags)
	{
		$('body').append("<div class='config-pane'><div style='text-align: right; background: none; margin: 0px 5px' class='global-msgs'></div><div id='config-tabs' class='config-content'><ul id='config-navs'></div></div>");
        $('body').Dialog();

		config_pane.update_buttons();
		update_expiry_warning();
	},

	enable_handlers: function()
	{
	},

	show: function()
	{
		$('.config-pane').show();
		var lCommand = { "method" : "request.config", "name" : "servers" };
		$.post("/portal.cgi", JSON.stringify(lCommand), function(data)
		{
			api_async.preferences.get_for_realm("system", "", "", "", function(pResult) {
				var language = pResult.preferences.language;
				if ($.isEmptyObject(data.preferences)) {
					data.preferences = {};
				}
				data.preferences.language = language;
				data.preferences.workflow = pResult.preferences.workflow;
				config_pane.redraw_pane(data);

				var lCommand = { "method" : "request.requiredversion" };
				$.post("/portal.cgi", JSON.stringify(lCommand), function(data)
				{
					if (data !== config_pane.m_json_blob.version)
					{
						config_dashboard_tab.add_message($.i18n._('nixps-cloudflow-dashboard.warning_outdated_database') + "<br>");
					}
				});
			});
		});
	},

	hide: function()
	{
		$('.config-pane').hide();
	},

	//
	// Specific Methods
	//
	update_tab: function(name, blob, receiver)
	{
		$("#tabs-"+name+"-tab").css('display', 'list-item');
		receiver.set_metadata(blob);
	},

	redraw_pane: function(json_blob)
	{
		// Let's go…
		if (json_blob == undefined)
			json_blob = new Object();
		config_pane.m_json_blob = json_blob;
		if (sContext == 'portal') {
			config_dashboard_tab.show();
			if(config_log_tab !== undefined) {
                config_log_tab.Log('load_logs');
            }
		}
		this.update_tab("file-stores", json_blob.file_stores, file_stores_tab);
		this.update_tab("work-servers", json_blob.work_servers, work_servers_tab);
		this.update_tab("workablelist", json_blob.preferences, workables_list_tab);
		this.update_tab("preferences", json_blob.preferences, settings_tab);
		this.update_tab("preferences", json_blob.preferences.patchplanner, patchplanner_tab);
	},

	switch_tab: function(old_tab, new_tab)
	{

	},

	update_buttons: function()
	{
		if (config_pane.m_dirty)
		{
			$('#fs_save_button').css("color", "#fff");
			$('#fs_save_button').css("cursor", "pointer");
			$('#fs_revert_button').css("color", "#fff");
			$('#fs_revert_button').css("cursor", "pointer");
		}
		else
		{
			$('#fs_save_button').css("color", "#999");
			$('#fs_save_button').css("cursor", "default");
			$('#fs_revert_button').css("color", "#999");
			$('#fs_revert_button').css("cursor", "default");
		}
	},

	touch: function()
	{
		if (typeof config_pane.m_json_blob.error === 'string' || typeof config_pane.m_json_blob.error_code === 'string') {
			$('body').Dialog('showDialog', $.i18n._('nixps-config.settings_dberror_title'), $.i18n._('nixps-config.settings_dberror_message'), {}, [{
				classes: 'dialog_ok_button',
				type: 'ok',
				label: 'nixps-config.refreshButtonText'
			}]).done(function() {
				window.location.reload();
			});
			return;
		}

		var lCommand = { "method" : "request.store_config", "name" : "servers", "data" : config_pane.m_json_blob };
		$.post("/portal.cgi", JSON.stringify(lCommand), function(data) {
			if (data.error === 'conflict') {
				$('body').Dialog('showDialog', $.i18n._('nixps-config.saveerror_title'), $.i18n._('nixps-config.saveerror_message'), {}, [{
                    classes: 'dialog_ok_button',
                    type: 'ok',
                    label: 'nixps-config.refreshButtonText'
                }]).done(function() {
                    window.location.reload();
                });
				return;
			} else if (data.error !== undefined) {
				api.message('Executing request.store_config failed: ', data.error, 'closeable-error', true);
				return;
			} else {
				// Set the language
				var language = config_pane.m_json_blob.preferences.language;
				api_async.preferences.save_for_realm(language, "system", "", "", "language");
				config_pane.m_json_blob.last_modification = data.modification_time;
			}
		});
		config_pane.update_buttons();
	},

	save: function()
	{
		if (config_pane.m_dirty == true)
		{
			config_pane.touch();
			config_pane.m_dirty = false;
			config_pane.update_buttons();
		}
	},

	revert: function()
	{
		if (config_pane.m_dirty == true)
		{
			config_pane.show();
			config_pane.m_dirty = false;
			config_pane.update_buttons();
			work_servers_tab.enable_handlers();
		}
	},

	unique_worker_id: function(pPrefix)
	{
		var idstr = pPrefix + '_';

		for (var i = 0; i < 13; ++i) {
			var asciiCode;

			do {
				asciiCode = Math.floor((Math.random() * 42) + 48);
			} while ((asciiCode >= 58) && (asciiCode <= 64));

			idstr += String.fromCharCode(asciiCode);
		}

		for (var ws in config_pane.m_json_blob.work_servers) {
			// Not unique!
			if ((config_pane.m_json_blob.work_servers[ws].workers != undefined) && (config_pane.m_json_blob.work_servers[ws].workers[idstr] != undefined)) {
				return config_pane.unique_worker_id(pPrefix);
			}
		}

		return (idstr);
	},

	modified_work_server: function(ws_name)
	{
		var milli = new Date();
		config_pane.m_json_blob.work_servers[ws_name].last_modification=Math.round(milli.getTime());
		//config_pane.m_json_blob.last_modification=Math.round(milli.getTime());
	}
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

///////////////////////////////////////////////////////////////////////////////////////
// INITIALIZATION WRAPPER
///////////////////////////////////////////////////////////////////////////////////////
function init_config()
{
	return $.when(nixps.cloudflow.License.get(), getPrereleasePreferences()).then(function(license, prereleasePreferences) {

		for (var app in config_pane.m_checked_apps) {
			var ok = false;
			for (var lic in config_pane.m_checked_apps[app]) {
				if (license.check(config_pane.m_checked_apps[app][lic]) !== false) {
					ok = true;
					break;
				}
			}
			if (ok === false) {
				config_pane.m_disabled_apps[app] = app;
			}
		}

		if (sContext == 'portal') {
			var modules = [config_pane];
			var has_maxcpu = license.check('max_cpu');
			var has_portal = license.check('portal');
			var has_patchplanner = license.check('patchplanner');

			if (license.isDataLink() === false && has_maxcpu) {
				modules.push(config_dashboard_tab);
				modules.push(config_log_tab);
				modules.push(workables_list_tab);
				modules.push(output_device_tab);
                modules.push(folder_mapping_tab);
				if (has_portal) {
					modules.push(file_stores_tab);
				}
				modules.push(work_servers_tab);
				if (has_portal) {
					modules.push(settings_tab);
					modules.push(resources_tab);
				}
				if (has_patchplanner) {
					modules.push(patchplanner_tab);
				}
				modules.push(maintenance_tab);
			}
			else if (has_maxcpu) {
				modules.push(config_dashboard_tab);
				modules.push(config_log_tab);
			}

			if ($.inArray('ADMIN', sPermissions) !== -1) {
				modules.push(license_tab);
			}

			for(i in modules) {
				if (modules[i] == config_log_tab) {
					config_log_tab = $('<div>').Log({});
					$('#config-tabs').append(config_log_tab);
					$('#config-navs').append("<li id='tabs-log-tab'><a href='#tabs-log'>" + $.i18n._('nixps-cloudflow-log.title') + "</a></li>");
				} else {
					modules[i].setup_ui(prereleasePreferences.preferences);
					modules[i].enable_handlers();
				}
			}

			$('#config-tabs').tabs();
			$('#config-tabs').tabs('select', 0);
			if ((license.check('max_cpu') === true) && (window.location.href.indexOf('license') < 0)) {
				if (window.location.href.indexOf('patchplanner') >= 0) {
					for (var i in modules) {
						if (modules[i] === patchplanner_tab) {
							$('#config-tabs').tabs('select', (i - 1));
						}
					}
				}
			} else {
				for (var i in modules) {
					if (modules[i] === license_tab) {
						$('#config-tabs').tabs('select', (i - 1));
					}
				}
			}
		} else {
			modules = [ config_pane, settings_tab, work_servers_tab, file_stores_tab ];
			for(i in modules)
			{
				modules[i].setup_ui();
				modules[i].enable_handlers();
				$('#config-tabs').tabs();
				$('#config-tabs').tabs('select', 0);
			}
		}
	});

}

function show_config() {
	init_config().then(function() {
		if ($.inArray('ADMIN_USER', sPermissions) == -1 && $.inArray('ADMIN', sPermissions) == -1) {
			document.location = '/';
		} else {
			top_pane.set_active("#configSection");
			config_pane.show();
		}
	});
}
