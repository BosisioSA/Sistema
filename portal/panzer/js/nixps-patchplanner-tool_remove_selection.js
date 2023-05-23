/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, nixps, namespace */


(function() {

    namespace("nixps.patchplanner");

    // Tool that deletes labels from the layout.
    //
    nixps.patchplanner.tool_remove_selection = function ()
    {
        this.m_edition_pane = null;
    };


    nixps.patchplanner.tool_remove_selection.prototype = {

        // Sets up the button UI.
        // Override if necessary.
        //
        // Parameters:
        //   - p_$parent : jQuery UI object that will contain the button
        //
        setup_tool_button: function (p_$parent)
        {
            this.m_$button = $("<button>").addClass('deletelabel');
            this.m_$button.text('Remove patch');
            p_$parent.append(this.m_$button);
            this.m_$button.button({ 
                text: false, 
                icons: { 
                    primary: 'icon-remove' 
                } 
            });
        },


        // Sets up the tool.
        //
        // This method calls setup_tool_button and enable_handlers
        //
        // Parameters:
        //   - p_$parent : jQuery UI object that will contain the button
        //
        setup_ui: function (p_$parent, p_edition_pane)
        {
            this.m_edition_pane = p_edition_pane;
            this.setup_tool_button(p_$parent);
            this.enable_handlers();
        },


        // Sets up the event handlers.
        //
        enable_handlers: function ()
        {
            var l_this = this;
            
            this.m_$button.bind('click', function (p_event)
            {
                l_this.m_edition_pane.editor('removeSelection');
            });
            
        }
    };

}());

