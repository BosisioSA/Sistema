/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, nixps, namespace */


(function() {

    namespace("nixps.patchplanner");

    // Tool that deletes labels from the layout.
    //
    nixps.patchplanner.tool_snap = function ()
    {
        this.m_edition_pane = null;
    };


    nixps.patchplanner.tool_snap.prototype = {

        // Sets up the button UI.
        // Override if necessary.
        //
        // Parameters:
        //   - p_$parent : jQuery UI object that will contain the button
        //
        setup_tool_button: function (p_$parent)
        {
			p_$parent.append($("<input type='checkbox' checked='checked' id='patchplanner-snap'><label for='patchplanner-snap'>Snap</label>"));
			this.m_$button = p_$parent.find('#patchplanner-snap');
			this.m_$button.button({ 
                text: false, 
                icons: { 
                    primary: 'icon-snap' 
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
            // this.enable_handlers();
        },


        // Sets up the event handlers.
        //
        enable_handlers: function ()
        {
            // var l_this = this;
            
            // this.m_$button.bind('click', function (p_event)
            // {
            //     l_this.m_edition_pane.editor('removeSelection');
            // });
            
        }
    };

}());

