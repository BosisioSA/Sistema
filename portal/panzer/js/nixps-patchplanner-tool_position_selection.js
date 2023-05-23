/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, _, panzer_layout_edition_sheet, nixps, namespace */


(function() {

    namespace("nixps.patchplanner");

    /**
     * @brief Tool that moves labels on the layout.
     * @warn The tool button has ID 'layout--toolbar-move'.
     */
    nixps.patchplanner.tool_position_selection = function ()
    {
        this.m_edition_pane = null;
    };


    /**
     * @brief Sets up the view.
     * @warn Override if necessary.
     * @param p_$parent jQuery UI object that will contain the button
     */
    nixps.patchplanner.tool_position_selection.prototype = {

        setup_view: function (p_$parent)
        {
            var l_$left_icon = $("<div class='ui-icon ui-icon-arrowthickstop-1-e' width='20px'></div>");
            this.m_$left_label = $("<input class='labelleft' />");
            var l_$top_icon = $("<div class='ui-icon ui-icon-arrowthickstop-1-s' width='20px'></div>");
            this.m_$top_label = $("<input class='labeltop' />");
            p_$parent.append(l_$left_icon);
            p_$parent.append(this.m_$left_label);
            p_$parent.append(l_$top_icon);
            p_$parent.append(this.m_$top_label);
        },


        /**
         * @brief Sets up the tool.
         * @warn This method calls setup_tool_button and enable_handlers
         * @param p_$parent jQuery UI object that will contain the button
         */
        setup_ui: function (p_$parent, p_edition_pane)
        {
            this.m_edition_pane = p_edition_pane;
            this.setup_view(p_$parent);
            this.enable_handlers();
        },


        /**
         * @brief updates the view tool ui according to the selected labels
         * @param p_label_selection the labels that are selected
         */
        update_ui: function(p_label_selection)
        {
            if (p_label_selection.length === 0)
            {
                this.m_$left_label.val('');
                this.m_$top_label.val('');
                this.m_$left_label.attr('disabled','disabled');
                this.m_$top_label.attr('disabled','disabled');
            }
            else
            {
                var l_top_label = panzer.get_top_most(p_label_selection);
                var l_top_pos = l_top_label.get_position();
                var l_top_unit = panzer.units.get_current().from_pt(l_top_pos.top);
                var l_left_label = panzer.get_left_most(p_label_selection);
                var l_left_pos = l_left_label.get_position();
                var l_left_unit = panzer.units.get_current().from_pt(l_left_pos.left);
            
                this.m_$left_label.val(panzer.units.get_current().format_value(l_left_unit));
                this.m_$top_label.val(panzer.units.get_current().format_value(l_top_unit));
                this.m_$left_label.removeAttr('disabled');
                this.m_$top_label.removeAttr('disabled');
            }
        },


        /**
         * @brief handles the changes of one of the input boxes
         */
        onchange_handler: function()
        {
            var l_new_left = parseFloat($('#layout .labelleft').val());
            if (isNaN(l_new_left))
            {
                return false;
            }

            var l_new_top = parseFloat($('#layout .labeltop').val());
            if (isNaN(l_new_top))
            {
                return false;
            }

            var l_new_left_pt = panzer.units.get_current().to_pt(l_new_left);
            var l_new_top_pt = panzer.units.get_current().to_pt(l_new_top);
            
            var l_selected_labels = panzer_layout_edition_sheet.get_selection();
            var l_leftmost_label = panzer.get_left_most(l_selected_labels);
            var l_topmost_label = panzer.get_top_most(l_selected_labels);

            var l_diff_left_pt = l_new_left_pt - l_leftmost_label.get_position().left;
            var l_diff_top_pt = l_new_top_pt - l_topmost_label.get_position().top;

            // TODO: group movement -> check group constraints
            // Apply the position offset to all labels
            _.each(l_selected_labels, function(p_label)
            {
                var l_position = p_label.get_position();
                p_label.set_position(l_position.left + l_diff_left_pt, l_position.top + l_diff_top_pt);
            });
        },


        /**
         * @brief Sets up the event handlers
         */
        enable_handlers: function ()
        {
            var l_this = this;

            $('#layout').on('selectionchanged.layout_edition_sheet', function (p_event, p_selection)
            {
                l_this.update_ui(p_selection);
            });

            $('#layout').on('layoutchanged', function(p_events, p_layout)
            {
                l_this.update_ui(panzer_layout_edition_sheet.get_selection());
            });

            $('#layout .labelleft').bind('keyup', function()
            {
                l_this.onchange_handler();
            });
            
            $('#layout .labeltop').bind('keyup', function()
            {
                l_this.onchange_handler();
            });
        }

    };

}());

