/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, Option, namespace, nixps*/


(function () {

	namespace("nixps.patchplanner");


	// Tool that allows the user to select a particular zoom level.
	//
	nixps.patchplanner.tool_zoom_level = function (p_tools)
	{
		this.m_edition_pane = null;
		this.m_$select_zoom = null;
	    // nothing to do
	};



	nixps.patchplanner.tool_zoom_level.prototype = {

		// Sets up the tool UI.
		// Override if necessary.
		//
		// Parameters:
		//   - p_$parent : jQuery UI object that will contain the button
		//
		setup_tool_button: function (p_$parent)
		{
		    var l_this = this;
		    l_this.m_$select_zoom = $('<select class="zoomlevel">');
		    p_$parent.append(this.m_$select_zoom);

		    [5, 10, 25, 50, 75, 100, 150, 200, 400].forEach(function (p_zoom_level)
		    {
		        var l_$option = $(new Option(p_zoom_level + '%', p_zoom_level / 100));

		        if (p_zoom_level === 100)
		        {
		            l_$option.attr('selected', 'selected');
		        }

		        l_this.m_$select_zoom.append(l_$option);
		    });
			
			// TODO
		    // l_this.m_$select_zoom.append(new Option('fit frame', 'fit'));
		},


		// Sets up the group.
		//
		// It also calls setup_ui on the included buttons.
		//
		// Parameters:
		//   - p_$parent : jQuery UI object that will contain the button
		//
		setup_ui: function (p_$parent, p_edition_pane)
		{
		    this.m_edition_pane = p_edition_pane;
		    this.setup_tool_button(p_$parent);
		    this.enable_handlers();
		},


		// Sets up the event handlers.
		//
		enable_handlers: function ()
		{
		    var that = this;

		    this.m_edition_pane.on('editorzoomchanged', function(pEvent, pZoom) {
		    	that.m_$select_zoom.val(pZoom.zoom);
		    });

		    this.m_$select_zoom.on('change', function (p_event)
		    {
		        var zoom = that.m_$select_zoom.val();

		        if (zoom === 'fit')
		        {
		        	// TODO
		            // panzer.get_application().get_edition_state().zoom_fit();
		        }
		        else
		        {
		        	that.m_edition_pane.editor('option', 'zoom', zoom);
		        }
		    });
		    
		    // $('#layout').bind('zoomchanged', function(p_event, p_new_zoom)
		    // {
		    //     // off the change event
		    //     l_this.m_$select_zoom.off('change');
		    //     var l_zoom_set = false;
		    //     l_this.m_$select_zoom.val(p_new_zoom);

		    //     if (l_this.m_$select_zoom.val() !== p_new_zoom.toString()) // implicit conversion from int to string
		    //     {
		    //         l_this.m_$select_zoom.val('fit');
		    //     }

		    //     l_this.m_$select_zoom.on('change');
		    // });    
		}

	};

}());
