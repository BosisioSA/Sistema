/*********************************************************************/
/* NiXPS Localization Javascript                                     */
/*                                                                   */
/* Copyright 2012, NiXPS (www.nixps.com)                             */
/*********************************************************************/

/* All Localizable Strings should be stored in this table */
var loc =
{
    // Contacts
    contacts:
    {
//        title: "Manage Contacts",
//        add: "Add Contact",
        imports: "Import vCard",
        editlist: "Edit List...",
        importtitle: "Choose a (group) vCard to import:",
    },
    
    // Scopes
    scopes:
    {
//        title: "Manage Scopes",
        all: "All Scopes", 
//        add: "Add Scope",        
    },
    
    // Users
    users:
    {
//        title: "Manage Users",
//        add: "Add User",
    },
    
    // Approval Chains
    approvalchains:
    {
//        title: "Manage Approval Chains",
//        add: "Add Chain",
    },
    
    // Notification Templates
    templates:
    {
//        title: "Manage Templates",
//        add: "Add Template",
    },
    
    // Event Handlers
    eventhandlers:
    {
//        title: "Manage Event Handlers",
//        add: "Add Handler",
    },
    
    // Table Headers
    th:
    {
        name: "NAME",
        username: "USERNAME",
        fullname: "FULL NAME",
        email: "E-MAIL",
        attributes: "ATTRIBUTES",
        password: "PASSWORD",
        scope: "SCOPE",
        steps: "STEPS",
        subject: "SUBJECT",
        template: "TEMPLATE",
        filter: "ASSET FILTER",
		welcomepage: "WELCOME PAGE",
		trigger: "TRIGGER EVENT",
        language: "LANGUAGE"
    },
    
    // Generic Stuff
    generic:
    {
//        cancel: "Cancel",
//        remove: "Delete",
//        save: "Save",
//        edit: "Edit"
    }
}


function init_translations(p_function)
{
	var language = api.preferences.get_for_current_user('', 'language').preferences;
	var build = api.portal.version().build;
		
	$.get("/cloudflow_" + language + ".json?" + build).then(function(p_translations) {
		$.i18n.setDictionary(p_translations);
		$('body').find("span.translate").each(function(index, element) {
			e = $(element);
			e._t(e.attr('key'));
		});
		p_function(language);
	}).fail(function() {
		language = "en";
		$.get("/cloudflow_" + language + ".json?" + build).then(function(p_translations) {
			$.i18n.setDictionary(p_translations);
			$('body').find("span.translate").each(function(index, element) {
				e = $(element);
				e._t(e.attr('key'));
			});
			p_function("en");
		}, function(pError) {
            console.error(pError);
        });
	});
}