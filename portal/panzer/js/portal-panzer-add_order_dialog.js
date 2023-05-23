/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, api_async, setTimeout, chooser*/

/*global panzer_layout_edition_sheet*/


panzer.portal.add_order_dialog = function ()
{
    this.m_chooser = null;
};


panzer.portal.add_order_dialog.prototype.setup_ui = function (p_filelist)
{
	var l_this = this;

    var l_$chooser_div = $('<div class="chooser" style="position:absolute; top:0px; left:0px; bottom:0px; right:0px; display:none; z-index:10000">');
    $('#layout').append(l_$chooser_div);
    l_this.m_chooser = chooser.setup_ui(
        l_$chooser_div,
        {
            callback: function (p_files) { l_this.open_asset(p_files[0]); },
            allowed_file_types: ["application/pdf"]
        });
	l_this.m_filelist = p_filelist;
	p_filelist.set_add_order_dialog(this);

	l_this.enable_handlers();
};


panzer.portal.add_order_dialog.prototype.enable_handlers = function()
{
	var l_this = this;
};


panzer.portal.add_order_dialog.prototype.open_asset = function (p_file)
{
    $("#layout .chooser").hide();
    api_async.assets.get_with_url(
        p_file.url + '/' + p_file.name, '',
        function (p_asset)
        {
    var l_parsed_file = {};
    l_parsed_file.url = p_asset.url;
    l_parsed_file.thumb = p_asset.thumb;
    l_parsed_file.name = panzer.get_filename(p_asset.url);
    l_parsed_file.path = panzer.get_path(p_asset.url);
    l_parsed_file.id = p_asset._id;
    l_parsed_file.rotation = 0;
    l_parsed_file.flipx = false;
    l_parsed_file.flipy = false;

    var metadata_boxes = p_asset.metadata.page_boxes;
    var printplanner_boxes = {
        cropbox: [ 
            metadata_boxes.crop.origin.x, 
            metadata_boxes.crop.origin.y,
            metadata_boxes.crop.origin.x + metadata_boxes.crop.size.width, 
            metadata_boxes.crop.origin.y + metadata_boxes.crop.size.height
        ],
        bleedbox: [ 
            metadata_boxes.bleed.origin.x, 
            metadata_boxes.bleed.origin.y,
            metadata_boxes.bleed.origin.x + metadata_boxes.bleed.size.width, 
            metadata_boxes.bleed.origin.y + metadata_boxes.bleed.size.height
        ],
        mediabox: [ 
            metadata_boxes.media.origin.x, 
            metadata_boxes.media.origin.y,
            metadata_boxes.media.origin.x + metadata_boxes.media.size.width, 
            metadata_boxes.media.origin.y + metadata_boxes.media.size.height
        ]
    };

    var metadata_inks = p_asset.metadata.output_color_space.colorants;
    var printplanner_inks = [];
    for(var i = 0; i < metadata_inks.length; i++) {
        printplanner_inks.push = {
            Name: metadata_inks[i].name,
            CMYK: 0
        };
    }


    l_parsed_file.pages = [ { 
        boxes: printplanner_boxes, 
        inks: printplanner_inks 
    } ];

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
    l_parsed_file.clipWidth = l_clipped_cropbox.width;
    l_parsed_file.clipHeight = l_clipped_cropbox.height;
    l_parsed_file.clipTop = 0;
    l_parsed_file.clipLeft = 0;
		
    var l_order = { file: l_parsed_file, copies: 1 };
    $('#layout').trigger('orderadded', [ l_order ]);
    $('#layout').trigger('needlayoutcalculate');

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
};


panzer.portal.add_order_dialog.prototype.show = function ()
{
	var l_this = this;
    
    l_this.m_chooser.select_files([]);
    $("#layout .chooser").show();
/*
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
		});*/
};


panzer.portal.add_order_dialog.prototype.hide = function ()
{
};
