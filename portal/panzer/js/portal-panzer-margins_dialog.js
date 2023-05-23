/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/


(function( $ ) {

	$.widget("nixps-printplanner.margins_dialog", $.ui.dialog, {

		options: {

			/**
			 * @brief max height (pt)
			 */
			sheetMaxHeight: 1984,

			/** 
			 * @brief min height (pt)
			 */
			sheetMinHeight: 1417,

			/** 
			 * @brief width (pt)
			 */
			sheetWidth: 850,

			/**
			 * @brief horizontal margin between labels (pt)
			 */
			horizontalMargin: 28,

			/**
			 * @brief vertical margin between lebels (pt)
			 */
			verticalMargin: 28

		},


		/**
		 * @brief creates the konica dialog
		 */
		_create: function() {
			this.options.width = 680;
			this.options.height = 370;
			this.options.resizable = false;
			this.options.title = 'Setup Margins';
			this.options.modal = true;
			this.options.buttons = [
				{ 
					text: "Ok", 
					click: function() { 
						$(this).margins_dialog("updateModel");
						$(this).margins_dialog("close"); 
					}
				},
				{ 
					text: "Cancel", 
					click: function() { 
						$(this).margins_dialog("close"); 
					}
				}				
			];
			this.options.position = {
				my: "center top+200",
				at: "center top",
				of: this.window
			};


			this._super();

			var dialogTemplate = 
				"<div class='settings'>"
					+ "<h1>Settings</h1>"
					+ "<div class='row'>"
						+ "<label class='fieldname'>width</label><input name='sheetWidth' value='${sheetWidth}'><label class='unit'>${unitname}</label>"
					+ "</div>"
					+ "<div class='row'>"
						+ "<label class='fieldname'>minimum height</label><input name='sheetMinHeight' value='${sheetMinHeight}'><label class='unit'>${unitname}</label>"
					+ "</div>"
					+ "<div class='row'>"
						+ "<label class='fieldname'>maximum height</label><input name='sheetMaxHeight' value='${sheetMaxHeight}'><label class='unit'>${unitname}</label>"
					+ "</div>"
					+ "<div class='row'>"
						+ "<label class='fieldname'>vertical gap (A)</label><input name='verticalMargin' value='${verticalMargin}'><label class='unit'>${unitname}</label>"
					+ "</div>"
					+ "<div class='row'>"
						+ "<label class='fieldname'>horizontal gap (B)</label><input name='horizontalMargin' value='${horizontalMargin}'><label class='unit'>${unitname}</label>"
					+ "</div>"
				+ "</div>";

			var settingsImage = "<img class='image' src='/okilms/images/v_exact_h_exact.png'>";

			var unit = panzer.units.get_current();
			var settingsDiv = $.tmpl(dialogTemplate, {
				sheetMinHeight: unit.format_value(panzer.units.convert(this.options.sheetMinHeight, panzer.units.pt, unit)),
				sheetMaxHeight: unit.format_value(panzer.units.convert(this.options.sheetMaxHeight, panzer.units.pt, unit)),
				sheetWidth: unit.format_value(panzer.units.convert(this.options.sheetWidth, panzer.units.pt, unit)),
				horizontalMargin: unit.format_value(panzer.units.convert(this.options.horizontalMargin, panzer.units.pt, unit)),
				verticalMargin: unit.format_value(panzer.units.convert(this.options.verticalMargin, panzer.units.pt, unit)),
				unitname: unit.get_short_name()
			});

			this.element.addClass(this.widgetFullName);
			this.element.append(settingsDiv);
			this.element.append(settingsImage);
		},


		/**
		 * @brief updates the options of the dialog 
		 */
		updateModel: function() {
			var unit = panzer.units.get_current();
			var ptunit = panzer.units.pt;

			var sheetWidthUnit = parseFloat(this.element.find('input[name=sheetWidth]').val());
			var sheetMinHeightUnit = parseFloat(this.element.find('input[name=sheetMinHeight]').val());
			var sheetMaxHeightUnit = parseFloat(this.element.find('input[name=sheetMaxHeight]').val());
			var horizontalMarginUnit = parseFloat(this.element.find('input[name=horizontalMargin]').val());
			var verticalMarginUnit = parseFloat(this.element.find('input[name=verticalMargin]').val());

			this.options.sheetWidth = panzer.units.convert(sheetWidthUnit, unit, panzer.units.pt);
			this.options.sheetMinHeight = panzer.units.convert(sheetMinHeightUnit, unit, panzer.units.pt);
			this.options.sheetMaxHeight = panzer.units.convert(sheetMaxHeightUnit, unit, panzer.units.pt);
			this.options.horizontalMargin =panzer.units.convert(horizontalMarginUnit, unit, panzer.units.pt);
			this.options.verticalMargin = panzer.units.convert(verticalMarginUnit, unit, panzer.units.pt);
		}

	});

})(jQuery);