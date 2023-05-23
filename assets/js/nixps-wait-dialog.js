/**
 * @brief a wait dialog with text and spinner when the file is prepared
 */
function wait_dialog() {
	this.m_waitdialog = null;
	this.m_spinner = null;

	this.setup_ui();
}

/**
 * @brief destroys the dialog, cleans the DOM tree
 */
wait_dialog.prototype.destroy = function() {
	this.m_spinner.stop();
	this.m_waitdialog.remove();
}

/**
 * @brief creates the dialog html
 */
wait_dialog.prototype.setup_ui = function() {
	var l_waitdialog = $('<div>');
	l_waitdialog.addClass('panzer_overlay');
	l_waitdialog.hide();

	var l_spinner = $('<div>');
	l_spinner.addClass('spinner');
	l_spinner.appendTo(l_waitdialog);

	// var l_text = $('<div>');
	// l_text.addClass('overlaytext');
	// l_text.text('Preparing file');
	// l_text.appendTo(l_waitdialog);

	this.m_waitdialog = l_waitdialog;
	this.m_waitdialog.appendTo($('body'));

	var opts = {
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
	var target = $(this.m_waitdialog).find('.spinner'); //document.getElementById('foo');
	this.m_spinner = new Spinner(opts).spin(target[0]);
}

/**
 * @brief shows the wait dialog
 */
wait_dialog.prototype.show = function() {
	this.m_waitdialog.show();
}

/**
 * @brief hides the wait dialog and destroys it
 */
wait_dialog.prototype.hide = function() {
	this.m_waitdialog.hide();

	// Destroy the wait dialog on hide
	this.destroy();
}