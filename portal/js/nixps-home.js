/* NiXPS Home Pane JavaScript                                        */
/*                                                                   */
/* Copyright 2012, NiXPS (www.nixps.com)                             */
/*********************************************************************/

// *** My Approvals Component ***
function my_approvals_component()
{
	//
	// Settings
	//
	this.m_context = undefined;

	this.m_results = undefined;

	this.currentUser = undefined;

    // the refreshRate in miliseconds
    this.refreshRate = 15000; 
}
	
my_approvals_component.prototype.setup_ui = function(context)
{
	this.m_context = $(context);
	this.m_context.append(
				"<div class='my-approvals-pane'>" +
					"<div class='nixps-widget'>" +
						"<div class='nixps-widget-title'>" + $.i18n._('nixps-cloudflow-home.asset_list') + " <a href='#' id='rss'><img style='width:14px;height:14px;margin-bottom:4px;opacity:0.5' src='/portal/images/rss.png' alt='RSS'></a></div>" +
						"<div class='nixps-widget-content asset-properties'>" +
						"</div>" +
					"</div>" +
				"</div>"
	);
	this.refresh(this.m_results);
};


my_approvals_component.prototype.view_asset = function(pAsset) {
    if ($.isPlainObject(pAsset.cloudflow) && typeof pAsset.cloudflow.file === "string" && pAsset.cloudflow.file.length > 0 ) {
        window.location = "?asset=" + encodeURIComponent(pAsset.cloudflow.file) + "&sub=";
    }
};

my_approvals_component.prototype.refresh = function()
{
	api_async.rss.get_pending_approvals_url(function (p_data) { 
		$('#rss').attr('href', p_data.url);
	});
	
	var that = this;
    $.when(nixps.cloudflow.User.get()).done(function (user) {
        that.currentUser = user.getUserObject();
        $(that.m_context).find('.nixps-widget-content').empty().IconView();
        that.query = ["iterations.assessment", "equal to", "pending", "and", "iterations.participants.email_address", "equal to", that.currentUser.email];
        that.draw();
    });
};

my_approvals_component.prototype.draw = function () {
    var that = this;
	api_async.approval.list_with_options
	(
		that.query,
        [],
		[],
        {maximum: 350},
		function (pResults)
		{
			var assetURLs = [];
			if ($.isArray(pResults.results) && pResults.results.length > 0)
			{
				for (var countEntries = 0; countEntries < pResults.results.length; ++countEntries)
				{
					var approvalEntry = pResults.results[countEntries];
					var approvalIteration = approvalEntry.iterations[approvalEntry.iterations.length - 1];
					if (approvalIteration.assessment === "pending")
					{
						// the last entry is pending indeed
						for (var countParticipants = 0; countParticipants < approvalIteration.participants.length; ++countParticipants)
						{
							var participant = approvalIteration.participants[countParticipants];
							if (participant.email_address === that.currentUser.email)
							{
								for (var countReferences = 0; countReferences < approvalEntry.references.length; ++countReferences)
								{
									if (assetURLs.indexOf(approvalEntry.references[countReferences]) === -1)
									{
										assetURLs.push(approvalEntry.references[countReferences]);
                        			}
								}
							}
						}
					}
				}
			}
			if (assetURLs.length !== 0)
			{
				api_async.asset.list_with_options
				(
					["cloudflow.part", "in", assetURLs],
					[],
					["url", "sub", "cloudflow", "thumb", "approvals", "modtime", "filetype"],
					{"maximum" : 200},
					function(pResults)
					{
						$(that.m_context).find('.nixps-widget-content').IconView("option", "files", pResults.results)
                                                                       .off('iconviewopen')
                                                                       .on('iconviewopen', function(pEvent, pData) {
                                                                            that.view_asset(pData);
                                                                       });
                        that.triggerTimer();
					}
				);
			}
		}
	);
};

my_approvals_component.prototype.triggerTimer = function() {
    var that = this;
    var id = setTimeout(function() {that.draw(); }, that.refreshRate);
    return id;
};

// *** Panzer Component ***
function panzer_home_component()
{
	this.m_context = undefined;
}
	
panzer_home_component.prototype.setup_ui = function(context)
{
	this.m_context = $(context);
	this.m_context.append(
				"<div class='panzer-home-pane'>" +
					"<div class='nixps-widget'>" +
						"<div class='nixps-widget-title'>PANZER</div>" +
						"<div class='nixps-widget-content'>" +
							"LAYOUT NAME <input id='panzer-new-layout-name'> <a class='green-button' id='panzer-new-layout-button'>CREATE LAYOUT</a>" +
						"</div>" +
					"</div>" +
				"</div>"
	);
	this.refresh(this.m_results);

	$('#panzer-new-layout-button').click(function(e) {
		home_pane.hide();
		$('.panzer-pane').show();
		panzer.set_application(new panzer.portal.application());
		panzer.get_application().set_api(new panzer.portal.api());
		var l_job = new panzer.portal.job();
		l_job.create_with_url("PP_FILE_STORE/Layouts", $('#panzer-new-layout-name').val());
		l_job.save(function (pJobRecord)
		{
			var jobid = pJobRecord._id;
			if ($.isEmptyObject(api.panzer.jobinfo.getdatablob(jobid))) {
				var konica_defaults = {
					"media_size": "850.3937007874016",
					"sheet_max_height": "1984.2519685039372",
					"sheet_min_height": "1417.3228346456694",
					"horizontal_margin": "28.34645669291339",
					"vertical_margin": "28.34645669291339"	   			
				};

				api.panzer.jobinfo.setdatablob(jobid, konica_defaults);
			}
			window.location = '/portal.cgi?cloudflow=PP_FILE_STORE/Layouts/' + encodeURIComponent($('#panzer-new-layout-name').val());
		});
	});
};

panzer_home_component.prototype.refresh = function()
{
};


function show_panzer_home() {
	top_pane.set_active("#printPlannerSection");

	$('body').append("<div class='home-pane' style='display: block;'>"
		+ "<div id='home-welcome'>"
		   + "<div id='home-widgets'>"
		   + "</div>"
		+ "</div>"
	+ "</div>");

	license.check('lms', function (success) {
		if (success) {
			var l_panzer = new panzer_home_component();
			l_panzer.setup_ui("#home-widgets");
		}
	});
};

// *** Home component ***
function home_component()
{
	this.m_context = undefined;
	this.m_my_approvals = undefined;
	this.m_panzer = undefined;
}
	
//
// General Methods
//
home_component.prototype.setup_ui = function(context)
{
	this.m_context = $(context);
	this.m_context.append(
				"<div class='home-pane'>"+
				"<div class='global-msgs'></div>"+
				"<div id='home-welcome'>"+
				"</div>"+
				"</div>"
	);
	update_expiry_warning();
};
	
home_component.prototype.enable_handlers = function()
{	
/*
	this.m_context.find('.load_more').click($.proxy(this.load_more_logs,this));
	this.m_context.find('.load_more').css("cursor", "pointer");
	this.m_context.find('.live_updating').click($.proxy(this.change_live_updating,this));
	this.m_context.find('.live_updating').css("cursor", "pointer");
	this.m_context.find('#log-level').change($.proxy(this.change_log_level,this));
	this.m_context.find('#log-level').css("cursor", "pointer");
	this.m_context.find('#log-save').click($.proxy(this.save_logs,this));
	this.m_context.find('#log-save').css("cursor", "pointer");
*/
};

home_component.prototype.show = function(welcome_text, is_external)
{
	if (welcome_text !== undefined) {
		$('#home-welcome').html(welcome_text);
		$('#home-welcome').show();
	} else {
		$('#home-welcome').hide();
	}
	
	if (is_external) {
		$('#home-welcome').css('margin-bottom', '0px');
		$('.home-pane').css('top', '32px');
		$('.home-pane').css('bottom', '0px');
		$('.home-pane').css('left', '0px');
		$('.home-pane').css('right', '0px');
	}
	
	this.m_my_approvals = new my_approvals_component();
	this.m_my_approvals.setup_ui("#home-widgets");

	$('.home-pane').show();
	top_pane.set_title("CLOUDFLOW HOME");
};

home_component.prototype.hide = function()
{
	$('.home-pane').hide();
};


// === static + show function
var home_pane = new home_component();

function init_home_pane()
{
	home_pane.setup_ui('body');
}

function show_home_pane(welcome_text, is_external)
{
	nixps.cloudflow.License.get().then(function(license) {
		if ((license.check('portal') === false) && (license.check('quantumrip') === true)) {
			window.location = '/standalone_rip.html';
		} else if (license.check('max_cpu') === true) {
			home_pane.show(welcome_text, is_external);
		} else {
			api.not_licensed();
		}
	});
}

function show_cloudflow_pane(p_id, p_show_portal_bar)
{
	if (!p_show_portal_bar) {
		$('#portal-bar').remove();
		$('#title-flap').remove();
		$('.panzer-pane').css('top', 0);
	}
	panzer.get_application().load_asset(
		p_id,
		function ()
		{
			panzer.get_jobinfo_cgi().open_job_layout(p_id);
			$('.panzer-pane').show();
		});
}
