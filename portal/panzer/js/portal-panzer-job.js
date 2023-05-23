/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, api_async*/


panzer.portal.job = function ()
{
    this.m_record = null;
};


panzer.portal.job.prototype.create_with_url = function (p_folder, p_name, p_media_width)
{
    if (! p_media_width)
    {
        p_media_width = 538;
    }

    var l_current_time = new Date();
    this.m_record = {
        "cloudflow": {
            "file": "cloudflow://PP_FILE_STORE/" + p_folder + "/" + p_name,
            "enclosing_folder": "cloudflow://PP_FILE_STORE/" + p_folder,
            "part": "cloudflow://PP_FILE_STORE/" + p_folder + "/" + p_name
        },
        "jobname": p_name,
        "folder": p_folder,
        "id": "",
        "create_time": l_current_time.getTime(),
        "status": "layout",
        "layout_id": "",
        "order_number": "",
        "customer_name": "",
        "jobmedia": "1",
        "medianote": "",
        "orders": [],
        "media_size": p_media_width,
        "layout": { "sheets": [ { contents: [], copies: 1, height: 756, marks: [], width: p_media_width } ] }
    };
    this.m_media_width = p_media_width;
};


panzer.portal.job.prototype.save = function (p_success_callback, p_error_callback)
{
    var l_parameters = { "record": this.m_record };
    panzer.get_application().get_api().save_job_info(l_parameters, p_success_callback, p_error_callback);
};


panzer.portal.job.prototype.add_file_with_asset = function (p_asset)
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
    l_parsed_file.clipWidth = l_clipped_cropbox.width;
    l_parsed_file.clipHeight = l_clipped_cropbox.height;
    l_parsed_file.clipTop = 0;
    l_parsed_file.clipLeft = 0;

    var l_order = { file: l_parsed_file, copies: 1 };
    this.m_record.orders.push(l_order);
};


panzer.portal.job.prototype.add_file_with_url = function (p_order_url, p_success_callback, p_error_callback)
{
    var l_this = this;
    
    api_async.assets.get_with_url(
        p_order_url, '',
        function (p_asset)
        {
            l_this.add_file_with_asset(p_asset);
            p_success_callback();
        },
        function() 
        {
            if (p_error_callback)
            {
                p_error_callback();
            }
        });
};


panzer.portal.job.prototype.add_files_with_urls = function (p_order_urls, p_success_callback, p_error_callback)
{
    var l_this = this;
    
    if (p_order_urls.length === 0)
    {
        p_success_callback();
        return;
    }
    
    l_this.add_file_with_url(
        p_order_urls[0], 
        function ()
        {
            l_this.add_files_with_urls(p_order_urls.slice(1), p_success_callback, p_error_callback);
        },
        function ()
        {
            if (p_error_callback)
            {
                p_error_callback(p_order_urls[0]);
            }
        });
};


panzer.portal.job.prototype.get_file_with_url = function (p_url)
{
    var l_index;
    for (l_index = 0; l_index < this.m_record.orders.length; l_index += 1)
    {
        var l_order = this.m_record.orders[l_index];
        if (l_order.file.url === p_url)
        {
            return l_order.file;
        }
    }
    
    return null;
};


panzer.portal.job.prototype.update_layout = function (p_callback)
{
    var l_this = this;
    
    var l_job = {
        mediawidth: l_this.m_media_width,
        orders: l_this.m_record.orders,
        jobmedia: 1
    };
    
    var l_settings = {
        verticalspacing: 9.0,
		verticalexact: true,
		horizontalspacing: 9.0,
		horizontalexact: false,	
		fixedmediamargins: false,
		fixedleft: 0.0,
		fixedright: 0.0
	};

	var l_eyemarks = {
		reference: 'layout',
		topmark: false,
		topmarkpos: 'right',
		topx: 8.5,
		topy: 0.0,
		topw: 8.5,
		toph: 8.5,
		botmark: false,
		botmarkpos: 'left',
		botx: 8.5,
		boty: 0.0,
		botw: 8.5,
		both: 8.5,
        rowbased: false
	};

	var l_precut_settings = {
		precut_left_offset: null,
		precut_top_offset: null
	};

	var l_calculation_settings = {
		set_layout_height: false,
		set_height: 'max',
		layout_height_max: 756,
		layout_height_exact: 756
	};
    
    panzer.layout_job(
        l_job, l_settings, l_precut_settings, l_eyemarks, l_calculation_settings,
        function (p_result)
        {
            var l_success = ! $.isEmptyObject(p_result);
            
            if (l_success)
            {
                l_this.m_record.layout.sheets = p_result.sheets;
            }
            
            p_callback(l_success);
        });
};
