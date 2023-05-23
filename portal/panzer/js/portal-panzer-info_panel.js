/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, window*/

/*global panzer_layout_edition_sheet*/
/*global panzer_filelist*/

panzer.portal.info_panel = function ()
{
	this.m_order =  null;
	this.m_selected_icon = null;
	this.m_scrollbar_width = 15;
    this.m_filelist = null;
};


panzer.portal.info_panel.prototype.setup_ui = function (p_filelist)
{
    var l_this = this;
    
    p_filelist.add_element_decorator(function (p_$element)
    {
        p_$element.find('.content').append("<div class='infoiconholder'>"
                                           +    "<div class='infoicon ui-icon ui-icon-info'></div>"
                                           + "</div>");

    });
    
    $.get('/portal/panzer/infopanel.html', function (p_html)
    {
        $('#layout .layoutcontent').append(p_html);
        l_this.hide();
        $('#layout .layoutcontent').append("<div class='infopanelflap'>");
        $('#layout .rotationbuttons').buttonset();
        l_this.enable_handlers();
    }, 'text');
};

panzer.portal.info_panel.prototype.update_ui = function (p_order)
{
    var l_this = this;
    
    l_this.m_order = p_order;

    var l_$file_info = $('#layout .fileinfo');
    var l_$sidebar = $('#layout .sidebar');

    var l_creation_date = 0;
    var l_modification_date = 0;

    var l_box_width = 0;
    var l_box_height = 0;

    $('#layout .fileinfo .title').html(p_order.file.name);
    $('#layout .fileinfo .filename').html(p_order.file.name);
    $('#layout .fileinfo .filepath').html(p_order.file.path);
    $('#layout .fileinfo .jobcopies').val(p_order.copies);
    var l_cropbox = p_order.file.pages[0].boxes.cropbox;
    var l_mediabox = p_order.file.pages[0].boxes.mediabox;
    var l_clipped = panzer.clip_rect(panzer.rect_from_points(l_cropbox[0], l_cropbox[1], l_cropbox[2], l_cropbox[3]),
                                     panzer.rect_from_points(l_mediabox[0], l_mediabox[1], l_mediabox[2], l_mediabox[3]));
    var l_pt_width = l_clipped.width;
    var l_pt_height = l_clipped.height;
    var l_unit = panzer.units.get_current();
    $('#layout .fileinfo .width').html(l_unit.format_string(l_unit.from_pt(l_pt_width)));
    $('#layout .fileinfo .height').html(l_unit.format_string(l_unit.from_pt(l_pt_height)));

    var l_$ink_div = $('#layout .inks');
    var l_inks = p_order.file.pages[0].inks;
    var l_ink_data = [];

    var l_ink_index;
    for(l_ink_index = 0; l_ink_index < l_inks.length; l_ink_index += 1)
    {
        l_ink_data.push({ Name: l_inks[l_ink_index].Name, CMYK: l_inks[l_ink_index].CMYK });
    }

    $.template("inkentry",
               "<div class='infopair'>"
               + "<label>"
               +   "<div class='swatch'></div>"
               + "</label>"
               + "<div class='infotext'>${Name}</div>"
               + "</div>");

    l_$ink_div.empty();

    $.each(l_ink_data, function(p_ink_index, p_ink)
    {
        var l_$entry = $.tmpl("inkentry", p_ink);
        l_$entry.find('.swatch').css('background-color', panzer.cmyk_to_web_rgb(p_ink.CMYK));
        l_$ink_div.append(l_$entry);
    });

    var l_$filelist = $('#layout .filelist');
    var l_offset = 0;

    if (l_$filelist[0].clientHeight < l_$filelist[0].scrollHeight)
    {
        l_offset = l_this.m_scrollbar_width;
    }

        var l_layout = panzer_layout_edition_sheet.generate_layout();

        var l_label_count = 0;

        $.each(l_layout.sheets[0].contents, function(p_element_index, p_element)
        {
            if (p_element.url === p_order.file.url)
            {
                l_label_count += 1;
            }
        });

        var l_layout_copies = l_layout.sheets[0].copies;
        var l_black_toner_surface = 0.0;  // the total surface the black toner will cover
        var l_color_toner_surface = 0.0; // the total surface the color toner will cover
        var l_surface = panzer.units.inch.from_pt(p_order.file.width) * panzer.units.inch.from_pt(p_order.file.height);

        $.each(p_order.file.pages[0].inks, function(p_ink_index, p_ink)
        {
            if (p_ink.Name === 'Black')
            {
                l_black_toner_surface += p_ink.density * l_surface;
            }
            else
            {
                l_color_toner_surface += p_ink.density * l_surface;
            }
        });


    l_$file_info.css({ left: l_$sidebar.position().left + l_$sidebar.width() - l_offset, top: 0 });
    l_$file_info.show();
};


panzer.portal.info_panel.prototype.enable_handlers = function ()
{
    var l_this = this;
    
    $('#layout').bind('fileinfoclicked', function(p_event, p_$selected)
    {
        if (l_this.m_order !== null)
        {
            $('#layout .infopanelflap').trigger('click');
        }

        var l_order = p_$selected.data('order');
        l_this.update_ui(l_order);

        var l_$info_icon = p_$selected.find('.infoicon');
        l_this.m_selected_icon = l_$info_icon;

        var l_$file_info = $('#layout .fileinfo');
        var l_$file_list = $('#layout .filelist');
        var l_$info_panel_flap = $('#layout .infopanelflap');
        l_$info_panel_flap.css({
            'left': l_$file_info.position().left - l_$info_panel_flap.width(), 
            'top':  l_$file_list.position().top + l_$info_icon.position().top - ((l_$info_panel_flap.height() - l_$info_icon.height()) / 2.0)
        });

        l_$info_panel_flap.show();

        var l_$title = l_$file_info.find('.title');
        $('#layout .fileinfo .content').css('height', l_$file_info.innerHeight() - l_$title.outerHeight(true));

        // TODO: can this be done better?
        var l_$rotation_buttons = $('#layout .rotationbuttons input');
        l_$rotation_buttons.removeAttr('checked');
        $("#layout .rotationbuttons input[value='" + l_order.file.rotation + "']").attr('checked','checked');
        $('#layout .rotationbuttons input').button('refresh');

        var l_$flip_x_checkbox = $('#layout .fileinfo .flipx').removeAttr('checked');

        if ((l_order.file.flipx !== undefined) && (l_order.file.flipx))
        {
            l_$flip_x_checkbox.attr('checked', 'checked');
        }

        var l_$flip_y_checkbox = $('#layout .fileinfo .flipy').removeAttr('checked');

        if ((l_order.file.flipy !== undefined) && (l_order.file.flipy))
        {
            l_$flip_y_checkbox.attr('checked', 'checked');
        }

        l_this.show();
    });

    $('#layout .filelist').scroll(function ()
    {			
        var l_$file_info = $('#layout .fileinfo');
        var l_$info_icon = l_this.m_selected_icon;
        var l_$info_panel_flap = $('#layout .infopanelflap');

        l_$info_panel_flap.css({
            'left': l_$file_info.position().left - l_$info_panel_flap.width(), 
            'top':  $('#layout .filelist').position().top + l_$info_icon.position().top - ((l_$info_panel_flap.height() - l_$info_icon.height()) / 2.0)
        });
    });

    $('#layout .infopanelflap').live('click', function (p_event)
    {
        l_this.m_order.copies = parseInt($('#layout .fileinfo .jobcopies').val(), 10); 
        l_this.m_order.file.rotation = parseInt($('#layout .rotationbuttons input[name=rotation]:checked').val(), 10);
        l_this.m_order.file.flipx = $('#layout .fileinfo .flipx').attr('checked') === 'checked';
        l_this.m_order.file.flipy = $('#layout .fileinfo .flipy').attr('checked') === 'checked';
        l_this.hide();

        $('#layout .filelist .element').each(function (p_index, p_element)
        {            
            var l_$orderinfo = $(p_element).find('.orderinfo');
            l_$orderinfo.show();
            l_$orderinfo.css('right', 15);
            l_$orderinfo.css('top', - 3);
            var l_order = $(p_element).data('order');
            l_$orderinfo.text(l_order.copies);
        });

        panzer_layout_edition_sheet.m_labels.forEach(function (p_label)
        {
            var l_file = panzer_filelist.get_file_with_url(p_label.m_options.fileid);
            p_label.set_rotation(l_file.rotation);
            p_label.set_flip(l_file.flipx, l_file.flipy);
            p_label.draw();
        });

        // TODO: please, make a more specific event, like ordercopieschanged + element id
        $('#layout').trigger('layoutchanged', panzer_layout_edition_sheet.generate_layout());
        $('#layout').trigger('needlayoutcalculate');

        l_this.m_order = null;
    });

    $(window).bind('resize', function()
    {
        var l_$file_info =  $('#layout .fileinfo');

        if (! l_$file_info.is(':visible')) 
        {
            return;
        }

        var l_$file_list = $('#layout .filelist');
        var l_offset = 0;

        if (l_$file_list[0].clientHeight < l_$file_list[0].scrollHeight)
        {
            l_offset = l_this.m_scrollbar_width;
        }

        var l_$sidebar = $('#layout .sidebar');
        
        l_$file_info.css({
            left: l_$sidebar.position().left + l_$sidebar.width() - l_offset,
            top: 0
        });

        var l_$info_panel_flap = $('#layout .infopanelflap');
        var l_$info_icon = l_this.m_selected_icon;
        
        l_$info_panel_flap.css({
            'left': l_$file_info.position().left - l_$info_panel_flap.width(), 
            'top':  l_$file_list.position().top + l_$info_icon.position().top - ((l_$info_panel_flap.height() - l_$info_icon.height()) / 2.0)
        });

        var l_$title = l_$file_info.find('.title');
        $('#layout .fileinfo .content').css('height', l_$file_info.innerHeight() - l_$title.outerHeight(true));
    });

    // Add the click event on each info icon
    $('#layout .filelist .element .infoicon').live('click', function (p_event)
    {
        var l_$element = $(this).parents('.element');
        $('#layout').trigger('fileinfoclicked', [ l_$element ]);
        $('#layout .filelist .element').removeClass('selected');
        l_$element.addClass('selected');
    });
};


panzer.portal.info_panel.prototype.show = function ()
{
    $('#layout .fileinfo').show();
    $('#layout .infopanelflap').show();
};


panzer.portal.info_panel.prototype.hide = function ()
{
    $('#layout .fileinfo').hide();
    $('#layout .infopanelflap').hide();
};
