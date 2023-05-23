/*global panzer*/

// The panzer.portal namespace.
// This namespace contains classes and functions specific for Panzer in Portal
//
panzer.portal = {};


// p_options:
//   url: url of the layout (automatically created if it doesn not yet exist)

panzer.portal.setup_ui = function (p_$div, p_options)
{
    p_$div.append('<div id="layout" class="portal">');
	
	var l_app = new panzer.portal.application();
    panzer.set_application(l_app);
	l_app.set_api(new panzer.portal.api());
	
    var l_toolbar_items = [
		new panzer.tool_group([ new panzer.tool_button_group([ new panzer.move_tool(), new panzer.zoom_tool() ]), new panzer.zoom_level_tool() ]),
		new panzer.tool_group([ new panzer.tool_button_group([ new panzer.delete_tool() ]), new panzer.position_view_tool() ]),
		new panzer.tool_group([ new panzer.snap_to_grid_tool() ]),
		new panzer.tool_group([ new panzer.copies_tool() ])
    ];
    
    if (p_options.enable_label_placement)
        l_toolbar_items.push(new panzer.tool_group([ new panzer.portal.place_button() ]));
    
    l_toolbar_items.push(new panzer.tool_group([ new panzer.portal.workflow_continue_button(p_options) ], true));
	l_app.add_component_to_edition_pane(new panzer.edition_toolbar(l_toolbar_items));

	l_app.add_component_to_edition_pane(new panzer.pan_tool());
	
	l_app.add_component_to_side_bar(new panzer.portal.filelist_toolbar());
    l_app.add_component_to_side_bar(new panzer.portal.add_order_dialog());
    
    if (p_options.enable_label_placement)
    {
        l_app.add_component_to_side_bar(new panzer.portal.info_panel());
        l_app.add_component_to_side_bar(new panzer.okilms.order_count());
    }
    
    var l_url = p_options.url;

    api_async.assets.get_with_url(
        l_url, '', function (p_asset)
        {
            l_id = p_asset._id;
            panzer.get_application().load_asset(
                l_id,
                function ()
                {
                    panzer.get_jobinfo_cgi().open_job_layout(l_id);
                    $('#layout .panzer-pane').show();
                });
            l_app.run();
        },
        function ()
        {
            var l_job = new panzer.portal.job();
            l_job.create_with_url(l_url.substring(0, l_url.lastIndexOf('/')), panzer.get_filename(l_url));
            l_job.save(function ()
            {
                api_async.assets.get_with_url(
                    l_url, '', function (p_asset)
                    {
                        l_id = p_asset._id;
                        panzer.get_application().load_asset(
                            l_id,
                            function ()
                            {
                                panzer.get_jobinfo_cgi().open_job_layout(l_id);
                                $('#layout .panzer-pane').show();
                            });
                        l_app.run();
                    });
            });
        });
};
