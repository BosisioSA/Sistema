/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en*/
/*global namespace, nixps*/
/*global panzer_filelist*/


(function() {

	namespace("nixps.patchplanner");

	nixps.patchplanner.application = function() 
	{
		var pLanguage = "en";
		$.get("/cloudflow_" + pLanguage + ".json").then(function(translations) {
			$.i18n.setDictionary(translations);
			$('body').find("span.translate").each(function(index, element) {
				e = $(element);
				e._t(e.attr('key'));
			});
			//pFunction();
		}).fail(function() {
			language = "en";
			$.get("/cloudflow_" + pLanguage + ".json").then(function(translations) {
				$.i18n.setDictionary(translations);
				$('body').find("span.translate").each(function(index, element) {
					e = $(element);
					e._t(e.attr('key'));
				});
				//pFunction();
			});
		});
	};
	 
	nixps.patchplanner.application.prototype = {

		// Returns the layout panel.
		//
		get_layout_panel: function ()
		{
			return this.m_layout_panel;
		},


		// Returns the preferences helper
		//
		get_preferences: function ()
		{
			return this.m_preferences;
		},
			
		// Starts the application.
		// This method also sets the global application instance variable so that the function get_application can be called.
		//
		run: function()
		{


			var l_this = this;
			panzer.m_application_instance = l_this;
 
			var l_$top_component = $('#layout');
			this.m_layout_panel = new nixps.patchplanner.layout_panel();
			this.m_layout_panel.setup_ui(l_$top_component);

			this.get_layout_panel().show();
			this.get_layout_panel().disable();

			// Event handlers
			this.get_layout_panel().get_editor().on('editorlayoutchanged', function() {
				l_this.get_layout_panel().get_sidebar().get_filelist().filelist('redraw');
			});	
			
		}

	};
}());
