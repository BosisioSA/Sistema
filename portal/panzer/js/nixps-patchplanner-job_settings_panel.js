/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $*/
/*global panzer_filelist*/
/*global panzer_layout_edition_sheet*/
/*global console*/


/**
 * A jQuery UI plugin for the editor labels
 */
(function( $ ) {

	$.widget("nixps-patchplanner.job_settings", {
		options: {
			/**
			 * @brief reference to the job being edited
			 */
			jobpath: '',

			/**
			 * @brief the top margin for that job
			 */
			margin_top: 144,

			/**
			 * @brief the left margin for that job
			 */
			margin_left: 144,

			/**
			 * @brief the distortion for that job
			 */
			distortion: 1.00,

			/**
			 * @brief the cilinder circumference
			 */
			cilinder_circumference: 5472,

			/**
			 * @brief the cilinder width
			 */
			cilinder_width: 8496,

			/**
			 * @brief the plate thickness
			 */
			tickness_plate: 9,

			/**
			 * @brief the mylar thickness
			 */
			tickness_mylar: 9,

			/**
			 * @brief the paper thickness
			 */
			tickness_paper: 9,

			/**
			 * @brief the tape thickness
			 */
			tickness_tape: 9,

			/**
			 * @brief the base name to use in the slugline
			 */
			slugline_base_name: null,

			/**
			 * @brief the top margin of the patch
			 */
			patch_margin_top: 45,

			/** 
			 * @brief the bottom margin of the patch
			 */
			patch_margin_bottom: 45,

			/**
			 * @brief the left margin of the patch
			 */
			patch_margin_left: 45,

			/**
			 * @brief the right margin of the patch
			 */
			patch_margin_right: 45,

			/**
			 * @brief the selected mark for the job
			 */
			mark: null,

			/**
			 * @brief if true, the panel is opened in read only mode
			 */
			readOnly: false,

			/**
			 * @brief the mounting method
			 */
			mounting_method: 'mom',

			/**
			 * @brief mirror mounting separation
			 */
			mirror_mounting_separation: '',

			/**
			 * @brief mirror mounting mark distortion
			 */
			mirror_mounting_distortion: 1.00,
			/**
			 * @brief drill mounting die separation
			 */
			drill_mount_die_separation:'',
			/**
			 * @brief drill carrier box
			 */
			drill_mount_carrier_box:'mediabox'

		},


		_create: function() {
			var that = this;
			var unit = (new nixps.cloudflow.UnitPreferences()).getDefinition('small_length');
			var ptUnit = new nixps.cloudflow.Unit({ unit: 'pt' });
			var distortionUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('distortion');
			var noUnit = new nixps.cloudflow.Unit({ unit: '' });

			if ((this.options.jobpath instanceof nixps.cloudflow.URLPath) === false) {
				throw new Error('invalid job path');
			}

			if (this.options.slugline_base_name === null) {
				this.options.slugline_base_name = this.options.jobpath.get_name();
			}
			else if ((typeof this.options.slugline_base_name !== "string")
					|| (this.options.slugline_base_name.length === 0)) {
				throw new Error('invalid parameter');
			}

			this.element.addClass(this.widgetFullName);
			this.element.css('position', 'absolute');
			this.element.css('z-index', 500);
			this.element.css('bottom', 0);
			this.element.css('width', 370);
			this.element.css('overflow-y', 'auto');

			this.element.append('<h1>Job settings - ' + that.options.mounting_method + '</h1>');

			var $row = $('<div>').addClass('row');
			$row.css({
				'margin-top': 3,
				'margin-bottom': 3
			});
			var $label = $('<label>');
			$label.addClass('description');
			$label.css({
				'display': 'inline-block',
				'width': 110,
				'text-align': 'right',
				'margin-right': 5
			});

			var $input = $('<input>');
			$input.css({
				'display': 'inline-block',
				'width': 180
			});

			this.element.append('<h2>Review File</h2>');

			(function() {
				var $myrow = $row.clone().appendTo(that.element);
				$myrow.css({
					'text-align': 'center'
				});
				var $button = $("<button>View file ...</button>");
				$button.addClass('viewfilebutton');
				$button.button();
				$button.appendTo($myrow);
			})();

			this.element.append('<h2>Slug Line</h2>');

			(function() {
				var $myrow = $row.clone().appendTo(that.element);
				$label.clone().text('base name').appendTo($myrow);
				$input.clone().attr('name','slugline_base_name').val(that.options.slugline_base_name).appendTo($myrow);

				var errorMessage = $('<div>').addClass('momerror').text('a MOM file with this name exists').appendTo($myrow).css({
					'margin-left': 122,
					'margin-top': 5
				});

				if (that.options.mounting_method === "mirror") {
					errorMessage.text('a mirror mount file with this name exists');
				}
				else if (that.options.mounting_method === "mirrormom") {
					errorMessage.text('a mirror mount and/or mom file with this name exists');	
				}
				else if(that.options.mounting_method === "drillmount"){
					errorMessage.text('a drill mount file with this name exists');	
				}
				if (that.options.mounting_method === "heaford") {
					errorMessage.text('a Heaford CSV file with this name exists');
				}
			})();

			this.element.append('<h2>General</h2>');

			(function() {
				var distortion = distortionUnit.toStringWithoutUnit(parseFloat(that.options.distortion) * 100, distortionUnit);

				var $myrow = $row.clone().appendTo(that.element);

				$label.clone().text('distortion').appendTo($myrow);
				$input.clone().attr('name','distortion').val(distortion).appendTo($myrow);
				$myrow.append(' %');
			})();

			if (this.options.mounting_method === 'mirror' || this.options.mounting_method === 'mirrormom') {
				this.element.append('<h2>Mirror Mounting</h2>');

				(function() {
					var mirror_mounting_distortion = distortionUnit.toStringWithoutUnit(parseFloat(that.options.mirror_mounting_distortion) * 100, distortionUnit);

					var $myrow = $row.clone().appendTo(that.element);

					$label.clone().text('separation').appendTo($myrow);
					var separations = $('<select>').attr('name','mirror_mounting_separation').css('width', '180px');
					separations.appendTo($myrow);

					separations.append($('<option>').attr('value', '').text('choose'));
					nixps.patchplanner.util.get_asset_separation_names(that.options.jobpath).then(function(names) {
						for(var i = 0; i < names.length; i++) {
							separations.append($('<option>').attr('value', names[i]).text(names[i]));
						}

						separations.val(that.options.mirror_mounting_separation);
					});

					$myrow = $row.clone().appendTo(that.element);
					$label.clone().text('distortion').appendTo($myrow);
					$input.clone().attr('name','mirror_mounting_distortion').val(mirror_mounting_distortion).appendTo($myrow);
					$myrow.append(' %');
				})();
			}
			console.log("Mounting Method = " + this.options.mounting_method);
			if (this.options.mounting_method === 'drillmount') {
				this.element.append('<h2>Drill Mount Settings</h2>');
				(function() {
					var $myrow = $row.clone().appendTo(that.element);
						//drill_mount_die_separation
						$label.clone().text('die').appendTo($myrow);
						var separations = $('<select>').attr('name','drill_mount_die_separation').css('width', '180px');
						separations.appendTo($myrow);
						separations.append($('<option>').attr('value', '').text('choose'));
						nixps.patchplanner.util.get_asset_separation_names(that.options.jobpath).then(function(names) {
							for(var i = 0; i < names.length; i++) {
								separations.append($('<option>').attr('value', names[i]).text(names[i]));
							}
							separations.val(that.options.drill_mount_die_separation);
						});
						//drill_mount_carrier_box
						$label.clone().text('carrier box').appendTo($myrow);
						var carrierbox = $('<select>').attr('name','drill_mount_carrier_box').css('width', '180px');
						carrierbox.appendTo($myrow);
						//carrierbox.append($('<option>').attr('value', '').text('choose'));
						carrierbox.append(
							"<option value='mediabox'>Media Box</option>"+
							"<option value='trimbox'>Trim Box</option>"+
							"<option value='bleedbox'>Bleed Box</option>"+
							"<option value='cropbox'>Crop Box</option>"+
							"<option value='artbox'>Art Box</option>"
						 ); 
						carrierbox.val(that.options.drill_mount_carrier_box); 
				})();
			}	
			if (this.options.mounting_method === 'mom' || this.options.mounting_method === 'mirrormom' || this.options.mounting_method === 'heaford') {
				this.element.append('<h2>Cylinder</h2>');

				(function() {
					var cilinder_circumference = unit.toStringWithoutUnit(ptUnit.convert(that.options.cilinder_circumference, unit));

					var $myrow = $row.clone().appendTo(that.element);

					$label.clone().text('circumference').appendTo($myrow);
					$input.clone().attr('name','cilinder_circumference').val(cilinder_circumference).appendTo($myrow);
					$myrow.append(' ' + unit.getShortName());
				})();

				(function() {
					var cilinder_width = unit.toStringWithoutUnit(ptUnit.convert(that.options.cilinder_width, unit));

					var $myrow = $row.clone().appendTo(that.element);

					$label.clone().text('width').appendTo($myrow);
					$input.clone().attr('name','cilinder_width').val(cilinder_width).appendTo($myrow);
					$myrow.append(' ' + unit.getShortName());
				})();
			}

			if (this.options.mounting_method === 'mom' || this.options.mounting_method === 'mirrormom' || this.options.mounting_method === 'heaford') {
				this.element.append('<h2>Thickness</h2>');

				(function() {
					var value = unit.toStringWithoutUnit(ptUnit.convert(that.options.thickness_plate, unit));

					var $myrow = $row.clone().appendTo(that.element);

					$label.clone().text('plate').appendTo($myrow);
					$input.clone().attr('name','thickness_plate').val(value).appendTo($myrow);
					$myrow.append(' ' + unit.getShortName());
				})();

				(function() {
					var value = unit.toStringWithoutUnit(ptUnit.convert(that.options.thickness_mylar, unit));

					var $myrow = $row.clone().appendTo(that.element);

					$label.clone().text('mylar').appendTo($myrow);
					$input.clone().attr('name','thickness_mylar').val(value).appendTo($myrow);
					$myrow.append(' ' + unit.getShortName());
				})();

				(function() {
					var value = unit.toStringWithoutUnit(ptUnit.convert(that.options.thickness_paper, unit));

					var $myrow = $row.clone().appendTo(that.element);

					$label.clone().text('paper').appendTo($myrow);
					$input.clone().attr('name','thickness_paper').val(value).appendTo($myrow);
					$myrow.append(' ' + unit.getShortName());
				})();

				(function() {
					var value = unit.toStringWithoutUnit(ptUnit.convert(that.options.thickness_tape, unit));

					var $myrow = $row.clone().appendTo(that.element);

					$label.clone().text('tape').appendTo($myrow);
					$input.clone().attr('name','thickness_tape').val(value).appendTo($myrow);
					$myrow.append(' ' + unit.getShortName());
				})();
			}

			this.element.append('<h2>Marks</h2>');

			(function() {
				var $myrow = $row.clone().appendTo(that.element);

				var clone = $label.clone();
				clone = $label.text('mark').appendTo($myrow);
				clone.css({
					'vertical-align': 'top'
				});

				var markList = $('<div>');
				markList.css({
					'max-height': 200,
					'display': 'inline-block',
					'overflow-x': 'hidden',
					'overflow-y': 'auto',
					'width': 220
				});
				markList.markslistview({
					refresh: false,
					selectionchanged: function() {
						that._settingChangedHandler();
					}
				});
				markList.markslistview('setSelected', that.options.mark);
				markList.appendTo($myrow);
			})();

			this.element.append('<h2>Patch Margins</h2>');

			(function() {
				var value = unit.toStringWithoutUnit(ptUnit.convert(that.options.patch_margin_top, unit));

				var $myrow = $row.clone().appendTo(that.element);

				$label.clone().text('top').appendTo($myrow);
				$input.clone().attr('name','patch_margin_top').val(value).appendTo($myrow);
				$myrow.append(' ' + unit.getShortName());
			})();

			(function() {
				var value = unit.toStringWithoutUnit(ptUnit.convert(that.options.patch_margin_bottom, unit));

				var $myrow = $row.clone().appendTo(that.element);

				$label.clone().text('bottom').appendTo($myrow);
				$input.clone().attr('name','patch_margin_bottom').val(value).appendTo($myrow);
				$myrow.append(' ' + unit.getShortName());
			})();

			(function() {
				var value = unit.toStringWithoutUnit(ptUnit.convert(that.options.patch_margin_left, unit));

				var $myrow = $row.clone().appendTo(that.element);

				$label.clone().text('left').appendTo($myrow);
				$input.clone().attr('name','patch_margin_left').val(value).appendTo($myrow);
				$myrow.append(' ' + unit.getShortName());
			})();

			(function() {
				var value = unit.toStringWithoutUnit(ptUnit.convert(that.options.patch_margin_right, unit));

				var $myrow = $row.clone().appendTo(that.element);

				$label.clone().text('right').appendTo($myrow);
				$input.clone().attr('name','patch_margin_right').val(value).appendTo($myrow);
				$myrow.append(' ' + unit.getShortName());
			})();

			if (this.options.mounting_method === 'mom' || this.options.mounting_method === 'mirrormom') {
				this.element.append($('<h2>').text('Cylinder Marks').addClass('hideReadOnly'));

				(function() {
					var $myrow = $row.clone().appendTo(that.element).addClass('hideReadOnly');
					$myrow.css({
						'text-align': 'center'
					});

					var $button = $("<button>Set cylinder marks...</button>");
					$button.button();
					$button.hide();
					$button.addClass('markseditorbutton');

					var $message = $("<span><img src='/portal/images/patchplanner_wait_render.gif'/>Preview not available yet ...</span>");
					$message.find('img').css({
						'vertical-align': 'text-bottom',
						'margin-right': '10px'
					});
					$myrow.append($message);
					(function patchplanner_check_render() {
						nixps.patchplanner.util.is_rendered(that.options.jobpath).then(function(pRendered) {
							if (pRendered) {
								$message.hide();
								$button.show();
							}
							else {
								that._delay(patchplanner_check_render, 3000);
							}
						}).fail(function() {
							that._delay(patchplanner_check_render, 3000);
						});
					})();

					$myrow.append($button);
				})();
			}

			this._on(this.element, {
				'click .markseditorbutton': this._openCylinderMarksEditor,
				'blur input': this._settingChangedHandler,
				'change select': this._settingChangedHandler,
				'click .viewfilebutton': this._viewFileHandler,
				'keydown input[name=slugline_base_name]': this._sluglineChangedHandler
			});

			this.option('readonly', this.options.readonly);
			this._sluglineChangedHandler();
		},


		_sluglineChangedHandler: function() {
			if (typeof this.sluglineChangedTimerID === "number") {
				clearTimeout(this.sluglineChangedTimerID);
			}

			this.sluglineChangedTimerID = this._delay(function() {
				var slugineName = this.element.find('input[name=slugline_base_name]').val();
				
				var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();

				this.element.find('.momerror').hide();
				if (this.options.mounting_method === "mirror") {
					var result = api.printplanner.mom_file_exists(slugineName + "_mount.pdf", cloudflowSettings.getMirrorProofsOutputPath().getFullPath());
					if (result.mom_exists === true) {
						this.element.find('.momerror').show();
					}
				}
				else if (this.options.mounting_method === "mirrormom") {
					var result = api.printplanner.mom_file_exists(slugineName + ".xml", cloudflowSettings.getMOMOutputPath().getFullPath());
					var mirrorResult = api.printplanner.mom_file_exists(slugineName + "_mount.pdf", cloudflowSettings.getMirrorProofsOutputPath().getFullPath());
					if (result.mom_exists === true || mirrorResult.mom_exists === true) {
						this.element.find('.momerror').show();
					}
				}
				else {
					var result = api.printplanner.mom_file_exists(slugineName + ".xml", cloudflowSettings.getMOMOutputPath().getFullPath());
					if (result.mom_exists === true) {
						this.element.find('.momerror').show();
					}
				}

			}, 300); 
		},


		_checkThicknessBounds: function(pThicknessPt) {
			if (pThicknessPt > 72) {
				return false;
			}
			else if (pThicknessPt < 0) {
				return false;
			}

			return true;
		},


		_settingChangedHandler: function() {
			var that = this;
			var unit = (new nixps.cloudflow.UnitPreferences()).getDefinition('small_length');
			var ptUnit = new nixps.cloudflow.Unit({ unit: 'pt' });
			var distortionUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('distortion');
			var noUnit = new nixps.cloudflow.Unit({ unit: '' });

			this.element.find('input,select').each(function(p_index, p_input) {
				var $input = $(p_input);
				var value = $input.val();
				var numberValue = parseFloat(value);
				switch($input.attr('name')) {
					case 'margin_left':
						that.options.margin_left = unit.convert(numberValue, ptUnit);
						break;

					case 'margin_top':
						that.options.margin_top = unit.convert(numberValue, ptUnit);
						break;

					case 'distortion':
						if ((value > 0) && (value <= 100.0)) {
							that.options.distortion = parseFloat(parseFloat(value).toFixed(10)) / 100;
						}
						break;

					case 'cilinder_circumference':
						that.options.cilinder_circumference = unit.convert(numberValue, ptUnit);
						break;

					case 'cilinder_width':
						that.options.cilinder_width = unit.convert(numberValue, ptUnit);
						break;

					case 'slugline_base_name':
						that.options.slugline_base_name = value;
						break;

					case 'thickness_paper':
						if ((!isNaN(numberValue)) && that._checkThicknessBounds(unit.convert(numberValue, ptUnit))) {
							that.options.thickness_paper = unit.convert(numberValue, ptUnit);
						}
						else {
							that.element.find("input[name='thickness_paper']").val(unit.toStringWithoutUnit(ptUnit.convert(that.options.thickness_paper, unit)));
						}
						break;

					case 'thickness_tape':
						if ((!isNaN(numberValue)) && that._checkThicknessBounds(unit.convert(numberValue, ptUnit))) {
							that.options.thickness_tape = unit.convert(numberValue, ptUnit);
						}
						else {
							that.element.find("input[name='thickness_tape']").val(unit.toStringWithoutUnit(ptUnit.convert(that.options.thickness_tape, unit)));
						}
						break;

					case 'thickness_mylar':
						if ((!isNaN(numberValue)) && that._checkThicknessBounds(unit.convert(numberValue, ptUnit))) {
							that.options.thickness_mylar = unit.convert(numberValue, ptUnit);
						}
						else {
							that.element.find("input[name='thickness_mylar']").val(unit.toStringWithoutUnit(ptUnit.convert(that.options.thickness_mylar, unit)));
						}
						break;

					case 'thickness_plate':
						if ((!isNaN(numberValue)) && that._checkThicknessBounds(unit.convert(numberValue, ptUnit))) {
							that.options.thickness_plate = unit.convert(numberValue, ptUnit);
						}
						else {
							that.element.find("input[name='thickness_plate']").val(unit.toStringWithoutUnit(ptUnit.convert(that.options.thickness_plate, unit)));
						}
						break;

					case 'patch_margin_top':
						that.options.patch_margin_top = unit.convert(numberValue, ptUnit);
						break;

					case 'patch_margin_bottom':
						that.options.patch_margin_bottom = unit.convert(numberValue, ptUnit);
						break;

					case 'patch_margin_left':
						that.options.patch_margin_left = unit.convert(numberValue, ptUnit);
						break;

					case 'patch_margin_right':
						that.options.patch_margin_right = unit.convert(numberValue, ptUnit);
						break;

					case 'mirror_mounting_separation':
						that.options.mirror_mounting_separation = value;
						break;
					case 'mirror_mounting_distortion':
						if ((value > 0) && (value <= 100.0)) {
							that.options.mirror_mounting_distortion = parseFloat(parseFloat(value).toFixed(10)) / 100;
						}
						break;
					case 'drill_mount_die_separation':
						that.options.drill_mount_die_separation = value;
						break;
					case 'drill_mount_carrier_box':
						that.options.drill_mount_carrier_box = value;
						break;	
				}
			});
		
			var selected = this.element.find(':nixps-patchplanner-markslistview').markslistview('getSelected');
			that.options.mark = selected;
		},

		_openCylinderMarksEditor: function() {
			var editor = $("<div>").appendTo($('#layout.patchplanner'));
			editor.cylinder_marks_editor_dialog({
				file: this.options.jobpath
			});
			editor.cylinder_marks_editor_dialog("open");
		},

		_viewFileHandler: function() {
			var jobpath = this.options.jobpath;
			window.open("/portal.cgi?proofscope&url=" + encodeURI(jobpath.get_full_path()));
		},

		_setOption: function(pKey, pValue) {
			if (pKey === "readonly") {
				if (pValue === true) {
					this.element.find('input,select').prop('readonly', true);
					this.element.find('.hideReadOnly').hide();
					this.element.find('.nixps-patchplanner-markslistview').markslistview('option', 'readonly', true);
				}
				else {
					this.element.find('input,select').prop('readonly', false);
					this.element.find('.hideReadOnly').show();
					this.element.find('.nixps-patchplanner-markslistview').markslistview('option', 'readonly', false);
				}

				return this._superApply(arguments);
			}

		},


		_destroy: function() {
			// Use the destroy method to reverse everything your plugin has applied
			return this._super();
		}		
	});

}) (jQuery);

