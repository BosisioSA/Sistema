/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window*/

/**
 * @brief the error dialog
 */
panzer.xeikon.error_dialog = function (p_file)
{
	this.m_file = panzer.get_filename(p_file);
	this.m_dialog_div = null;
	this.m_overlay_div = null;
	this.m_cb_on_close = function () {};
	this.setup_ui();
	this.enable_handlers();
};


/**
 * @brief the error dialog destructor, cleans up the bindings and dom tree
 */
panzer.xeikon.error_dialog.prototype.destroy = function ()
{
	this.m_overlaydiv.remove();
	$(window).unbind('resize.errordialog');
};


/**
 * @brief creates the error dialog ui
 */
panzer.xeikon.error_dialog.prototype.setup_ui = function ()
{
	var l_this = this;

	var l_overlay_div = $('<div>');
	l_overlay_div.hide();
	l_overlay_div.addClass('panzer_overlay');
	l_overlay_div.attr('id', 'panzer_errordialog_overlay');
	l_overlay_div.appendTo($('#layout'));

	var l_dialog_div = $('<div>');
	l_dialog_div.addClass('panzer_dialog');
	l_dialog_div.appendTo(l_overlay_div);

	var l_header = $('<div>');
	l_header.html('Invalid file type');
	l_header.addClass('panzer_dialog_header');
	l_header.appendTo(l_dialog_div);
	
	var l_msg = $('<div>');
	l_msg.addClass('panzer_dialog_text');
	l_msg.html('The file ' + this.m_file + ' is not a PDF file.');
	l_msg.appendTo(l_dialog_div);

	var l_buttons = $('<div>');
	l_buttons.addClass('panzer_dialog_buttons');
	l_buttons.append('<button class="panzer_errordialog_errorbutton">ok</button>');
	l_buttons.appendTo(l_dialog_div);

	l_dialog_div.find('.panzer_errordialog_errorbutton').button();

	this.m_overlay_div = l_overlay_div;
	this.m_dialog_div = l_dialog_div;
};

/**
 * @brief creates all the bindings
 */
panzer.xeikon.error_dialog.prototype.enable_handlers = function ()
{
	var l_this = this;

	$('div.panzer_dialog .panzer_errordialog_errorbutton').bind('click', function ()
	{
		l_this.m_overlay_div.hide();
		l_this.m_cb_on_close(l_this.m_file);
	});
};


/**
 * @brief shows the dialog box
 * @param p_cbonclose the callback to execute when the error dialog is closed
 *		  parameter p_file structure supplied enriched with clipWidth, clipHeight, clipTop, clipLeft in pt
 */
panzer.xeikon.error_dialog.prototype.show = function (p_cb_on_close)
{
	this.m_cb_on_close = p_cb_on_close;
	this.m_overlay_div.show();

	$('#panzer_errordialog_overlay .panzer_dialog_buttons').position({
		my: 'center',
		at: 'center',
		of: '#panzer_errordialog_overlay'
	});
	
	$('#panzer_errordialog_overlay .panzer_dialog_text').position({
		my: 'bottom',
		at: 'top',
		of: '.panzer_dialog_buttons'
	});
	
	$('#panzer_errordialog_overlay .panzer_dialog_header').position({
		my: 'bottom',
		at: 'top',
		of: '.panzer_dialog_text'
	});
};
