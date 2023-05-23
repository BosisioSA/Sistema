/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, document, window, Spinner, setTimeout, clearTimeout*/


panzer.xeikon.upload_dialog = function ()
{
	this.m_cbonclose = null;
	this.m_cbonuploaded = null;
	this.m_filedata = null;

	this.m_overlay = null;
	this.m_uploaddialog = null;	

	this.m_waitdialog = null;
	this.m_spinner = null;
};


panzer.xeikon.upload_dialog.prototype.destroy = function ()
{
	$(document).unbind('dragover');
	this.m_spinner.stop();
	this.m_overlay.remove();
};


panzer.xeikon.upload_dialog.prototype.setup_ui = function ()
{
	var l_this = this;

	var l_overlay = $('<div>');
	l_overlay.addClass('panzer_overlay');
	l_overlay.hide();

	//
	// The upload dialog
	//
	var l_upload_dialog = $('<div>');
	l_upload_dialog.attr('id', 'panzer_upload_dialog');
	l_overlay.append(l_upload_dialog);

	var l_upload_dialog_title = $('<div>');
	l_upload_dialog_title.text('Upload PDF');
	l_upload_dialog_title.addClass('panzer_dialog_header');
	l_upload_dialog.append(l_upload_dialog_title);

	var l_cancel_button, l_upload_field;

	if ($.browser.msie)
	{
		var l_upload_div = $('<div>');
		l_upload_div.addClass('panzer_uploaddiv_msie');
		l_upload_dialog.append(l_upload_div);
		
		l_upload_field = $("<input class='panzer_addfilebutton-files' type='file' name='files[]' data-url='/portal.cgi' multiple>");
		l_upload_div.append(l_upload_field);

		l_cancel_button = $("<button class='textbutton' id='panzer_cancel_button'>Cancel</button>");
		l_cancel_button.addClass('panzer_cancel_button_msie');
		l_upload_div.append(l_cancel_button);
	}
	else
	{
		var l_upload_dialog_dropzone = $('<div>');
		l_upload_dialog_dropzone.attr('id', 'panzer_upload_dialog_dropzone');
		l_upload_dialog_dropzone.addClass('fade well');
		l_upload_dialog_dropzone.text('Drag your file here');
		l_upload_dialog.append(l_upload_dialog_dropzone);

		l_upload_dialog.append('<div class="vertical_spacer">or</div>');

		var l_upload_button = $("<button class='textbutton' id='panzer_upload_button'>Browse files...</button>");
		l_upload_dialog.append(l_upload_button);
		l_cancel_button = $("<button class='textbutton' id='panzer_cancel_button'>Cancel</button>");
		l_upload_dialog.append(l_cancel_button);

		l_upload_field = $("<input class='panzer_addfilebutton-files' type='file' name='files[]' data-url='/portal.cgi' multiple>");
		l_upload_dialog.append(l_upload_field);
		l_upload_field.hide();
	}

	this.m_upload_dialog = l_upload_dialog;
	this.m_overlay = l_overlay;
	$('#layout').append(l_overlay);

	//
	// The wait dialog
	//
	this.m_waitdialog = $('<div>');
	this.m_waitdialog.attr('id', 'panzer_wait_dialog');
	this.m_waitdialog.hide();
	this.m_overlay.append(this.m_waitdialog);

	var l_waitdialog_title = $('<div>');
	l_waitdialog_title.addClass('panzer_dialog_header');
	l_waitdialog_title.text('Upload');
	this.m_waitdialog.append(l_waitdialog_title);

	var l_spinner = $('<div>');
	l_spinner.addClass('spinner');
	this.m_waitdialog.append(l_spinner);

	var l_spinner_text = $('<div>');
	l_spinner_text.addClass('spinner_text');
	l_spinner_text.text('uploading');
	this.m_waitdialog.append(l_spinner_text);

	var l_opts = {
		lines: 17, // The number of lines to draw
		length: 0, // The length of each line
		width: 16, // The line thickness
		radius: 60, // The radius of the inner circle
		corners: 1, // Corner roundness (0..1)
		rotate: 0, // The rotation offset
		direction: 1, // 1: clockwise, -1: counterclockwise
		color: '#fff', // #rgb or #rrggbb
		speed: 1.2, // Rounds per second
		trail: 32, // Afterglow percentage
		shadow: false, // Whether to render a shadow
		hwaccel: false, // Whether to use hardware acceleration
		className: 'spinner', // The CSS class to assign to the spinner
		zIndex: 2e9, // The z-index (defaults to 2000000000)
		top: 'auto', // Top position relative to parent in px
		left: 'auto' // Left position relative to parent in px
	};

	var l_target = $(this.m_waitdialog).find('.spinner');
	this.m_spinner = new Spinner(l_opts).spin(l_target[0]);

	//
	// File Upload Component
	//
	$("#panzer_upload_dialog .panzer_addfilebutton-files").fileupload({
        pasteZone: null,
		dataType: 'json',
		dropZone: $('#panzer_upload_dialog_dropzone'),

		send: function (p_event, p_data)
		{
			l_this.m_upload_dialog.hide();
			l_this.m_waitdialog.show();

		    $.cookie("current_url", $('#layout .filelisttoolbar').attr('panzer_location'), {path: '/'});
		},

		done: function (p_event, p_data)
		{
			l_this.m_waitdialog.find('.spinner_text').text('preparing file');				
			var l_path = $('#layout .filelisttoolbar').attr('panzer_location');

			if ((p_event.type !== "fileuploaddone") || (p_data.result === undefined) || (p_data.result.files === undefined))
			{
				// got error or garbage from the server, treat as a "fail"
				l_this.m_cbonclose();
			}
			else
			{
				var l_file_index;
				var l_done = false;

				for (l_file_index = 0; (l_file_index < p_data.result.files.length) && !l_done; l_file_index += 1)
				{
					if (l_this.m_cbonuploaded)
					{
						var l_filename = p_data.result.files[l_file_index];
						l_this.m_cbonuploaded(l_path + l_filename);
					}

					l_done = true; // only treat the first file
				}
			}
		},

		progress: function (p_event, p_data)
		{
			var l_progress = parseInt(p_data.loaded / p_data.total * 100, 10);
			l_this.m_waitdialog.find('.spinner_text').text('uploading, ' + l_progress.toString() + "%");
		},

		fail: function(p_event, p_data)
		{
			// Just close the dialog
			l_this.m_cbonclose();
		}
	});

	$('#panzer_upload_button').button({ icons: { primary: 'ui-icon-arrowthick-1-n' }});
	$('#panzer_cancel_button').button();

	l_this.enable_handlers();
};


panzer.xeikon.upload_dialog.prototype.enable_handlers = function()
{
	var l_this = this;

	$('#panzer_upload_button').click(function()
	{
		$("#panzer_upload_dialog .panzer_addfilebutton-files").click();
	});

	$('#panzer_cancel_button').click(function()
	{
		l_this.hide();
	});

	if (! $.browser.msie)
	{
		$(document).bind('dragover', function (p_event)
		{
			var l_$drop_zone = $('#panzer_upload_dialog_dropzone');
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


panzer.xeikon.upload_dialog.prototype.show = function (p_cbonclose, p_cbonuploaded)
{
	$('.panzer_overlay').show();
	this.m_cbonclose = p_cbonclose;
	this.m_cbonuploaded = p_cbonuploaded;
};


panzer.xeikon.upload_dialog.prototype.hide = function ()
{
	$('.panzer_overlay').hide();

	if (this.m_cbonclose)
	{
		this.m_cbonclose();
	}
};
