/*********************************************************************/
/* NiXPS Manage Pane JavaScript                                      */
/*                                                                   */
/* Copyright 2012, NiXPS (www.nixps.com)                             */
/*********************************************************************/

var config_dashboard_tab =
{
	m_configuration: undefined,
	m_stats: undefined,
	m_users: undefined,
	m_timerhandle: -1,
	m_max_users: 0,

	//
	// General Methods
	//
	setup_ui: function(pPrereleaseFlags)
	{
		$('#config-navs').append("<li id='tabs-dashboard-tab'><a href='#tabs-dashboard'>" + $.i18n._('nixps-cloudflow-dashboard.title') + "</a></li>");
		$('#config-tabs').append("<div id='tabs-dashboard' class='tab'></div>");
		$('#config-tabs').on("tabsactivate", function(event, ui)
		{
			if (ui.oldPanel.attr('id') == 'tabs-dashboard')
			{
				clearTimeout(config_dashboard_tab.m_timerhandle);
				config_dashboard_tab.m_timerhandle = -1;
			}
			if (ui.newPanel.attr('id') == 'tabs-dashboard')
			{
				if (config_dashboard_tab.m_timerhandle == -1)
				{
					config_dashboard_tab.refresh_status();
				}
			}
		});
	},

	enable_handlers: function()
	{
	},

	add_table_for_worker: function(name, workserver)
	{
		l_running_img = "dashboard_running.png";
		l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-running');
		if (workserver.running == false)
		{
			l_running_img = "dashboard_error.png";
			l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-inactive');
		}
		else if (m_configuration.cur_time - workserver.keep_alive > 600000)
		{
			l_running_img = "dashboard_error.png";
			l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-error');
		}
		else if (m_configuration.cur_time - workserver.keep_alive > 10000)
		{
			l_running_img = "dashboard_error.png";
			l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-processing');
		}
		$("#tabs-dashboard").append("<div id='dashboard-" + name + "-section' class='dashboard-section'>"
			+ "<div class='header'><div class='title'><img class='toggle expand' src='/portal/images/toggle-expand-arrow.svg'> " + name.toUpperCase()
			+ "</div><div class='summary'><img id='"+name+"_state' src='portal/images/" + l_running_img + "''> <span class='load'></span></div></div>"
			+ "<div class='details' style='overflow:hidden;clear:right'>"
			+ "<table id='"+name+"_table' class='tsw-table ds-table' style='padding:20px'></table></div></div>");
		$("#"+name+"_table").append("<tr id='"+name+"' height='30px'>"
			+ "<td colspan='2'>STATUS: <span class='state_txt' id='"+name+"_state_txt'>" + l_running_text + "</span></td>"
			+ "<td colspan='6'><img src='/portal/images/report.svg' class='log_button'></td>"+
                                    "</tr>");
		var l_total_usage = 0;
		var l_total_mem = 0;

        var workServerKeys = Object.keys(workserver.workers);
        workServerKeys.sort(function(a,b) {
                        var aw = workserver.workers[a];
                        var bw = workserver.workers[b];
                        if (typeof aw.app !== "string") {
                            return 1;
                        } else if (bw.app === undefined) {
                            return -1;
                        } else {
                            return $.i18n._('nixps-cloudflow-workers.' + aw.app).localeCompare($.i18n._('nixps-cloudflow-workers.' + bw.app));
                        }
                    });
		for (var i=0; i<workServerKeys.length; i++)
		{
            var wk = workServerKeys[i];
			var l_worker = workserver.workers[wk];
			var l_running_img = "dashboard_running.svg"; // "dashboard_wk_running.png";
			var l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-running');

			if (l_worker.license_error === true)
			{
				l_running_img = "dashboard_error.svg"; //"dashboard_wk_error.png";
				l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-error');
			}
			else if (l_worker.running == false)
			{
				l_running_img = "dashboard_stopped.svg"; //"dashboard_wk_inactive.png";
				l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-inactive');
			}
			else if (l_worker.active == false && m_configuration.cur_time - l_worker.keep_alive > 10000)
			{
				l_running_img = "dashboard_stopped.svg"; //"dashboard_wk_inactive.png";
				l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-inactive');
			}
			else if (m_configuration.cur_time - l_worker.keep_alive > 600000)
			{
				l_running_img = "dashboard_error.svg"; //"dashboard_wk_error.png";
				l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-error');
			}
			else if (m_configuration.cur_time - l_worker.keep_alive > 10000)
			{
				l_running_img = "dashboard_running.svg"; //"dashboard_wk_running.png";
				l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-processing');
			}

			var l_status = $.i18n._('nixps-cloudflow-dashboard.state-waiting');
			var l_url = "";
			if (l_worker.active_file != undefined)
				l_url = l_worker.active_file;
			if (l_worker.status != undefined)
				l_status = l_worker.status;

			var l_cpu="";
			if (l_worker.cpu_usage != undefined)
			{
				l_cpu=l_worker.cpu_usage+"%";
				l_total_usage += l_worker.cpu_usage;
			}

			var l_mem="";
			if (l_worker.mem_res != undefined)
			{
				l_mem = l_worker.mem_res + " MB";
				l_total_mem += l_worker.mem_res;
			}

			var l_pending_class = "dashboard_pending";
			if (l_worker.app !== undefined)
			{
				l_pending_class += " " + l_worker.app + "_pending";
			}

            var l_file_store = l_worker.file_store;
            if (typeof l_file_store !== 'string') {
                l_file_store = '';
            }
            var l_file_store_mapping = '';
            if (typeof l_file_store === 'string' && l_file_store.length > 0) {
                l_file_store_mapping = workserver.file_store_mapping[l_file_store];
            }

            var l_file_store_content = '';
            if (typeof l_file_store === 'string' && l_file_store.length > 0) {
                l_file_store_content = '<br>' + l_file_store;
                if (typeof l_file_store_mapping === 'string' && l_file_store_mapping.length > 0) {
                    l_file_store_content += ': ' + l_file_store_mapping;
                }
            }

			$("#"+name+"_table").append("<tr id='"+wk+"' title='"+wk+"' height='26px'>"
				+ "<td width='35px' class='icon'><img id='"+name+"_"+wk+"_state' src='portal/images/"+l_running_img+"' + title='" + l_running_text + "'/></td>"
				+ "<td width='200px' class='name'>" + $.i18n._('nixps-cloudflow-workers.' + l_worker.app) + l_file_store_content +  "</td>"
				+ "<td width='35px' class='running'><img src='/portal/images/report.svg' class='log_button'></td>"
				+ "<td width='*' class='dashboard_cpu' id='"+name+"_"+wk+"_cpu'>"+l_cpu+"</td>"
				+ "<td width='*' class='dashboard_mem' id='"+name+"_"+wk+"_mem'>"+l_mem+"</td>"
				+ "<td width='*' class='"+l_pending_class+"' id='"+name+"_"+wk+"_pending'></td>"
				+ "<td width='*' class='description' id='"+name+"_"+wk+"_status'>"+l_status+"</td>"
				+ "<td width='*' id='"+name+"_"+wk+"_active_file' class='active_file'>"+l_url+"</td>"
				+ "</tr>");
		}
		$("#dashboard-" + name + "-section .load").text(l_total_usage + "%, " + l_total_mem + " MB");

		$(".log_button").css("cursor", "pointer");
		$(".log_button").click(function(event)
		{
			event.stopPropagation();
			window.open("portal.cgi?logging="+$(this).closest('tr').attr('id'),'_self');
		});
		$("#dashboard-" + name + "-section .details").hide();
		$("#dashboard-" + name + "-section .header").click(function (e)
		{
			if ($("#dashboard-" + name + "-section .details").is(':hidden'))
			{
				$("#dashboard-" + name + "-section .toggle").attr('src', '/portal/images/toggle-collapse-arrow.svg').removeClass('expand');
				$("#dashboard-" + name + "-section .details").slideDown();
			}
			else
			{
				$("#dashboard-" + name + "-section .toggle").attr('src', '/portal/images/toggle-expand-arrow.svg').addClass('expand');
				$("#dashboard-" + name + "-section .details").slideUp();
			}
		});
	},

    toggle_meta_row: function(server_id)
    {
        if ($("#__meta__"+server_id).length > 0)
        {
            var tr = $("#__meta__"+server_id);
            tr.children("td").each(function()
            {
                $(this).wrapInner("<div></div>").children("div").slideUp(function()
                {
                    tr.remove();
                });
            });
        }
        else
        {
            l_meta = config_dashboard_tab.get_meta_for_id(server_id);
            $("#"+server_id).after("<tr class='meta-row' id='__meta__"+server_id+"'>"+
                                   "<td colspan='8'><div class='meta-arrow'><img class='meta-arrow-image' src='portal/images/dashboard_fold_arrow.png'/>"+l_meta+"</div></td>"+
                                   "</tr>");
            $(".meta-row").each(function()
            {
                var tr = $(this);
                tr.children("td").each(function()
                {
                    $(this).children("div").slideDown(function() {});
                });
            });
        }
    },

    find_server_blob: function(server_id)
    {
        for (var ws in m_configuration.work_servers)
        {
            if (ws == server_id)
            {
                return m_configuration.work_servers[ws];
            }
            else
            {
                for (var wk in m_configuration.work_servers[ws].workers)
                {
                    if (wk == server_id)
                    {
                        return m_configuration.work_servers[ws].workers[wk];
                    }
                }
            }
        }
        return undefined;
    },

    get_meta_for_id: function(server_id)
    {
        l_json_blob = config_dashboard_tab.find_server_blob(server_id);
        var l_meta_string = "ID: " + server_id + "<br/>";
        for (var l_prop in l_json_blob)
        {
			if (typeof l_json_blob[l_prop] === 'object')
			{
				for (var l_prop2 in l_json_blob[l_prop])
				{
					l_meta_string += l_prop + "." + l_prop2 + ": " + l_json_blob[l_prop][l_prop2] + "<br/>";
				}
			} else
				l_meta_string += l_prop + ": " + l_json_blob[l_prop] + "<br/>";
        }

        return l_meta_string;
    },

	refresh_status: function()
	{
		var lCommand = { "method" : "request.config", "name" : "servers" };

		$.post("/portal.cgi", JSON.stringify(lCommand), function(data)
		{
            for (var ws in data.work_servers)
			{
				var l_workserver = data.work_servers[ws];
				var l_running_img = "portal/images/dashboard_running.png";
				var l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-running');
				if (l_workserver.running == false)
				{
					l_running_img = "portal/images/dashboard_wk_inactive.png";
					l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-inactive');
				}
				else if (data.cur_time - l_workserver.keep_alive > 600000)
				{
					l_running_img = "portal/images/dashboard_error.png";
					l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-error');
				}
				$("#" + ws + "_state").attr("src", l_running_img);
				$("#" + ws + "_state_txt").attr("src", l_running_text);
				var l_total_usage = 0;
				var l_total_mem = 0;
				for (var wk in l_workserver.workers)
				{
					l_worker = l_workserver.workers[wk];
					l_running_img = "portal/images/dashboard_running.svg"; //"portal/images/dashboard_wk_running.png";
					l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-running');

					if (l_worker.license_error === true)
					{
						l_running_img = "portal/images/dashboard_error.svg"; //"portal/images/dashboard_wk_error.png";
						l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-error');
					}
					else if (l_worker.running == false)
					{
						l_running_img = "portal/images/dashboard_stopped.svg"; //"portal/images/dashboard_wk_inactive.png";
						l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-inactive');
					}
					else if (l_worker.active == false && m_configuration.cur_time - l_worker.keep_alive > 10000)
					{
						l_running_img = "portal/images/dashboard_stopped.svg"; //"portal/images/dashboard_wk_inactive.png";
						l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-inactive');
					}
					else if (m_configuration.cur_time - l_worker.keep_alive > 600000)
					{
						l_running_img = "portal/images/dashboard_error.svg"; //"portal/images/dashboard_wk_error.png";
						l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-error');
					}
					else if (data.cur_time - l_worker.keep_alive > 10000)
					{
						l_running_img = "portal/images/dashboard_running.svg"; //"portal/images/dashboard_wk_running.png";
						l_running_text = $.i18n._('nixps-cloudflow-dashboard.state-processing');
					}
					var l_status = $.i18n._('nixps-cloudflow-dashboard.state-waiting');
					$("#"+ws+"_"+wk+"_state").attr("src", l_running_img);
					$("#"+ws+"_"+wk+"_state").attr("title", l_running_text);
					var l_url = "";
					if (l_worker.active_file != undefined)
					{
						l_url = l_worker.active_file;
					}
					if (l_worker.status != undefined)
					{
						l_status = l_worker.status;
					}

					var l_cpu="";
					if (l_worker.cpu_usage != undefined) {
						l_cpu=l_worker.cpu_usage+"%";
						l_total_usage += l_worker.cpu_usage;
					}

					var l_mem="";
					if (l_worker.mem_res != undefined) {
						l_mem = l_worker.mem_res + " MB";
						l_total_mem += l_worker.mem_res;
					}

					$("#"+ws+"_"+wk+"_status").empty();
					$("#"+ws+"_"+wk+"_status").append(l_status);
					$("#"+ws+"_"+wk+"_active_file").empty();
					$("#"+ws+"_"+wk+"_active_file").append(l_url);
					$("#"+ws+"_"+wk+"_cpu").empty();
					$("#"+ws+"_"+wk+"_cpu").append(l_cpu);
					$("#"+ws+"_"+wk+"_mem").empty();
					$("#"+ws+"_"+wk+"_mem").append(l_mem);
				}
				$("#dashboard-" + ws + "-section .load").text(l_total_usage + "%, " + l_total_mem + " MB");
			}

			api_async.portal.get_workers_pending(function (data)
			{
				$(".metadata_pending").empty();
				if (data.metadata > 0)
				{
					$(".metadata_pending").append(data.metadata);
				}
				$(".preview_pending").empty();
				if (data.preview > 0)
				{
					$(".preview_pending").append(data.preview);
				}
				$(".renderer_pending").empty();
				if (data.render > 0)
				{
					$(".renderer_pending").append(data.render);
				}
				$(".quantumshare_pending").empty();
				if (data.share > 0)
				{
					$(".quantumshare_pending").append(data.share);
				}
                clearTimeout(config_dashboard_tab.m_timerhandle);
				config_dashboard_tab.m_timerhandle = setTimeout(config_dashboard_tab.refresh_status, 10000);
			});

			m_configuration = data;
		});

		api_async.portal.get_stats(function (data)
		{
			m_stats = data;

			$("#dashboard-database-section .files").text(nixps_utils.humanize_filesize(m_stats.storage));
			$("#dashboard-database-section .reclaimable").text('-' + nixps_utils.humanize_filesize(m_stats.reclaimable));
			if (m_stats.namespaces === undefined) {
				$("#dashboard-database-section .namespaces").parent().hide();
				$("#dashboard-database-section .total").text(nixps_utils.humanize_filesize(m_stats.storage - m_stats.reclaimable));
				$("#dashboard-database-section .load").text(nixps_utils.humanize_filesize(m_stats.storage - m_stats.reclaimable));
			} else {
				$("#dashboard-database-section .namespaces").text(nixps_utils.humanize_filesize(m_stats.namespaces));
				$("#dashboard-database-section .total").text(nixps_utils.humanize_filesize(m_stats.storage + m_stats.namespaces - m_stats.reclaimable));
				$("#dashboard-database-section .load").text(nixps_utils.humanize_filesize(m_stats.storage + m_stats.namespaces - m_stats.reclaimable));
			}

			m_stats.collections.forEach(function (c) {
				$("#collection-size-" + c.name).text(nixps_utils.humanize_filesize(c.size));
			});
		});

		api_async.portal.get_active_users(function (data) {
			var l_user_count = 0;
			m_users = data;
			m_users.forEach(function (u) {
				if (u.username != 'guest')
					l_user_count += 1;
			});

			if (config_dashboard_tab.m_max_users > 0) {
				if (l_user_count == 1) {
					$("#dashboard-users-section .summary")._t("nixps-cloudflow-dashboard.users-count-1", [config_dashboard_tab.m_max_users]);
				} else {
					$("#dashboard-users-section .summary")._t("nixps-cloudflow-dashboard.users-count-n", [l_user_count, config_dashboard_tab.m_max_users]);
				}
			} else {
				if (l_user_count == 1) {
					$("#dashboard-users-section .summary")._t("nixps-cloudflow-dashboard.users-count-1-unlimited", []);
				} else {
					$("#dashboard-users-section .summary")._t("nixps-cloudflow-dashboard.users-count-n-unlimited", [l_user_count]);
				}
			}

			var table_contents = "<tr><td class='users-name-title'>" + $.i18n._('nixps-cloudflow-dashboard.users-column-username') + "</td>" +
				"<td class='users-fullname-title'>" + $.i18n._('nixps-cloudflow-dashboard.users-column-name') + "</td>" +
				"<td class='users-login-title'>" + $.i18n._('nixps-cloudflow-dashboard.users-column-login') + "</td>" +
				"<td class='users-access-title'>" + $.i18n._('nixps-cloudflow-dashboard.users-column-last') + "</td></tr>";
			m_users.forEach(function (u) {
				table_contents += "<tr><td class='users-name'>" + u.username + "</td><td class='users-fullname'>" + u.fullname + "</td>"
								+ "<td class='users-login'>" + dateFormat(u.login_time, "yyyy-mm-dd HH:MM:ss") + "</td><td class='users-access'>" + dateFormat(u.access_time, "yyyy-mm-dd HH:MM:ss") + "</td></tr>";
			});
			$("#dashboard-users-section .users").html(table_contents);
		});
	},

    add_message: function(message)
    {
    	$("#dashboard-messages-section").show();
    	$("#dashboard-messages-section").append(message);
    },

    add_section_for_messages: function()
    {
	    $("#tabs-dashboard").append("<div id='dashboard-messages-section' class='dashboard-section'></div>");
    },

	add_section_for_database: function()
	{
		$("#tabs-dashboard").append("<div id='dashboard-database-section' class='dashboard-section'>"
		                            + "<div class='header'><div class='title'><img class='toggle expand' src='/portal/images/toggle-expand-arrow.svg'> " + $.i18n._('nixps-cloudflow-dashboard.database') + "</div><div class='summary'> <span class='load'></span></div></div>"
		                            + "<div class='details'>"
		                            + "<table class='details-layout'><tr><td><table class='collections'>"
									+   "<tr><td class='collections-title' colspan='2'>" + $.i18n._('nixps-cloudflow-dashboard.database-collections') + "</td></tr>"
									+ "</table></td>"
									+ "<td class='overview'><table>"
									+   "<tr><td class='overview-title' colspan='2'>" + $.i18n._('nixps-cloudflow-dashboard.database-diskspace') + "</td></tr>"
									+   "<tr><td class='overview-key'>" + $.i18n._('nixps-cloudflow-dashboard.database-diskspace-files') + "</td><td class='overview-value files'></td></tr>"
									+   "<tr><td class='overview-key'>" + $.i18n._('nixps-cloudflow-dashboard.database-diskspace-namespaces') + "</td><td class='overview-value namespaces'></td></tr>"
									+   "<tr><td class='overview-key'>" + $.i18n._('nixps-cloudflow-dashboard.database-diskspace-reclaimable') + "</td><td class='overview-value reclaimable'></td></tr>"
									+   "<tr><td class='overview-key'>&nbsp;</td><td class='overview-value'></td></tr>"
									+   "<tr><td class='overview-key'>" + $.i18n._('nixps-cloudflow-dashboard.database-diskspace-total') + "</td><td class='overview-value total'></td></tr>"
									+   "<tr><td class='overview-key'>&nbsp;</td><td class='overview-value'></td></tr>"
									+   "<tr><td class='overview-key'>" + $.i18n._('nixps-cloudflow-dashboard.database-ip') + "</td><td class='overview-value db-ip'></td></tr>"
									+   "<tr><td class='overview-key'>" + $.i18n._('nixps-cloudflow-dashboard.database-version') + "</td><td class='overview-value db-version'></td></tr>"
									+   "<tr><td class='overview-key'>" + $.i18n._('nixps-cloudflow-dashboard.database-type') + "</td><td class='overview-value type'></td></tr>"
									+ "</table></tr></table></div></div>");
		$("#dashboard-database-section .files").text(nixps_utils.humanize_filesize(m_stats.storage));
		$("#dashboard-database-section .reclaimable").text('-' + nixps_utils.humanize_filesize(m_stats.reclaimable));
		$("#dashboard-database-section .type").text(m_stats.type);
		$("#dashboard-database-section .db-ip").text(m_stats.db_ip);
		$("#dashboard-database-section .db-version").text(m_stats.db_version);
		if (m_stats.namespaces === undefined) {
			$("#dashboard-database-section .namespaces").parent().hide();
			$("#dashboard-database-section .total").text(nixps_utils.humanize_filesize(m_stats.storage - m_stats.reclaimable));
			$("#dashboard-database-section .load").text(nixps_utils.humanize_filesize(m_stats.files - m_stats.reclaimable));
		} else {
			$("#dashboard-database-section .namespaces").text(nixps_utils.humanize_filesize(m_stats.namespaces));
			$("#dashboard-database-section .total").text(nixps_utils.humanize_filesize(m_stats.storage + m_stats.namespaces - m_stats.reclaimable));
			$("#dashboard-database-section .load").text(nixps_utils.humanize_filesize(m_stats.storage + m_stats.namespaces - m_stats.reclaimable));
		}
		m_stats.collections.forEach(function (c) {
			$("#dashboard-database-section .collections tbody").append("<tr><td class='collection-name'>" + c.name + "</td><td class='collection-size' id='collection-size-'" + c.name + "'>" + nixps_utils.humanize_filesize(c.size) + "</td></tr>");
		});
		$("#dashboard-database-section .details").hide();
		$("#dashboard-database-section .header").click(function (e) {
			if ($("#dashboard-database-section .details").is(':hidden')) {
				$("#dashboard-database-section .toggle").attr('src', '/portal/images/toggle-collapse-arrow.svg').removeClass('expand');
				$("#dashboard-database-section .details").slideDown();
			} else {
				$("#dashboard-database-section .toggle").attr('src', '/portal/images/toggle-expand-arrow.svg').addClass('expand');
				$("#dashboard-database-section .details").slideUp();
			}
		});
	},

	add_section_for_users: function ()
	{
		$("#tabs-dashboard").append("<div id='dashboard-users-section' class='dashboard-section'>"
			+ "<div class='header'><div class='title'><img class='toggle expand' src='/portal/images/toggle-expand-arrow.svg'> " + $.i18n._('nixps-cloudflow-dashboard.users') + "</div><div class='summary'></div></div>"
			+ "<div class='details'><table class='users'>"
			+ "<tr><td class='users-title' colspan='2'>" + $.i18n._('nixps-cloudflow-dashboard.users-column-username') + "</td></tr>"
			+ "</table></div></div>");
		license.get('max_user', function (p_limit) {
			config_dashboard_tab.m_max_users = p_limit;

			var l_user_count = 0;

			m_users.forEach(function (u) {
				if (u.username != 'guest') {
					l_user_count += 1;
				}
			});

			if (p_limit > 0) {
				if (l_user_count == 1) {
					$("#dashboard-users-section .summary")._t("nixps-cloudflow-dashboard.users-count-1", [p_limit]);
				} else {
					$("#dashboard-users-section .summary")._t("nixps-cloudflow-dashboard.users-count-n", [l_user_count, p_limit]);
				}
			} else {
				if (l_user_count == 1) {
					$("#dashboard-users-section .summary")._t("nixps-cloudflow-dashboard.users-count-1-unlimited", []);
				} else {
					$("#dashboard-users-section .summary")._t("nixps-cloudflow-dashboard.users-count-n-unlimited", [l_user_count]);
				}
			}
		});

		var table_contents = "<tr><td class='users-name-title'>" + $.i18n._('nixps-cloudflow-dashboard.users-column-username') + "</td>" +
			"<td class='users-fullname-title'>" + $.i18n._('nixps-cloudflow-dashboard.users-column-name') + "</td>" +
			"<td class='users-login-title'>" + $.i18n._('nixps-cloudflow-dashboard.users-column-login') + "</td>" +
			"<td class='users-access-title'>" + $.i18n._('nixps-cloudflow-dashboard.users-column-last') + "</td></tr>";
		m_users.forEach(function (u) {
			table_contents += "<tr><td class='users-name'>" + u.username + "</td><td class='users-fullname'>" + u.fullname + "</td>"
				+ "<td class='users-login'>" + dateFormat(u.login_time, "yyyy-mm-dd HH:MM:ss") + "</td><td class='users-access'>" + dateFormat(u.access_time, "yyyy-mm-dd HH:MM:ss") + "</td></tr>";
		});
		$("#dashboard-users-section .users").html(table_contents);
		$("#dashboard-users-section .details").hide();
		$("#dashboard-users-section .header").click(function (e) {
			if ($("#dashboard-users-section .details").is(':hidden')) {
				$("#dashboard-users-section .toggle").attr('src', '/portal/images/toggle-collapse-arrow.svg').removeClass('expand');
				$("#dashboard-users-section .details").slideDown();
			} else {
				$("#dashboard-users-section .toggle").attr('src', '/portal/images/toggle-expand-arrow.svg').addClass('expand');
				$("#dashboard-users-section .details").slideUp();
			}
		});
	},

    show: function()
    {
		config_dashboard_tab.add_section_for_messages();

		api_async.request.config('servers', function (data) {
		m_configuration = data;

			api_async.portal.get_stats(function (data) {
				m_stats = data;

				api_async.portal.get_active_users(function (data) {
					m_users = data;

					config_dashboard_tab.add_section_for_users();
					config_dashboard_tab.add_section_for_database();

					for (var ws in m_configuration.work_servers)
					{
						if (m_configuration.work_servers[ws].active == true)
						{
							config_dashboard_tab.add_table_for_worker(ws, m_configuration.work_servers[ws]);
						}
					}
					$("tr").unbind();
					$("tr").click(function () {
						if ($(this).attr("id") != undefined)
						{
							config_dashboard_tab.toggle_meta_row($(this).attr("id"));
						}
						return true;
					});
    		        if (config_dashboard_tab.m_timerhandle == -1)
    		        {
                        config_dashboard_tab.m_timerhandle = setTimeout(config_dashboard_tab.refresh_status, 10000);
                    }
				});
			});
        });
    }
}
