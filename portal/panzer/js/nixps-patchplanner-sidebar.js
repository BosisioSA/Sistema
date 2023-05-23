/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, nixps, namespace */


(function() {

	namespace("nixps.patchplanner");

	nixps.patchplanner.sidebar = function () 
	{};


	nixps.patchplanner.sidebar.prototype = {

		setup_ui: function () 
		{
		    var l_this = this;

			// create the sidebar
			var sidebar = $('<div>').addClass('sidebar').appendTo($('#layout .layoutcontent'));

			$('<div>').addClass('filelist').appendTo(sidebar).filelist();

			$('#layout .sidebar').prepend("<div class='filelisttoolbar'>");
			$('#layout .filelisttoolbar').FileListToolbar();
		},

		enable_handlers: function ()
		{
			$('#layout .sidebar').resizable({
				handles: "e",

				stop: function ()
		        {
					// Fix resizable behaviour, will set the height to a fixed amount of pixels
					$('#layout .sidebar').css('height', '');
				}
			});
		},

		get_filelist: function()
		{
			return $(':nixps-patchplanner-filelist');
		}

	};

}());
