/*********************************************************************/
/* NiXPS Logging Configuration Tab                                   */
/*                                                                   */
/* Copyright 2012, NiXPS (www.nixps.com)                             */
/*********************************************************************/
var config_log_tab;

function show_logging(filter)
{
	init_config().then(function() {
	    config_pane.show();
	    if (filter.length > 0)
	    {
	        config_log_tab.Log({
	            filter: filter
	        });
	    }
	    config_log_tab.Log('load_logs');
	    $('#config-tabs').tabs('select',1);
	});
}
