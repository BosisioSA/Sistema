/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, nixps, namespace */


(function() {

    namespace("nixps.patchplanner");

    // Tool that deletes labels from the layout.
    //
    nixps.patchplanner.tool_clear_sheet = function ()
    {
        this.m_edition_pane = null;
        this.m_button = null;
    };


    nixps.patchplanner.tool_clear_sheet.prototype = {

        // Sets up the button UI.
        // Override if necessary.
        //
        // Parameters:
        //   - p_$parent : jQuery UI object that will contain the button
        //
        setup_tool_button: function (p_$parent)
        {
			p_$parent.append($("<button>").text('Clear sheet').addClass('clearsheet'));
			this.m_button = p_$parent.find('.clearsheet');
            this.m_button.button({ 
                text: false, 
                icons: { 
                    primary: 'icon-clear-sheet' 
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
            var that = this;

            this.m_button.on('click', function(pEvent) {
                var confirmMessage = $('<p>Are you sure you want to clear the sheet?</p>');
                confirmMessage.dialog({
                    title: "Clear sheet?",
                    width: 350,
                    autoOpen: true,
                    modal: true,
                    buttons: {
                        "Clear": function() {
                            $(this).dialog('close');
                            that.m_edition_pane.editor('removeAll');
                        },
                        "Cancel": function() {
                            $(this).dialog('close');
                        }
                    }
                });
            });
        }
    };

}());

