///////////////////////////////////////////////////////////////////////////////////////
// MAINTENANCE TAB
///////////////////////////////////////////////////////////////////////////////////////

var maintenance_tab =
{
	//
	// General Methods
	//
	setup_ui: function(pPrereleaseFlags)
	{
		$('#config-navs').append("<li id='tabs-maintenance-tab'><a href='#tabs-maintenance'>" + $.i18n._('nixps-cloudflow-maintenance.title') + "</a></li>");
		$('#config-tabs').append("<div id='tabs-maintenance' class='tab'><table id='maintenance-table' class='tsw-table' style='margin-right:0px; margin-left:0px; width:100%'></table></div>");

		$('#maintenance-table').append("<tr class='ws_entry'>"+
								"<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-maintenance-db.title').toUpperCase() + "</td>"+
								"<td class='running'><img src='/portal/images/empty.png' height='26'/></td>"+
								"<td></td></tr>");
		$('#maintenance-table').append("<tr>"+
								"<td width='35px'><img src='/portal/images/remove.svg' class='purge_button' collection='logs' /></td>"+
								"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-maintenance-db.purge_logs') + "</td>"+
								"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
								"<td class='description' width='*'></td></tr>");
		$('#maintenance-table').append("<tr>"+
								"<td width='35px'><img src='/portal/images/remove.svg' class='purge_button' collection='assets' /></td>"+
								"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-maintenance-db.purge_assets') + "</td>"+
								"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
								"<td class='description' width='*'></td></tr>");
		$('#maintenance-table').append("<tr>"+
								"<td width='35px'><img src='/portal/images/remove.svg' class='purge_button' collection='users' /></td>"+
								"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-maintenance-db.purge_users') + "</td>"+
								"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
								"<td class='description' width='*'></td></tr>");

		$('#maintenance-table').append("<tr>"+
								"<td width='35px'><img src='/portal/images/remove.svg' class='purge_bcd_button'/></td>"+
								"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-maintenance-db.purge_flow_node_defs') + "</td>"+
								"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
								"<td class='description' width='*'></td></tr>");
		$('#maintenance-table').append("<tr>"+
								"<td width='35px'><img src='/portal/images/reload.png' class='scan_addons_button'/></td>"+
								"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-maintenance-db.scan_addons') + "</td>"+
								"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
								"<td class='description' width='*'></td></tr>");
        $('#maintenance-table').append("<tr class='install_cfapps' style='display: none;'>"+
								"<td width='35px'><img src='/portal/images/reload.png' class='install_cfapps_button'/></td>"+
								"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-maintenance-db.install_cfapps') + "</td>"+
								"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
								"<td class='description' width='*'></td></tr>");
	},

	enable_handlers: function()
	{
		$('.purge_button').css("cursor", "pointer");
		$('.purge_button').click(function()
		{
			l_collection = $(this).attr("collection");
			l_msg = $.i18n._('nixps-cloudflow-maintenance.warn_purge_msg.' + l_collection).replace('[', '<b>').replace(']', '</b>');
			$('body').Dialog('show_yes_no', $.i18n._('nixps-cloudflow-maintenance.warn_purge_title'), "<center><img src='portal/images/madness.png' width='300px' /><br/>" + l_msg + "</center>", null, function()
			{
				api_sync.portal.flush(l_collection);
				window.location.reload();
			});
		});

		$('.purge_bcd_button').css("cursor", "pointer");
		$('.purge_bcd_button').click(function()
		{
			l_msg = $.i18n._('nixps-cloudflow-maintenance.warn_purge_msg.flow_node_defs').replace('[', '<b>').replace(']', '</b>');
			$('body').Dialog('show_yes_no', $.i18n._('nixps-cloudflow-maintenance.warn_purge_title'), "<center>" + l_msg + "</center>", null, function()
			{
				api_sync.portal.drop_blue_collar_definitions(3);
				window.location.reload();
			});
		});

		$('.scan_addons_button').css("cursor", "pointer");
		$('.scan_addons_button').click(function()
		{
			api_sync.portal.scan_addons();
			window.location.reload();
		});


        nixps.cloudflow.License.get().then(function(license) {
            if (license.check('mars') === true) {
                $('.install_cfapps').css('display', 'table-row');
            }
        });

        $('.install_cfapps_button').css("cursor", "pointer");
		$('.install_cfapps_button').click(function()
		{
			api_sync.hub.start_from_whitepaper("Mars Client Flow", "autoinstall");
            window.location.reload();
		});
	}
};
