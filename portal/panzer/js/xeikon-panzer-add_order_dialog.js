/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, api_async, setTimeout*/

/*global panzer_layout_edition_sheet*/


panzer.xeikon.add_order_dialog = function ()
{
	this.m_upload_dialog = null;
};


panzer.xeikon.add_order_dialog.prototype.setup_ui = function (p_filelist)
{
	var l_this = this;

	l_this.m_filelist = p_filelist;
	p_filelist.set_add_order_dialog(this);

	l_this.enable_handlers();
};


panzer.xeikon.add_order_dialog.prototype.enable_handlers = function()
{
	var l_this = this;
};


panzer.xeikon.add_order_dialog.prototype.open_asset = function (p_filename, p_asset)
{
	var l_file_extension = p_filename.split('.').pop();
	var l_accepted_extension = (l_file_extension === 'pdf') || (l_file_extension === 'ai');
	var l_dialog;

	if (((p_asset.filetype !== undefined) && (p_asset.filetype !== 'application/unknown') && (p_asset.filetype !== 'application/pdf')) || !l_accepted_extension)
	{
		this.m_upload_dialog.hide();
		this.m_upload_dialog.destroy();
		this.m_upload_dialog = null;
		l_dialog = new panzer.xeikon.error_dialog(p_filename);

		l_dialog.show(function()              
		{
		    l_dialog.destroy();
		});

		return;
	}

	if ((p_asset.thumb === undefined) || (p_asset.boxes === undefined))
	{
		var l_this = this;

		setTimeout(function()
		{
		    api_async.assets.get_with_url(
		        p_filename, '',
		        function (p_asset_2)
		        {
		            l_this.open_asset(p_filename, p_asset_2);
		        },
		        function() 
		        {
		            l_this.open_asset(p_filename, {});
		        });
		}, 250);
	}
	else
	{
		this.m_upload_dialog.hide();
		this.m_upload_dialog.destroy();
		this.m_upload_dialog = null;

		var l_parsed_file = {};
		l_parsed_file.url = p_asset.url;
		l_parsed_file.thumb = p_asset.thumb;
		l_parsed_file.name = panzer.get_filename(p_asset.url);
		l_parsed_file.path = panzer.get_path(p_asset.url);
		l_parsed_file.id = p_asset._id;
		l_parsed_file.rotation = 0;
		l_parsed_file.flipx = false;
		l_parsed_file.flipy = false;

		l_parsed_file.pages = [ { boxes: p_asset.boxes, inks: p_asset.inks } ];
		// Add the width and height in the file data
		var l_cropbox = l_parsed_file.pages[0].boxes.cropbox;
		var l_mediabox = l_parsed_file.pages[0].boxes.mediabox;
		var l_bleedbox = l_parsed_file.pages[0].boxes.bleedbox;
		var l_croprect = panzer.rect_from_points(l_cropbox[0], l_cropbox[1], l_cropbox[2], l_cropbox[3]);
		var l_mediarect = panzer.rect_from_points(l_mediabox[0], l_mediabox[1], l_mediabox[2], l_mediabox[3]);
		var l_bleedrect = panzer.rect_from_points(l_bleedbox[0], l_bleedbox[1], l_bleedbox[2], l_bleedbox[4]);
		var l_clipped_cropbox = panzer.clip_rect(l_croprect, l_mediarect);
		var l_clipped_bleedbox = panzer.clip_rect(l_bleedrect, l_mediarect);

		l_parsed_file.width = l_clipped_cropbox.width;
		l_parsed_file.height = l_clipped_cropbox.height;
		
		l_dialog = new panzer.xeikon.cropping_dialog(l_parsed_file);

		l_dialog.show(function (p_fileinfo) 
		{
		    var l_order = { file: p_fileinfo, copies: 1 };
		    $('#layout').trigger('orderadded', [ l_order ]);
		    $('#layout').trigger('needlayoutcalculate');
		    l_dialog.destroy();

		    // Position the "order" on the top left of the layout
		    var l_cliprect = { left: l_order.file.clipLeft, top: l_order.file.clipTop, width: l_order.file.clipWidth, height: l_order.file.clipHeight };
            
            var l_label = new panzer.edition_label({
		        fileid: l_order.file.url,
		        thumb: l_order.file.thumb,
		        width: l_cliprect.width,
		        height: l_cliprect.height,
		        left: 0,
		        top: 0,
		        rotation: l_order.file.rotation,
		        cliprect: l_cliprect,
		        edition_sheet: panzer_layout_edition_sheet
            });
            
            panzer_layout_edition_sheet.add_label(l_label);

		    $('#layout').trigger('layoutchanged', panzer_layout_edition_sheet.generate_layout());
		});
	}
};


panzer.xeikon.add_order_dialog.prototype.show = function ()
{
	var l_this = this;

	if (l_this.m_upload_dialog)
	{
		l_this.m_upload_dialog.destroy();
	}

	l_this.m_upload_dialog = new panzer.xeikon.upload_dialog();
	l_this.m_upload_dialog.setup_ui();

	l_this.m_upload_dialog.show(
		function ()
		{
		    l_this.m_upload_dialog.destroy();
		},
		function (p_upload_path)
		{
		    l_this.open_asset(p_upload_path, {});      
		});
};


panzer.xeikon.add_order_dialog.prototype.hide = function ()
{
};
