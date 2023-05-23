var output_device_tab = {
	//
	// General Methods
	//
	setup_ui: function(pPrereleaseFlags)
	{
	    $('#config-navs').append("<li id='tabs-output-device-tab'><a href='#tabs-output-device'>" + $.i18n._('nixps-outputdevice.title') + "</a></li>");
	},
	
	enable_handlers: function()
	{
		$("#tabs-output-device-tab").on("click", function(event, data) {
			document.location.href = "/portal.cgi?output_device=setup";
		});
	}
}