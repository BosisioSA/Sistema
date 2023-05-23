/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, document, lang_en*/


/**
 * This file contains the application entry point
 **/

/**
 * Entrypoint
 */
function init_xeikon_panzer_pane(p_options)
{
	$('body').append('<div id="layout" class="xeikon">');
	
	lang_en['edittoolbar.snapgrid'] = 'snap to grid';
	
	var l_app = new panzer.portal.application();
	l_app.set_api(new panzer.portal.api());
	
	l_app.add_component_to_edition_pane(new panzer.edition_toolbar([
		new panzer.tool_group([ new panzer.tool_button_group([ new panzer.move_tool(), new panzer.zoom_tool() ]), new panzer.zoom_level_tool() ]),
		new panzer.tool_group([ new panzer.tool_button_group([ new panzer.delete_tool() ]) ]),
		new panzer.tool_group([ new panzer.snap_to_grid_tool() ]),
		new panzer.tool_group([ new panzer.xeikon.continue_button(p_options) ], true)
	]));

	l_app.add_component_to_edition_pane(new panzer.pan_tool());
	
	l_app.add_component_to_side_bar(new panzer.xeikon.filelist_toolbar());
	l_app.add_component_to_side_bar(new panzer.xeikon.add_order_dialog());

    l_app.run();
}
