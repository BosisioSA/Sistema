var folder_mapping_tab = {
    
    setup_ui: function()
    {
        // create component
        $('#config-navs').append("<li id='tabs-foldermapping-tab'><a href='#tabs-foldermapping'>" + $.i18n._('nixps-cloudflow-FolderMappingTable.title') + "</a></li>");
        $('#config-tabs').append("<div id='tabs-foldermapping' class='tab'></div>");
        $('#config-tabs #tabs-foldermapping').append($('<div>').FolderMappingTable({}));
    },
    
    set_metadata: function(pPreferences) {
    },
    
    enable_handlers: $.noop
};


