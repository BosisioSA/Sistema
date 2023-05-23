/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, nixps, namespace */


(function() {

    namespace("nixps.patchplanner");

    // Tool that deletes labels from the layout.
    //
    nixps.patchplanner.tool_edit_marks = function ()
    {
        this.m_edition_pane = null;
        this.m_button = null;
    };


    nixps.patchplanner.tool_edit_marks.prototype = {

        // Sets up the button UI.
        // Override if necessary.
        //
        // Parameters:
        //   - p_$parent : jQuery UI object that will contain the button
        //
        setup_tool_button: function (p_$parent)
        {
			p_$parent.append($("<button class='editmarks'>Edit patch marks</button>"));
			this.m_button = p_$parent.find('.editmarks');
            this.m_button.button({ 
                text: false, 
                icons: { 
                    primary: 'icon-edit-marks' 
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
                var patchids = that.m_edition_pane.editor('getSelectionReferences');

                if (patchids.length === 1) {
                    var editor = $("<div>").appendTo($('#layout.patchplanner'));

                    var layoutDocument = (new nixps.patchplanner.Session()).load_layout_document();
                    var mounting_method = layoutDocument.get_settings().mounting_method;
                     console.log(mounting_method);
                    if(mounting_method === 'drillmount'){
                        editor.drill_marks_editor_dialog({
                            patchid: _.first(patchids)
                        });
                        editor.drill_marks_editor_dialog("open");
                    }else{
                        editor.marks_editor_dialog({
                            patchid: _.first(patchids)
                        });
                        editor.marks_editor_dialog("open");
                    }
                }
            });
        }
    };

}());

