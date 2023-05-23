/*********************************************************************/
/* NiXPS Manage Pane JavaScript									  */
/*																   */
/* Copyright 2012-2013, NiXPS (www.nixps.com)						*/
/*********************************************************************/

/*********************************************************************/
/* ![ BASECLASS ]													*/
/*********************************************************************/
(function($) {
    var scriptsReg = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

    if($.isFunction($.nixpsRemoveScripts)) {
        throw new Error("function already in use!!");
    }

    $.nixpsRemoveScripts = function(pMessage) {
        if (typeof pMessage === "string") {
            return pMessage.replace(scriptsReg, "");
        }
        return pMessage;
    };
}(jQuery));
/**
 * @brief Default Constructor for all manage div's
 * @param p_name The name of the objects to store in this
 */
function ManageBase(p_name, p_list_fn, p_add_fn, p_update_fn, p_remove_fn)
{
	// settings
	this.m_area = undefined;
	this.m_name = p_name;
	this.m_list_fn = p_list_fn;
	this.m_add_fn = p_add_fn;
	this.m_update_fn = p_update_fn;
	this.m_remove_fn = p_remove_fn;
}

/**
 * Setup the UI for modular deployment
 */
ManageBase.prototype.setup_ui = function(p_parent_div, p_parent_nav)
{
	// Add to Body if no daddy
	if (p_parent_div == undefined || p_parent_div == null)
		p_parent_div = $("body");

	// Create the main DIV
	var l_id = "div-"+this.m_name;
	p_parent_div.append("<div id='"+l_id+"'>");

	// Add to Tab if required
	if (p_parent_nav != undefined)
	{
		$("#"+l_id).addClass("tab");
		p_parent_nav.append("<li id='tabs-"+this.m_name+"-tab'>"+
							"	<a href='#"+l_id+"'>" + $.i18n._('nixps-cloudflow-manage.' + this.m_name + '-title') + "</a>"+
							"</li>");
	}

	// Bind refresh
	$('body').on(this.m_name+'-data-changed', $.proxy(this.refresh, this));
	$('body').on('active-scope-changed', $.proxy(this.refresh, this));

	// Add the initial button to the div
	$("#"+l_id).append("<a class='green-button right-button' id='add-"+this.m_name+"'>" + $.i18n._('nixps-cloudflow-manage.' + this.m_name + '-add') + "</a>");
	$("#"+l_id).append("<table id='"+this.m_name+"-table' class='manage-table tsw-table'>");

    // init dialog
    if ($('body').not(".nixps-Dialog")) {
        $('body').Dialog();
    }
}

/**
 * Enables the handlers for modular deployment
 */
ManageBase.prototype.enable_handlers = function()
{
	$('#add-'+this.m_name).unbind();
	$('#add-'+this.m_name).click($.proxy(this.row_insert, this));
	$('#div-'+this.m_name).click($.proxy(function ()
	{
		$('#div-'+this.m_name).find('a.delete').hide();
		$('#div-'+this.m_name).find('a.edit').hide();
		$('#div-'+this.m_name).find('tr').removeClass("selected");
		if (this.m_area == undefined)
		{
			$('#div-'+this.m_name).find('div.popout-arrow').slideUp(function() {});
		}
	},
	this));
}

/**
 * Repopulates the table with data from the backend
 */
ManageBase.prototype.refresh = function()
{
	this.m_list_fn($.proxy(function(p_data)
	{
		// Reset & initialize table
		var l_table = $('#'+this.m_name+'-table');
		l_table.empty();
		l_table.append("<tr><td width='21px'><img src='portal/images/empty.png' height='2px' width='21px'/></td>"+this.table_headers()+"<td width='140px'><img src='portal/images/empty.png' height='2px' width='135px'/></td></tr>");
		l_table.find("td").addClass("header");

		// Add an entry for each object
		for (l_idx in p_data)
		{
			var l_col_count = 2;
			var l_object = p_data[l_idx];
			var l_object_dict = this.get_data(l_object);
			if (l_object_dict !== undefined)
			{
				var l_new_row = $("<tr object_id='"+l_object_dict.id+"'>");
				l_new_row.append("<td><img src='"+l_object_dict.icon+"'/></td>");
				var l_row_class = 'left-gradient';
				for (l_key in l_object_dict.params)
				{
					var l_extras = "";
					var l_params = l_object_dict.params[l_key];
					if (l_params.no_edit == 1)
						l_extras = " no_edit=1";
					var l_new_cell = $("<td class='"+l_row_class+"' type='"+l_key+"' internal='"+l_params.id+"'"+l_extras+"></td>");
					this.create_view_control(l_new_cell, l_key, l_params);
					l_new_row.append(l_new_cell);
					l_row_class = 'middle';
					l_col_count = l_col_count + 1;
				}
				l_new_row.append("<td class='right-gradient'><a class='red-button delete editbutton'>"+ $.i18n._('nixps-cloudflow-manage.generic-remove') +"</a><a class='green-button edit editbutton'>"+ $.i18n._('nixps-cloudflow-manage.generic-edit') +"</a><a class='green-button cancel editbutton'>"+ $.i18n._('nixps-cloudflow-manage.generic-cancel') +"</a><a class='green-button save editbutton'>"+ $.i18n._('nixps-cloudflow-manage.generic-save') +"</a></td>");
				if (l_object_dict.no_delete == 1)
				{
					l_new_row.find('a.delete').remove();
				}
				if (l_object_dict.no_edit == 1)
				{
					l_new_row.find('a.edit').remove();
				}
				l_table.append(l_new_row);

				// Check if we need a popout row
				var l_row_content = this.get_popout_for_object(l_object);
				if (l_row_content != undefined)
				{
					var l_popout_row = $("<tr popout_id='"+l_object_dict.id+"' class='popout-row'>");
					var l_popout_cell = $("<td colspan="+l_col_count+"><div class='popout-arrow'>"+l_row_content+"</div></td>"); // <img class='popout-arrow-image' src='portal/images/dashboard_fold_arrow.png'/>
					l_popout_row.append(l_popout_cell);
					l_table.append(l_popout_row);
				}
			}
		}

		// Bindings
		l_table.find('[object_id]').unbind();
		l_table.find('[object_id]').click(this.row_clicked);
		// l_table.find('[object_id]').dblclick($.proxy(this.row_edit, this));
		l_table.find('a.delete').unbind();
		l_table.find('a.delete').click($.proxy(this.remove_object, this));
		l_table.find('a.edit').unbind();
		l_table.find('a.edit').click($.proxy(this.row_edit, this));

		// Make lined textareas
/*		 $(".lined").linedtextarea(); */

		// Disable editing
		this.m_edit_row = undefined;
		this.m_area = undefined;
		this.enable_handlers();
	},
	this));
}

/**
 * User clicked a row, deselect everything and select this row
 */
ManageBase.prototype.row_clicked = function()
{
	if (!$(this).hasClass("selected"))
	{
		$(this).closest('table').find('a.delete').hide();
		$(this).closest('table').find('a.edit').hide();
		$(this).closest('table').find('tr').removeClass("selected");
		// if (!$(this).hasClass('selected'))
		$(this).closest('table').find('div.popout-arrow').slideUp(function() {});
		$(this).find('a.delete').show();
		$(this).find('a.edit').show();
		$(this).addClass("selected");
		$(this).next().find('div').slideDown(function() {});
	}
	else
	{
		$(this).closest('table').find('a.delete').hide();
		$(this).closest('table').find('a.edit').hide();
		$(this).closest('table').find('tr').removeClass("selected");
		$(this).closest('table').find('div.popout-arrow').slideUp(function() {});
	}
	return false;
}

/**
 * Create a new object entry
 */
ManageBase.prototype.row_insert = function()
{
	$('#add-'+this.m_name).unbind();
	var l_table = $('#'+this.m_name+'-table');
	l_table.find('[object_id]').unbind();
	l_table.find('a.delete').hide();
	l_table.find('a.edit').hide();

	// Create the new cells
	var l_dummy = {};
	if ($.cookie('scope', {path: '/'}) != undefined && $.cookie('scope', {path: '/'}) != "*")
		l_dummy.scope = [ $.cookie('scope', {path: '/'}) ];
	var l_object_dict = this.get_data(l_dummy);
	var l_new_row = $("<tr class='selected'>");
	var l_row_class = "left-gradient";
	l_new_row.append("<td><img src='"+l_object_dict.icon+"'/></td>");
	for (l_key in l_object_dict.params)
	{
		var l_param = l_object_dict.params[l_key];
		var l_new_cell = $("<td class='"+l_row_class+"'></td>");
		if (l_param.no_edit == 1)
		{
			this.create_view_control(l_new_cell, l_key, l_param);
		}
		else
		{
			this.create_input_control(l_new_cell, l_key, l_param.id);
		}
		l_new_row.append(l_new_cell);
		l_row_class = "middle";
	}
	l_new_row.append("<td class='right-gradient'><a class='green-button cancel'>"+ $.i18n._('nixps-cloudflow-manage.generic-cancel') +"</a><a class='green-button save'>"+ $.i18n._('nixps-cloudflow-manage.generic-save') +"</a></td>");
	l_table.find('tr:first').after(l_new_row);
	this.m_edit_row = l_new_row;

	// Generate the binders
	$('body').keyup($.proxy(function(e)
	{
		if (e.keyCode == 27)/* escape */
		{
			$('body').unbind('keyup');
			this.refresh();
		}
		else if (e.keyCode == 13) /* enter */
		{
			$('body').unbind('keyup');
			this.create_object();
		}
	},
	this));

	// Save should save, Cancel should cancel
	l_new_row.find('.save').show();
	l_new_row.find('.cancel').show();
    l_new_row.find('.save, .cancel').click(function(){
        $('body').unbind('keyup');
    });
	l_new_row.find('.save').click($.proxy(this.create_object, this));
	l_new_row.find('.cancel').click($.proxy(this.refresh, this));
	return l_new_row;
}

/**
 * Edit the current row
 */
ManageBase.prototype.row_edit = function()
{

	$('#add-'+this.m_name).unbind();
	var l_table = $('#'+this.m_name+'-table');
	l_table.find('[object_id]').unbind();
	l_table.find('a.delete').hide();
	l_table.find('a.edit').hide();
	var l_row = l_table.find('.selected');
	l_row.attr("selected_row", 1);

	// Create the Edit fields
	l_row.find('[type]').each($.proxy(function(index, element)
	{
		if ($(element).attr("no_edit") != 1)
		{
			$(element).empty();
			this.create_input_control($(element), $(element).attr('type'), $(element).attr('internal'));
		}
	},
	this));

	// Edit the popout
	this.make_popout_editable(l_row.next());

	// ESC Cancels
	$('body').keyup($.proxy(function(e)
	{
		if (e.keyCode == 27)
		{
			$('body').unbind('keyup');
			this.refresh();
		}
		else if (e.keyCode == 13)
		{
			$('body').unbind('keyup');
			this.save_object();
		}
	},
	this));

	// Save should save. Cancel should cancel
	l_row.find('.save').show();
	l_row.find('.cancel').show();
	l_row.find('.save').click($.proxy(this.save_object, this));
	l_row.find('.cancel').click($.proxy(this.refresh, this));
	return l_row;
}

/**
 * Creates a view control for a field
 */
ManageBase.prototype.create_view_control = function(p_parent, p_key, p_params)
{
	if (p_key == 'attributes')
	{
		var l_attr_list = new attribute_list(p_parent,{ editable: false, attributes: p_params.id });
	}
	else if (p_key == 'userpass')
	{
		p_parent.append("******");
	}
	else if (p_key == 'scope')
	{
		var l_scope_name = sScopes[p_params.id];
		if (l_scope_name == "ALL")
		{
			l_scope_name = '<i>'+ $.i18n._('nixps-cloudflow-top.all_scopes') +'</i>';
		}
		p_parent.append(l_scope_name);
	}
	else if (p_params.name != undefined)
	{
		p_parent.append(p_params.name);
	}
	else
	{
		p_parent.append(p_params.id);
	}
}

/**
 * Creates an editable control for a field
 */
ManageBase.prototype.create_input_control = function(p_parent, p_key, p_id)
{
	if (p_id == undefined)
		p_id = "";
	if (p_key == 'scope')
	{
		var l_result;
		var l_scope_count = 0;
		if ($.cookie('scope', {path: '/'}) == undefined || $.cookie('scope', {path: '/'}) == "*")
		{
			l_result = "<select key='scope' old_value='"+p_id+"'>"
			for (l_scope_idx in sScopes)
			{
				l_scope_count = l_scope_count + 1;
				var l_scope = sScopes[l_scope_idx];
				if (l_scope == "ALL")
					l_scope = $.i18n._('nixps-cloudflow-top.all_scopes');
				var l_selected = "";
				if (l_scope_idx == p_id)
				{
					l_selected = " selected";
				}
				l_result = l_result + "<option value='" + l_scope_idx + "'" + l_selected + ">" + l_scope + "</option>";
			}
			l_result = l_result + "</select>";
		}
		else if (l_scope_count < 2)
		{
			var l_scope_name = sScopes[p_id];
			if (l_scope_name == "ALL")
			{
				l_scope_name = '<i>'+$.i18n._('nixps-cloudflow-top.all_scopes')+'</i>';
			}
			l_result = "<select key='scope' old_value='' readonly><option value='"+p_id+"' selected>"+l_scope_name+"</option></select>";
		}
		p_parent.append(l_result);
	}
/*
	else if (p_key == 'language')
	{
		p_parent.append("<span id='language'/>");
		p_parent.find("#language").LanguageSelector({ value : p_id });
	}
*/
	else
	{
		p_parent.append("<input type='text' key='"+p_key+"' value='"+p_id+"' old_value='"+p_id+"'/>");
	}
}

/**
 * Save the data into the backend
 */
ManageBase.prototype.create_object = function()
{
	var l_row = $('#'+this.m_name+'-table').find('input').first().closest('tr');
	var l_dict = {};
	this.row_to_dictionary(l_dict, l_row);
	l_row.find('[key]').each(function(index, element)
	{
		l_dict[$(element).attr("key")] = $(element).val();
	});
	this.m_add_fn(l_dict, $.proxy(function()
	{
		$('body').trigger(this.m_name+'-data-changed');
	},
	this));
}

/**
 * Save changes to the datamodel
 */
ManageBase.prototype.save_object = function()
{
	var l_row = $('#'+this.m_name+'-table').find('[selected_row]').first();
	var l_object_id = l_row.attr("object_id");
	var l_dict = {};
	this.row_to_dictionary(l_dict, l_row);
	l_row.find('[key]').each(function(index, element)
	{
		if ($(element).attr('old_value') != $(element).val())
		{
			l_dict[$(element).attr("key")] = $(element).val();
		}
	});
	this.save_popout_for_object(l_row.next(), l_dict);
	this.m_update_fn(l_object_id, l_dict, $.proxy(function()
	{
		$('body').trigger(this.m_name+'-data-changed');
	},
	this));
}

/**
 * Extra stuff to save...
 */
ManageBase.prototype.row_to_dictionary = function(p_dict, p_row)
{
}

/**
 * Remove an item from the datamodel
 */
ManageBase.prototype.remove_object = function()
{
	var l_this = this;
	var l_name = this.m_name;
	if (l_name.charAt(l_name.length - 1) == 's')
	{
		l_name = l_name.substring(0, l_name.length-1);
	}
	var l_delete_function = function(p_data)
	{
		var l_row = $('#'+p_data+'-table').find('.selected');
		var l_object_id = l_row.attr("object_id");
		l_this.m_remove_fn(l_object_id, $.proxy(function()
		{
			$('body').trigger(p_data+'-data-changed');
		},
		this));
	};
	$('body').Dialog("show_yes_no", $.i18n._("nixps-cloudflow-manage.removedialog_title"), $.i18n._("nixps-cloudflow-manage.removedialog_message", [l_name]), this.m_name, l_delete_function, undefined);
	return false;
}

/**
 * Base method for setting the table headers
 */
ManageBase.prototype.table_headers = function()
{
	return "";
}

ManageBase.prototype.get_data = function(p_object)
{
	return { id : p_object._id }
}

/**
 * Base functions for using the popout
 */
ManageBase.prototype.get_popout_for_object = function(p_object)
{
	return undefined;
}

ManageBase.prototype.make_popout_editable = function(p_row)
{

}

ManageBase.prototype.save_popout_for_object = function(p_row, p_dict)
{

}

/*********************************************************************/
/* ![ SCOPES ]													   */
/*********************************************************************/

/**
 * Create Scopes Instance
 */
function ManageScopes()
{
}

ManageScopes.prototype = new ManageBase("scopes",
	 function (cb) { api_async.scopes.list_all(cb); },
	 function (dict, cb) { api_async.scopes.add(dict.name, dict.filter, dict.welcomepage, cb); },
	 function (id, dict, cb) { api_async.scopes.update(id, dict.name, dict.filter, dict.welcomepage, cb); },
	 function (id, cb) { api_async.scopes.remove(id, cb); }
);

ManageScopes.prototype.table_headers = function()
{
	return "<td width='*'>"+$.i18n._('nixps-cloudflow-manage.scopes-column-name')+"</td>" +
		   "<td width='*'>"+$.i18n._('nixps-cloudflow-manage.scopes-column-filter')+"</td>" +
		   "<td width='*'>"+$.i18n._('nixps-cloudflow-manage.scopes-column-welcome_page')+"</td>";
}

ManageScopes.prototype.get_data = function(p_object)
{
	var l_welcomepage;
	if (p_object.welcomepage === undefined) {
		l_welcomepage = "";
	} else {
		l_welcomepage = p_object.welcomepage;
	}

	var l_data =
	{
		id : p_object._id,
		icon : 'portal/images/config_scope.png',
		params :
		{
			name : { id: p_object.name },
			filter : { id: p_object.filter },
			welcomepage: { id: l_welcomepage }
		}
	}
	return l_data;
}

/*********************************************************************/
/* ![ TEMPLATES ]													*/
/*********************************************************************/

/**
 * Create Templates Instance
 */
function ManageTemplates()
{
}

ManageTemplates.prototype = new ManageBase("templates",
	function (cb) {
        api_async.templates.list_all(function(pResults) {
            var output = [];
            if ($.isArray(pResults)) {
                for(var i=0; i<pResults.length; i++) {
                    if (typeof pResults[i].message === "string") {
                        pResults[i].message = $.nixpsRemoveScripts(pResults[i].message);
                    }
                    if (typeof pResults[i].subject === "string") {
                        pResults[i].subject = $.nixpsRemoveScripts(pResults[i].subject);
                    }
                    output.push(pResults[i]);
                }
            }
            cb(output);
        });

    },
	function (dict, cb) { api_async.templates.add(dict.name, dict.language, $.nixpsRemoveScripts(dict.subject), $.nixpsRemoveScripts(dict.message), cb); },
	function (id, dict, cb) { api_async.templates.update(id, dict.name, dict.language, $.nixpsRemoveScripts(dict.subject), $.nixpsRemoveScripts(dict.message), cb); },
	function (id, cb) { api_async.templates.remove(id, cb); }
);

ManageTemplates.prototype.table_headers = function()
{
	return "<td width='150px'>"+$.i18n._('nixps-cloudflow-manage.templates-column-name')+"</td>"+
		   "<td width='150px'>"+$.i18n._('nixps-cloudflow-manage.templates-column-language')+"</td>"+
		   "<td width='*'>"+$.i18n._('nixps-cloudflow-manage.templates-column-subject')+"</td>";
}

ManageTemplates.prototype.get_data = function(p_object)
{
	var l_data =
	{
		id : p_object._id,
		icon : 'portal/images/config_contact.png',
		params :
		{
			name : { id: p_object.name },
			language : { id: p_object.language },
			subject : { id: p_object.subject }
		}
	}
	if (l_data.params.language.id === undefined)
	{
		l_data.params.language.id = 'en';
	}
	return l_data;
}

ManageTemplates.prototype.get_popout_for_object = function(p_object)
{
	return "<div id='template_"+p_object._id+"' class='richtext selectable'>" + p_object.message + "</div>";
}

ManageTemplates.prototype.make_popout_editable = function(p_row)
{
	if (this.m_area != undefined)
	{
		this.m_area.removeInstance(p_row.find("[id]").attr("id"));
	}
	this.m_area = new nicEditor({fullPanel:true}).panelInstance(p_row.find("[id]").attr("id"));
	p_row.find("[id]").keyup(function(e)
	{
		e.stopPropagation();
	});
}

ManageTemplates.prototype.save_popout_for_object = function(p_row, p_dict)
{
	this.m_area.removeInstance(p_row.find("[id]").attr("id"));
	p_dict.message = p_row.find("[id]").html();
}


ManageTemplates.prototype.create_input_control = function(p_parent, p_key, p_id)
{
	if (p_key == 'language')
	{
		p_parent.append("<span id='templatelang'/>");
		p_parent.find("#templatelang").LanguageSelector({ value : p_id });
	}
	else
	{
	 	ManageBase.prototype.create_input_control.call(this, p_parent, p_key, p_id);
	}
}

ManageTemplates.prototype.row_to_dictionary = function(p_dict, p_row)
{
	p_dict['language'] = p_row.find("#templatelang").LanguageSelector('option', 'value');
}

/**
 * Creates a view control for a field
 */
ManageTemplates.prototype.create_view_control = function(p_parent, p_key, p_params)
{
	if (p_key == 'language')
	{
		p_parent.append(nixps.common.isoLangs[p_params.id].name);
	}
	else
	{
		ManageBase.prototype.create_view_control(p_parent, p_key, p_params);
	}
}


/*********************************************************************/
/* ![ EVENT HANDLERS ]													*/
/*********************************************************************/

/**
 * Create Event Handlers Instance
 */
function ManageEventHandlers()
{
}

ManageEventHandlers.prototype = new ManageBase("eventhandlers",
	 function (cb) { api_async.eventhandlers.list_all(cb); },
	 function (dict, cb) {api_async.eventhandlers.add(dict.name, dict.script, dict.scope, dict.trigger, cb); },
	 function (id, dict, cb) {api_async.eventhandlers.update(id, dict.name, dict.script, dict.scope, dict.trigger, cb); },
	 function (id, cb) { api_async.eventhandlers.remove(id, cb); }
);

ManageEventHandlers.prototype.table_headers = function()
{
	return "<td width='150px'>"+$.i18n._('nixps-cloudflow-manage.eventhandlers-column-name')+"</td>"+
		   "<td width='*'>"+$.i18n._('nixps-cloudflow-manage.eventhandlers-column-trigger')+"</td>"+
		   "<td width='100px'>"+$.i18n._('nixps-cloudflow-manage.eventhandlers-column-scope')+"</td>";
}

ManageEventHandlers.prototype.get_data = function(p_object)
{
	var l_data =
	{
		id : p_object._id,
		icon : 'portal/images/config_worker.svg',
		params :
		{
			name : { id: p_object.name },
			trigger : { id: p_object.trigger },
			scope: { id: '*' }
		}
	}

	// Special treatment of users in the contacts
	if (p_object.scope != undefined)
	{
		l_data.params['scope'].id = p_object.scope[0];
	}

	// Add name for the scope
	l_data.params.scope.name = sScopes[l_data.params.scope.id];
	if (l_data.params.scope.name == "ALL")
	{
		l_data.params.scope.name = '<i>'+$.i18n._('nixps-cloudflow-top.all_scopes')+'</i>';
	}
	for (i in this.mTemplates)
	{
		if (this.mTemplates[i]._id == l_data.params.template.id)
		{
			l_data.params.template.name = this.mTemplates[i].name;
		}
	}

	return l_data;
}

ManageEventHandlers.prototype.get_popout_for_object = function(p_object)
{
	return "<textarea rows='30' class='full_width lined' disabled>" + p_object.script + "</textarea>";
}

ManageEventHandlers.prototype.make_popout_editable = function(p_row)
{
	var l_textarea = p_row.find('textarea')[0];
	this.m_area = CodeMirror.fromTextArea(l_textarea,
	{
		value: p_row.find('textarea').html(),
		mode:  "javascript",
		lineNumbers: true,
		matchBrackets: true,
		firstLineNumber: 7,
		indentUnit: 4,
		onKeyEvent : function (editor, e)
		{
			e.stopPropagation();
		}
	});
}

ManageEventHandlers.prototype.save_popout_for_object = function(p_row, p_dict)
{
	p_dict.script = this.m_area.getValue();
	this.m_area = undefined;
}

/*********************************************************************/
/*  ![ APPROVAL CHAINS ]											 */
/*********************************************************************/

/**
 * Create Approval Chains Instance
 */
function ManageApprovalChains()
{
	$('<img>').attr("src", "/portal/images/search_gray.png").appendTo('body').hide();

	this.mTemplates = undefined;
	this.refresh_templates();
	$('body').on('scopes-data-changed', $.proxy(this.refresh, this));
	$('body').on('templates-data-changed', $.proxy(this.refresh_templates, this));
}

ManageApprovalChains.prototype = new ManageBase("approvalchains",
	function (cb) {
		api_async.approval_whitepaper_proxy.list(function(pResults) {
			cb(pResults.results);
		});
	},
	function (dict, cb) {
		var templateName = '';
		for (i in this.mTemplates)
		{
			if (this.mTemplates[i]._id === dict.template)
			{
				templateName = this.mTemplates[i].name;
				break;
			}
		}

		var scopeName = '*';
		if (dict.scope !== '*') {
			scopeName = sScopes[dict.scope];
		}

		var data = {
			input_name: dict.name,
			steps: dict.steps,
			usage_scope : scopeName
		};
		for (var index in data.steps) {
			data.steps[index].email_template = templateName;
		}
		api_async.approval_whitepaper_proxy.add(data, cb);
	},
	function (id, dict, cb) {
		var data = api.approval_whitepaper_proxy.get(id);
		delete data.id;
		if (dict.name !== undefined) {
			data.input_name = dict.name;
		}

		var scopeName = '*';
		if (dict.scope !== undefined) {
			if (dict.scope !== '*') {
				scopeName = sScopes[dict.scope];
			}
			data.usage_scope = scopeName;
		}


		var templateName = '';
		if (data.steps !== undefined && data.steps[0] !== undefined) {
			templateName = data.steps[0].email_template;
		}
		if (dict.steps !== undefined) {
			data.steps = dict.steps
		};
		if (dict.template !== undefined) {
			for (i in this.mTemplates) {
				if (this.mTemplates[i]._id === dict.template) {
					templateName = this.mTemplates[i].name;
					break;
				}
			}
		}
		if (data.steps !== undefined) {
			for (var index in data.steps) {
				data.steps[index].email_template = templateName;
			}
		}
		api_async.approval_whitepaper_proxy.update(id, data, cb);
	},
	function (id, cb) {
		api_async.approval_whitepaper_proxy.delete(id, cb);
	}
);

ManageApprovalChains.prototype.refresh_templates = function()
{
	api_async.templates.list_all($.proxy(function(p_data)
	{
        this.mTemplates = [];
        if ($.isArray(p_data)) {
            for (var i = 0; i < p_data.length; i++) {
                if (typeof p_data[i].message === "string") {
                    p_data[i].message = $.nixpsRemoveScripts(p_data[i].message);
                }
                if (typeof p_data[i].subject === "string") {
                    p_data[i].subject = $.nixpsRemoveScripts(p_data[i].subject);
                }
                this.mTemplates.push(p_data[i]);
            }
        }
	}, this));
}

ManageApprovalChains.prototype.table_headers = function()
{
	return "<td width='30%'>"+$.i18n._('nixps-cloudflow-manage.approvalchains-column-name')+"</td>"+
		   "<td width='20%'>"+$.i18n._('nixps-cloudflow-manage.approvalchains-column-steps')+"</td>"+
		   "<td width='20%'>"+$.i18n._('nixps-cloudflow-manage.approvalchains-column-template')+"</td>"+
		   "<td width='30%'>"+$.i18n._('nixps-cloudflow-manage.approvalchains-column-scope')+"</td>";
}

ManageApprovalChains.prototype.get_popout_for_object = function(p_object)
{
/*	return "<div class='chain_editor' chainid='" + p_object._id + "'></div>";*/

}

ManageApprovalChains.prototype.make_popout_editable = function(p_row)
{
	/* h4x0r */
/*	this.m_area = 1;
	new ApprovalChainEditor(p_row.find('.chain_editor'), p_row.find('.chain_editor').attr('chainid'));*/
}

ManageApprovalChains.prototype.save_popout_for_object = function(p_row, p_dict)
{

}

ManageApprovalChains.prototype.create_input_control = function(p_parent, p_key, p_id)
{
	if (p_key == "steps")
	{
    	var l_chainid = $('#'+this.m_name+'-table').find('[selected_row]').first().attr('object_id');
    	if (l_chainid === undefined)
    	{
        	p_parent.append($.i18n._('nixps-cloudflow-manage.save_chain_first'));
    		approvalchain_editor.json = null;
    	}
    	else
    	{
    		// This must change in a popout
    		var editbutton = $("<a class='green-button' style='display: inline !important;'>" + $.i18n._('nixps-cloudflow-manage.approvalchains-edit_steps') + "</a>");
    		editbutton.bind('click', function(event) {
    			var l_command = { "method" : "approvalchains.list_approvalchains" };
    			var l_chainid = $(this).closest('tr').attr('object_id');
				var approvalchain = api.approval_whitepaper_proxy.get(l_chainid);
				if (approvalchain.id !== undefined) {
					$('#nixps_mask').fadeIn(450);
					approvalchain_editor.json = null;
					approvalchain_editor.edit_chain(approvalchain, $('#nixps_mask'));
				}
    		});

    		p_parent.append(editbutton);
        }
	}
	else if (p_key == "template")
	{
		var l_select_template = $("<select key='template' old_value='"+p_id+"'></select>");
		for (i in this.mTemplates)
		{
			l_select_template.append("<option value='"+this.mTemplates[i]._id+"'>"+this.mTemplates[i].name+"</option>");
		}
		l_select_template.val(p_id);

		p_parent.append(l_select_template);
	}
	else
	{
		ManageBase.prototype.create_input_control.call(this, p_parent, p_key, p_id);
	}
}

ManageApprovalChains.prototype.row_to_dictionary = function(p_dict, p_row)
{
	if (approvalchain_editor.json) {
		p_dict['steps'] = approvalchain_editor.json.steps;
	}
}

ManageApprovalChains.prototype.get_data = function(p_object)
{
	var l_data =
	{
		id : p_object._id,
		icon : 'portal/images/config_chain.png',
		params :
		{
			name : { id : p_object.name },
			steps : { id : p_object.steps },
			template : { name : p_object.template },
			scope : {
				id : '*',
				name : '<i>'+$.i18n._('nixps-cloudflow-top.all_scopes')+'</i>'
			}
		}
	}

	if (p_object.usage_scope !== undefined)
	{
		if (p_object.usage_scope === '*') {
			l_data.params.scope.id = '*';
			l_data.params.scope.name = '<i>'+$.i18n._('nixps-cloudflow-top.all_scopes')+'</i>';
		} else {
			l_data.params.scope.name = p_object.usage_scope
			for (i in sScopes) {
				if (sScopes[i] === p_object.usage_scope) {
					l_data.params.scope.id = i;
				}
			}
		}
	}

	for (i in this.mTemplates)
	{
		if (this.mTemplates[i].name === l_data.params.template.name)
		{
			l_data.params.template.id = this.mTemplates[i]._id;
			break;
		}
	}

	return l_data;
}

/*********************************************************************/
/* ![ CHAINS PANE ]												  */
/*********************************************************************/

var manage_chains_pane =
{
	//
	// General Methods
	//
	setup_ui: function()
	{
		var language = api_sync.preferences.get_for_current_user("", "language").preferences;

		var obsoleteFlags = api_sync.preferences.get_for_current_user("com.nixps.general.obsolete", "").preferences;
		var obsoleteEventHandler = true;
		if (obsoleteFlags !== undefined) {
			if (("eventhandler" in obsoleteFlags) === true) {
				obsoleteEventHandler = obsoleteFlags.eventhandler;
			}
		}

		if($("body").data("nixps-Dialog") === undefined) {
			$("body").Dialog({});
		}

		$('body').append("<div id='manage-chains-pane' class='manage-pane'><div style='text-align: right; background: none; margin: 0px 5px' class='global-msgs'></div><div id='manage-chains-tabs' class='manage-tabs'><ul id='manage-chains-navs'></div></div>");
		if (($.inArray('ADMIN', sPermissions) > -1) || ($.inArray('MANAGE_CHAINS', sPermissions) > -1)) {
			manage_chains_pane.approvalchains = new ManageApprovalChains();
			manage_chains_pane.approvalchains.setup_ui($("#manage-chains-tabs"), $("#manage-chains-navs"));
		}
		if (($.inArray('ADMIN', sPermissions) > -1) || ($.inArray('MANAGE_TEMPLATES', sPermissions) > -1)) {
			manage_chains_pane.templates = new ManageTemplates();
			manage_chains_pane.templates.setup_ui($("#manage-chains-tabs"), $("#manage-chains-navs"));
		}

		var approvalList = $('<div>');
		var user = nixps.cloudflow.User.get();
		var queryChangeTimeoutID;
		var queryChanged = function(event, data) {
			clearTimeout(queryChangeTimeoutID);
			queryChangeTimeoutID = setTimeout(function() {
				approvalList.ApprovalList("option", { searchQuery: data.query });
			},	300);
		};
		var assessmentChanged = function(event, data) {
			approvalList.ApprovalList("option", { assessmentsToShow: data.assessments });
		};

		if (($.inArray('ADMIN', sPermissions) > -1) || ($.inArray('MANAGE_CHAINS', sPermissions) > -1)) {
			$("#manage-chains-navs").append("<li id='tabs-all_approval_overview-tab'>"+
							"	<a href='#div-all_approval_overview'>" + $.i18n._('nixps-cloudflow-manage.all_approvals-title') + "</a>"+
							"</li>");

			var tab = $("<div id='div-all_approval_overview' class='tab bootstrap-polyfill'>").appendTo($("#manage-chains-tabs"));
			var queryPanel = $("<div>").AllApprovalQueryPanel({ language: language }).appendTo(tab);
			queryPanel.on('allapprovalquerypanelquerychanged', queryChanged);
			queryPanel.on('allapprovalquerypanelassessmentschanged', assessmentChanged);

			$("#tabs-all_approval_overview-tab").on("click", function() {
				tab.append(approvalList)
				user.then(function(pUser) {
					approvalList.ApprovalList({
			        	user: pUser,
			        	assessmentsToShow: ["all"],
			        	refreshRate: 60000,
			        	tableOptions: {
			        		language: language,
			                dateFormat: "MMMM Do YYYY, h:mm:ss",
				        		maxRows: 20
			            },
			            searchQuery: queryPanel.AllApprovalQueryPanel("getQuery")
					});
				});
			});

		}

		$("#manage-chains-navs").append("<li id='tabs-my_approvals-tab'>"+
						"	<a href='#div-my_approval_overview'>" + $.i18n._('nixps-cloudflow-manage.my_approvals-title') + "</a>"+
						"</li>");
		var myTab = $("<div id='div-my_approval_overview' class='tab bootstrap-polyfill'>").appendTo($("#manage-chains-tabs"));
		var myQueryPanel = $("<div>").appendTo(myTab);
		user.then(function(pUser) {
			myQueryPanel.MyApprovalQueryPanel({
				language: language,
				userName: pUser.getUserName(),
				assessment: "pending",
			});
		});
		myQueryPanel.on('myapprovalquerypanelquerychanged', queryChanged);
		myQueryPanel.on('myapprovalquerypanelassessmentschanged', assessmentChanged);

		$("#tabs-my_approvals-tab").on("click", function() {
			myTab.append(approvalList)
			user.then(function(pUser) {
				approvalList.ApprovalList({
		        	user: pUser,
		        	assessmentsToShow: ["pending"],
		        	refreshRate: 60000,
		        	tableOptions: {
		        		language: language,
		                dateFormat: "MMMM Do YYYY, h:mm:ss",
			        		maxRows: 20
		            },
		            searchQuery: myQueryPanel.MyApprovalQueryPanel("getQuery")
				});
			});
		});

		$("#manage-chains-navs").append("<li id='tabs-my_team_approval_overview-tab'>"+
						"	<a href='#div-team_approval_overview'>" + $.i18n._('nixps-cloudflow-manage.my_teams_approvals-title') + "</a>"+
						"</li>");
		var teamTab = $("<div id='div-team_approval_overview' class='tab bootstrap-polyfill'>").appendTo($("#manage-chains-tabs"));
		var teamQueryPanel = $("<div>").appendTo(teamTab);
		user.then(function(pUser) {
			teamQueryPanel.MyTeamApprovalQueryPanel({
				language: language,
				userName: pUser.getUserName(),
				assessment: "pending",
			});
		});
		teamQueryPanel.on('myteamapprovalquerypanelquerychanged', queryChanged);
		teamQueryPanel.on('myteamapprovalquerypanelassessmentschanged', assessmentChanged);

		$("#tabs-my_team_approval_overview-tab").on("click", function() {
			teamTab.append(approvalList)
			user.then(function(pUser) {
				approvalList.ApprovalList({
		        	user: pUser,
		        	assessmentsToShow: ["pending"],
		        	refreshRate: 60000,
		        	tableOptions: {
		        		language: language,
		                dateFormat: "MMMM Do YYYY, h:mm:ss",
			        		maxRows: 20
		            },
		            searchQuery: teamQueryPanel.MyTeamApprovalQueryPanel("getQuery")
				});
			});
		});

		if (($.inArray('ADMIN', sPermissions) > -1) || ($.inArray('MANAGE_CHAINS', sPermissions) > -1)) {
			tab.append(approvalList);
		} else {
			myTab.append(approvalList);
			if($.inArray('MANAGE_CHAINS', sPermissions) === -1 && $.inArray('MANAGE_TEMPLATES', sPermissions) === -1) {
				$("#tabs-my_approvals-tab").trigger("click");
			}
		}

		if (obsoleteEventHandler === false) {
			if ($.inArray('ADMIN', sPermissions) > -1) {
				manage_chains_pane.eventhandlers = new ManageEventHandlers();
				manage_chains_pane.eventhandlers.setup_ui($("#manage-chains-tabs"), $("#manage-chains-navs"));
			}
		}

		update_expiry_warning();
	},

	enable_handlers: function()
	{
		if (manage_chains_pane.templates != undefined) manage_chains_pane.templates.enable_handlers();
		if (manage_chains_pane.approvalchains != undefined) manage_chains_pane.approvalchains.enable_handlers();
		if (manage_chains_pane.eventhandlers != undefined) manage_chains_pane.eventhandlers.enable_handlers();
	},

	show: function()
	{
		$('#manage-chains-pane').show();
		manage_chains_pane.refresh();
		top_pane.set_active("#chainsSection");
	},

	hide: function()
	{
		$('#manage-chains-pane').hide();
	},

	refresh: function()
	{
		if (manage_chains_pane.templates != undefined) manage_chains_pane.templates.refresh();
		if (manage_chains_pane.approvalchains != undefined) manage_chains_pane.approvalchains.refresh();
		if (manage_chains_pane.eventhandlers != undefined) manage_chains_pane.eventhandlers.refresh();
	}
}

/*********************************************************************/
/* ![ CHAINS PANE ]												  */
/*********************************************************************/

var manage_tasks_pane =
{
	//
	// General Methods
	//
	setup_ui: function()
	{
		$('body').append("<div id='manage-tasks-pane' class='manage-pane'><div style='text-align: right; background: none; margin: 0px 5px' class='global-msgs'></div><div id='manage-tasks-tabs' class='manage-tabs'><ul id='manage-tasks-navs'></div></div>");
 		$("#manage-tasks-navs").append("<li id='tabs-my_tasks-tab'>"+
 						"	<a href='/portal.cgi?task_list=myTasks'>" + $.i18n._('nixps-cloudflow-manage.my_tasks-title') + "</a>"+
 						"</li>");
 		$("#manage-tasks-navs").append("<li id='tabs-all_tasks-tab'>"+
 						"	<a href='/portal.cgi?task_list=allTasks'>" + $.i18n._('nixps-cloudflow-manage.all_tasks-title') + "</a>"+
 						"</li>");
 		if ($.inArray('ADMIN', sPermissions) > -1) {
 			$("#manage-tasks-navs").append("<li id='tabs-calendars-tab'>"+
 							"	<a href='/portal.cgi?calendar=allCalendars'>" + $.i18n._('nixps-cloudflow-manage.all_calendars-title') + "</a>"+
 							"</li>");
		}
		update_expiry_warning();
	},

	enable_handlers: function()
	{
	},

	show: function()
	{
		$('#manage-tasks-pane').show();
		manage_tasks_pane.refresh();
		top_pane.set_active("#tasksSection");
	},

	hide: function()
	{
		$('#manage-tasks-pane').hide();
	},

	refresh: function()
	{
	}
}

/*********************************************************************/
/* ![ INITIALIZATION ]											   */
/*********************************************************************/

function init_manage_pane()
{
	var modules = [ manage_chains_pane, manage_tasks_pane ];
	for(i in modules)
	{
		modules[i].setup_ui();
		modules[i].enable_handlers();
	}
	$('#manage-users-tabs').tabs();
	$('#manage-users-tabs').tabs('select',0);
	$('#manage-chains-tabs').tabs();
	$('#manage-chains-tabs').tabs('select',0);
}

function show_manage_users_pane()
{
}

function show_manage_chains_pane()
{
	nixps.cloudflow.License.get().then(function(license) {
		if (license.check('portal') === true) {
			manage_chains_pane.show();
		} else if (license.check('max_cpu') === true) {
			window.location = '/';
		} else {
			api.not_licensed();
		}
	});
}

function show_manage_tasks_pane()
{
	nixps.cloudflow.License.get().then(function(license) {
		if (license.check('portal') === true) {
			manage_tasks_pane.show();
		} else if (license.check('max_cpu') === true) {
			window.location = '/';
		} else {
			api.not_licensed();
		}
	});
}
