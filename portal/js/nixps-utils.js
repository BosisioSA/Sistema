var nixps_utils =
{
	cmyk_to_web_rgb: function(i)
	{
	    var lC = (i & 0xFF000000) >> 24;
	    var lM = (i & 0x00FF0000) >> 16;
	    var lY = (i & 0x0000FF00) >> 8;
	    var lK = (i & 0x000000FF);
	    if (lC < 0)
	    {
	        lC += 256;
	    }
	    var lR = 255 - (lC + lK);
	    var lG = 255 - (lM + lK);
	    var lB = 255 - (lY + lK);
	    if (lR < 0)
	    {
	        lR = 0;
	    }
	    if (lG < 0)
	    {
	        lG = 0;
	    }
	    if (lB < 0)
	    {
	        lB = 0;
	    }
	    var lResult = (lR << 16) + (lG << 8) + lB;
	    var lString = lResult.toString(16);
	    while (lString.length < 6)
	    {
	        lString = "0" + lString;
	    }
	    return "#" + lString;
	},

	cmyk_array_to_web_rgb: function(a)
	{
	    var lC = Math.round(a[0] * 255);
	    var lM = Math.round(a[1] * 255);
	    var lY = Math.round(a[2] * 255);
	    var lK = Math.round(a[3] * 255);
	    if (lC < 0)
	    {
	        lC += 256;
	    }
	    var lR = 255 - (lC + lK);
	    var lG = 255 - (lM + lK);
	    var lB = 255 - (lY + lK);
	    if (lR < 0)
	    {
	        lR = 0;
	    }
	    if (lG < 0)
	    {
	        lG = 0;
	    }
	    if (lB < 0)
	    {
	        lB = 0;
	    }
	    var lResult = (lR << 16) + (lG << 8) + lB;
	    var lString = lResult.toString(16);
	    while (lString.length < 6)
	    {
	        lString = "0" + lString;
	    }
	    return "#" + lString;
	},

	rgb_array_to_web_rgb: function(a)
	{
	    var lR = Math.round(a[0] * 255);
	    var lG = Math.round(a[1] * 255);
	    var lB = Math.round(a[2] * 255);
	    var lResult = (lR << 16) + (lG << 8) + lB;
	    var lString = lResult.toString(16);
	    while (lString.length < 6)
	    {
	        lString = "0" + lString;
	    }
	    return "#" + lString;
	},

	round_number: function(num, dec)
	{
		return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
	},

	humanize_filesize: function(fs)
	{
		if (fs >= 1000000000) { return nixps_utils.round_number(fs / 1000000000, 2) + ' GB'; }
		if (fs >= 1000000)    { return nixps_utils.round_number(fs / 1000000, 2) + ' MB'; }
		if (fs >= 1000)       { return nixps_utils.round_number(fs / 1000, 0) + ' KB'; }
//		if (fs >= 1073741824) { return nixps_utils.round_number(fs / 1073741824, 2) + ' GB'; }
//		if (fs >= 1048576)    { return nixps_utils.round_number(fs / 1048576, 2) + ' MB'; }
//		if (fs >= 1024)       { return nixps_utils.round_number(fs / 1024, 0) + ' KB'; }
		return fs + ' B';
	},

	humanize_colorspacename: function(colorspace)
	{
		if (colorspace.substring(0,8) == "/DeviceN")
		{
			return "N-Channel";
		}
		if (colorspace.substring(0,7) == "/Device")
		{
			return colorspace.substring(7);
		}
		else if (colorspace.substring(0,1) == "/")
		{
			return colorspace.substring(1);
		}
		return colorspace;
	},

	humanize_filtername: function(filter)
	{
		if (filter == "/ASCIIHexDecode")
		{
			return "ASCII Hexadecimal";
		}
		else if (filter == "/ASCII85Decode")
		{
			return "ASCII Hexadecimal";
		}
		else if (filter == "/DCTDecode")
		{
			return "JPEG Baseline";
		}
		return filter;
	},

	get_filename: function(url)
	{
		if (url!=undefined)
			return url.substring(url.lastIndexOf('/') + 1);
		else
			return url;
	},

	get_path: function(url)
	{
		if (url!=undefined)
			return url.substring(0, url.lastIndexOf('/') + 1);
		else
			return url;
	},

	get_descriptive_filetype: function(p_mimetype)
	{
    	if (p_mimetype == "folder")
    	{
            return $.i18n._('nixps-cloudflow-assets.filetype-folder');
    	}
        else if (p_mimetype.indexOf("text/") === 0)
        {
            var type = p_mimetype.substring(5).toUpperCase();
            if (type.indexOf("PLAIN") != -1)
            {
	            return $.i18n._('nixps-cloudflow-assets.filetype-text_file');
            }
            return $.i18n._('nixps-cloudflow-assets.filetype-regular_file', [type]);
        }
    	else if (p_mimetype == "vnd.nixps-layout")
    	{
        	return "Cloudflow Layout";
    	}
        else if (p_mimetype.indexOf("application/") === 0 && p_mimetype != "application/unknown")
        {
            var type = p_mimetype.substring(12).toUpperCase();
            if (type.indexOf("ILLUSTRATOR") != -1)
            {
                type = "Adobe Illustrator";
            }
            return $.i18n._('nixps-cloudflow-assets.filetype-regular_file', [type]);
        }
        else if (p_mimetype.indexOf("image/") === 0)
        {
			var type = p_mimetype.substring(6).toUpperCase();
            return $.i18n._('nixps-cloudflow-assets.filetype-image', [type]);
        }
        else
        {
            return $.i18n._('nixps-cloudflow-assets.filetype-unknown');
        }
	}
}

///////////////////////////////////////////////////////////////////////////////////////
// THUMBNAIL CLASS
///////////////////////////////////////////////////////////////////////////////////////

var nixps_thumb =
{
	// Variables
	m_target_dimension: 150,
	m_lazy_loading: false,
	m_hide_missing_images: false,

	init: function(p_target_dimension, p_lazy_loading, p_hide_missing_images)
	{
		this.m_target_dimension = p_target_dimension;
		if (p_lazy_loading != undefined && p_lazy_loading == false)
		{
			m_lazy_loading = false;
		}
		else
		{
 			m_lazy_loading = true;
		}
		if (p_hide_missing_images != undefined && p_hide_missing_images == true)
		{
			m_hide_missing_images = true;
		}
		else
		{
			m_hide_missing_images = false;
		}
	},

	generate: function(p_target_url, p_img_url, p_caption, p_img_width, p_img_height)
	{
		if (p_img_width == undefined || p_img_height == undefined)
		{
			return nixps_thumb.generate_thumb_with_unknown_dimensions(p_target_url, undefined, p_img_url, p_caption);
		}
		else
		{
			return nixps_thumb.generate_thumb_with_known_dimensions(p_target_url, undefined, p_img_url, p_img_width, p_img_height, p_caption);
		}
	},

	generate_fn: function(p_target_path, p_target_fn, p_img_url, p_caption, p_img_width, p_img_height, p_fallbackurl)
	{
		if (p_img_width == undefined || p_img_height == undefined)
		{
			return nixps_thumb.generate_thumb_with_unknown_dimensions(p_target_path, p_target_fn, p_img_url, p_caption, p_fallbackurl);
		}
		else
		{
			return nixps_thumb.generate_thumb_with_known_dimensions(p_target_path, p_target_fn, p_img_url, p_img_width, p_img_height, p_caption);
		}
	},

	//
	// Internal Stuff
	//
	generate_thumb_with_known_dimensions: function(p_target_url, p_target_fn, p_img_url, p_img_width, p_img_height, p_caption)
	{
		// Calculate target width / height for the thumbnails
		var lw = p_img_width;
		var lh = p_img_height;
		if (lw < lh)
		{
			lw = lw * (this.m_target_dimension / lh);
			lh = this.m_target_dimension;
		}
		else
		{
			lh = lh * (this.m_target_dimension / lw);
			lw = this.m_target_dimension;
		}

		// Generate the Box HTML
		var l_box = $("<div>").addClass("thumb_box");
		l_box.css("width", this.m_target_dimension+"px");
		if (p_caption == undefined || p_caption == "")
			l_box.css("height", this.m_target_dimension+"px");
		else
			l_box.css("height", (this.m_target_dimension+20)+"px");

		// Generate the Border HTML
		var l_border = $("<div>").addClass("thumb_border");
		l_border.css("width", (lw+12)+"px");
		l_border.css("height", (lh+12)+"px");
		if (lw != this.m_target_dimension)
			l_border.css("margin-left", (this.m_target_dimension-lw)/2+"px");
		else
			l_border.css("margin-top", (this.m_target_dimension-lh)/2+"px");
		l_border.appendTo(l_box);

		// Generate the Link HTML
		if (p_target_fn === undefined) {
			var l_href = $("<a/>", {"href" : p_target_url});
			l_href.appendTo(l_border);
		} else {
			var l_href = $("<a/>", {"href" : '#'});
			l_href.appendTo(l_border);
			l_href.click(function(e) {
                p_target_fn(p_target_url);
            });
		}

		// Generate the Image HTML
		var l_image = $("<img>").addClass("thumb_image");
		l_image.css("width", lw+"px");
		l_image.css("height", lh+"px");
		l_image.attr("src", p_img_url);
		if (nixps_thumb.m_lazy_loading && !l_image.complete)
		{
		 	l_image.attr("src", "/portal/images/no_thumb.png");
		 	l_image.attr("a_src", p_img_url);
		 	l_image.appear(function()
			{
				$(this).attr("src", $(this).attr("a_src"));
			});
		}
		else if (p_img_url !== undefined && p_img_url.length > 0)
			l_image.attr("src", p_img_url);
        else
		 	l_image.attr("src", "/portal/images/no_thumb.png");
		if (nixps_thumb.m_hide_missing_images)
			l_image.error(function(){$(this).parent().parent().parent().hide()});
		else
			l_image.error(function(){$(this).attr("src", "/portal/images/no_thumb.png")});
		l_image.appendTo(l_href);

		// Check for a caption
		if (p_caption != undefined && p_caption != "")
		{
			l_box.append($("<div>").addClass('thumb_name').append(p_caption));
		}

		// Return top-level object
		return l_box;
	},

	reposition_thumb: function(thumb_image)
	{
		var new_width = thumb_image[0].naturalWidth;
		var new_height = thumb_image[0].naturalHeight;
		var max_dim = parseInt(thumb_image.attr("max_dim"));
		if (new_width < new_height)
		{
			var new_width = new_width * (max_dim / new_height);
			var new_height = max_dim;
		}
		else
		{
			var new_height = new_height * (max_dim / new_width);
			var new_width = max_dim;
		}
		thumb_image.css("width", new_width+"px");
		thumb_image.css("height", new_height+"px");
		thumb_image.parent().parent().css("height", (new_height + 12)+"px");
		thumb_image.parent().parent().css("width", (new_width + 12)+"px");
		thumb_image.parent().parent().css("margin-left", (max_dim - new_width) / 2 +"px");
		thumb_image.parent().parent().css("margin-top", (max_dim - new_height) / 2 +"px");
	},

	generate_thumb_with_unknown_dimensions: function(p_target_url, p_target_fn, p_img_url, p_caption, p_fallbackurl)
	{
		// Set lw/lh
		var lw = nixps_thumb.m_target_dimension;
		var lh = nixps_thumb.m_target_dimension;

		// Generate the Box HTML
		var l_box = $("<div>").addClass("thumb_box");
		l_box.css("width", (nixps_thumb.m_target_dimension+12)+"px");
		if (p_caption == undefined || p_caption == "")
			l_box.css("height", (nixps_thumb.m_target_dimension+12)+"px");
		else
		{
			l_box.css("height", (nixps_thumb.m_target_dimension+32)+"px");
		}

		// Generate the Border HTML
		var l_border = $("<div>").addClass("thumb_border");
		l_border.css("width", (lw+12)+"px");
		l_border.css("height", (lh+12)+"px");
		l_border.appendTo(l_box);

		// Generate the Link HTML
		if (p_target_fn === undefined) {
			var l_href = $("<a/>", {"href" : p_target_url});
			l_href.appendTo(l_border);
		} else {
			var l_href = $("<span/>");
			l_href.appendTo(l_border);
			l_href.click(function(e) {
                p_target_fn(p_target_url);
            });
		}

		// Generate the Image HTML
		var l_image = $("<img/>", {"class": "thumb_image", "max_dim" : nixps_thumb.m_target_dimension});
		l_image.css("width", lw+"px");
		l_image.css("height", lh+"px");
		l_image.attr("src", p_img_url);
		if (nixps_thumb.m_lazy_loading && !l_image.complete)
		{
		 	l_image.attr("src", "/portal/images/no_thumb.png");
		 	l_image.attr("a_src", p_img_url);
		 	l_image.appear(function()
			{
				$(this).attr("src", $(this).attr("a_src"));
				$(this).load(function(){nixps_thumb.reposition_thumb($(this))});
			});
		}
		else if (p_img_url !== undefined && p_img_url.length > 0)
		{
            if (l_image.complete)
                nixps_thumb.reposition_thumb(l_image);
            else
    			l_image.load(function(){nixps_thumb.reposition_thumb($(this))});
		}
		else
		{
		 	l_image.attr("src", "/portal/images/no_thumb.png");
			l_image.load(function(){nixps_thumb.reposition_thumb($(this))});
		}
		if (nixps_thumb.m_hide_missing_images)
			l_image.error(function(){$(this).parent().parent().parent().hide();});
		else
			l_image.error(function(){
                $(this).closest(".thumb_border").addClass('fallback_url');
                if (typeof p_fallbackurl !== "string" || p_fallbackurl.length <= 0 || $(this).attr("src") == p_fallbackurl) {
                    $(this).attr("src", "/portal/images/no_thumb.png");
                } else {
                    $(this).attr("src", p_fallbackurl);
                }
            });
		l_image.appendTo(l_href);

		// Check for a caption
		if (p_caption != undefined && p_caption != "")
		{
			l_box.append($("<div>").addClass('thumb_name').append(p_caption));
		}

		// Return top-level object
		return l_box;
	},

	generate_transparant: function(p_target_url, p_img_url, p_caption)
	{
		// Set lw/lh
		var lw = nixps_thumb.m_target_dimension;
		var lh = nixps_thumb.m_target_dimension;

		// Generate the Box HTML
		var l_box = $("<div>").addClass("thumb_box");
		l_box.css("width", (nixps_thumb.m_target_dimension+12)+"px");
		if (p_caption == undefined || p_caption == "")
			l_box.css("height", (nixps_thumb.m_target_dimension+12)+"px");
		else
		{
			l_box.css("height", (nixps_thumb.m_target_dimension+32)+"px");
		}

		// Generate the Border HTML
		var l_border = $("<div/>", {"class": "div.transparant_thumb_border"});
		l_border.css("width", (lw+12)+"px");
		l_border.css("height", (lh+12)+"px");
		l_border.appendTo(l_box);

		// Generate the Link HTML
		var l_href = $("<a/>", {"href" : p_target_url});
		l_href.appendTo(l_border);

		// Generate the Image HTML
		var l_image = $("<img/>", {"class": "transparent_thumb_image", "max_dim" : nixps_thumb.m_target_dimension});
		l_image.css("width", lw+"px");
		l_image.css("height", lh+"px");
		l_image.attr("src", p_img_url);
		if (nixps_thumb.m_lazy_loading && !l_image.complete)
		{
		 	l_image.attr("src", "/portal/images/no_thumb.png");
		 	l_image.attr("a_src", p_img_url);
		 	l_image.appear(function()
			{
				$(this).attr("src", $(this).attr("a_src"));
				$(this).load(function(){nixps_thumb.reposition_thumb($(this))});
			});
		}
		else
		{
            if (l_image.complete)
                nixps_thumb.reposition_thumb(l_image);
            else
    			l_image.load(function(){nixps_thumb.reposition_thumb($(this))});
		}
		if (nixps_thumb.m_hide_missing_images)
			l_image.error(function(){$(this).parent().parent().parent().hide()});
		else
			l_image.error(function(){$(this).attr("src", "/portal/images/no_thumb.png")});
		l_image.appendTo(l_href);

		// Check for a caption
		if (p_caption != undefined && p_caption != "")
		{
			l_box.append($("<div>").addClass('thumb_name').append(p_caption));
		}

		// Return top-level object
		return l_box;
	},

	generate_transparant_fn: function(p_target_url, p_target_fn, p_img_url, p_caption, p_fallbackurl)
	{
		// Set lw/lh
		var lw = nixps_thumb.m_target_dimension;
		var lh = nixps_thumb.m_target_dimension;

		// Generate the Box HTML
		var l_box = $("<div>").addClass("thumb_box");
		l_box.css("width", (nixps_thumb.m_target_dimension+12)+"px");
		if (p_caption == undefined || p_caption == "")
			l_box.css("height", (nixps_thumb.m_target_dimension+12)+"px");
		else
		{
			l_box.css("height", (nixps_thumb.m_target_dimension+32)+"px");
		}

		// Generate the Border HTML
		var l_border = $("<div>").addClass("transparant_thumb_border");
		l_border.css("width", (lw+12)+"px");
		l_border.css("height", (lh+12)+"px");
		l_border.appendTo(l_box);

		// Generate the Link HTML
		if (p_target_fn === undefined) {
			var l_href = $("<a/>", {"href" : p_target_url});
			l_href.appendTo(l_border);
		} else {
			var l_href = $("<div>");
			l_href.appendTo(l_border);
			l_href.click(function(e) {
                p_target_fn(p_target_url);
            });
		}

		// Generate the Image HTML
		var l_image = $("<img/>", {"class": "transparent_thumb_image", "max_dim" : nixps_thumb.m_target_dimension});
		l_image.css("width", lw+"px");
		l_image.css("height", lh+"px");
		l_image.attr("src", p_img_url);
		if (nixps_thumb.m_lazy_loading && !l_image.complete)
		{
		 	l_image.attr("src", "/portal/images/no_thumb.png");
		 	l_image.attr("a_src", p_img_url);
		 	l_image.appear(function()
			{
				$(this).attr("src", $(this).attr("a_src"));
				$(this).load(function(){nixps_thumb.reposition_thumb($(this))});
			});
		}
		else
		{
            if (l_image.complete)
                nixps_thumb.reposition_thumb(l_image);
            else
    			l_image.load(function(){nixps_thumb.reposition_thumb($(this));});
		}
		if (nixps_thumb.m_hide_missing_images)
			l_image.error(function(){$(this).parent().parent().parent().hide();});
		else
			l_image.error(function(){
                if (typeof p_fallbackurl !== "string" || p_fallbackurl.length <= 0 || $(this).attr("src") == p_fallbackurl) {
                    $(this).attr("src", "/portal/images/no_thumb.png");
                } else {
                    $(this).attr("src", p_fallbackurl);
                }
            });
		l_image.appendTo(l_href);

		// Check for a caption
		if (p_caption != undefined && p_caption != "")
		{
			l_box.append($("<div>").addClass('thumb_name').append(p_caption));
		}

		// Return top-level object
		return l_box;
	}
}

///////////////////////////////////////////////////////////////////////////////////////
// INITIALIZATION WRAPPER
///////////////////////////////////////////////////////////////////////////////////////

function init_utils()
{
	// Preloader
}

function database_unreachable(db_ip)
{
    $('body').append("<div class='database-unreachable'><img src='portal/images/dashboard_error.png'> DATABASE UNREACHABLE AT "+db_ip+"</div>");
    top_pane.set_title("Configuration Error");
}

window.nixps_utils = nixps_utils;
window.init_utils = init_utils;
window.nixps_thumb = nixps_thumb;
window.database_unreachable = database_unreachable;
