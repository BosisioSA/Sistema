var workables_list_tab = {
    
    setup_ui: function()
    {
        // create component
        $('#config-navs').append("<li id='tabs-workablelist-tab'><a href='#tabs-workablelist'>" + $.i18n._('nixps-cloudflow-workablestable.title') + "</a></li>");
        $('#config-tabs').append("<div id='tabs-workablelist' class='tab'></div>");
        $('#config-tabs #tabs-workablelist').append($('<div>').WorkablesTable({}));
    },
    
    set_metadata: function(pPreferences) {
        // set up the language
        if ($.isPlainObject(pPreferences) && typeof pPreferences.language === "string") {
            $('#config-tabs #tabs-workablelist .nixps-cloudflow-WorkablesTable').WorkablesTable('option', 'language', pPreferences.language);
        }
    },
    
    enable_handlers: $.noop
};



