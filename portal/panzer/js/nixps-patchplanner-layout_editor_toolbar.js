/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/

/*global panzer_layout_edition_sheet*/

// A tool bar to put above the layout.
//
// Parameters:
//   - p_tools : An array of tools to add.
//

(function() {

    namespace("nixps.patchplanner");

    nixps.patchplanner.layout_editor_toolbar = function (p_tools)
    {
        this.m_tools = p_tools;
    };


    nixps.patchplanner.layout_editor_toolbar.prototype = {

        setup_ui: function (p_$parent, p_layout_editor)
        {
            var l_this = this;

            var l_$edit_toolbar = $("<div class='edittoolbar'>");
            this.toolbar = l_$edit_toolbar;
            p_$parent.append(l_$edit_toolbar);

            this.m_tools.forEach(function (p_tool)
            {
                p_tool.setup_ui(l_$edit_toolbar, p_layout_editor);
            });
        },

        destroy: function() {
            this.toolbar.remove();
            this.toolbar = null;
        }

    };

}());
