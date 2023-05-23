/*********************************************************************/
/* NiXPS Portal API													 */
/*                                                                   */
/* Copyright 2012, NiXPS (www.nixps.com)                             */
/*********************************************************************/

/***************************************************************************************************************************************
* Users API
*/

// Convenience Function
portal_api_users.prototype.query_user = function(dict)
{
	var lCommand={ "method" : "users.list_contacts" };
	this.m_return = {};

	$.ajax({
	  type: 'POST',
	  url: this.m_parent.m_address,
	  data: JSON.stringify(lCommand),
	  success: $.proxy(function(data) {
	  		this.m_return = [];
			for(i in data) {
				// Filter locally, later put that code in the server
				var patt = new RegExp(dict.term, "i");
				if (data[i].username == undefined)
					 data[i].username = data[i].email;
				var filtered = [];
				for(i in data) {
					if (patt.test(data[i].username) || (patt.test(data[i].fullname))) {
						filtered.push(data[i]);
					}
				}
			}
			this.m_return = filtered;
		},this),
	  async:false
	});
	
	return this.m_return;
}


/***************************************************************************************************************************************
 * Utils HTTP API
 */

// Legacy -- moved to utils.http_post
portal_api_utils_http.prototype.post = function(p_host,p_port,p_url,p_ssl,p_data,cb) {
	var dict = {
		method: 'utils.http.post',
		host: p_host,
		port: p_port,
		url: p_url,
		ssl: p_ssl,
		data:p_data
	};
	return this.m_parent.server_call(this, "utils/http/post", dict, cb);
}

/***************************************************************************************************************************************
 * Utils SQL API
 */

// Legacy -- moved to utils.sql_query
portal_api_utils_sql.prototype.query = function(p_db_url, p_query, p_params, cb) {
	var dict = {
		method: 'utils.sql.query',
		db_url: p_db_url,
		query: p_query,
		params: p_params
	};
	return this.m_parent.server_call(this, "utils/sql/query", dict, cb);
}

// Legacy -- moved to utils.sql_update
portal_api_utils_sql.prototype.update = function(p_db_url, p_queries, cb) {
	var dict = {
		method: 'utils.sql.update',
		db_url: p_db_url,
		queries: p_queries
	};
	return this.m_parent.server_call(this, "utils/sql/update", dict, cb);
}

/***************************************************************************************************************************************
 * Utils API
 */

function portal_api_utils(parent)
{
	this.m_parent = parent;
	this.http = new portal_api_utils_http(parent);
	this.sql = new portal_api_utils_sql(parent);
}

/***************************************************************************************************************************************
 * hub API
 */

// Convenience
portal_api_hub.run_async_waiter = function (p_workable_id, p_variable_names, p_callback, p_error_callback)
{
	api_async.hub.get_waiting_room_of_workable(
		p_workable_id,
		function (p_waiting_room) {
			if (p_waiting_room.collar.substr(0, 29) === 'com.nixps.quantum.form_input.') {
				api_async.hub.get_variables_from_workable(
					p_workable_id, p_variable_names,
					function (p_result) {
						api_async.hub.continue_workable_from_kiosk(
							p_workable_id, p_waiting_room.node, p_waiting_room.connector, 'success.0', [], {},
							function () {
								p_callback(p_result.variables);
							},
							p_error_callback);
					},
					p_error_callback);
			} else if (p_waiting_room.collar.substr(0, 36) === 'com.nixps.quantum.unhandled_problem.') {
				if (p_error_callback) {
					p_error_callback();
				}
			} else {
				portal_api_hub.run_async_waiter(p_workable_id, p_variable_names, p_callback, p_error_callback);
			}
		},
		p_error_callback);
}

// Convenience
portal_api_hub.prototype.run_from_whitepaper_with_variables = function (p_whitepaper_name, p_input_name, p_input_variables, p_output_variable_names, p_callback, p_error_callback)
{
	api_async.hub.start_from_whitepaper_with_variables(
		p_whitepaper_name, p_input_name, p_input_variables,
		function (p_result) {
			portal_api_hub.run_async_waiter(p_result.workable_id, p_output_variable_names, p_callback, p_error_callback);
		},
		p_error_callback);
}


/***************************************************************************************************************************************
 * UI API
 */
function portal_api_ui(p_parent) { this.m_parent = p_parent; }
api_sync.ui = new portal_api_ui(api_sync);
api_async.ui = new portal_api_ui(api_async);

// convenience
function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    } else var expires = "";
    document.cookie = escape(name) + "=" + escape(value) + expires + "; path=/";
}

// convenience
portal_api_ui.prototype.set_cookie = function(data) 
{
    var date = new Date();
    date.setTime(date.getTime() + (2 * 24 * 60 * 60 * 1000));
    var expires = "; expires=" + date.toGMTString();

 	document.cookie = 'user_id=' + escape(data.user_id) + expires + "; path=/";
 	document.cookie = 'user_hash=' + escape(data.user_hash) + expires + "; path=/";
 	document.cookie = 'expiration_date=' + escape(data.expiration_date) + expires + "; path=/";
}

// convenience
portal_api_ui.prototype.set_workable_state_as_cookie = function(workable, whitepaper) 
{
    var date = new Date();
    date.setTime(date.getTime() + (2 * 24 * 60 * 60 * 1000));
    var expires = "; expires=" + date.toGMTString();

 	document.cookie = 'workable=' + escape(workable) + expires + "; path=/";
 	document.cookie = 'whitepaper=' + escape(whitepaper) + expires + "; path=/";
}

// convenience
portal_api_ui.prototype.convert_form_to_json = function(form) 
{
	var array = jQuery(form).serializeArray();
	var json = {};

	jQuery.each(array, function() {
		json[this.name] = this.value || '';
	});

	return {
		variables: json
	};
}


/***************************************************************************************************************************************
 * DataConnector API
 */

// Convenience
portal_api_dataconnector.prototype.parse_date = function(p_string, p_callback)
{
    var l_comp = p_string.replace(/[ :]/g, '/').split('/');
    var l_result = new Date;
    l_result.setMonth(parseInt(l_comp[0], 10) - 1);
    l_result.setDate(parseInt(l_comp[1], 10));
    l_result.setFullYear(parseInt(l_comp[2], 10));
    l_result.setHours(parseInt(l_comp[3], 10));
    l_result.setMinutes(parseInt(l_comp[4], 10));
    l_result.setSeconds(parseInt(l_comp[5], 10));
    if (p_callback)
        p_callback(l_result);
    return l_result;
}

// Convenience
portal_api_dataconnector.prototype.format_date = function (p_date, p_callback)
{
    var l_result = '';
    if (p_date.getMonth() < 9)
        l_result += '0';
    l_result += (p_date.getMonth() + 1) + '/';
    if (p_date.getDate() < 10)
        l_result += '0';
    l_result += p_date.getDate() + '/' + p_date.getFullYear() + ' ';
    if (p_date.getHours() < 10)
        l_result += '0';
    l_result += p_date.getHours() + ':';
    if (p_date.getMinutes() < 10)
        l_result += '0';
    l_result += p_date.getMinutes() + ':';
    if (p_date.getSeconds() < 10)
        l_result += '0';
    l_result += p_date.getSeconds();
    if (p_callback)
        p_callback(l_result);
    return l_result;
}


// Shows a message in the notification area
//   p_title     : title of the alert
//   p_msg       : the message
//   p_id        : the class of the child div in #notify-area; if not specified or undefined, is "default" for non-closeable or "closeable"
//   p_may_close : true if the user may close the notification 
portal_api_base.prototype.message = function (p_title, p_msg, p_id, p_may_close)
{
	var l_click_handler = function(e,instance) {};
	var l_default_id = "default";
	
	if (p_may_close === true) {
		l_click_handler = function (e, instance) {
			instance.close();
		};
		l_default_id = "closeable";
	}

	if (p_id === undefined) {
		p_id = l_default_id;
	}
	
	if ($('#notify-area').length > 0) {
		if (p_may_close)
			$('#notify-area').notify("create", p_id, { title:p_title, text:p_msg }, { expires:false, click:l_click_handler });
		else
			$('#notify-area').notify("create", p_id, { title:p_title, text:p_msg }, { click:l_click_handler });
	}
};

portal_api_base.prototype.not_licensed = function ()
{
    debugger;
    api_async.preferences.get_for_current_user('com.nixps.general.prerelease','', function(pref) {
        if($.isPlainObject(pref.preferences) && pref.preferences.new_ui === false) {
            // if pref is old go to dark style, default white
            if ($.inArray('ADMIN', sPermissions) > -1) {
                window.location = '/portal_no_license_admin.html';
            } else {
                window.location = '/portal_no_license_user.html';
            }
        } else {
            if ($.inArray('ADMIN', sPermissions) > -1) {
                window.location = '/portal_no_license_admin_new.html';
            } else {
                window.location = '/portal_no_license_user_new.html';
            }
        }
    }, function(pError) {
        // default, fallback go to white style
        if ($.inArray('ADMIN', sPermissions) > -1) {
            window.location = '/portal_no_license_admin_new.html';
        } else {
            window.location = '/portal_no_license_user_new.html';
        }
    });
}


portal_api_base.prototype.session_expired = function ()
{
	window.location = '/?login=%2a';
}

function portal_license()
{
	this.check = function (name, callback) {
		api_async.license.get(function (data) {
            var now = Date.now() / 1000;

			if ((data != null) && (data.machines !== undefined)) {
				for (var countMachine = 0; countMachine < data.machines.length; ++countMachine) {
					var machine = data.machines[countMachine];
					for (var countLicense = 0; countLicense < machine.licenses.length; ++countLicense) {
						var license = machine.licenses[countLicense];
						if (license.code === name) {
							var ok = true;
							if ((license.start !== undefined) && (license.start > now)) {
								ok = false;
							}
							if ((license.start !== undefined) && (license.end < now)) {
								ok = false;
							}
							if (ok) {
								callback(true);
								return;
							}
						}
					};
				};
			}
			
			callback(false);
		});
	};

	this.check_sync = function (name) {
        var now = Date.now() / 1000;
		var data = api_sync.license.get();
		if ((data != null) && (data.machines !== undefined)) {
			for (var countMachine = 0; countMachine < data.machines.length; ++countMachine) {
				var machine = data.machines[countMachine];
				for (var countLicense = 0; countLicense < machine.licenses.length; ++countLicense) {
					var license = machine.licenses[countLicense];
					if (license.code === name) {
						var ok = true;
						if ((license.start !== undefined) && (license.start > now)) {
							ok = false;
						}
						if ((license.start !== undefined) && (license.end < now)) {
							ok = false;
						}
						if (ok) {
							return true;
						}
					}
				};
			};
		}

		return false;
	};

	this.check_multiple = function (names, callback) {
		api_async.license.get(function (data) {
			var found = false;
            var now = Date.now() / 1000;

			var results = {};
			for (var countNames = 0; countNames < names.length; ++countNames) {
				results[names[countNames]] = false;
			}

			if ((data != null) && (data.machines !== undefined)) {
				for (var countMachine = 0; countMachine < data.machines.length; ++countMachine) {
					var machine = data.machines[countMachine];
					for (var countLicense = 0; countLicense < machine.licenses.length; ++countLicense) {
						var license = machine.licenses[countLicense];
						for (var countNames = 0; countNames < names.length; ++countNames) {
							if (license.code === names[countNames]) {
								var ok = true;
								if ((license.start !== undefined) && (license.start > now)) {
									ok = false;
								}
								if ((license.start !== undefined) && (license.end < now)) {
									ok = false;
								}
								if (ok) {
									results[names[countNames]] = true;
								}
							}
						}
					};
				};
			}
			
			callback(results);
		});
	};

	this.get = function (name, callback) {
		api_async.license.get(function (data) {
			var found = false;
            var now = Date.now() / 1000;

			var totalCount = -1;
			if ((data != null) && (data.machines !== undefined)) {
				for (var countMachine = 0; countMachine < data.machines.length; ++countMachine) {
					var machine = data.machines[countMachine];
					for (var countLicense = 0; countLicense < machine.licenses.length; ++countLicense) {
						var license = machine.licenses[countLicense];
						if (license.code === name) {
							var ok = true;
							if ((license.start !== undefined) && (license.start > now)) {
								ok = false;
							}
							if ((license.start !== undefined) && (license.end < now)) {
								ok = false;
							}
							if (ok) {
								if (name === 'max_user') {
									if (license.value === undefined) {
										totalCount = 0;
									} else if (totalCount !== 0) {
										totalCount = Math.max(totalCount, license.value);
									}
								} else {
									if (license.value === undefined) {
										if (totalCount < 0) {
											totalCount = 1;
										} else {
											totalCount += 1;
										}
									} else {
										totalCount += license.value;
									}
								}
							}
						}
					};
				};
			}

			callback(totalCount);
		});
	};
	}


var license = new portal_license();


function user_has_permission(pPermission)
{
    if (sPermissions.indexOf('ADMIN') >= 0) {
        return true;
    } else if (sPermissions.indexOf('ALL') >= 0) {
        return pPermission != 'ADMIN'; // everything except ADMIN
    } else {
	   return sPermissions.indexOf(pPermission) >= 0;
    }
}
