/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, document*/


/**
 * This file contains the application entry point
 **/

/**
 * Entrypoint
 */
function init_panzer_pane()
{
	$('body').append('<div id="layout" class="portal">');
	
	var l_app = new panzer.portal.application();
	l_app.set_api(new panzer.portal.api());
	
	l_app.add_component_to_edition_pane(new panzer.edition_toolbar([
		new panzer.tool_group([ new panzer.tool_button_group([ new panzer.move_tool(), new panzer.zoom_tool() ]), new panzer.zoom_level_tool() ]),
		new panzer.tool_group([ new panzer.tool_button_group([ new panzer.delete_tool() ]), new panzer.position_view_tool() ]),
		new panzer.tool_group([ new panzer.snap_to_grid_tool() ]),
		new panzer.tool_group([ new panzer.copies_tool() ]),
		new panzer.tool_group([ new panzer.portal.setup_margins_button(), new panzer.portal.place_button() ]),
		new panzer.tool_group([ new panzer.portal.workflow_continue_button() ], true)
	]));

	l_app.add_component_to_edition_pane(new panzer.pan_tool());
    l_app.add_component_to_side_bar(new panzer.portal.info_panel());
    l_app.add_component_to_side_bar(new panzer.okilms.order_count());
	
	l_app.add_component_to_side_bar(new panzer.portal.filelist_toolbar());
    l_app.add_component_to_side_bar(new panzer.portal.add_order_dialog());

	l_app.run();
};
