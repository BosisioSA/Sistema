/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window, Image*/

/**
 * @brief the crop dialog
 */
panzer.xeikon.cropping_dialog = function (p_file)
{
	this.m_cropsize = 500;
	this.m_file = p_file;
	this.m_dialogdiv = null;
	this.m_overlaydiv = null;
	this.m_cbonclose = function(){};
	this.setup_ui();
	this.enable_handlers();
};

/**
 * @brief the crop dialog destructor, cleans up the bindings and dom tree
 */
panzer.xeikon.cropping_dialog.prototype.destroy = function ()
{
	this.m_overlaydiv.remove();
	$(window).unbind('resize.cropdialog');
};

/**
 * @brief creates the crop dialog ui
 */
panzer.xeikon.cropping_dialog.prototype.setup_ui = function ()
{
	var l_this = this;
	var l_baseurl = panzer.get_base_url();

	var l_overlaydiv = $('<div>');
	l_overlaydiv.hide();
	l_overlaydiv.addClass('panzer_overlay');
	l_overlaydiv.attr('id', 'panzer_cropdialog_overlay');
	l_overlaydiv.appendTo($('#layout'));

	var l_dialogdiv = $('<div>');
	l_dialogdiv.addClass('panzer_dialog');
	l_dialogdiv.appendTo(l_overlaydiv);

	var l_header = $('<div>');
	l_header.html('Crop');
	l_header.addClass('panzer_dialog_header');
	l_header.appendTo(l_dialogdiv);
	
	var l_blahblah = $('<div>');
	l_blahblah.addClass('panzer_dialog_text');
	l_blahblah.html('Drag the red corners to crop the image.');
	l_blahblah.appendTo(l_dialogdiv);

	var l_buttons = $('<div>');
	l_buttons.addClass('panzer_dialog_buttons');
	l_buttons.append('<button class="panzer_cropdialog_cropbutton">ok</button>');
	l_buttons.appendTo(l_dialogdiv);

	l_dialogdiv.find('.panzer_cropdialog_cropbutton').button();

	this.m_overlaydiv = l_overlaydiv;
	this.m_dialogdiv = l_dialogdiv;

	var l_thumbimage = new Image();
	l_thumbimage.src = l_baseurl + this.m_file.thumb;
	
	l_thumbimage.onload = function ()
	{
		var l_cropdiv = $('<div>');
		l_cropdiv.addClass('panzer_cropdiv');
		l_cropdiv.css('background-image', 'url(' + l_baseurl + l_this.m_file.thumb + ')');
		l_cropdiv.css('background-repeat', 'no-repeat');
		l_cropdiv.css('background-position', '0px 0px');
		
		if (l_thumbimage.width > l_thumbimage.height)
		{
			l_cropdiv.css('background-size', l_this.m_cropsize.toString() + 'px auto');
			l_cropdiv.css('width', l_this.m_cropsize);
			l_cropdiv.css('height', l_this.m_cropsize * l_thumbimage.height / l_thumbimage.width);
		}
		else
		{
			l_cropdiv.css('background-size', 'auto ' + l_this.m_cropsize.toString() + 'px');
			l_cropdiv.css('height', l_this.m_cropsize);
			l_cropdiv.css('width', l_this.m_cropsize * l_thumbimage.width / l_thumbimage.height);
		}

		l_cropdiv.appendTo(l_dialogdiv);
		l_cropdiv.css('margin-top', Math.abs((l_cropdiv.parent().height() - l_header.height() - l_buttons.height() - l_cropdiv.height()) / 2.0));

		var l_mask = $('<div>');
		l_mask.addClass('panzer_mask');
		l_mask.appendTo(l_cropdiv);

		var l_selector = $('<div>');
		l_selector.addClass('panzer_cropselector');
		l_selector.css('background-image', 'url(' + l_baseurl + l_this.m_file.thumb + ')');
		l_cropdiv.css('background-repeat', 'no-repeat');
		l_cropdiv.css('background-position', '0px 0px');

		if (l_thumbimage.width > l_thumbimage.height)
		{
			l_selector.css('background-size', l_this.m_cropsize.toString() + 'px auto');
			l_selector.css('width', l_this.m_cropsize);
			l_selector.css('height', l_this.m_cropsize * l_thumbimage.height / l_thumbimage.width);
		}
		else
		{
			l_selector.css('background-size', 'auto ' + l_this.m_cropsize.toString() + 'px');
			l_selector.css('height', l_this.m_cropsize);
			l_selector.css('width', l_this.m_cropsize * l_thumbimage.width / l_thumbimage.height);
		}

		l_selector.css('left', 0);
		l_selector.css('top', 0);
		l_selector.css('position', 'absolute');
		l_selector.width(l_cropdiv.width() - 1);
		l_selector.height(l_cropdiv.height() - 1);
		l_cropdiv.append(l_selector);

		l_cropdiv.position({
			my: 'center',
			at: 'center',
			of: '#panzer_cropdialog_overlay'
		});

		l_blahblah.position({
			my: 'bottom',
			at: 'top',
			of: '#panzer_cropdialog_overlay .panzer_cropdiv'
		});

		l_header.position({
			my: 'bottom',
			at: 'top',
			of: '#panzer_cropdialog_overlay .panzer_dialog_text'
		});

		l_buttons.position({
			my: 'top',
			at: 'bottom',
			of: '#panzer_cropdialog_overlay .panzer_cropdiv'
		});

        l_selector.draggable({
			drag: function(event, ui)
			{
				var l_left = - ui.position.left;
				var l_top = - ui.position.top;
				l_selector.css('background-position', l_left + 'px ' + l_top + 'px');				
			},
			
			stop: function(event, ui) {
				var l_left = - ui.position.left;
				var l_top = - ui.position.top;
				l_selector.css('background-position', l_left + 'px ' + l_top + 'px');
			},

			containment: "parent"
		});

		l_selector.resizable({ 
			handles: "n, e, s, w, ne, nw, se, sw",

			resize: function(event, ui) {
				var l_left = - ui.element.position().left;
				var l_top = - ui.element.position().top;
				l_selector.css('background-position', l_left + 'px ' + l_top + 'px');
			},

			stop: function(event, ui) {
				var l_left = - ui.element.position().left;
				var l_top = - ui.element.position().top;
				l_selector.css('background-position', l_left + 'px ' + l_top + 'px');
			},

			containment: "parent"
		});
	};
};


/**
 * @brief creates all the bindings
 */
panzer.xeikon.cropping_dialog.prototype.enable_handlers = function ()
{
	var l_this = this;

	$(window).bind('resize.cropdialog', function ()
	{
		$(l_this.m_dialogdiv).find('.panzer_cropdiv').position({
			my: 'center',
			at: 'center',
			of: '#panzer_cropdialog_overlay'
		});

		$(l_this.m_dialogdiv).find('.panzer_dialog_text').position({
			my: 'bottom',
			at: 'top',
			of: '#panzer_cropdialog_overlay .panzer_cropdiv'
		});

		$(l_this.m_dialogdiv).find('.panzer_dialog_header').position({
			my: 'bottom',
			at: 'top',
			of: '#panzer_cropdialog_overlay .panzer_dialog_text'
		});

		$(l_this.m_dialogdiv).find('.panzer_dialog_buttons').position({
			my: 'top',
			at: 'bottom',
			of: '#panzer_cropdialog_overlay .panzer_cropdiv'
		});
	});

	$('div.panzer_dialog .panzer_cropdialog_cropbutton').bind('click', function()
	{
		// Convert the coordinates to crop box coordinates
		var l_scalingfactor = l_this.m_file.width / $(l_this.m_dialogdiv).find('.panzer_cropdiv').width();

		var l_cropselector = $(l_this.m_dialogdiv).find('.panzer_cropselector');
		var l_clipLeft = l_cropselector.position().left * l_scalingfactor;
		var l_clipTop = l_cropselector.position().top * l_scalingfactor;
		var l_clipWidth = l_cropselector.width() * l_scalingfactor;
		var l_clipHeight = l_cropselector.height() * l_scalingfactor;

		l_this.m_file.clipLeft = l_clipLeft;
		l_this.m_file.clipTop = l_clipTop;
		l_this.m_file.clipWidth = l_clipWidth;
		l_this.m_file.clipHeight = l_clipHeight;

		l_this.m_overlaydiv.hide();
		l_this.m_cbonclose(l_this.m_file);
	});
};


/**
 * @brief shows the dialog box
 * @param p_cbonclose the callback to execute when the crop dialog is closed
 *		  parameter p_file structure supplied enriched with clipWidth, clipHeight, clipTop, clipLeft in pt
 */
panzer.xeikon.cropping_dialog.prototype.show = function (p_cbonclose)
{
	this.m_cbonclose = p_cbonclose;
	this.m_overlaydiv.show();
};
