///////////////////////////////////////////////////////////////////////////////////////
// FILE STORES TAB
///////////////////////////////////////////////////////////////////////////////////////

var file_stores_tab =
{
    m_dirty: false,

    //
    // General Methods
    //
    setup_ui: function(pPrereleaseFlags)
    {
        $('#config-navs').append("<li id='tabs-file-stores-tab'><a href='#tabs-file-stores'>" + $.i18n._('nixps-cloudflow-file_stores.title') + "</a></li>");
        $('#config-tabs').append("<div id='tabs-file-stores' class='tab'><table id='fs-table' class='tsw-table' style='margin-right:0px; margin-left:0px; width:100%'></table></div>");
    },

    enable_handlers: function()
    {
    },

    set_metadata: function(json_blob, prereleaseFlags)
    {
        $('#fs-table').empty();
        $('#fs-table').append("<tr class='ws_entry'>"+
                              "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-file_stores.title2') + "</td>"+
                              "<td class='running'><img src='portal/images/empty.png' style='width: 20px; height: 26px'></td>"+
                              "<td><a class='green-button fs_add' style='margin-left:15px'>" + $.i18n._('nixps-cloudflow-file_stores.button-add') + "</td>"+
                              "<td></td></tr>");
        $('.fs_add').click(file_stores_tab.add_filestore);
        $('.fs_add').css("cursor", "pointer");
        if (json_blob == undefined)
        {
            config_pane.m_json_blob["file_stores"] = new Object();
            file_stores_tab.add_filestore();
        }
        else if (json_blob.length == 0)
        {
            file_stores_tab.add_filestore();
        }
        else
        {
            for (var fs in json_blob)
            {
                $('#fs-table').append("<tr fs_id='"+fs+"'>"+
                                      "<td width='35px'><img src='portal/images/config_fileserver.svg'/></td>"+
                                      "<td width='25%' class='name'>"+fs+"</td>"+
                                      "<td class='running' width='30px'></td>"+
                                      "<td class='description'>"+json_blob[fs]+"</td>"+
                                      "<td width='60px'><img src='/portal/images/pensil.svg' class='fs_edit'/><img src='/portal/images/setting_save.svg' class='fs_save' style='display:none'/><img src='/portal/images/remove.svg' class='fs_delete'/></td></tr>");
            }
            $('.fs_edit').click(file_stores_tab.edit_row);
            $('.fs_edit').css("cursor", "pointer");
            $('.fs_save').click(file_stores_tab.save_row);
            $('.fs_save').css("cursor", "pointer");
            $('.fs_delete').click(file_stores_tab.delete_row);
            $('.fs_delete').css("cursor", "pointer");
        }
    },

    enter_edit_mode: function()
    {
        // Disable what should be during editing
        $('.fs_edit').hide();
        $('.fs_delete').hide();
        $('.fs_add').hide();
    },

    //
    // Update the Buttons
    //
    edit_row: function()
    {
        file_stores_tab.enter_edit_mode();
        $(this).next(".fs_save").show();

        var fs_name = $(this).closest("tr");
        var fs_name_row = fs_name.children(".name");
        var fs_name_string = fs_name.attr("fs_id");

        fs_name_row.empty();
        fs_name_row.append(fs_name_string);

        var fs_desc_row = fs_name.children(".description");
        var fs_desc_string = fs_desc_row.html();

        fs_desc_row.empty();
        fs_desc_row.append("<input value='"+fs_desc_string+"' old='"+fs_desc_string+"' size='50' />");
    },

    save_row: function()
    {
        var fs_row = $(this).closest("tr");
        var fs_name = fs_row.attr("fs_id");

        var fs_desc = fs_row.children(".description");
        var fs_desc_string = fs_desc.children().attr("value");
        var fs_desc_old = fs_desc.children().attr("old");

        if (fs_name.length == 0)
            return;

        if (fs_desc_string != fs_desc_old)
        {
            config_pane.m_json_blob.file_stores[fs_name] = fs_desc_string;
            config_pane.touch();
        }

        // Update our UI
        file_stores_tab.set_metadata(config_pane.m_json_blob.file_stores);
        file_stores_tab.enable_handlers();

        // Update work servers UI
        work_servers_tab.set_metadata(config_pane.m_json_blob.work_servers);
        work_servers_tab.enable_handlers();
    },

    save_new_row: function()
    {
        var fs_name = $(this).closest("tr");
        var fs_name_row = fs_name.children(".name");
        var fs_name_string = fs_name_row.children().attr("value");
        var fs_name_old = fs_name_row.children().attr("old");
        var fs_desc_row = fs_name.children(".description");
        var fs_desc_string = fs_desc_row.children().attr("value");
        var fs_desc_old = fs_desc_row.children().attr("old");
        // control name is not empty
        if (fs_name_string.length == 0)
            return;

        // control if name does not contain space(s)
        if (typeof fs_name_string === "string" && fs_name_string.search(' ') >= 0) {
            // add error message if not already added
            if ($(this).closest("table").find('.errorMessage').length === 0) {
                $(this).closest("tr").before($('<tr>').addClass('errorMessage').append($('<td>').attr('colspan', 5)._t('nixps-cloudflow-file_stores.error_spaces')));
            }
            return false;// return false to stop the event bublling, rest of the queue
        } else {
            // remove latests error messages
            $(this).closest("table").find('.errorMessage').remove();
        }

        if (fs_name_old.length > 0 && fs_name_old != fs_name_string)
            delete config_pane.m_json_blob.file_stores[fs_name_old];
        config_pane.m_json_blob.file_stores[fs_name_string] = fs_desc_string;

        // Update JSON Object
        if ((fs_name_string != fs_name_old || fs_desc_string != fs_desc_old))
        {
            config_pane.touch();
        }

        // Update our UI
        file_stores_tab.set_metadata(config_pane.m_json_blob.file_stores);
        file_stores_tab.enable_handlers();

        // Update work servers UI
        work_servers_tab.set_metadata(config_pane.m_json_blob.work_servers);
        work_servers_tab.enable_handlers();
    },

    delete_row: function()
    {
        var fs_name = $(this).closest("tr").attr("fs_id");

		$('body').Dialog("show_yes_no", $.i18n._("nixps-cloudflow-file_stores.removedialog_title"), "<center><img src='portal/images/caution.jpg' width='300px'><br>" +
			$.i18n._('nixps-cloudflow-file_stores.warning', ["<b>" + fs_name + "</b>"]) + "</center>", null, function() {
            delete config_pane.m_json_blob.file_stores[fs_name];
			api_sync.portal.remove_filestore(fs_name);

    		// and now delete all mappings that might be defined for the work servers
    		for (var countWorkServers in config_pane.m_json_blob.work_servers)
    		{
    			var workServer = config_pane.m_json_blob.work_servers[countWorkServers];
    			if (workServer.file_store_mapping !== undefined && workServer.file_store_mapping[fs_name] !== undefined)
    			{
    				delete workServer.file_store_mapping[fs_name];
    			}
    		}

            // Update our UI
            file_stores_tab.set_metadata(config_pane.m_json_blob.file_stores);

            // Update work servers UI
            work_servers_tab.set_metadata(config_pane.m_json_blob.work_servers);
            
            api_async.asset.delete_by_query(["cloudflow.enclosing_folder", "begins with", "cloudflow://" + fs_name], {}, function(pResults){
                
                config_pane.touch(); 
            }, function(pError) {
                console.error(pError);
                config_pane.touch(); 
            });
		});
    },

    add_filestore: function()
    {
        $('#fs-table').append("<tr>"+
                              "<td width='35px'><img src='portal/images/config_fileserver.svg'/></td>"+
                              "<td width='25%' class='name' ><input value='" + $.i18n._('nixps-cloudflow-file_stores.placeholder-name') + "' old='' size='20' /></td>"+
                              "<td class='running' width='30px'></td>"+
                              "<td class='description'><input value='" + $.i18n._('nixps-cloudflow-file_stores.placeholder-description') + "' old='' size='50' /></td>"+
                              "<td width='60px'><img src='/portal/images/pensil.svg' class='fs_edit' style='display:none'/><img src='/portal/images/setting_save.svg' class='fs_save'/><img src='/portal/images/remove.svg' class='fs_delete'/></td></tr>");
        $('.fs_edit').unbind("click");
        $('.fs_save').unbind("click");
        $('.fs_delete').unbind("click");
        $('.name input').unbind("keydown");
        $('.fs_edit').click(file_stores_tab.edit_row);
        $('.fs_save').click(file_stores_tab.save_new_row);
        $('.fs_delete').click(file_stores_tab.delete_row);
        $('.name input').on('keydown', file_stores_tab.inputNameKeyDownHandler);
        $('.fs_save').css("cursor", "pointer");
        file_stores_tab.enter_edit_mode();
    },

    /**
     * @brief handler that runs when user press a key.
     * for preventing pressing a space char in th name
     * @param {type} pEvent
     * @returns {Boolean}
     */
    inputNameKeyDownHandler: function(pEvent) {
        // preventing continue by returning false if key is same as space character
        return pEvent.which !== 32; /* same as keystroke.SPACE */
    }
}
