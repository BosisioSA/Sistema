/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en*/


// Concrete subclass of panzer.application for Oki LMS.
//
panzer.portal.application = function ()
{
	// nothing to do
};

panzer.portal.application.prototype = new panzer.application();


// Loads a layout asset.
// Parameters:
//   - p_asset_id   : the id of the asset
//   - p_callback() : function called when the asset has been loaded
//
panzer.portal.application.prototype.load_asset = function (p_id, p_callback)
{
	var l_this = this;
	
	l_this.m_asset_id = p_id;
	
	api_async.assets.get(
		p_id,
		function (p_data)
		{
		    l_this.m_asset_url = p_data.url;
		    l_this.m_asset_sub = p_data.sub;
            l_this.get_job_info_panel().set_selected_job_id(p_id);

		    panzer.get_jobinfo_cgi().open_job_layout(
		        p_id,
		        function ()
		        {
		            l_this.get_job_info_panel().set_selected_job_id(p_data._id);
		            
		            if (p_callback)
		            {
		                p_callback();
		            }
		        });
		});
};


// Is called to change the window title (or some other indication in the UI)
// Parameters:
//   - p_job_name     : the name of the current job
//   - p_media_name   : the name of the media
//   - p_width_string : an optional string indiciating the media width
//
panzer.portal.application.prototype.set_window_title = function (p_job_name, p_media_name, p_width_string)
{
	var l_title = 'Cloudflow - ' + p_job_name;

	document.title = l_title;
};


// Is called to set up the various model helpers.
//
panzer.portal.application.prototype.setup_helpers = function ()
{
	// nothing to do
};


// Is called to set up the various ui components.
//
// Parameters:
//   - p_$component : jQuery div component for the complete user interface
//
panzer.portal.application.prototype.setup_ui = function (p_$component)
{
	// nothing to do
};


// This method is called when the application is about to start.
// At this point, preferences have been loaded.
// It is called from the run method.
// The method should call the setup_complete method when the post_setup method is ready (likely in some async block).
//
panzer.portal.application.prototype.post_setup = function ()
{
	var l_this = this;
	
	l_this.setup_complete();
};


// Creates extra binding to the layout.
//
// Parameters:
//   - p_$component : jQuery div component for the complete user interface
//
// TODO: SOME PARTS THIS SHOULD BE MOVED OT THE INDIVIDUAL COMPONENTS!
panzer.application.prototype.enable_handlers = function (p_$component)
{
	var l_this = this;

	$('#layout').bind('openjob', function (p_event, p_jobname, p_medianame)
	{
		l_this.set_window_title(p_jobname, p_medianame);
	});
};
