///////////////////////////////////////////////////////////////////////////////////////
// WORK SERVERS TAB
///////////////////////////////////////////////////////////////////////////////////////

var work_servers_tab =
{
    _switchOnButton: $('<span>').load('/portal/images/button_on.svg'),
    _switchOFFButton: $('<span>').load('/portal/images/button_off.svg'),
	mPrereleaseFlags: {},

    //
    // General Methods
    //
    setup_ui: function(pPrereleaseFlags)
    {
		this.mPrereleaseFlags = pPrereleaseFlags;
        $('#config-navs').append("<li id='tabs-work-servers-tab'><a href='#tabs-work-servers'>" + $.i18n._('nixps-cloudflow-workservers.title') + "</a></li>");
        $('#config-tabs').append("<div id='tabs-work-servers' class='tab'><table id='ws-table' class='tsw-table' style='margin-right:0px; margin-left:0px; width:100%'></table></div>");
        var addButton = $("<a src='#' class='ws_add green-button'>")._t('nixps-cloudflow-workservers.add_workserver');
        $('#tabs-work-servers').append("<br/>").append(addButton);
    },

    enable_handlers: function()
    {
        $('.ws_add').show();
        $('.ws_add').unbind();
        $('.ws_add').click(work_servers_tab.add_workserver);
        $('.ws_add').css("cursor", "pointer");
    },

    ensure_minimal: function(workserver_json)
    {
        var lModified = false;

        if (workserver_json.file_store_mapping == undefined)
        {
            workserver_json.file_store_mapping = new Object();
        }

        if (workserver_json.active == undefined)
        {
            workserver_json.active = false;
            lModified = true;
        }

        if (workserver_json.keep_alive == undefined)
        {
            workserver_json.keep_alive = 0;
        }

        if (workserver_json.running == undefined)
        {
            workserver_json.running = false;
            lModified = true;
        }

        if (workserver_json.last_modification == undefined)
        {
            workserver_json.last_modification = 0;
        }

        return lModified;
    },

    enter_edit_mode: function()
    {
        // $('.ws_edit').hide();
        $('.ws_delete').hide();
        $('.wk_edit').hide();
        $('.wk_delete').hide();
        $('.wf_edit').hide();
        $('.wf_delete').hide();
        $('.ws_add').hide();
        $('.wk_add').hide();
        $('.wu_edit').hide();
    },

    apps_list: function()
    {
        var lList = "<select name='wk_app_select'><option value=''>- " + $.i18n._('nixps-cloudflow-workservers.worker_type') + " -</option>";
        for (var app_index in config_pane.m_supported_apps)
        {
			var app = config_pane.m_supported_apps[app_index];
			if (config_pane.m_disabled_apps[app] === undefined)
	            lList += "<option value='" + app + "'>" + $.i18n._('nixps-cloudflow-workers.' + app) + "</option>";
        }
        lList += "</select>";
        return lList;
    },

    filestores_list: function(app_name, work_server)
    {
        var lList = "<select name='wk_fs_select'><option value=''>- " + $.i18n._('nixps-cloudflow-workservers.select_filestore') + " -</option>";
        if (app_name !== "indexer")
        {
	        lList += "<option value=''>" + $.i18n._('nixps-cloudflow-workservers.select_filestore-all') + "</option>";
		}
        for (var fs in work_server.file_store_mapping)
        {
			if (fs !== undefined && fs !== "undefined" && fs !== "")
			{
				lList += "<option value='"+fs+"'>"+fs+"</option>";
			}
        }
        lList += "</select>";
        return lList;
    },

	set_metadata: function(json_blob)
	{

		$('#ws-table').empty();
		if (json_blob == undefined)
		{
			config_pane.m_json_blob["work_servers"] = new Object();
			work_servers_tab.add_workserver();
		}
		else if (json_blob.length == 0)
		{
			work_servers_tab.add_workserver();
		}
		else
		{
			for (var ws in json_blob)
			{
				// first we clean out some junk that might have appeared (in older installations)
				var cleaned = true
				for (; cleaned === true;)
				{
					cleaned = false;
					for (var wf in json_blob[ws].file_store_mapping)
					{
						if (wf === undefined || wf === "undefined" || wf === "")
						{
							delete json_blob[ws].file_store_mapping[wf];
							cleaned = true;
							break;
						}
					}
				}

				if (work_servers_tab.ensure_minimal(json_blob[ws]))
				{
					config_pane.modified_work_server(ws);
				}

				var ws_checked;
				if (json_blob[ws].active)
				{
					ws_checked = this._switchOnButton.clone().addClass('ws_activate');
				}
				else
				{
					ws_checked = this._switchOFFButton.clone().addClass('ws_activate');
				}

				var row = $("<tr class='ws_entry' ws_id='"+ws+"'>"+
					"<td colspan='2' class='header'>"+ws+"</td>"+
					"<td class='running'></td>"+
					"<td><a class='green-button wk_add'>" + $.i18n._('nixps-cloudflow-workservers.add_worker') + "</a></td>"+
					"<td><img src='/portal/images/pensil.svg' class='ws_edit' style='visibility:hidden'/><img src='/portal/images/setting_save.svg' class='wk_save' style='display:none'/><img src='/portal/images/remove.svg' class='ws_delete'/>"+
					"</td></tr>");

				row.find('.running').prepend(ws_checked);
				$('#ws-table').append(row);

                if ($.isEmptyObject(json_blob[ws]) === false && $.isEmptyObject(json_blob[ws].workers) === false && $.isPlainObject(json_blob[ws].workers)) {
                    var workersKeys = Object.keys(json_blob[ws].workers);
                    workersKeys.sort(function(a,b) {
                        var aw = json_blob[ws].workers[a];
                        var bw = json_blob[ws].workers[b];
                        if (aw.app === undefined) {
                            return -1;
                        } else if (bw.app === undefined) {
                            return 1;
                        } else {
                            return aw.app.localeCompare(bw.app);
                        }
                    });
                    for (var i=0; i< workersKeys.length; i++)
                    {
                        var wk = workersKeys[i];
                        if (wk !== "wk_web")
                        {
                            // 2014/06 FV : I don't think we want to list the configuration of the web server in this interface ...
                            var worker = json_blob[ws].workers[wk];
                            var wk_checked;

                            if (worker.active)
                            {
                                wk_checked = this._switchOnButton.clone().addClass('wk_activate');
                            }
                            else
                            {
                                wk_checked = this._switchOFFButton.clone().addClass('wk_activate');
                            }

                            var description = worker.file_store;

                            if (worker.app === "indexer" && typeof worker.filter === "string" && worker.filter.length > 0)
                            {
                                // append filter asset to description
                                description += " &emsp;" + $.i18n._('nixps-cloudflow-workservers.asset_filter') +': ' + worker.filter;
                            }
                            if (worker.app === "indexer" && typeof worker.delay_per_file === typeof 1 && worker.delay_per_file > 0 && work_servers_tab.mPrereleaseFlags.indexer_delay_per_file === true)
                            {
                                // append filter asset to description
                                description += " &emsp;" + $.i18n._('nixps-cloudflow-workservers.delay_per_file') +'&nbsp;' + worker.delay_per_file + $.i18n._('nixps-cloudflow-workservers.delay_per_file_unit');
                            }
                            var row = $("<tr class='wk_entry' title='" + wk + "' wk_id='"+wk+"' ws_name='"+ws+"'>"+
                                "<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
                                "<td class='name' app='"+worker.app+"' width='20%'>"+$.i18n._('nixps-cloudflow-workers.' + worker.app)+"</td>"+
                                "<td class='running' width='50px'>"+
                                "<img src='/portal/images/report.svg' class='wk_log_button'></td>"+
                                "<td class='description'>"+ description +"</td>"+
                                "<td width='60px'><img src='/portal/images/pensil.svg' class='wk_edit'/><img src='/portal/images/setting_save.svg' class='wk_save' style='display:none'/><img src='/portal/images/remove.svg' class='wk_delete'/></td></tr>");
                            row.find('.running').prepend(wk_checked);
                            $('#ws-table').append(row);
                        }
                    }
                }


				if (config_pane.ui_path_mapping === undefined)
				{
					config_pane.ui_path_mapping = {};
				}

				for (var fs in config_pane.m_json_blob.file_stores)
				{
					var mapping = "";

					for (var wf in json_blob[ws].file_store_mapping)
					{
						if (wf === fs)
						{
							mapping = json_blob[ws].file_store_mapping[wf];
							break;
						}
					}

					var mapping_text = mapping;
					var ui_path = mapping;

					if (typeof mapping === typeof "")
					{
						if (mapping_text.length == 0)
						{
							mapping_text = "<i>" + $.i18n._('nixps-cloudflow-workservers.filestore_mapping') + "</i>";
						}
					}
					else
					{
						ui_path = mapping.path;

						if (mapping.user === "")
						{
							mapping_text = mapping.path;
						}
						else
						{
							if (mapping.path.substr(0, 24) === '/Users/Shared/Cloudflow/')
							{
								ui_path = mapping.path.substr(24);
								ui_path = ui_path.substr(0, 3) + ':/' + ui_path.substr(3);
							}

							mapping_text = ui_path + " (" + $.i18n._('nixps-cloudflow-workservers.filestore_mapping_with_user', [mapping.user]) + ")";
						}

						mapping_text = ui_path;
						config_pane.ui_path_mapping[mapping.path] = ui_path;
					}
					$('#ws-table').append("<tr class='wf_entry' wf_id='"+fs+"' ws_name='"+ws+"'>"+
								"<td><img src='portal/images/config_fileserver.svg'/></td>"+
								"<td class='name'>"+fs+"</td>"+
								"<td class='running' width='50px'><img src='portal/images/empty.png' style='width: 20px; height: 26px'></td>"+
								"<td class='description' value='" + ui_path + "'>" + mapping_text + "</td>"+
								"<td><img src='/portal/images/pensil.svg' class='wf_edit'/><img src='/portal/images/setting_save.svg' class='wf_save' style='display:none'/><img src='portal/images/empty.png' style='width: 21px; height: 21px' class='wf_delete'/></td></tr>");
				}

				url = json_blob[ws].url;

				if (url === undefined)
					url = "<i>" + $.i18n._('nixps-cloudflow-workservers.url_description') + "</i>";

				$('#ws-table').append("<tr class='wu_entry' ws_name='" + ws + "'>"+
					"<td><img src='portal/images/config_fileserver.svg' style='visibility:hidden'/></td>"+
					"<td class='name'>" + $.i18n._('nixps-cloudflow-workservers.url').toUpperCase() + "</td>"+
					"<td class='running' width='50px'><img src='portal/images/empty.png' style='width: 20px; height: 26px'></td>"+
					"<td class='description' value='" + url + "'>" + url + "</td>"+
					"<td><img src='/portal/images/pensil.svg' class='wu_edit'/><img src='/portal/images/setting_save.svg' class='wu_save' style='display:none'/></td></tr>");

                // desactivate for the moment, we should reactivate this. see track #16556
                if(false && !$.isEmptyObject(json_blob[ws].logicals)) {
                    $('#ws-table').append("<tr class='wu_entry' ws_name='" + ws + "'>"+
                        "<td><img src='portal/images/config_fileserver.svg' style='visibility:hidden'/></td>"+
                        "<td class='name'>" + $.i18n._('nixps-cloudflow-workservers.logicals').toUpperCase() + "</td>"+
                        "<td class='running' width='50px'><img src='portal/images/empty.png' style='width: 20px; height: 26px'></td>"+
                        "<td class='description'></td>"+
                        "<td></td></tr>");

                    $('#ws-table').append($('<tr ws_name="' + ws + '">')
                            .append("<td><img src='portal/images/config_fileserver.svg' style='visibility:hidden'/></td>")
                            .append($('<td colspan="4">').append($("<div>").LogicalsList({
                                    logicalsObject:json_blob[ws].logicals,
                                    update: work_servers_tab._logicalsChangeHandler
                            }))));
                }
			}

			$('.ws_activate').click(work_servers_tab.ws_activate);
			$('.ws_activate').css("cursor", "pointer");
			// $('.ws_edit').click(work_servers_tab.ws_edit_row);
			$('.ws_edit').css("cursor", "pointer");
			$('.ws_save').click(work_servers_tab.ws_save_row);
			$('.ws_save').css("cursor", "pointer");
			$('.ws_delete').click(work_servers_tab.ws_delete_row);
			$('.ws_delete').css("cursor", "pointer");
			$('.wk_add').click(work_servers_tab.add_worker);
			$('.wk_add').css("cursor", "pointer");
			$('.wk_activate').click(work_servers_tab.wk_activate);
			$('.wk_activate').css("cursor", "pointer");
			$('.wk_edit').click(work_servers_tab.wk_edit_row);
			$('.wk_edit').css("cursor", "pointer");
			$('.wk_save').click(work_servers_tab.wk_save_row);
			$('.wk_save').css("cursor", "pointer");
			$('.wk_delete').click(work_servers_tab.wk_delete_row);
			$('.wk_delete').css("cursor", "pointer");
			$('.wf_edit').click(work_servers_tab.wf_edit_row);
			$('.wf_edit').css("cursor", "pointer");
			$('.wf_save').click(work_servers_tab.wf_save_row);
			$('.wf_save').css("cursor", "pointer");
			$('.wf_delete').click(work_servers_tab.wf_delete_row);
			$('.wf_delete').css("cursor", "pointer");
			$('.wu_edit').click(work_servers_tab.wu_edit_row);
			$('.wu_edit').css("cursor", "pointer");
			$('.wu_save').click(work_servers_tab.wu_save_row);
			$('.wu_save').css("cursor", "pointer");

			$(".wk_log_button").css("cursor", "pointer");

			$(".wk_log_button").click(function(event)
			{
				event.stopPropagation();
				window.open("portal.cgi?logging="+$(this).closest('tr').attr('wk_id'),'_self');
			});

			work_servers_tab.enable_handlers();
		}
	},

    //
    // Update the Buttons
    //
    ws_edit_row: function()
    {
        work_servers_tab.enter_edit_mode();
        $(this).next(".ws_save").show();

        var ws_name = $(this).closest("tr");
        var ws_name_string = ws_name.attr("ws_id");
        var ws_edit_row = ws_name.children(".header");

        ws_edit_row.empty();
        ws_edit_row.append("<input value='"+ws_name_string+"' old='"+ws_name_string+"' size='20' />");
    },

    ws_save_row: function()
    {
        var ws_input = $(this).closest("tr").find("input");
        var ws_name_string = ws_input.val();
        var ws_name_old = ws_input.attr("old");

        // If the user entered nothing, don't save!
        if (ws_name_string.length == 0)
            return;

        // Check for name change
        if (ws_name_string != ws_name_old)
        {
            if (ws_name_old.length > 0)
            {
                var new_work_servers = new Object();
                for (var ws in config_pane.m_json_blob.work_servers)
                {
                    if (ws == ws_name_old)
                        new_work_servers[ws_name_string] = config_pane.m_json_blob.work_servers[ws];
                    else
                        new_work_servers[ws] = config_pane.m_json_blob.work_servers[ws];
                }
                config_pane.m_json_blob.work_servers = new_work_servers;
            }
            else
            {
                config_pane.m_json_blob.work_servers[ws_name_string] =
                {
                    "last_modification": 0,
            		"active": false,
            		"running": false,
            		"keep_alive": 0,
            		"workers": new Object(),
            		"file_store_mapping": new Object()
                };
            }
            config_pane.modified_work_server(ws_name_string);
            config_pane.touch();
        }

        // Update our UI
        work_servers_tab.set_metadata(config_pane.m_json_blob.work_servers);
        work_servers_tab.enable_handlers();
    },

    ws_delete_row: function()
    {
        var ws_name = $(this).closest("tr").attr("ws_id");
        $('body').Dialog("show_yes_no", $.i18n._('nixps-cloudflow-maintenance.warn_purge_workserver_title'), $.i18n._('nixps-cloudflow-maintenance.warn_purge_workserver', [ ws_name ]), null, function()
        {
            delete config_pane.m_json_blob.work_servers[ws_name];
            work_servers_tab.set_metadata(config_pane.m_json_blob.work_servers);
            config_pane.touch();
        });
    },

    ws_activate: function()
    {
        var ws_name = $(this).closest("tr").attr("ws_id");
        var thisCheck = $(this);
        if (config_pane.m_json_blob.work_servers[ws_name] != undefined)
        {
            config_pane.m_json_blob.work_servers[ws_name].active = !config_pane.m_json_blob.work_servers[ws_name].active;
            config_pane.modified_work_server(ws_name);
            config_pane.touch();

            // Update our UI
            work_servers_tab.set_metadata(config_pane.m_json_blob.work_servers);
            work_servers_tab.enable_handlers();
        }
    },

    wk_edit_row: function()
    {
        work_servers_tab.enter_edit_mode();
        $(this).next(".wk_save").show();

        var wk_app = $(this).closest("tr");

        var wk_name_string = config_pane.m_json_blob.work_servers[wk_app.attr("ws_name")].workers[wk_app.attr("wk_id")].app;
        var wk_name_field = wk_app.children(".name");
        wk_name_field.empty();
        wk_name_field.append(work_servers_tab.apps_list());
        $("select[name='wk_app_select']").val(wk_name_string);/*  option[value='"+wk_app_string+"']").attr("selected", true); */

        var wk_fs_string = config_pane.m_json_blob.work_servers[wk_app.attr("ws_name")].workers[wk_app.attr("wk_id")].file_store;
		if (wk_fs_string === undefined)
		{
			wk_fs_string = "";
		}
        var wk_fs_field = wk_app.children(".description");
        wk_fs_field.empty();
        wk_fs_field.append(work_servers_tab.filestores_list(wk_name_field.attr("app"), config_pane.m_json_blob.work_servers[wk_app.attr("ws_name")]));
        $("select[name='wk_fs_select'] option[value='"+wk_fs_string+"']").attr("selected", true);
        if (wk_name_field.attr("app") == "indexer")
        {
            var editUI = " <span style='white-space:nowrap'>" +
               $.i18n._('nixps-cloudflow-workservers.asset_filter') +
               ":&nbsp;<input size=30 name='asset_filter'/> " +
               " <input type=checkbox name='asset_filter_regex'/>&nbsp;" +
               $.i18n._('nixps-cloudflow-workservers.asset_filter_regex') +
               "</span>";

            if (work_servers_tab.mPrereleaseFlags.indexer_delay_per_file !== false) {
               editUI += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style='white-space:nowrap'>" +
                  $.i18n._('nixps-cloudflow-workservers.delay_per_file') +
                  "&nbsp;<input size=3 name='delay_per_file'/>&nbsp;" +
                  $.i18n._('nixps-cloudflow-workservers.delay_per_file_unit') +
                  "</span>";
            }

            if (work_servers_tab.mPrereleaseFlags.indexer_fs_events !== false) {
               editUI += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style='white-space:nowrap'>" +
                  "<input type='checkbox' name='process_fs_events'/>&nbsp;" +
                  $.i18n._('nixps-cloudflow-workservers.process_fs_events') +
                  "&nbsp;(*)</span>";
               editUI += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style='white-space:nowrap'>" +
                  $.i18n._('nixps-cloudflow-workservers.minimum_pass_time') +
                  " <input size=3 name='min_pass_time'/>&nbsp;" +
                  $.i18n._('nixps-cloudflow-workservers.minimum_pass_time_unit') +
                  "</span>";
               editUI += "<br>(*) " + $.i18n._('nixps-cloudflow-workservers.process_fs_events_only_windows')
            }

            wk_fs_field.append(editUI);
            if (config_pane.m_json_blob.work_servers[wk_app.attr("ws_name")].workers[wk_app.attr("wk_id")].filter !== undefined)
            {
                $("input[name='asset_filter']").val(config_pane.m_json_blob.work_servers[wk_app.attr("ws_name")].workers[wk_app.attr("wk_id")].filter);
            }
            if (config_pane.m_json_blob.work_servers[wk_app.attr("ws_name")].workers[wk_app.attr("wk_id")].filter_regex === true)
            {
                $("input[name='asset_filter_regex']").prop( "checked", true );
            }
            if (config_pane.m_json_blob.work_servers[wk_app.attr("ws_name")].workers[wk_app.attr("wk_id")].delay_per_file === undefined)
            {
                $("input[name='delay_per_file']").val('0');
            }
            else
            {
                $("input[name='delay_per_file']").val(config_pane.m_json_blob.work_servers[wk_app.attr("ws_name")].workers[wk_app.attr("wk_id")].delay_per_file);
            }
            if (config_pane.m_json_blob.work_servers[wk_app.attr("ws_name")].workers[wk_app.attr("wk_id")].min_pass_time === undefined) {
               $("input[name='min_pass_time']").val('');
            }
            else {
               $("input[name='min_pass_time']").val(config_pane.m_json_blob.work_servers[wk_app.attr("ws_name")].workers[wk_app.attr("wk_id")].min_pass_time);
            }
            if (config_pane.m_json_blob.work_servers[wk_app.attr("ws_name")].workers[wk_app.attr("wk_id")].process_fs_events === true) {
               $("input[name='process_fs_events']").prop("checked", true);
            }
        }
    },

    wk_save_row: function()
    {
        var wk_id = $(this).closest("tr").attr("wk_id");
        var ws_name = $(this).closest("tr").attr("ws_name");
        var wk_app = $(this).closest("tr").children(".name").find("select").val();
        var wk_fs = $(this).closest("tr").children(".description").find("select").val();

        if (wk_app.length == 0)
        {
            return;
        }

        if (wk_id.length == 0)
        {
            // New entry
            wk_id = config_pane.unique_worker_id('wk_' + wk_app);
        }

        if (config_pane.m_json_blob.work_servers[ws_name].workers == undefined)
        {
            config_pane.m_json_blob.work_servers[ws_name].workers = new Object();
        }

        config_pane.m_json_blob.work_servers[ws_name].workers[wk_id] =
        {
            "app": wk_app,
            "file_store": wk_fs,
            "active": false,
            "running": false,
            "keep_alive": 0
        };

        if (wk_app == 'indexer')
        {
            // those extra fields are not created when adding a new worker, only wnen editing

            if ($("input[name='asset_filter']").length > 0)
            {
                config_pane.m_json_blob.work_servers[ws_name].workers[wk_id].filter = $("input[name='asset_filter']").val();
            }

            if ($("input[name='asset_filter_regex']").length > 0)
            {
                config_pane.m_json_blob.work_servers[ws_name].workers[wk_id].filter_regex = $("input[name='asset_filter_regex']").prop('checked');
            }

            if ($("input[name='delay_per_file']").length > 0)
            {
                config_pane.m_json_blob.work_servers[ws_name].workers[wk_id].delay_per_file = parseInt('0' + $("input[name='delay_per_file']").val().trim(), 10);
            }

            if ($("input[name='process_fs_events']").length > 0) {
               config_pane.m_json_blob.work_servers[ws_name].workers[wk_id].process_fs_events = $("input[name='process_fs_events']").prop('checked');
            }

            if ($("input[name='delay_per_file']").length > 0) {
               config_pane.m_json_blob.work_servers[ws_name].workers[wk_id].min_pass_time = parseInt('0' + $("input[name='min_pass_time']").val().trim(), 10);
            }
        }
        config_pane.modified_work_server(ws_name);

        config_pane.touch();

        // Update our UI
        work_servers_tab.set_metadata(config_pane.m_json_blob.work_servers);
        work_servers_tab.enable_handlers();
    },

    wk_delete_row: function()
    {
        var wk_id = $(this).closest("tr").attr("wk_id");
        var ws_name = $(this).closest("tr").attr("ws_name");
        delete config_pane.m_json_blob.work_servers[ws_name].workers[wk_id];
        work_servers_tab.set_metadata(config_pane.m_json_blob.work_servers);
        config_pane.touch();
    },

    wk_activate: function()
    {
        var wk_id = $(this).closest("tr").attr("wk_id");
        var ws_name = $(this).closest("tr").attr("ws_name");
        var thisCheck = $(this);
        if (config_pane.m_json_blob.work_servers[ws_name].workers[wk_id] != undefined)
        {
            config_pane.m_json_blob.work_servers[ws_name].workers[wk_id].active = !config_pane.m_json_blob.work_servers[ws_name].workers[wk_id].active;
            config_pane.modified_work_server(ws_name);
            config_pane.touch();

            // Update our UI
            work_servers_tab.set_metadata(config_pane.m_json_blob.work_servers);
            work_servers_tab.enable_handlers();
        }
    },

    wf_edit_row: function()
    {
        work_servers_tab.enter_edit_mode();
        $(this).next(".wf_save").show();

        var wf_row = $(this).closest("tr");

        var wf_mapping_info = config_pane.m_json_blob.work_servers[wf_row.attr("ws_name")].file_store_mapping[wf_row.attr("wf_id")];
		var wf_path = "";
		var wf_user = "";
		var wf_password = "";
		var wf_distance = 1;
		if (wf_mapping_info === undefined)
		{
			wf_mapping_info = "";
		}
		if (typeof wf_mapping_info !== typeof "")
		{
			wf_user = wf_mapping_info.user;
			wf_password = wf_mapping_info.password;
			wf_path = config_pane.ui_path_mapping[wf_mapping_info.path];
			if (wf_mapping_info.distance !== undefined) {
				wf_distance = wf_mapping_info.distance;
			}
		} else {
			wf_path = wf_mapping_info;
		}
		var selectDAS = "";
		var selectLAN = "";
		var selectWAN = "";
		if (parseInt(wf_distance) <= 1) {
			selectDAS = " selected";
		}else if (parseInt(wf_distance) <= 3) {
			selectLAN = " selected";
		} else {
			selectWAN = " selected";
		}
		var distanceConfig = "";
		if (work_servers_tab.mPrereleaseFlags !== undefined && (work_servers_tab.mPrereleaseFlags.preview_as_blue_collar === true || work_servers_tab.mPrereleaseFlags.renderer_as_blue_collar === true)) {
			distanceConfig = "&nbsp;<select class='wf_distance old='"+wf_distance+">"
                               +"<option value='1'" + selectDAS + ">" + $.i18n._('nixps-cloudflow-workservers.filestore_direct_attached_storage') + "</option>"
                               +"<option value='3'" + selectLAN + ">" + $.i18n._('nixps-cloudflow-workservers.filestore_nas_or_local_file_server') + "</option>"
                               +"<option value='10'" + selectWAN + ">" + $.i18n._('nixps-cloudflow-workservers.filestore_nas_or_file_server_on_wan') + "</option>"
                               +"</select>";
		}

        var wf_mapping_field = wf_row.children(".description");
        wf_mapping_field.empty();
        wf_mapping_field.append("<input class='wf_path' value='"+wf_path+"' old='"+wf_path+"' size='60' placeholder='" + $.i18n._('nixps-cloudflow-workservers.filestore_path_placeholder') + "'/>"
                               +"&nbsp;&nbsp;"
                               +'<input type="text" name="username" style="display:none"/> <input type="password" name="pw" style="display:none"/>'
                               +"<input class='wf_user' value='"+wf_user+"' old='"+wf_user+"' size='16' placeholder='" + $.i18n._('nixps-cloudflow-workservers.filestore_username_placeholder') + "'/>"
                               +"&nbsp;"
                               +"<input class='wf_password' type='password' value='"+wf_password+"' old='"+wf_password+"' size='16' placeholder='" + $.i18n._('nixps-cloudflow-workservers.filestore_password_placeholder') + "'/>"
                               +distanceConfig);
    },

    wf_save_row: function()
    {
        var wf_id = $(this).closest("tr").attr("wf_id");
        var ws_name = $(this).closest("tr").attr("ws_name");
        var wf_path_elt = $(this).closest("tr").children(".description").find("input.wf_path");
        var wf_path_string = wf_path_elt.val();
        var wf_path_old = wf_path_elt.attr("old");
        var wf_user_elt = $(this).closest("tr").children(".description").find("input.wf_user");
        var wf_user_string = wf_user_elt.val();
        var wf_password_elt = $(this).closest("tr").children(".description").find("input.wf_password");
        var wf_password_string = wf_password_elt.val();
        var wf_distance_number = 1;
		if (work_servers_tab.mPrereleaseFlags !== undefined && (work_servers_tab.mPrereleaseFlags.preview_as_blue_collar === true || work_servers_tab.mPrereleaseFlags.renderer_as_blue_collar === true)) {
			var wf_distance_elt = $(this).closest("tr").children(".description").find("select.wf_distance");
			wf_distance_number = parseInt(wf_distance_elt.val());
		}
		if (wf_distance_number < 1) {
			wf_distance_number = 1;
		}

        if (wf_path_string.length == 0 && wf_path_old.length == 0)
		{
			// If the user entered nothing, don't save!
		}
		else if (wf_path_string.length == 0 && wf_path_old.length > 0)
		{
			// change from 'defined' to 'undefined'. Remove the mapping
            delete config_pane.m_json_blob.work_servers[ws_name].file_store_mapping[wf_id];
            config_pane.modified_work_server(ws_name);
            config_pane.touch();
		}
		else
        {
            if ((wf_path_string.substr(0, 6) === 'smb://') || (wf_path_string.substr(0, 6) === 'afp://'))
            {
                wf_path_string = '/Users/Shared/Cloudflow/' + wf_path_string.substr(0, 3) + wf_path_string.substr(5);
            }

			if (wf_user_string === '' && wf_distance_number === 1)
			{
            	config_pane.m_json_blob.work_servers[ws_name].file_store_mapping[wf_id] = wf_path_string;
			}
			else
			{
			    config_pane.m_json_blob.work_servers[ws_name].file_store_mapping[wf_id] = {
					"type": "smb",
					"path": wf_path_string,
					"user": wf_user_string,
					"password": wf_password_string,
					"distance": wf_distance_number
				};
			}

            config_pane.modified_work_server(ws_name);
            config_pane.touch();
        }

        // Update our UI
        work_servers_tab.set_metadata(config_pane.m_json_blob.work_servers);
        work_servers_tab.enable_handlers();
    },

    wu_edit_row: function()
    {
        work_servers_tab.enter_edit_mode();
        $(this).next(".wu_save").show();

        var wu_row = $(this).closest("tr");

        var wu_url = config_pane.m_json_blob.work_servers[wu_row.attr("ws_name")].url;
		if (wu_url === undefined)
			wu_url = '';
        var wu_field = wu_row.children(".description");
        wu_field.empty();
        wu_field.append("<input class='wu_url' value='" + wu_url + "' old='" + wu_url + "' size='60'>");
    },

    wu_save_row: function()
    {
        var ws_name = $(this).closest("tr").attr("ws_name");
        var wu_url_elt = $(this).closest("tr").children(".description").find("input.wu_url");
        var wu_url_string = wu_url_elt.val();
        var wu_url_old = wu_url_elt.attr("old");

        if (wu_url_string.length == 0 && wu_url_old.length == 0)
		{
			// If the user entered nothing, don't save!
		}
		else if (wu_url_string.length == 0 && wu_url_old.length > 0)
		{
			// change from 'defined' to 'undefined'. Remove the mapping
            delete config_pane.m_json_blob.work_servers[ws_name].url;
            config_pane.modified_work_server(ws_name);
            config_pane.touch();
		}
		else
        {
			config_pane.m_json_blob.work_servers[ws_name].url = wu_url_string;
            config_pane.modified_work_server(ws_name);
            config_pane.touch();
        }

        // Update our UI
        work_servers_tab.set_metadata(config_pane.m_json_blob.work_servers);
        work_servers_tab.enable_handlers();
    },

    _logicalsChangeHandler: function(pEvent, pData) {
        if(pData !== undefined && !$.isEmptyObject(pData.logicals)) {
            var ws_name = $(this).closest("tr").attr("ws_name");
            config_pane.m_json_blob.work_servers[ws_name].logicals = pData.logicals;
            config_pane.modified_work_server(ws_name);
            config_pane.touch();
        }
    },

    add_workserver: function()
    {
        var addedRow = $("<tr class='ws_entry'>"+
                              "<td colspan='2' class='header'><input value='' old='' size='20' /></td>"+
                              "<td class='running'></td>"+
                              "<td></td>"+
                              "<td><img src='/portal/images/pensil.svg' class='ws_edit'/><img src='/portal/images/setting_save.svg' class='ws_save'/><img src='/portal/images/remove.svg' class='ws_delete'/></td></tr>");
        addedRow.find('.running').append(work_servers_tab._switchOFFButton.clone().addClass('switchButton').css('top', 2));
        $('#ws-table').append(addedRow);
        $('.ws_save').unbind("click");
        $('.ws_delete').unbind("click");
        $('.ws_save').click(work_servers_tab.ws_save_row);
        $('.ws_delete').click(work_servers_tab.ws_delete_row);
        $('.ws_save').css("cursor", "pointer");
        work_servers_tab.enter_edit_mode();
    },

    add_worker: function()
    {
		var workServerName = $(this).closest("tr").attr("ws_id");
        var addedRow = $("<tr class='wk_entry' wk_id='' ws_name='" + workServerName + "'>"+
          "<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
          "<td class='name' width='25%'>"+work_servers_tab.apps_list()+"</td>"+
          "<td class='running' width='30px'></td>"+
          "<td class='description'>"+work_servers_tab.filestores_list("", workServerName)+"</td>"+
          "<td width='60px'><img src='/portal/images/pensil.svg' class='wk_edit'/><img src='/portal/images/setting_save.svg' class='wk_save'/><img src='/portal/images/remove.svg' class='wk_delete'/></td></tr>");
        addedRow.find('.running').append(work_servers_tab._switchOFFButton.clone().addClass('switchButton'));
        addedRow.insertAfter($(this).closest("tr"));

        $('.wk_edit').unbind("click");
        $('.wk_save').unbind("click");
        $('.wk_delete').unbind("click");
        $('.wk_edit').click(work_servers_tab.wk_edit_row);
        $('.wk_save').click(work_servers_tab.wk_save_row);
        $('.wk_delete').click(work_servers_tab.wk_delete_row);
        $('.wk_save').css("cursor", "pointer");
        work_servers_tab.enter_edit_mode();
    }
}
