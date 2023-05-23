/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global upload, $, document, window, setTimeout, clearTimeout*/


upload.controller = function (p_options)
{
	var l_this = this;
	
	l_this.m_$div = null;
	l_this.m_$filelist = null;
	l_this.m_files = [];
	l_this.m_assets = [];
	
	l_this.m_options = {
		url: 'PP_FILE_STORE',
		check_file_cb: function (p_filename, p_size, p_type) { return true; },
		fail_cb: function (p_filename) {},
		done_cb: function (p_asset) {},
		process_cb: function (p_asset, p_callback) { p_callback(true); },
		only_upload: false,
		multiple: false
	};
	
	$.extend(l_this.m_options, p_options);
};


upload.controller.prototype.setup_ui = function (p_$div)
{
	var l_this = this;
	l_this.m_$div = p_$div;
	l_this.m_$div.addClass('upload');
	this.m_$div.data('controller', this);
	var l_$upload_field;
	var l_$upload_button = null;
	var l_$upload_div = $('<div class="upload_div">');
	l_this.m_$div.append(l_$upload_div);
	
	var l_$filescroll = $('<div class="filescroll">');
	l_this.m_$div.append(l_$filescroll);
	
	l_this.m_$filelist = $('<div class="filelist">');
	l_$filescroll.append(l_this.m_$filelist);
	
	var l_multiple = '';
	if (l_this.m_options.multiple)
	{
		l_multiple = ' multiple';
	}

	if ($.browser.msie)
	{
		l_$upload_field = $("<input class='upload_input_msie' type='file' name='files[]' data-url='/portal.cgi'" + l_multiple + ">");
		l_$upload_div.append(l_$upload_field);
	}
	else
	{
		l_$upload_button = $("<button class='upload_button'>Dateien wählen...</button>");
		l_$upload_div.append(l_$upload_button);
		
		l_$upload_field = $("<input class='upload_input' type='file' name='files[]' data-url='/portal.cgi'" + l_multiple + ">");
		l_$upload_div.append(l_$upload_field);
		l_$upload_field.hide();
	}

	l_this.m_$div.fileupload({
		dataType: 'json',
		dropZone: l_this.m_$div,
		url: '/portal.cgi',

		send: function (p_event, p_data)
		{
			if (l_this.m_options.url!='')
				$.cookie("current_url", l_this.m_options.url, {path: '/'});
			var l_index;
			if (! l_this.m_options.multiple)
			{
				l_this.m_files = [];
				l_this.m_$filelist.empty();
			}
			for (l_index = 0; l_index < p_data.files.length; l_index++)
			{
				var l_file = p_data.files[l_index];
				if (! l_this.m_options.check_file_cb(l_file.name, l_file.size, l_file.type)) 
				{
					return false;
				}
			}
			
			for (l_index = 0; l_index < p_data.files.length; l_index++)
			{
				var l_file = p_data.files[l_index];
				l_this.add_file(l_file.name);
			}
			
			return true;
		},

		done: function (p_event, p_data)
		{
			var l_$progressbar = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .progressbar');
			var l_$progress = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .progress');
			var l_$status = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .status');
			
			l_$progressbar.hide();

			if ((p_event.type !== "fileuploaddone") || (p_data.result === undefined) || (p_data.result.files === undefined))
			{
				l_this.forget_file(p_data.files[0].name);
				l_$status.text('Failed!');
				l_$status.addClass('error');
			}
			else
			{
				if (l_this.m_options.only_upload==true)
				{
					l_$status.text('Completed');
					l_$status.addClass('success');
					l_this.m_options.done_cb(p_data.files[0].url);
				} else
				{
					l_$status.text('Processing...');
                	p_data.files[0].url = l_this.m_options.url + '/' + p_data.result.files[0];
					l_this.post_process_file(p_data.files[0].name, p_data.files[0].url);
				}
			}
		},

		progress: function (p_event, p_data)
		{
			var l_$progressbar = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .progressbar');
			var l_$progress = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .progress');
			var l_$status = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .status');
			var l_progress_pct = parseInt(p_data.loaded / p_data.total * 100, 10);
			l_$progress.css('width', l_$progressbar.width() * l_progress_pct / 100);
			l_$status.text(l_progress_pct.toString() + "%");
		},

		fail: function(p_event, p_data)
		{
			var l_$progressbar = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .progressbar');
			var l_$progress = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .progress');
			var l_$status = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .status');
			
			l_this.forget_file(p_data.files[0].name);
			l_$progressbar.hide();
			l_$status.text('Failed!');
			l_$status.addClass('error');
		}
	});

	if (l_$upload_button)
	{
		l_$upload_button.click(function()
		{
			l_$upload_field.click();
		});
	}

	if (! $.browser.msie)
	{
		l_this.m_$div.bind('dragover', function (p_event)
		{
			var l_$drop_zone = l_this.m_$div;
			var l_timeout = window.dropZoneTimeout;

			if (! l_timeout)
			{
				l_$drop_zone.addClass('in');
			}
			else
			{
				clearTimeout(l_timeout);
			}

			var l_found = false;
			var l_node = p_event.target;
			
			do
			{
				if (l_node === l_$drop_zone[0])
				{
					l_found = true;
					break;
				}

				l_node = l_node.parentNode;
			} while (l_node !== null);

			if (l_found)
			{
				l_$drop_zone.addClass('hover');
			}
			else
			{
				l_$drop_zone.removeClass('hover');
			}

			window.dropZoneTimeout = setTimeout(function ()
			{
				window.dropZoneTimeout = null;
				l_$drop_zone.removeClass('in hover');
			}, 100);
		});
	}
};


upload.controller.prototype.post_process_file = function (p_filename, p_url)
{
	var l_this = this;
	var l_$status = l_this.m_$filelist.find('.filerow[file="' + p_filename + '"] .status');
	
	api_async.assets.get_with_url(
		p_url, '',
		function (p_asset)
		{
			l_this.m_assets.push(p_asset);

			l_this.m_options.process_cb(
				p_asset,
				function (p_success)
				{
					if (p_success)
					{
						l_$status.text('Completed');
						l_$status.addClass('success');
						l_this.m_options.done_cb(p_asset);
					}
					else
					{
						l_this.forget_file(p_filename);
						l_$status.text('Failed');
						l_$status.addClass('error');
						l_this.m_options.fail_cb(p_asset);
					}
				});
		},
		function ()
		{
			l_this.post_process_file(p_filename);
		});
};


upload.controller.prototype.forget_file = function (p_filename)
{
	var l_this = this;
	var l_old_list = l_this.m_files;
	l_this.m_files = [];
	l_old_list.forEach(function (p_file)
	{
		if (p_file !== p_filename)
		{
			l_this.m_files.push(p_file);
		}
	});
};


upload.controller.prototype.add_file = function (p_filename)
{
	var l_this = this;
	l_this.m_files.push(p_filename);
	var l_$row = $('<div class="filerow">');
	l_this.m_$filelist.append(l_$row);
	l_$row.attr('file', p_filename);

	if ((l_this.m_files.length % 2) == 0)
	{
		l_$row.addClass('even');
	}
	else
	{
		l_$row.addClass('odd');
	}
		
	var l_$name = $('<div class="filename">');
	l_$name.text(p_filename);
	l_$row.append(l_$name);
	var l_$rightcolumn = $('<div class="rightcolumn">');
	l_$row.append(l_$rightcolumn);
	var l_$progresstext = $('<span class="status">');
	l_$rightcolumn.append(l_$progresstext);
	l_$progresstext.text("0%");
	var l_$progressbar = $('<div class="progressbar">');
	l_$rightcolumn.append(l_$progressbar);
	var l_$progress = $('<div class="progress">');
	l_$progressbar.append(l_$progress);
};


upload.controller.prototype.add_failed_entry = function (p_filename, p_msg)
{
	var l_this = this;
	var l_$row = $('<div class="filerow">');
	l_this.m_$filelist.append(l_$row);

	if ((l_this.m_files.length % 2) == 0)
	{
		l_$row.addClass('even');
	}
	else
	{
		l_$row.addClass('odd');
	}
		
	var l_$name = $('<div class="filename">');
	l_$name.text(p_filename);
	l_$row.append(l_$name);
	var l_$rightcolumn = $('<div class="rightcolumn">');
	l_$row.append(l_$rightcolumn);
	var l_$progresstext = $('<span class="status error">');
	l_$rightcolumn.append(l_$progresstext);
	l_$progresstext.text(p_msg);
};


upload.controller.prototype.get_files = function ()
{
	return this.m_files;
};


upload.controller.prototype.get_uploaded_assets = function ()
{
	return this.m_assets;
};


upload.controller.prototype.reset = function (p_options)
{
	this.m_$filelist.empty();
	this.m_files = [];
	this.m_assets = [];
	
	if (p_options)
	{
		$.extend(l_this.m_options, p_options);
	}
};
