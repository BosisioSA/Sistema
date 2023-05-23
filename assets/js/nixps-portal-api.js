/*********************************************************************/
/* NiXPS Portal API													 */
/*                                                                   */
/* Copyright 2012, NiXPS (www.nixps.com)                             */
/*********************************************************************/


/***************************************************************************************************************************************
* Users API
*/
function portal_api_users(parent)
{
	this.m_parent=parent;
}

portal_api_users.prototype.get_assets_with_state = function(pState,cb)
{
	var dict = {
		method: "users.get_assets_with_state",
		state: pState
	};
	return this.m_parent.server_call(this,dict,cb);
}

portal_api_users.prototype.get_contact_by_id = function(userid,cb)
{
	var dict = {
		method: "users.get_contact_by_id",
		contact_id: userid
	};
	return this.m_parent.server_call(this,dict,cb);
}

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

portal_api_users.prototype.list_all = function(cb) {
	var dict = {
		method: "users.list_users",
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_users.prototype.add = function(data,cb) {
	var dict = {
		method: "users.add_user",
		dict: data
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_users.prototype.update = function(id,data,cb) {
	var dict = {
		method: "users.update_user",
		user_id: id,
		dict: data
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_users.prototype.remove = function(id,cb) {
	var dict = {
		method: "users.remove_user",
		user_id: id
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_users.prototype.get_all_permissions = function(cb) {
	var dict = {
		method: "users.get_all_permissions"
	};
	return this.m_parent.server_call(this, dict, cb);
}

			
/***************************************************************************************************************************************
 * Template API
 */
function portal_api_templates(parent)
{
	this.m_parent=parent;
}

/**
 * Template CRUD
 * @param json The JSON blob for the initial chain
 */
portal_api_templates.prototype.list_all = function(cb) {
	var dict = {
		method: "templates.list_all",
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_templates.prototype.add = function(data,cb) {
	var dict = {
		method: "templates.add",
		dict: data
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_templates.prototype.update = function(id,data,cb) {
	var dict = {
		method: "templates.update",
		template_id: id,
		dict: data
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_templates.prototype.remove = function(id,cb) {
	var dict = {
		method: "templates.remove",
		template_id: id
	};
	return this.m_parent.server_call(this, dict, cb);
}


/***************************************************************************************************************************************
 * EventHandlers API
 */
function portal_api_eventhandlers(parent)
{
	this.m_parent=parent;
}

/**
 * Template CRUD
 * @param json The JSON blob for the initial chain
 */
portal_api_eventhandlers.prototype.list_all = function(cb) {
	var dict = {
		method: "eventhandlers.list_all",
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_eventhandlers.prototype.add = function(data,cb) {
	var dict = {
		method: "eventhandlers.add",
		dict: data
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_eventhandlers.prototype.update = function(id,data,cb) {
	var dict = {
		method: "eventhandlers.update",
		eventhandler_id: id,
		dict: data
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_eventhandlers.prototype.remove = function(id,cb) {
	var dict = {
		method: "eventhandlers.remove",
		eventhandler_id: id
	};
	return this.m_parent.server_call(this, dict, cb);
}


/***************************************************************************************************************************************
 * Approvalchain API
 */
function portal_api_approvalchains(parent)
{
	this.m_parent=parent;
}

/**
 * Applies an approval chain to the asset
 * @param approvalchain_id the approval chain id
 * @param asset_url the asset id
 */
portal_api_approvalchains.prototype.apply_approvalchain_to_asset = function(approvalchain_id, asset_url, cb) {
	var dict = {
		method: "approvalchains.apply_approvalchain_to_asset",
		approvalchain_id: approvalchain_id,
		url: asset_url
	};
	return this.m_parent.server_call(this,dict,cb);
}

/**
 * Creates a new approval chain
 * @param json The JSON blob for the initial chain
 */
portal_api_approvalchains.prototype.list_all = function(cb) {
	var dict = {
		method: "approvalchains.list_all",
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_approvalchains.prototype.add = function(data,cb) {
	var dict = {
		method: "approvalchains.add",
		dict: data
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_approvalchains.prototype.update = function(id,data,cb) {
	var dict = {
		method: "approvalchains.update",
		approvalchain_id: id,
		dict: data
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_approvalchains.prototype.remove = function(id,cb) {
	var dict = {
		method: "approvalchains.remove",
		approvalchain_id: id
	};
	return this.m_parent.server_call(this, dict, cb);
}



/**
 * Checks if an asset has an approval chain
 * @param asset_url the asset id
 * @return true if the asset has an approval chain
 */
portal_api_approvalchains.prototype.asset_has_approvalchain = function(asset_url, cb) {
	return ! $.isEmptyObject(this.get_asset_approvalchain(asset_url,cb));
}

/**
 * Gets the approval chain for an assset
 * @param asset_url the asset id
 * @return the chain linked to that asset
 */
portal_api_approvalchains.prototype.get_asset_approvalchain = function(asset_url, cb) {
	var dict = {
		method: "approvalchains.get_approvalchain_for_asset",
		url: asset_url
	};
	return this.m_parent.server_call(this, dict, cb);
}

/**
 * Cancels the running approval chain for that asset
 * @param asset_url the asset id
 */
portal_api_approvalchains.prototype.cancel_asset_approvalchain = function(asset_url, cb) {
	var dict = {
		method: "approvalchains.cancel_asset_approvalchain",
		url: asset_url
	};
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Assets API
 */
function portal_api_assets(parent)
{
	this.m_parent=parent;
}

/**
 * search assets based on text
 * @param asset_url the asset id
 */
portal_api_assets.prototype.search_assets = function(ctx, cb) {
	var dict = {
		method: "assets.search_assets",
		context: ctx
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_assets.prototype.get_folders = function(ctx, cb) {
	var dict = {
		method: "assets.get_folders",
		context: ctx
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_assets.prototype.get_files_in_folder = function(ctx, cb) {
	var dict = {
		method: "assets.get_files_in_folder",
		context: ctx
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_assets.prototype.search_files_in_folder = function(ctx, search_string, cb) {
	var dict = {
		method: "assets.search_files_in_folder",
		context: ctx,
		search_string: search_string
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_assets.prototype.get = function(id, cb) {
	var dict = {
		method: "assets.get",
		_id: id
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_assets.prototype.get_with_url = function(url, sub, cb, err_cb) {
	var dict = {
		method: "assets.get_with_url",
		url: url,
		sub: sub
	};
	return this.m_parent.server_call(this, dict, cb, err_cb);
}

portal_api_assets.prototype.get_metadata = function(url, sub, cb) {
	var dict = {
		request: "metadata",
		url: url
	};
	if (sub != undefined)
	   dict.sub = sub;
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_assets.prototype.get_proofscope_url = function(proofscope_id, cb) {
    var dict = {
          method: "portal.get_proofscope_url",
          proofscope_id: proofscope_id
    };
    return this.m_parent.server_call(this, dict, cb);
}


/***************************************************************************************************************************************
 * Attributes API
 */
function portal_api_attributes(parent) {
	this.m_parent = parent;
}

/**
 * @return a list of all attributes
 */
portal_api_attributes.prototype.add = function(p_name) {
	var dict = {
		method: "attributes.add",
		attribute_name: p_name
	};
	return this.m_parent.server_call(this, dict);
}

/**
 * @return a list of all attributes
 */
portal_api_attributes.prototype.list_all = function() {
	var dict = {
		method: "attributes.list_all"
	};
	return this.m_parent.server_call(this, dict);
}

/***************************************************************************************************************************************
 * Proofscope API
 */
function portal_api_proofscope(parent) {
    this.m_parent = parent;
}

portal_api_proofscope.prototype.render = function(p_url, p_cb) {
    var l_dict = {
        method: "proofscope.render",
        url:    p_url
    };
    return this.m_parent.server_call(this, l_dict, p_cb);
}

portal_api_proofscope.prototype.invite = function(p_url, p_file, p_email_addresses, p_host, p_msg, p_permissions, p_expdate, p_cb, p_error_cb) {
    var l_dict = {
        method: "proofscope.invite",
        email:  p_email_addresses,
        url:    p_url,
        file:   p_file,
        host:   p_host,
        msg:    p_msg,
        perm:   p_permissions,
		exp:    p_expdate
    };
    return this.m_parent.server_call(this, l_dict, p_cb, p_error_cb);
}

/***************************************************************************************************************************************
 * Scopes API
 */
function portal_api_scopes(parent)
{
	this.m_parent=parent;
}

portal_api_scopes.prototype.list_all = function(cb) {
	var dict = {
		method: "scopes.list_all",
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_scopes.prototype.add = function(data,cb) {
	var dict = {
		method: "scopes.add",
		dict: data
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_scopes.prototype.update = function(id,data,cb) {
	var dict = {
		method: "scopes.update",
		scope_id: id,
		dict: data
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_scopes.prototype.remove = function(id,cb) {
	var dict = {
		method: "scopes.remove",
		scope_id: id
	};
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Contacts API
 */
function portal_api_contacts(parent)
{
	this.m_parent=parent;
}

portal_api_contacts.prototype.list_all = function(cb) {
	var dict = {
		method: "users.list_contacts",
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_contacts.prototype.add = function(data,cb) {
	var dict = {
		method: "users.add_contact",
		dict: data
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_contacts.prototype.update = function(id,data,cb) {
	var dict = {
		method: "users.update_contact",
		contact_id: id,
		dict: data
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_contacts.prototype.remove = function(id,cb) {
	var dict = {
		method: "users.remove_contact",
		contact_id: id
	};
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * License API
 */
function portal_api_license(parent)
{
	this.m_parent=parent;
}

portal_api_license.prototype.download_new = function(customer_code,serial,cb,error_cb) {
	var dict = {
		method: "license.download_new",
		customer_code: customer_code,
		serial: serial
	};
	return this.m_parent.server_call(this, dict, cb, error_cb);
}

portal_api_license.prototype.update = function(cb) {
	var dict = {
		method: "license.update"
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_license.prototype.reset = function(cb) {
	var dict = {
		method: "license.reset"
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_license.prototype.get = function(cb) {
	var dict = {
		method: "license.get"
	};
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Panzer - general API
 */
function portal_api_panzer(parent)
{
	this.m_parent = parent;
}

portal_api_panzer.prototype.get_registration = function(p_email, cb, err_cb) {
	var dict = {
		method: "panzer.get_registration",
        email:  p_email
	};
	return this.m_parent.server_call(this, dict, cb, err_cb);
}

portal_api_panzer.prototype.disable_registration = function(cb, err_cb) {
	var dict = {
		method: "panzer.disable_registration"
	};
	return this.m_parent.server_call(this, dict, cb, err_cb);
}
    
/***************************************************************************************************************************************
 * Panzer - costcalc API
 */
function portal_api_panzer_costcalc(parent)
{
	this.m_parent = parent;
}

portal_api_panzer_costcalc.prototype.list = function(cb) {
	var dict = {
		method: "panzer.costcalc.list"
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_costcalc.prototype.save = function(id, params, cb) {
	var dict = {
		method: "panzer.costcalc.save",
		record: { parameters: params }
	};
	if (id != null) {
		dict.record.id = id.toString();
	}
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Panzer - device API
 */
function portal_api_panzer_device(parent)
{
	this.m_parent = parent;
}

portal_api_panzer_device.prototype.get = function(id, cb) {
	var dict = {
		method: "panzer.device.get",
		id:     id
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_device.prototype.save = function(params, cb) {
	var dict = {
		method: "panzer.device.save",
		record: params
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_device.prototype.list = function(id, cb) {
	var dict = {
		method: "panzer.device.list"
	};
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Panzer - jobinfo API
 */
function portal_api_panzer_jobinfo(parent)
{
	this.m_parent = parent;
}

portal_api_panzer_jobinfo.prototype.sendpjl = function(ipaddress, port, cmd, cb) {
	// ipaddress and port may be undefined
	var dict = {
		method:  'panzer.jobinfo.sendpjl',
		command: cmd
	};
	if (ipaddress !== undefined) {
		dict.ip = ipaddres;
	}
	if (port !== undefined) {
		dict.port = port;
	}
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_jobinfo.prototype.get = function(jobid, cb) {
	var dict = {
		method: 'panzer.jobinfo.get',
		id:     jobid
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_jobinfo.prototype.remove = function(id, cb) {
	var dict = {
		method: 'panzer.jobinfo.remove',
		id:     id
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_jobinfo.prototype.save = function(parameters, cb) {
	var dict = {
		method: 'panzer.jobinfo.save',
		record: parameters
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_jobinfo.prototype.send_raw = function(ipaddress, port, cmd, cb) {
	var dict = {
		method:  'panzer.jobinfo.sendraw',
		command: cmd,
		ip:      ipaddress,
		port:    port
	};
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Panzer - layoutdb API
 */
function portal_api_panzer_layoutdb(parent)
{
	this.m_parent = parent;
}

portal_api_panzer_layoutdb.prototype.get = function(id, cb) {
	var dict = {
		method: 'panzer.layoutdb.get',
		id:     id
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layoutdb.prototype.remove = function(id, cb) {
	var dict = {
		method: 'panzer.layoutdb.remove',
		id:     id
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layoutdb.prototype.save = function(id, image, layout, orders, cb) {
	var savedlayout = {
		thumbnail: image,
		layout:    layout,
		orders:    orders
	};
	var dict = {
		method: 'panzer.layoutdb.save',
		record: { id: id, layout: savedlayout }
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layoutdb.prototype.list = function(cb) {
	var dict = {
		method: 'panzer.layoutdb.list'
	};
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Panzer - lmsstate API
 */
function portal_api_panzer_lmsstate(parent)
{
	this.m_parent = parent;
}

portal_api_panzer_lmsstate.prototype.list = function(cb) {
	var dict = {
		method: 'panzer.lmsstate.list'
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_lmsstate.prototype.save = function(id, state, cb) {
	var dict = {
		method: 'panzer.lmsstate.save',
		record: { lmsstate: state }
	};
	if (id) {
		dict.record.id = id.toString();
	}
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Panzer - media API
 */
function portal_api_panzer_media(parent)
{
	this.m_parent = parent;
}

portal_api_panzer_media.prototype.remove = function(id, cb) {
	var dict = {
		method: 'panzer.media.remove',
		id:     id
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_media.prototype.save = function(parameters, cb) {
	var dict = {
		method: 'panzer.media.save',
		record: parameters
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_media.prototype.get = function(id, cb) {
	var dict = {
		method: 'panzer.media.get',
		id:     id
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_media.prototype.list = function(cb) {
	var dict = {
		method: 'panzer.media.list'
	};
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Panzer - layout API
 */
function portal_api_panzer_layout(parent)
{
	this.m_parent = parent;
}

portal_api_panzer_layout.prototype.createlayout = function(params, cb) {
	var dict = {
		method:     'panzer.layout.createlayout',
		parameters: params
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layout.prototype.updateeyemarks = function(layout, eyemarks, cb) {
	var dict = {
		method:   'panzer.layout.updateeyemarks',
		eyemarks: eyemarks,
		layout:   layout
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layout.prototype.applymargins = function(layout, margins, minheight, cb) {
	var dict = {
		method:    'panzer.layout.applymargins',
		margins:   margins,
		layout:    layout,
		minheight: minheight
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layout.prototype.openfile = function(cb) {
	var dict = {
		method: 'panzer.layout.openfile'
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layout.prototype.inkcoverages = function(filepath, cb) {
	var dict = {
		method: 'panzer.layout.inkcoverages',
		path:   filepath
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layout.prototype.savelayoutdb = function(savedlayout, cb) {
	var dict = {
		method: 'panzer.layout.savelayoutdb',
		layout: savedlayout
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layout.prototype.restorelayoutdb = function(id, cb) {
	var dict = {
		method:     'panzer.layout.restorelayoutdb',
		parameters: id
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layout.prototype.savelayout = function(layout, cb) {
	var dict = {
		method:     'panzer.layout.savelayout',
		parameters: layout
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layout.prototype.exportpdf = function(layout_id, filepath, cb) {
	var dict = {
		method:    'panzer.layout.exportpdf',
		filepath:  filepath,
		layout:    { id: layout_id }
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layout.prototype.exportps = function(layout, filepath, cb) {
	var dict = {
		method:   'panzer.layout.exportps',
		filepath: filepath,
		layout:   layout
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layout.prototype.sendlayout = function(layout, cb) {
	var dict = {
		method: 'panzer.layout.sendlayout',
		layout: layout
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layout.prototype.sendqueue = function(layoutqueue, cb) {
	var dict = {
		method:      'panzer.layout.sendqueue',
		layoutqueue: layoutqueue,
		filepath:    ""
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_layout.prototype.exportqueueps = function(layoutqueue, cb) {
	var dict = {
		method:      'panzer.layout.exportqueueps',
		layoutqueue: layoutqueue,
		filepath:    ""
	};
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Panzer - preference API
 */
function portal_api_panzer_preference(parent)
{
	this.m_parent = parent;
}

portal_api_panzer_preference.prototype.list = function(cb) {
	var dict = {
		method: 'panzer.preference.list'
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_preference.prototype.save = function(id, params, cb) {
	var dict = {
		method: 'panzer.preference.save',
		record: { preferences: params }
	};
	if (id) {
		dict.record.id = id.toString();
	}
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Panzer - printqueue API
 */
function portal_api_panzer_printqueue(parent)
{
	this.m_parent = parent;
}

portal_api_panzer_printqueue.prototype.list = function(cb) {
	var dict = {
		method: 'panzer.printqueue.list'
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_printqueue.prototype.remove = function(queueid, cb) {
	var dict = {
		method: 'panzer.printqueue.remove',
		id:     queueid
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_printqueue.prototype.get = function(queueid, cb) {
	var dict = {
		method: 'panzer.printqueue.get',
		id:     queueid
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_panzer_printqueue.prototype.save = function(jobdata, cb) {
	var dict = {
		method:  'panzer.printqueue.save',
		jobdata: jobdata
	};
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Portal API
 */
function portal_api_portal(parent)
{
	this.m_parent = parent;
}

portal_api_portal.prototype.stats = function(cb) {
	var dict = {
		method: 'portal.get_stats'
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_portal.prototype.active_users = function(cb) {
	var dict = {
		method: 'portal.get_active_users'
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_portal.prototype.config = function(p_name, cb) {
	var dict = {
		request: 'config',
		name:    p_name
	};
	return this.m_parent.server_call(this, dict, cb);
}

portal_api_portal.prototype.version = function(cb) {
	var dict = {
		method: 'portal.version'
	};
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Utils HTTP API
 */

function portal_api_utils_http(parent)
{
	this.m_parent = parent;
}

portal_api_utils_http.prototype.post = function(p_host,p_port,p_url,p_ssl,p_data,cb) {
	var dict = {
		method: 'utils.http.post',
		host: p_host,
		port: p_port,
		url: p_url,
		ssl: p_ssl,
		data:p_data
	};
	return this.m_parent.server_call(this, dict, cb);
}

/***************************************************************************************************************************************
 * Utils API
 */

function portal_api_utils(parent)
{
	this.m_parent = parent;
	this.http = new portal_api_utils_http(parent);
}


/***************************************************************************************************************************************
 * Main API
 */
function portal_api_base()
{
    // settings
    this.m_address = "/portal.cgi";

	// modules
	this.users = new portal_api_users(this);
	this.approvalchains = new portal_api_approvalchains(this);
	this.eventhandlers = new portal_api_eventhandlers(this);
	this.assets = new portal_api_assets(this);
	this.scopes = new portal_api_scopes(this);
	this.contacts = new portal_api_contacts(this);
	this.attributes = new portal_api_attributes(this);
	this.license = new portal_api_license(this);
	this.templates = new portal_api_templates(this);
    this.proofscope = new portal_api_proofscope(this);
	this.portal = new portal_api_portal(this);
	this.utils = new portal_api_utils(this);
	
	this.panzer = new portal_api_panzer(this);
	this.panzer.costcalc = new portal_api_panzer_costcalc(this);
	this.panzer.device = new portal_api_panzer_device(this);
	this.panzer.jobinfo = new portal_api_panzer_jobinfo(this);
	this.panzer.layoutdb = new portal_api_panzer_layoutdb(this);
	this.panzer.lmsstate = new portal_api_panzer_lmsstate(this);
	this.panzer.media = new portal_api_panzer_media(this);
	this.panzer.layout = new portal_api_panzer_layout(this);
	this.panzer.preference = new portal_api_panzer_preference(this);
	this.panzer.printqueue = new portal_api_panzer_printqueue(this);
}

// Shows a message in the notification area
//   p_title     : title of the alert
//   p_msg       : the message
//   p_id        : the class of the child div in #notify-area; if not specified or undefined, is "default" for non-closeable or "closeable"
//   p_may_close : true if the user may close the notification 
function portal_api_message(p_title, p_msg, p_id, p_may_close)
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
		$('#notify-area').notify("create", p_id, { title:p_title, text:p_msg }, { expires:false , click:l_click_handler });
	}
}

function portal_redirect_not_licensed()
{
	if ($.inArray('ADMIN', sPermissions) > -1) {
		window.location = '/portal_no_license_admin.html';
	} else {
		window.location = '/portal_no_license_user.html';
	}
}


function portal_api_sync()
{
	var api = new portal_api_base();

	// call
	api.server_call = function(context,command,cb,error_cb)
	{
		$.ajax({
		  type: 'POST',
		  url: context.m_parent.m_address,
		  data: JSON.stringify(command),
		  success: $.proxy(function(data) {
			context.m_return=data;
		  },context),
		  async:false
		});

		if ((context.m_return !== undefined && context.m_return != null) && (context.m_return.error !== undefined)) {
			if (context.m_return.error_code === 'no_license') {
				//console.error("Executing " + command.method + " failed with the following error: " + context.m_return.error, command);
				portal_redirect_not_licensed();
				return;
			}
			if (error_cb === undefined) {
				portal_api_message("Executing " + command.method + " failed:", context.m_return.error, 'closeable-error', true);
				//console.error("Executing " + command.method + " failed with the following error: " + context.m_return.error, command);
			} else {
				error_cb(context.m_return);
			}
		}
		
		return context.m_return;
	}
	
	return api;
}

function portal_api_async(url)
{
	var api = new portal_api_base();

	// call
	api.server_call = function(context,command,cb,error_cb)
	{
		var cb2 = function(data) {
			if (data !== undefined && data !== null && data.error !== undefined) {
				if (data.error_code === 'no_license') {
					//console.error("Executing " + command.method + " failed with the following error: " + data.error, command);
					portal_redirect_not_licensed();
					return;
				}
				if (error_cb === undefined) {
					portal_api_message("Executing " + command.method + " failed:", data.error, 'closeable-error', true);
					//console.error("Executing " + command.method + " failed with the following error: " + data.error, command);
				} else {
					error_cb(data);
				}
			} else {
				if (cb) {
					cb(data);
				}
			}
		};
		$.ajax({
		  type: 'POST',
		  url: context.m_parent.m_address,
		  data: JSON.stringify(command),
		  success: cb2,
		  async:true
		});
	}
	
	return api;
}

/**
 * The api global
 */
var api_sync=new portal_api_sync();
var api_async=new portal_api_async();

var api=api_sync; // for backwards compatibility


function portal_license()
{
	this.check = function (name, callback) {
		api_async.license.get(function (data) {
			var found = false;
            var now = Date.now() / 1000;

			if (data != null) {
				data.machines.forEach(function(machine) {
					if ((! found) && (machine.name == 'pp_work_server')) {
						machine.licenses.forEach(function(license) {
							if (!found) {
								if (license.code == name) {
									var ok = true;
									if ((license.start !== undefined) && (license.start > now)) {
										ok = false;
									}
									if ((license.start !== undefined) && (license.end < now)) {
										ok = false;
									}
									if (ok) {
										callback(true);
										found = true;
									}
								}
							}
						});
					}
				});
			}
			
			if (! found) {
				callback(false);
			}
		});
	};
	
	this.check_sync = function (name, callback) {
		var found = false;
        var now = Date.now() / 1000;
		var data = api_sync.license.get();
			if (data != null) {
				data.machines.forEach(function(machine) {
					if (!found && machine.name == 'pp_work_server') {
						machine.licenses.forEach(function(license) {
							if (!found) {
								if (license.code == name) {
									var ok = true;
									if ((license.start !== undefined) && (license.start > now)) {
										ok = false;
									}
									if ((license.start !== undefined) && (license.end < now)) {
										ok = false;
									}
									if (ok) {
										callback(true);
										found = true;
									}
								}
							}
						});
					}
				});
			}
			
			if (!found) {
				callback(false);
			}
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
