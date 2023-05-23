/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, api_async*/


panzer.xeikon.filelist_toolbar = function ()
{
	// nothing to do
};


panzer.xeikon.filelist_toolbar.prototype.setup_ui = function (p_filelist)
{
	$('#layout .sidebar').prepend("<div class='filelisttoolbar'>");
	
	var l_$toolbar = $('#layout .filelisttoolbar');
	l_$toolbar.append("<a href='#' id='layout--addfilebutton' action='addfile' class='xeikon_button buttoncontent'>upload</a>");
	l_$toolbar.append("<a href='#' id='layout--removefilebutton' action='removefile' class='xeikon_button buttoncontent'>remove</a>");

	this.enable_handlers();
};


panzer.xeikon.filelist_toolbar.prototype.enable_handlers = function ()
{
	$('#layout .filelisttoolbar a').live('click', function ()
	{
		var l_$this = $(this);
		$('#layout').trigger('buttonclicked', [ l_$this.attr('action') ]);
	});

    $('#layout').bind('openjob', function (p_event, p_layout_name, p_title, p_jobdata, p_jobid)
    {
        api_async.assets.get(p_jobid, function (p_asset)
        {
            $('#layout .filelisttoolbar').attr('panzer_location', panzer.get_path(p_asset.url));
        });
    });
};
