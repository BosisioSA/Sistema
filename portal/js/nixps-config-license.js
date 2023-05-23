///////////////////////////////////////////////////////////////////////////////////////
// LICENSE TAB
///////////////////////////////////////////////////////////////////////////////////////

var license_tab =
{
	//
	// General Methods
	//
	setup_ui: function(pPrereleaseFlags)
	{
		$('#config-navs').append("<li id='tabs-license-tab'><a href='#tabs-license'>" + $.i18n._('nixps-cloudflow-license.title') + "</a></li>");
		$('#config-tabs').append("<div id='tabs-license' class='tab'><table id='license-table' class='tsw-table' style='margin-right:0px; margin-left:0px; width:100%'></table></div>");
	},

	enable_handlers: function()
	{
		$('#reset_db').css("cursor", "pointer");

		if ($.inArray('ADMIN', sPermissions) < 0) {
			$('#license-table').empty();
			return;
		}

		api_async.license.get_license({}, function(data) {
			license_tab.update_ui(data);
		});
	},

	reload: function()
	{
		if (window.location.href.indexOf('license') < 0) {
			window.location = '/?config=1&license=1';
		} else {
			window.location.reload();
		}
	},

	setup_initial_site: function(pLicense, pSerial)
	{
		$('#license-table').empty();
		$('#license-table').append("<tr class='meta-row'>"+
			"<td colspan='4'><div class='meta-arrow' style='display: block;'>"+
			$.i18n._('nixps-cloudflow-license.no_license') +
			"</div></td></tr>");
		$('#license-table').append("<tr class='ws_entry'>"+
			"<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-license.title').toUpperCase() + "</td>"+
			"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
			"<td></td></tr>");
		var span = $('<span>');
		span.text(pLicense.customer_code);
		$('#license-table').append("<tr>"+
			"<td width='35px'></td>"+
			"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-license.customer_code') + "</td>"+
			"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
			"<td class='description'>" + span.html() + "</td></tr>");
		span.text(pSerial);
		$('#license-table').append("<tr>"+
			"<td width='35px'></td>"+
			"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-license.serial') + "</td>"+
			"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
			"<td class='description'>" + span.html() + "</td></tr>");
		$('#license-table').append("<tr>"+
			"<td width='35px'></td>"+
			"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-license.site') + "</td>"+
			"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
			"<td class='description'><select id='license-site' size='1'></td></tr>");
		$('#license-table').append("<tr class='ws_entry'>"+
			"<td width='35px'></td>"+
			"<td width='25%'></td>"+
			"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
			"<td class='buttons'><a class='green-button' id='set-license-site-button'>" + $.i18n._('nixps-cloudflow-license.continue_button') + "</a> "+
			"<img id='set-license-site-loading' src='portal/images/loading10.gif'>"+
			"</td></tr>");
		$('#license-table').append("<tr class='meta-row' id='license-error'>"+
			"<td colspan='4'><div class='meta-arrow' style='display: block;'>"+
			"<img class='meta-arrow-image' src='portal/images/dashboard_fold_arrow.png'>"+
			"<span id='license-error-msg'>X</span>"+
			"</div></td></tr>");
		var siteList = Object.keys(pLicense.sites);
		for (var siteIndex = 0; siteIndex < siteList.length; ++siteIndex) {
			var option = $('<option>');
			option.attr('value', siteList[siteIndex]);
			option.text(siteList[siteIndex]);
			$('#license-site').append(option);
		}
		$('#set-license-site-loading').hide();
		$("#license-error").hide();
		$('#set-license-site-button').on('click', function () {
			$('#set-license-site-button').hide();
			$('#set-license-site-loading').show();
			var errorHandler =  function (e) {
				$('#set-license-site-loading').hide();
				$('#set-license-site-button').show();
				$("#license-error-msg")._t('nixps-cloudflow-license.msg-download_failed', [e.error]);
				$("#license-error").show();
			};

			$.post("/portal.cgi", '{"method":"request.config","name":"servers"}', function (config) {
				var siteDef = {name: $('#license-site').val(), description: $('#license-site').val(), url: config.preferences.web_server};
				api_async.site.setup(siteDef, function () {
					api_async.license.get_license({}, function (l) {
						//license_tab.update_ui(l);
						license_tab.reload();
					}, errorHandler);
				}, errorHandler);
			});
		});
	},

	update_ui: function(pLicenseDescription)
	{
		$('#license-table').empty();

		if ((pLicenseDescription == null) || (pLicenseDescription.status === 'invalid')) {
			$('#license-table').append("<tr class='meta-row'>"+
				"<td colspan='4'><div class='meta-arrow' style='display: block;'>"+
				$.i18n._('nixps-cloudflow-license.no_license') +
				"</div></td></tr>");
			$('#license-table').append("<tr class='ws_entry'>"+
				"<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-license.title').toUpperCase() + "</td>"+
				"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
				"<td></td></tr>");
			$('#license-table').append("<tr>"+
				"<td width='35px'></td>"+
				"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-license.customer_code') + "</td>"+
				"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
				"<td class='description'><input id='customer_code_value' value='' size='40'></td></tr>");
			$('#license-table').append("<tr>"+
				"<td width='35px'></td>"+
				"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-license.serial') + "</td>"+
				"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
				"<td class='description'><input id='serial_value' value='' size='40'></td></tr>");
			$('#license-table').append("<tr class='ws_entry'>"+
				"<td width='35px'></td>"+
				"<td width='25%'></td>"+
				"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
				"<td class='buttons'><a class='green-button' id='get-license-button'>" + $.i18n._('nixps-cloudflow-license.download_button') + "</a> "+
				"<a class='green-button' id='upload-license-button'>" + $.i18n._('nixps-cloudflow-license.upload_button') + "</a><input type='file' id='upload-license-file' style='opacity:0'>"+
				"<img id='get-license-loading' src='portal/images/loading10.gif'>"+
				"</td></tr>");
			$('#license-table').append("<tr class='meta-row' id='license-error'>"+
				"<td colspan='4'><div class='meta-arrow' style='display: block;'>"+
				"<img class='meta-arrow-image' src='portal/images/dashboard_fold_arrow.png'>"+
				"<span id='license-error-msg'>X</span>"+
				"</div></td></tr>");
			
			$('#get-license-loading').hide();
			$("#license-error").hide();

			$("#get-license-button").click(function() {
				if ($("#customer_code_value").val() == "") {
					$("#license-error-msg")._t("nixps-cloudflow-license.msg-no_customer_code");
					$("#license-error").show();
				} else if ($("#serial_value").val() == "") {
					$("#license-error-msg")._t("nixps-cloudflow-license.msg-no_serial");
					$("#license-error").show();
				} else {
					$("#license-error").hide();
					$('#get-license-button').hide();
					$('#upload-license-button').hide();
					$('#get-license-loading').show();

					api_async.license.download_new($("#customer_code_value").val(), $("#serial_value").val(), function(data) {
						api_async.license.get_license({}, function (lic) {
							$('#get-license-loading').hide();
							$('#get-license-button').show();
							if ((lic === null) || (lic.status === 'invalid')) {
								if ((data.sites !== undefined) && ($.isEmptyObject(data.sites) === false)) {
									license_tab.setup_initial_site(data, $("#serial_value").val());
								} else {
									$("#license-error-msg")._t('nixps-cloudflow-license.msg-download_failed', [data.error]);
									$("#license-error").show();
								}
							} else {
								$('#upload-license-button').show();
								//license_tab.update_ui(lic);
								license_tab.reload();
							}
						});
					}, function(data) {
						$('#get-license-loading').hide();
						$('#upload-license-button').show();
						$('#get-license-button').show();
						$("#license-error-msg")._t('nixps-cloudflow-license.msg-download_failed', [data.error]);
						$("#license-error").show();
					});
				}
			});
			
			$('#upload-license-button').click(function () {
				if ($("#customer_code_value").val() == "") {
					$("#license-error-msg")._t("nixps-cloudflow-license.msg-no_customer_code");
					$("#license-error").show();
				} else if ($("#serial_value").val() == "") {
					$("#license-error-msg")._t("nixps-cloudflow-license.msg-no_serial");
					$("#license-error").show();
				} else {
					if (! $.browser.msie) {
						$('#get-license-file').css('opacity', 0.01);
					}
					$('#upload-license-file').click();
					$('#upload-license-file').css('opacity', 0);
				}
			});
			
			$('#upload-license-file').change(function (e) {
				$("#license-error").hide();
				$('#get-license-button').hide();
				$('#upload-license-button').hide();
				$('#get-license-loading').show();
				var l_files = $('#upload-license-file')[0].files;
				var l_reader = new FileReader();
				l_reader.onloadend = function (e2) {
					$('#get-license-loading').hide();
					$('#upload-license-button').show();
					$('#get-license-button').show();
					var l_data = this.result;
					var l_valid = (typeof l_result !== typeof "blah");
					var l_parsed_data;
					if (l_valid) {
						try {
							l_parsed_data = JSON.parse(l_data);
							l_valid = l_parsed_data.customer_code !== undefined;
						} catch (l_exception) {
							l_valid = false;
						}
					}
					if (l_valid) {
						api_async.license.install($("#customer_code_value").val(), $("#serial_value").val(), l_data, function(data) {
							api_async.license.get_license({}, function (lic) {
								$('#get-license-loading').hide();
								$('#get-license-button').show();
								$('#upload-license-button').show();
								if ((lic === null) || (lic.status === 'invalid')) {
									if ((data.sites !== undefined) && ($.isEmptyObject(data.sites) === false)) {
										license_tab.setup_initial_site(data, $("#serial_value").val());
									} else {
										$("#license-error-msg")._t('nixps-cloudflow-license.msg-upload_failed', [data.error]);
										$("#license-error").show();
									}
								} else {
									$('#upload-license-button').show();
									//license_tab.update_ui(lic);
									license_tab.reload();
								}
							}, function(e) {
								$('#get-license-loading').hide();
								$('#upload-license-button').show();
								$('#get-license-button').show();
								$("#license-error-msg")._t('nixps-cloudflow-license.msg-upload_failed', [e.error]);
								$("#license-error").show();
							});
						}, function(e) {
							$('#get-license-loading').hide();
							$('#upload-license-button').show();
							$('#get-license-button').show();
							$("#license-error-msg")._t('nixps-cloudflow-license.msg-upload_failed', [e.error]);
							$("#license-error").show();
						});
					} else {
						$("#license-error-msg").text("This is not a license file.");
						$("#license-error").show();
					}
				};
				l_reader.readAsText(l_files[0]);
				// voodoo magic to reset the file input
				$('#upload-license-file').wrap('<form>').closest('form').get(0).reset();
				$('#upload-license-file').unwrap();
			});

		} else if ((pLicenseDescription.status === 'stale') || (pLicenseDescription.status === 'expired')) {
			var td1 = $("<td colspan='2' class='header' style='padding:8px;'>");
			td1.text($.i18n._('nixps-cloudflow-license.customer_code').toUpperCase());
			var td2 = $("<td class='' colspan='2'>");
			td2.text(pLicenseDescription.customer_code);
			var tr = $("<tr>");
			tr.append(td1);
			tr.append("<td class='running'><img src='portal/images/empty.png' height='1'/></td>");
			tr.append(td2);
			$('#license-table').append(tr);
			$('#license-table').append("<tr class='meta-row'>"+
				"<td colspan='4'><div class='meta-arrow' style='display: block;'>"+
				$.i18n._('nixps-cloudflow-license.error.' + pLicenseDescription.status, [(new Date(pLicenseDescription.date)).toLocaleDateString()]) +
				"</div></td></tr>");

			var buttonRow = "<a class='red-button' id='clear-license-button'>" + $.i18n._('nixps-cloudflow-license.clear_button') +
				"</a> <a class='green-button' id='update-license-button'>" + $.i18n._('nixps-cloudflow-license.update_button') +
				"</a>";

			$('#license-table').append("<tr class='ws_entry'>"+
						"<td width='35px'></td>"+
						"<td width='25%' ></td>"+
						"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
						"<td class='buttons'>" + buttonRow + "<img id='license-processing' src='portal/images/loading10.gif'/></td></tr>");
			$('#license-table').append("<tr class='meta-row' id='license-error'>"+
						"<td colspan='4'><div class='meta-arrow' style='display: block;'>"+
						"<img class='meta-arrow-image' src='portal/images/dashboard_fold_arrow.png'>"+
						"<span id='license-error-msg'>X</span>"+
						"</div></td></tr>");

			$('#license-processing').hide();
			$("#license-error").hide();

			$("#clear-license-button").click(function() {
				var clear_function = function() {
					$("#license-error").hide();
					$('#clear-license-button').hide();
					$('#update-license-button').hide();
					$('#activate-button').hide();
					$('#license-processing').show();

					api_async.license.reset(function(data) {
						$('#clear-license-button').show();
						$('#update-license-button').show();
						$('#license-processing').hide();

						if (data.error != undefined)
						{
							$("#license-error-msg")._t("nixps-cloudflow-license.msg-clear_failed", [data.error]);
							$("#license-error").show();
						}
						else
						{
							license_tab.update_ui(null);
						}
					});
				};
	
				$('body').Dialog("show_yes_no", $.i18n._('nixps-cloudflow-license.clear_warn_title'), $.i18n._('nixps-cloudflow-license.clear_warn_msg'), "", clear_function, function() {});
			});

			$("#update-license-button").click(function() {
				$("#license-error").hide();
				$('#clear-license-button').hide();
				$('#update-license-button').hide();
				$('#activate-button').hide();
				$('#license-processing').show();

				api_async.license.update(function(data) {
					$('#clear-license-button').show();
					$('#update-license-button').show();
					$('#license-processing').hide();

					if (data.error != undefined)
					{
						$("#license-error-msg")._t("nixps-cloudflow-license.msg-update_failed", [data.error]);
						$("#license-error").show();
					}
					else
					{
						license_tab.reload();
					}
				});
			});
		} else if (pLicenseDescription.machines !== undefined) {
			var td1 = $("<td colspan='2' class='header' style='padding:8px;'>");
			td1.text($.i18n._('nixps-cloudflow-license.customer_code').toUpperCase());
			var td2 = $("<td class='' colspan='2'>");
			td2.text(pLicenseDescription.customer_code);
			var tr = $("<tr>");
			tr.append(td1);
			tr.append("<td class='running'><img src='portal/images/empty.png' height='1'/></td>");
			tr.append(td2);
			$('#license-table').append(tr);

			var maintenanceEnd = undefined;
			var hasPendingActivations = false;

			if (pLicenseDescription.sites.length > 0) {
				pLicenseDescription.sites.sort(function (x, y) { return x.name.localeCompare(y.name); });

				for (var siteIndex = 0; siteIndex < pLicenseDescription.sites.length; ++siteIndex) {
					if (pLicenseDescription.sites[siteIndex].name === pLicenseDescription.current_site) {
						var site = pLicenseDescription.sites[siteIndex];
						pLicenseDescription.sites.splice(siteIndex, 1);
						pLicenseDescription.sites.splice(0, 0, site);
						break;
					}
				}

				for (var siteIndex = 0; siteIndex < pLicenseDescription.sites.length; ++siteIndex) {
					if (siteIndex === 1) {
						tr = $("<tr class='ws_entry'>");
						td1 = $("<td colspan='2' class='header'>");
						td1._t('nixps-cloudflow-license.other-sites');
						td1.css('font-weight', 'bold');
						tr.append(td1);
						$('#license-table').append(tr);
					}

					var site = pLicenseDescription.sites[siteIndex];
					td1 = $("<td colspan='2' class='header'>");
					if (site.name === '*') {
						td1._t('nixps-cloudflow-license.current-site');
					} else if (siteIndex === 0) {
						td1.text($.i18n._('nixps-cloudflow-license.current-site') + ': ' + site.name);
						td1.css('font-weight', 'bold');
					} else {
						td1.text($.i18n._('nixps-cloudflow-license.site') + ' ' + site.name);
					}
					tr = $("<tr class='ws_entry'>");
					tr.append(td1);
					$('#license-table').append(tr);

					for (var machineIndex = 0; machineIndex < site.machines.length; ++machineIndex) {
						var machine = site.machines[machineIndex];
						td1 = $("<td colspan='2' class='header' style='padding:8px; border-top: 10px solid white'>");
						td1.text(machine.name.toUpperCase());
						td2 = $("<td colspan='2' class='header' style='padding:8px 0px; border-top: 10px solid white'>");
						if (machine.system_id !== undefined) {
							td2.text($.i18n._('nixps-cloudflow-license.system_id') + ': ' + machine.system_id);
						}
						var tr = $("<tr>");
						tr.append(td1);
						tr.append("<td class='header' style='padding:8px; border-top: 10px solid white'>&nbsp;</td>");
						tr.append(td2);
						$('#license-table').append(tr);
						if ((siteIndex === 0) && (machine.activation !== 'activated') && (machine.activation !== 'not needed')) {
							var msg_td = $("<td colspan='4' class='header activationMsg' style='padding:8px 0px'>");
							msg_td.attr('machine', machine.name);
							msg_td.attr('site', siteIndex);
							if (machine.activation === 'not activated') {
								msg_td.append("<img src='/portal/images/WarningSmall.png'>&nbsp;");
							} else if ((machine.activation === 'error') || (machine.activation === 'required')) {
								msg_td.append("<img src='/portal/images/ErrorSmall.png'>&nbsp;");
							} else if (machine.activation === 'pending') {
								hasPendingActivations = true;
							}
							span = $("<span>");
							span._t('nixps-cloudflow-license.activation-' + machine.activation.replace(' ', '_'));
							msg_td.append(span);
							if ((machine.system_id === undefined) && (machine.activation !== 'not needed')) {
								msg_td.append('<br><img src="/portal/images/ErrorSmall.png">&nbsp;');
								var span = $("<span>");
								span._t('nixps-cloudflow-license.activation-no_system_id');
								msg_td.append(span);
							} else if ((machine.activation === 'not activated') || (machine.activation === 'required')) {
								if (machine.activation === 'not activated') {
									var span = $("<span>");
									if (machine.activation_days_left > 0) {
										span._t('nixps-cloudflow-license.activation-needs_activation_days_left', [machine.activation_days_left]);
									} else {
										span._t('nixps-cloudflow-license.activation-needs_activation_today');
									}
									msg_td.append(' ');
									msg_td.append(span);
								}
								msg_td.append('&nbsp;&nbsp;');
								var machineName = machine.name;
								var a = $("<a href='#'>");
								a._t('nixps-cloudflow-license.activate_button');
								a.click(function () {
									$(this).hide();
									api_async.license.activate(machineName,
										function (result) {
											 license_tab.reload(result);
										},
										function (errors) {
											msg_td.html("<img src='/portal/images/WarningSmall.png'>&nbsp;");
											for (var i = 0; i < errors.messages.length; ++i) {
												if (i > 0) {
													msg_td.append('<br>');
												}
												var span = $("<span>");
												span.text(errors.messages[i].description);
												msg_td.append(span);
											}
										}
									);
								});
								msg_td.append(a);
							}
							tr = $("<tr><td class='header'>&nbsp;</td></tr>");
							tr.attr('machine', machine.name);
							tr.append(msg_td);
							$('#license-table').append(tr);
						}

						var hasProducts = (pLicenseDescription.products !== undefined)
							&& (pLicenseDescription.products.sites !== undefined)
							&& (pLicenseDescription.products.sites[site.name] !== undefined)
							&& (pLicenseDescription.products.sites[site.name][machine.name] !== undefined)
							&& (pLicenseDescription.products.sites[site.name][machine.name].length > 0);

						if (hasProducts === true) {
							var productList = pLicenseDescription.products.sites[site.name][machine.name];
							for (var productIndex = 0; productIndex < productList.length; ++productIndex) {
								var product = productList[productIndex];
								var interval = '';
								if (product.interval !== undefined) {
									var start = new Date(product.interval[0]);
									var end = new Date(product.interval[1]);
									interval = " (" + $.i18n._('nixps-cloudflow-license.date_interval', [start.toLocaleDateString(), end.toLocaleDateString()]) + ")";
								}
								td1 = $("<td width='25%' class='name'>");
								td1.text(product.name + interval);
								tr = $("<tr><td width='35px'></td>");
								tr.append(td1);
								tr.append("<td class='running'><img src='portal/images/empty.png' height='24'/></td>");
								tr.append("<td colspan='2'></td>");
								$('#license-table').append(tr);
								tr.find('td').on('click', function () { $('#license-table tr.techlic').toggle(); });
							}
						}

						for (var licenseIndex = 0; licenseIndex < machine.licenses.length; ++licenseIndex) {
							var license = machine.licenses[licenseIndex];
							var interval = '';
							var value = '';
							if (license.code == 'maintenance') {
								if (license.end !== undefined) {
									maintenanceEnd = new Date(0); maintenanceEnd.setUTCSeconds(license.end);
								}
							} else {
								if (license.start !== undefined) {
									var start = new Date(0); start.setUTCSeconds(license.start);
									var end = new Date(0); end.setUTCSeconds(license.end);
									interval = " (" + $.i18n._('nixps-cloudflow-license.date_interval', [start.toLocaleDateString(), end.toLocaleDateString()]) + ")";
								}
								if (license.value !== undefined) {
									value = license.value;
								}
								td1 = $("<td width='25%' class='name' style='padding-top:1px'>");
								var name = $.i18n._('nixps-cloudflow-license.license-' + license.code);
								if (name === 'nixps-cloudflow-license.license-' + license.code) {
									name = license.code;
								}
								td1.text(name.toUpperCase() + interval);
								td2 = $("<td colspan='2' style='padding-top:1px'>");
								td2.text(value);
								tr = $("<tr class='ws_entry techlic'><td width='35px' style='padding-top:1px'></td>");
								tr.append(td1);
								tr.append("<td class='running' style='padding-top:1px'><img src='portal/images/empty.png' height='24'/></td>");
								tr.append(td2);
								if (hasProducts === true) {
									tr.hide();
								} else {
									tr.attr('class', '');
								}
								$('#license-table').append(tr);
							}
						}
					}
				 }
			} else {
				td1 = $("<td colspan='2' class='header'>");
				td1._t('nixps-cloudflow-license.current-site');
				tr = $("<tr class='ws_entry'>");
				tr.append(td1);
				$('#license-table').append(tr);

				pLicenseDescription.machines.forEach(function(machine) {
					var span = $('<span>');
					span.text(machine.name.toUpperCase());
					$('#license-table').append("<tr class='ws_entry'><td width='35px'></td><td width='25%' class='header'>" + span.html() + "</td></tr>");

					if ((machine.activation !== 'activated') && (machine.activation !== 'not needed')) {
						var msg_td = $("<td colspan='4' class='header activationMsg' style='padding:8px 0px'>");
						msg_td.attr('machine', marchine.name);
						msg_td.attr('site', 0);
						if (machine.activation === 'not activated') {
							msg_td.append("<img src='/portal/images/WarningSmall.png'>&nbsp;");
						} else if ((machine.activation === 'error') || (machine.activation === 'required')) {
							msg_td.append("<img src='/portal/images/ErrorSmall.png'>&nbsp;");
						} else if (machine.activation === 'pending') {
							hasPendingActivations = true;
						}
						span = $("<span>");
						span._t('nixps-cloudflow-license.activation-' + machine.activation.replace(' ', '_'));
						msg_td.append(span);
						if ((machine.system_id === undefined) && (machine.activation !== 'not needed')) {
							msg_td.append('<br><img src="/portal/images/ErrorSmall.png">&nbsp;');
							var span = $("<span>");
							span._t('nixps-cloudflow-license.activation-no_system_id');
							msg_td.append(span);
						} else if ((machine.activation === 'not activated') || (machine.activation === 'required')) {
							if (machine.activation === 'not activated') {
								var span = $("<span>");
								if (machine.activation_days_left > 0) {
									span._t('nixps-cloudflow-license.activation-needs_activation_days_left', [machine.activation_days_left]);
								} else {
									span._t('nixps-cloudflow-license.activation-needs_activation_today');
								}
								msg_td.append(' ');
								msg_td.append(span);
							}
							msg_td.append('&nbsp;&nbsp;');
							var machineName = machine.name;
							var a = $("<a href='#'>");
							a._t('nixps-cloudflow-license.activate_button');
							a.click(function () {
								$(this).hide();
								api_async.license.activate(machineName,
									function (result) {
										 license_tab.reload(result);
									},
									function (errors) {
										msg_td.html("<img src='/portal/images/WarningSmall.png'>&nbsp;");
									}
								);
							});
							msg_td.append(a);
						}
						tr = $("<tr><td class='header'>&nbsp;</td></tr>");
						tr.append(msg_td);
						tr.attr('machine', machine.name);
						$('#license-table').append(tr);
					}

					machine.licenses.forEach(function(license) {
						var value = "";
						var interval = "";
						
						if (license.code == 'maintenance') {
							if (license.end !== undefined) {
								maintenanceEnd = new Date(0); maintenanceEnd.setUTCSeconds(license.end);
							}
						} else {
							if (license.value !== undefined) {
								value = license.value;
							}
							
							if (license.start !== undefined) {
								var start = new Date(0); start.setUTCSeconds(license.start);
								var end = new Date(0); end.setUTCSeconds(license.end);
								interval = " (" + $.i18n._('nixps-cloudflow-license.date_interval', [start.toLocaleDateString(), end.toLocaleDateString()]) + ")";
							}
							
							$('#license-table').append("<tr>"+
								"<td width='35px'></td>"+
								"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-license.license-' + license.code).toUpperCase() + interval + "</td>"+
								"<td class='running'><img src='portal/images/empty.png' height='24'/></td>"+
								"<td class='description' colspan='2'>" + value + "</td></tr>");
						}
					});
				});
			}

			if (hasPendingActivations === true) {
				var refreshFunction = function () {
					if ($('#tabs-license').css('display') === "none") {
						setTimeout(refreshFunction, 60000);
					} else {
						api_async.license.update(function (data) {
							if (data.machines !== undefined) {
								var hasPendingActivations = false;
								for (var i = 0; i < data.machines.length; ++i) {
									if (data.machines[i].activation === 'pending') {
										hasPendingActivations = true;
									} else if (data.machines[i].activation === 'activated') {
										$('tr[machine="' + data.machines[i].name + '"][site="0"]').hide();
									} else {
										msg_td = $('td[machine="' + data.machines[i].name + '"][site="0"]').hide();
										msg_td.clear();
										if (machine.activation === 'not activated') {
											msg_td.append("<img src='/portal/images/WarningSmall.png'>&nbsp;");
										} else if (machine.activation === 'error') {
											msg_td.append("<img src='/portal/images/ErrorSmall.png'>&nbsp;");
										}
										span = $("<span>");
										span._t('nixps-cloudflow-license.activation-' + machine.activation.replace(' ', '_'));
										msg_td.append(span);
									}
									hasPendingActivations = true;
								}
								if (hasPendingActivations === true) {
									setTimeout(refreshFunction, 60000);
								}
							}
						});
					}
				};

				refreshFunction();
			}

			if (pLicenseDescription.distributed !== undefined) {
				$('#license-table').append("<tr class='ws_entry'>"+
									"<td class='header' colspan='2'>" + $.i18n._('nixps-cloudflow-license.distributed') + "</td>"+
									"<td class='running'><img src='portal/images/empty.png' height='24'/></td>" +
									"<td class='running'><a href='/?logging=license'><img src='/portal/images/report.svg' style='cursor: pointer'/></a></td>"+
									"<td></td></tr>");
				var licenseIndexes = {};
				
				pLicenseDescription.distributed.forEach(function(license) {
					var interval = "";
					var sites = "";
					
					if (license.start !== undefined) {
						var start = new Date(0); start.setUTCSeconds(license.start);
						var end = new Date(0); end.setUTCSeconds(license.end);
						interval = " (" + $.i18n._('nixps-cloudflow-license.date_interval', [start.toLocaleDateString(), end.toLocaleDateString()]) + ")";
					}

					if ((license.acquired !== undefined) && (license.acquired.length > 0)) {
						sites = $.i18n._('nixps-cloudflow-license.acquired_by', [license.acquired.join(', ')]);
					}

					if (licenseIndexes[license.code] === undefined) {
						licenseIndexes[license.code] = 0;
					} else {
						licenseIndexes[license.code] += 1;
					}

					$('#license-table').append("<tr>"+
						"<td width='35px'></td>"+
						"<td width='25%' class='name' >" + $.i18n._('nixps-cloudflow-license.license-' + license.code).toUpperCase() + interval + "</td>"+
						"<td class='running'><img src='portal/images/empty.png' height='24'/></td>"+
						"<td class='description'>&nbsp;</td><td id='distlic_sites-" + license.code + "-" + licenseIndexes[license.code] + "'></td></tr>");
					$('#distlic_sites-' + license.code).text(sites);
				});

				setTimeout(function updateDistLicenses() {
					if ($('#tabs-license').css('display') !== "none") {
						api_async.license.get_license({}, function (p_data) {
							if (p_data.distributed !== undefined) {
								var licenseIndexes = {};
								p_data.distributed.forEach(function(license) {
									var sites = "";

									if (licenseIndexes[license.code] === undefined) {
										licenseIndexes[license.code] = 0;
									} else {
										licenseIndexes[license.code] += 1;
									}

									if (license.acquired !== undefined) {
										sites = $.i18n._('nixps-cloudflow-license.acquired_by', [license.acquired.site + ', ' + license.acquired.workserver]);
									}

									$('#distlic_sites-' + license.code + "-" + licenseIndexes[license.code]).text(sites);
								});
							}
							setTimeout(updateDistLicenses, 10000);
						}, function () {
							setTimeout(updateDistLicenses, 10000);
						});
					} else {
						setTimeout(updateDistLicenses, 10000);
					}
				}, 10000);
			}
								
			if (maintenanceEnd !== undefined) {
				var now = new Date();
				if (maintenanceEnd.getTime() > (now.getTime() + (7 * 86400000))) {
					$('#license-table').append("<tr class='ws_entry'>"+
										  "<td colspan='2' class='header'>"  +$.i18n._('nixps-cloudflow-license.maintenance_title') + "</td>"+
										  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										  "<td class='description_header'>" + $.i18n._('nixps-cloudflow-license.maintenance_valid', [maintenanceEnd.toLocaleDateString()]) + "</td></tr>");
				} else if (maintenanceEnd.getTime() > (now.getTime() + 86400000)) {
					$('#license-table').append("<tr class='ws_entry'>"+
										  "<td colspan='2' class='header'>"  +$.i18n._('nixps-cloudflow-license.maintenance_title') + "</td>"+
										  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										  "<td class='description_header'>" + $.i18n._('nixps-cloudflow-license.maintenance_valid', [maintenanceEnd.toLocaleDateString()]) + "</td></tr>");
					$('#license-table').append("<tr class='meta-row'>"+
											"<td colspan='4'><div class='meta-arrow' style='display: block;'>"+
											"<img class='meta-arrow-image' src='portal/images/dashboard_fold_arrow.png'>"+
											"<img src='portal/images/WarningSmall.png'> Maintenance will expire in " + Math.ceil((maintenanceEnd.getTime() - now.getTime()) / 86400000) + " days."+
											"</div></td></tr>");
				} else if (maintenanceEnd.getTime() > now.getTime()) {
					$('#license-table').append("<tr class='ws_entry'>"+
										  "<td colspan='2' class='header'>"  +$.i18n._('nixps-cloudflow-license.maintenance_title') + "</td>"+
										  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										  "<td class='description_header'>" + $.i18n._('nixps-cloudflow-license.maintenance_valid', [maintenanceEnd.toLocaleDateString()]) + "</td></tr>");
					$('#license-table').append("<tr class='meta-row'>"+
											"<td colspan='4'><div class='meta-arrow' style='display: block;'>"+
											"<img class='meta-arrow-image' src='portal/images/dashboard_fold_arrow.png'>"+
											"<img src='portal/images/WarningSmall.png'> Maintenance will expire tomorrow."+
											"</div></td></tr>");
				} else {
					$('#license-table').append("<tr class='ws_entry'>"+
										  "<td colspan='2' class='header'>"  +$.i18n._('nixps-cloudflow-license.maintenance_title') + "</td>"+
										  "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
										  "<td class='description_header'>Expired since " + maintenanceEnd.toLocaleDateString() + "</td></tr>");
				}
			}

			if (pLicenseDescription.created !== undefined) {
				$('#license-table').append("<tr class='ws_entry'>"+
				"<td colspan='2' class='header'>"  +$.i18n._('nixps-cloudflow-license.creation_title') + "</td>"+
				"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
				"<td class='description_header'>" + (new Date(pLicenseDescription.created)).toLocaleString() + "</td></tr>");
			}

			var buttonRow = "<a class='red-button' id='clear-license-button'>" + $.i18n._('nixps-cloudflow-license.clear_button') +
							"</a> <a class='green-button' id='update-license-button'>" + $.i18n._('nixps-cloudflow-license.update_button') +
							"</a>";

			$('#license-table').append("<tr class='ws_entry'>"+
									"<td width='35px'></td>"+
									"<td width='25%' ></td>"+
									"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
									"<td class='buttons'>" + buttonRow + "<img id='license-processing' src='portal/images/loading10.gif'/></td></tr>");
			$('#license-table').append("<tr class='meta-row' id='license-error'>"+
									"<td colspan='4'><div class='meta-arrow' style='display: block;'>"+
									"<img class='meta-arrow-image' src='portal/images/dashboard_fold_arrow.png'>"+
									"<span id='license-error-msg'>X</span>"+
									"</div></td></tr>");

			$('#license-processing').hide();
			$("#license-error").hide();

			$("#clear-license-button").click(function() {
				var clear_function = function() {
					$("#license-error").hide();
					$('#clear-license-button').hide();
					$('#update-license-button').hide();
					$('#activate-button').hide();
					$('#license-processing').show();
		
					api_async.license.reset(function(data) {
						$('#clear-license-button').show();
						$('#update-license-button').show();
						$('#license-processing').hide();
			
						if (data.error != undefined)
						{
							$("#license-error-msg")._t("nixps-cloudflow-license.msg-clear_failed", [data.error]);
							$("#license-error").show();
						}
						else
						{
							license_tab.update_ui(null);
						}
					});
				};
				
				$('body').Dialog("show_yes_no", $.i18n._('nixps-cloudflow-license.clear_warn_title'), $.i18n._('nixps-cloudflow-license.clear_warn_msg'), "", clear_function, function() {});
			});

			$("#update-license-button").click(function() {
				$("#license-error").hide();
				$('#clear-license-button').hide();
				$('#update-license-button').hide();
				$('#activate-button').hide();
				$('#license-processing').show();
	
				api_async.license.update(function(data) {
					$('#clear-license-button').show();
					$('#update-license-button').show();
					$('#license-processing').hide();
		
					if (data.error != undefined)
					{
						$("#license-error-msg")._t("nixps-cloudflow-license.msg-update_failed", [data.error]);
						$("#license-error").show();
					}
					else
					{
						license_tab.reload();
					}
				});
			});
		}
	}
};
