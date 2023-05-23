/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, api_sync*/

/*global panzer_filelist*/
/*global panzer_layout_edition_sheet*/
/*global nixps, namespace */

/**
 * The layout panel, contains all the layout functionality
 */

(function() {

    namespace("nixps.patchplanner");

    nixps.patchplanner.layout_panel = function ()
    {
        this.m_sidebar = new nixps.patchplanner.sidebar();
        this.m_editionpane = $('<div>');
        this.m_editionpane.editor({
            unit: (new nixps.cloudflow.UnitPreferences()).getDefinition('length')
        });
    };


    nixps.patchplanner.layout_panel.prototype = {

        setup_ui: function()
        {
            // append the content div to the body
            $('#layout').append("<div class='layoutcontent'></div>");
            this.m_sidebar.setup_ui();
            this.m_editionpane.appendTo($('.layoutcontent'));
            this.m_editionpane.editor('redraw');
            this.enable_handlers();
        },


        get_editor: function()
        {
            return this.m_editionpane;
        },

        get_sidebar: function()
        {
            return this.m_sidebar;
        },

        enable_handlers: function()
        {
            var l_this = this;
            // l_this.m_editionpane.enable_handlers();
            l_this.m_sidebar.enable_handlers();
        },

        show: function ()
        {
            $('#layout .layoutcontent').show();
            this.m_editionpane.editor('redraw');
        },


        hide: function ()
        {
            $('#layout .layoutcontent').hide();
        },


        enable: function ()
        {
            $('#layout .layoutcontent').thawElement();
        },


        disable: function ()
        {
            $('#layout .layoutcontent').freezeElement();
        }
    };

}());

