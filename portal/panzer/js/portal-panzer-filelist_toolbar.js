/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/


panzer.portal.filelist_toolbar = function ()
{
    // nothing to do
};


panzer.portal.filelist_toolbar.prototype.setup_ui = function (p_filelist)
{
	$('#layout .sidebar').prepend("<div class='filelisttoolbar'>");

	var l_$toolbar = $('#layout .filelisttoolbar');
	l_$toolbar.append($("<button class='addfilebutton' action='addfile'>"));
	l_$toolbar.append($("<button class='removefilebutton' action='removefile'>"));

	$('#layout .addfilebutton').button({ text: false, icons: { primary: 'ui-icon-plus' } });
	$('#layout .removefilebutton').button({ text: false, icons: { primary: 'ui-icon-minus' } });
    this.enable_handlers();
};


panzer.portal.filelist_toolbar.prototype.enable_handlers = function ()
{
	$('#layout .filelisttoolbar button').live('click', function ()
    {
		var l_$this = $(this);
		$('#layout').trigger('buttonclicked', [ l_$this.attr('action') ]);
	});
};
