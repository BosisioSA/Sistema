/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/


// Groups tool buttons.
//
// Parameters:
//   - p_tools : The tools (array).
//
panzer.portal.workflow_continue_button = function (p_options)
{
	this.m_options = p_options;
};


// Sets up the button.
//
// Parameters:
//   - p_$parent : jQuery UI object that will contain the group
//
panzer.portal.workflow_continue_button.prototype.setup_ui = function (p_$parent, p_edition_pane)
{
    var l_this = this;
	var l_link = $("<button>export</button>");
	l_link.button({ text: true });
	l_link.css({
		'padding-top': '0',
		'float': 'right'
	});

	p_$parent.append(l_link);
	
	l_link.bind('click', function(p_event) {
		api_sync.file.create_folder("cloudflow://PP_FILE_STORE/", 'Output/');

		var jobid = panzer.get_application().get_job_info_panel().get_selected_job_id();
		var jobname = api.panzer.jobinfo.get(jobid).jobname;
		api.panzer.exportpdf(jobid, "PP_FILE_STORE/Output/" + jobname + ".pdf");

		var dialog = $('<div>PDF Exported to: ' + '/Output/' + jobname + '.pdf</div>').appendTo($('body'));
		dialog.dialog({
			'title': 'Export finished',
			'resizable': false,
			'width': 500,
			'autoOpen': true,
			'modal': true,
			'buttons': [
				{
					text: "Ok", 
					click: function() { 
						$(this).dialog("close"); 
					}
				}
			]
		});
	});
};
