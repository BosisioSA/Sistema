/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, nixps, namespace */


(function() {

    namespace("nixps.patchplanner");

    // Tool that deletes labels from the layout.
    //
    nixps.patchplanner.tool_rotate_selection = function ()
    {
        this.m_edition_pane = null;
    };


    nixps.patchplanner.tool_rotate_selection.prototype = {

        // Sets up the button UI.
        // Override if necessary.
        //
        // Parameters:
        //   - p_$parent : jQuery UI object that will contain the button
        //
        setup_tool_button: function (p_$parent)
        {
            this.m_$button = $("<button>").addClass('rotate');
            this.m_$button.text('Rotate patch');
            p_$parent.append(this.m_$button);
            this.m_$button.button({
                text: false, 
                icons: { 
                    primary: 'icon-rotate' 
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
                var selection = l_this.m_edition_pane.editor('getSelection');
                var rotation = selection.editor_label('option', 'rotation');
                if (rotation === 0) {
                    selection.editor_label('setRotation', 90);
                }
                else if (rotation === 90) {
                    selection.editor_label('setRotation', 0);
                }
                else if (rotation === 180) {
                    selection.editor_label('setRotation', 90);
                }
                else {
                    selection.editor_label('setRotation', 0);
                }
            });
            
        }
    };

}());

