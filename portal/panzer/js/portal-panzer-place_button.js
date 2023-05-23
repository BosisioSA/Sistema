/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/


// Groups tool buttons.
//
// Parameters:
//   - p_tools : The tools (array).
//
panzer.portal.place_button = function (p_options)
{
	this.m_options = p_options;
};


// Sets up the button.
//
// Parameters:
//   - p_$parent : jQuery UI object that will contain the group
//
panzer.portal.place_button.prototype.setup_ui = function (p_$parent, p_edition_pane)
{
    var l_this = this;
	var l_link = $("<button>place</button>");
	l_link.button({ text: true });
	l_link.css({
		'padding-top': '0'
	});

	p_$parent.append(l_link);
	
	l_link.bind('click', function(p_event) {
		panzer.portal.place_button.place_action();
	});
};

panzer.portal.place_button.place_action = function() {
	var jobid = panzer.get_application().get_job_info_panel().get_selected_job_id();
	var datablob = api.panzer.jobinfo.getdatablob(jobid);

    $('#layout .filelist .element').removeClass('selected');

    var l_$label_layer = $("#layout .labellayer");
    l_$label_layer.empty();
    panzer_layout_edition_sheet.m_labels = [];
    panzer_layout_edition_sheet.m_orders = panzer_filelist.get_orders();
    
    var l_job = {
        mediawidth: parseFloat(datablob.media_size), 
        orders: panzer_layout_edition_sheet.get_orders(),
        jobmedia: panzer_layout_edition_sheet.get_media_id()
    };

    $.freeze('');

    var l_eyemark_settings = {
		reference: 'layout',
		topmark: true,
		topmarkpos: 'right',
		topx: 8.5,
		topy: parseFloat(datablob.vertical_margin),
		topw: 8.5,
		toph: 8.5,
		botmark: false,
		botmarkpos: 'left',
		botx: 8.5,
		boty: 0.0,
		botw: 8.5,
		both: 8.5,
        rowbased: false
	};

	var l_precut_settings = {
		precut_left_offset: null,
		precut_top_offset: null
	};


    var l_settings = {
        verticalspacing: parseFloat(datablob.vertical_margin),
		verticalexact: true,
		horizontalspacing: parseFloat(datablob.horizontal_margin),
		horizontalexact: true,	
		fixedmediamargins: false,
		fixedleft: 0.0,
		fixedright: 0.0
	};

	var l_calculation_settings = {
		set_layout_height: false,
		set_height: 'max',
		layout_height_max: 756,
		layout_height_exact: 756
	};

	panzer.MAX_SHEET_HEIGHT = parseFloat(datablob.sheet_max_height);
	panzer.MIN_SHEET_HEIGHT = parseFloat(datablob.sheet_min_height);


    panzer.layout_job(l_job, l_settings, l_precut_settings, l_eyemark_settings, l_calculation_settings, function (p_result)
    {
        panzer.update_eyemarks(p_result, l_eyemark_settings, function (p_updated_layout) 
        {
            $.thaw();
            panzer_layout_edition_sheet.set_layout(p_result);
        });
    });
}
