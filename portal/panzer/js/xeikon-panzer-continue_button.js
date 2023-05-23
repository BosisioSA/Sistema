/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/


// Groups tool buttons.
//
// Parameters:
//   - p_tools : The tools (array).
//
panzer.xeikon.continue_button = function ()
{
	// nothing to do
};


// Sets up the button.
//
// Parameters:
//   - p_$parent : jQuery UI object that will contain the group
//
panzer.xeikon.continue_button.prototype.setup_ui = function (p_$parent, p_edition_pane)
{
	var l_link = $("<a class='xeikon_button buttoncontent'>continue</a>");

	p_$parent.append(l_link);
	
	l_link.bind('click', function(p_event) {
		
		var l_workable_id = $.cookie('workable', {path: '/'});	
		var l_quantum_id = $.cookie('whitepaper', {path: '/'});	
		
		api_sync.whitepaper.continue_ui(l_workable_id,l_quantum_id);
		var url='/portal.cgi?quantum='+l_quantum_id+'&workable='+l_workable_id;
		window.location.href = url;
	});
};
