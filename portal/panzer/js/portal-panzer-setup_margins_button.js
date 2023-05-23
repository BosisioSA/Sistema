/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/


// Groups tool buttons.
//
// Parameters:
//   - p_tools : The tools (array).
//
panzer.portal.setup_margins_button = function (p_options)
{
	this.m_options = p_options;
};


// Sets up the button.
//
// Parameters:
//   - p_$parent : jQuery UI object that will contain the group
//
panzer.portal.setup_margins_button.prototype.setup_ui = function (p_$parent, p_edition_pane)
{
    var l_this = this;
	var l_link = $("<button>setup margins</button>");
	l_link.button({ text: true });
	l_link.css({
		'padding-top': '0'
	});

	p_$parent.append(l_link);
	
	l_link.bind('click', function(p_event) {
		// Retrieve settings
		var jobid = panzer.get_application().get_job_info_panel().get_selected_job_id();
		var datablob = api.panzer.jobinfo.getdatablob(jobid);

		var dialog = $('<div>').margins_dialog({
			sheetMaxHeight: parseFloat(datablob.sheet_max_height),
			sheetMinHeight: parseFloat(datablob.sheet_min_height),
			sheetWidth: parseFloat(datablob.media_size),
			horizontalMargin: parseFloat(datablob.horizontal_margin),
			verticalMargin: parseFloat(datablob.vertical_margin)
		});
		dialog.margins_dialog('open');
		dialog.on('margins_dialogclose', function() {
			var options = $(this).margins_dialog('option');
			var jobid = panzer.get_application().get_job_info_panel().get_selected_job_id();

			var datablob = api.panzer.jobinfo.getdatablob(jobid);
			datablob.media_size = options.sheetWidth.toString();
			datablob.sheet_max_height = options.sheetMaxHeight.toString();
			datablob.sheet_min_height = options.sheetMinHeight.toString();
			datablob.horizontal_margin = options.horizontalMargin.toString();
			datablob.vertical_margin = options.verticalMargin.toString();

			api.panzer.jobinfo.setdatablob(jobid, datablob);

			panzer.get_jobinfo_cgi().get_job(jobid, function(p_job) {
				api_async.panzer.media.get(
					"1",
					datablob.media_size.toString(),
					function(p_media_record) {
			            $('#layout').trigger('currentmediachanged', [p_job, p_media_record]);
					}
				);
			});
		});
	});
};
