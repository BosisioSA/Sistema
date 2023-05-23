/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global upload, $, document, window, setTimeout, clearTimeout*/


upload.controller = function (p_options)
{
	var l_this = this;
	
	l_this.m_$div = null;
	l_this.m_$filelist = null;
	l_this.m_files = [];
	l_this.m_assets = [];
	l_this.xhrDict = {};
    
	l_this.m_options = {
		url: null,
		check_file_cb: function (p_filename, p_size, p_type) { return true; },
		fail_cb: function (p_filename) {},
		process_cb: function (p_asset, p_callback) { p_callback(true); },
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
		l_$upload_button = $("<button class='upload_button'>Browse files...</button>");
		l_$upload_div.append(l_$upload_button);
		
		l_$upload_field = $("<input class='upload_input' type='file' name='files[]' data-url='/portal.cgi'" + l_multiple + ">");
		l_$upload_div.append(l_$upload_field);
		l_$upload_field.hide();
	}

	var uploadURL = '/portal.cgi';
	if (l_this.m_options.url != null)
	{
		if (l_this.m_options.url.substring(0, 6) === "/?url=" ) 
		{
			uploadURL += l_this.m_options.url.substring(1); // Deprecated behaviour
		} else if( l_this.m_options.url.substring(0, 5) === "?hub=" )
        {
            uploadURL += l_this.m_options.url;
        }
		else
		{
			uploadURL += "?url=" + encodeURIComponent(l_this.m_options.url);
		}
	}

	l_this.m_$div.fileupload({
		dataType: 'json',
		dropZone: l_this.m_$div,
		url: uploadURL,
    
		send: function (p_event, p_data)
		{
			var l_index;
			if (! l_this.m_options.multiple)
			{
				l_this.m_files = [];
				l_this.m_$filelist.empty();
			}
			for (l_index = 0; l_index < p_data.files.length; l_index++)
			{
				var l_file = p_data.files[l_index];
				console.log("o arquivo")
				console.log(l_file)
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
		    console.log("Estou no DONE")
		    console.log(p_data)
            delete l_this.xhrDict[p_data.files[0].name];
			var l_$progressbar = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .progressbar');
		
			var l_$progress = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .progress');
			var l_$status = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .status');
			l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .removeFileIcon').css('display','');// show remove icon
          
          	l_$progressbar.hide();
			
			if ((p_event.type !== "fileuploaddone") || (p_data.result === undefined) || (p_data.result.files === undefined))
			{
			    console.log("Deu merda")
				l_this.forget_file(p_data.files[0].name);
				l_$status.text('Failed!');
				l_$status.addClass('error');
			}
			else
			{
				l_$status.text('Processing...');
				console.log("Estou subindo esse arquivo")
				console.log(p_data.result.files[0])
				p_data.files[0].url = p_data.result.files[0];
				if (p_data.files[0].url === undefined)
				{
					l_this.forget_file(p_data.files[0].name);
					l_$status.text('Failed!');
					l_$status.addClass('error');
				}
				else
				{
					l_this.post_process_file(p_data.files[0].name, p_data.files[0].url);
				}
			}
		},

		progress: function (p_event, p_data)
		{
            l_this.xhrDict[p_data.files[0].name] = p_data.xhr();
			var l_$progressbar = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .progressbar');
			var l_$progress = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .progress');
			var l_$status = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .status');
            l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .removeFileIcon').css('display','');// show remove icon
			
            var l_progress_pct = parseInt(p_data.loaded / p_data.total * 100, 10);
			l_$progress.css('width', l_$progressbar.width() * l_progress_pct / 100);
			l_$status.text(l_progress_pct.toString() + "%");
		},

		fail: function(p_event, p_data)
		{
            delete l_this.xhrDict[p_data.files[0].name];
			var l_$progressbar = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .progressbar');
			var l_$progress = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .progress');
			var l_$status = l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .status');
			l_this.m_$filelist.find('.filerow[file="' + p_data.files[0].name + '"] .removeFileIcon').css('display','');// show remove icon
            
			l_this.forget_file(p_data.files[0].name);
			l_$progressbar.hide();
			l_$status.text(l_this.extractErrorMessage(p_data.jqXHR));
			l_$status.addClass('error');
		}
	});

	if (l_$upload_button)
	{
		l_$upload_button.click(function()
		{
			l_this.m_$div.find('.upload_input').click();
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

upload.controller.prototype.extractErrorMessage = function (pJqXHR) {
    var errorMessage = "Failed!";
    if($.isPlainObject(pJqXHR) && typeof pJqXHR.responseText === "string" && pJqXHR.responseText.length > 0) {
        try {
            var errorObject = JSON.parse(pJqXHR.responseText);
            if (errorObject.error === "Processing Failure" && 
                $.isPlainObject(errorObject.messages) && 
                $.isArray(errorObject.messages.messages) && errorObject.messages.messages.length > 0 &&
                errorObject.messages.messages[0].type === "No Access to Asset") {
                return "There is no permission for the upload folder!";
            }
        } catch (pError) {
            return errorMessage;
        }
    }
    return errorMessage;
};

upload.controller.prototype.post_process_file = function (p_filename, p_url)
{
	var l_this = this;
	var l_$status = l_this.m_$filelist.find('.filerow[file="' + p_filename + '"] .status');
	console.log("Pós Processo!")
	if (l_this.m_options.got_files_cb)
	{
		l_this.m_options.got_files_cb(p_filename, p_url);
	}
	
	if (l_this.m_options.done_cb)
	{
		api_async.asset.list
		(
			["cloudflow.part", "equal to", p_url],
			[],
			function (p_data)
			{
				if (p_data.results !== undefined && p_data.results.length > 0)
				{
					var asset = p_data.results[0];
					if (l_this.m_options.multiple == false)
					{
						l_this.m_assets = [];
					}
						l_this.m_assets.push(asset);
					
	
					l_this.m_options.process_cb
					(
						asset,
						function (p_success)
						
						{
						    console.log("foi sucesso?")
						console.log(p_success)
							if (p_success)
							{
								l_$status.text('Completed');
								l_$status.addClass('success');
								l_this.m_options.done_cb(asset);
							}
							else
							{
								l_this.forget_file(p_filename);
								l_$status.text('Failed');
								l_$status.addClass('error');
								l_this.m_options.fail_cb(asset);
							}
						}
					);
				}
				else
				{
					l_this.post_process_file(p_filename, p_url);
				}
			}
		);
	}
	else
	{
		l_$status.text('Completed');
		l_$status.addClass('success');
	}
};

upload.controller.prototype._abort = function(pFileName) {
    // abort the ajax call if it is pressend
    if (this.xhrDict[pFileName] !== undefined) {
        this.xhrDict[pFileName].abort();
    }
};

/**
 * @description remove a file from the uploaded list if files
 * @param {string} p_filename filename with extension
 * @returns {undefined}
 */
upload.controller.prototype.forget_uploaded_asset = function (p_filename){
    var l_this = this;
	var l_old_list = l_this.m_assets;
	l_this.m_assets = [];
	l_old_list.forEach(function (p_file)
	{
		if (typeof p_file.file_name === "string") 
		{
            if (p_file.file_name !== p_filename)
                l_this.m_assets.push(p_file);
		} else {
            l_this.m_assets.push(p_file);
        }
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
    l_$name.prepend($('<span class="fa fa-times fa-fw removeFileIcon" >')
                .attr('title',$.i18n._("nixps-cloudflow-upload.remove"))
                .hide()
                .on('click', $.proxy(l_this.abortAndRemoveFileHandler, l_this)));
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
/**
 * @description function called when user clicked on remove button
 * @function 
 * @param {type} pEvent
 * @param {type} pData
 * @returns {undefined}
 */
upload.controller.prototype.abortAndRemoveFileHandler = function(pEvent, pData) {
    var fileName = $(pEvent.target).closest('[file]').attr('file');
    if (typeof fileName === "string" && fileName.length > 0) {
        this._abort(fileName); // abort the pending call
        this.forget_uploaded_asset(fileName); // in case of already doanloaded
        this.forget_file(fileName); // in case of during process
        //
        // control if everything is done well, in this case we can remove file from list
        var allFileNames = $.map(this.get_uploaded_assets(), function(file, index) {
            if ($.isPlainObject(file) && typeof file.file_name === "string" && file.file_name.length > 0) {
                return file.file_name;
            }
        });
        if ($.inArray(fileName, allFileNames) === -1) {
            this.m_$filelist.find('.filerow[file=\"' + fileName + '\"]').remove();
        }
    }
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
		$.extend(this.m_options, p_options);
	}
};
