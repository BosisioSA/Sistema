var gAllLicenses = {};
var gIsMultisite = false;
var gLicenseData = null;
var gCurrentWorkServer = null;

function initTranslations(pLanguage, pFunction)
{
	$.get("/cloudflow_" + pLanguage + ".json").then(function(translations) {
		$.i18n.setDictionary(translations);
		$('body').find("span.translate").each(function(index, element) {
			e = $(element);
			e._t(e.attr('key'));
		});
		pFunction();
	}).fail(function() {
		language = "en";
		$.get("/cloudflow_" + pLanguage + ".json").then(function(translations) {
			$.i18n.setDictionary(translations);
			$('body').find("span.translate").each(function(index, element) {
				e = $(element);
				e._t(e.attr('key'));
			});
			pFunction();
		});
	});
}


function uniqueWorkerId(pPrefix, pWorkserverDict)
{
	var idstr = pPrefix + '_';

	for (var i = 0; i < 13; ++i) {
		var asciiCode;

		do {
			asciiCode = Math.floor((Math.random() * 42) + 48);
		} while ((asciiCode >= 58) && (asciiCode <= 64));

		idstr += String.fromCharCode(asciiCode);
	}

	if (pWorkserverDict.workers[idstr] != undefined) {
		return uniqueWorkerId(pPrefix, pWorkserverDict);
	}

	return idstr;
}


function portalSetupWorker(pWorkerName)
{
	var filestore = '';
	
	if (pWorkerName === "indexer") {
		filestore = $('#filestore_name').val();
	}

	var workerDict = {
		"app": pWorkerName,
		"file_store": filestore,
		"active": true,
		"running": false,
		"keep_alive": 0
	};

	return workerDict;
}


function portalSetupWorkserver(pServerName, pFilePath, pMaxProcs)
{
	var licenses = {};
	var keys = Object.keys(gLicenseData.licenses[pServerName.toLowerCase()].base);
	for (var keyIndex = 0; keyIndex < keys.length; ++keyIndex) {
		licenses[keys[keyIndex]] = gLicenseData.licenses[pServerName.toLowerCase()].base[keys[keyIndex]];
	}
	var temps = gLicenseData.licenses[pServerName.toLowerCase()].temporary;
	for (var tempIndex = 0; tempIndex < temps.length; ++tempIndex) {
		var keys = Object.keys(temps[tempIndex]);
		for (var keyIndex = 0; keyIndex < keys.length; ++keyIndex) {
			if (keys[keyIndex] !== 'interval') {
				if (licenses[keys[keyIndex]] === undefined) {
					licenses[keys[keyIndex]] = 0;
				}
				licenses[keys[keyIndex]] += temps[tempIndex][keys[keyIndex]];
			}
		}
	}
	if (gLicenseData.shared !== undefined) {
		if (gLicenseData.shared.base !== undefined) {
			var keys = Object.keys(gLicenseData.shared.base);
			for (var keyIndex = 0; keyIndex < keys.length; ++keyIndex) {
				if (licenses[keys[keyIndex]] === undefined) {
					licenses[keys[keyIndex]] = 0;
				}
				licenses[keys[keyIndex]] += gLicenseData.shared.base[keys[keyIndex]];
			}
		}
		if (gLicenseData.shared.temporary !== undefined) {
			var temps = gLicenseData.shared.temporary;
			for (var tempIndex = 0; tempIndex < temps.length; ++tempIndex) {
				var keys = Object.keys(temps[tempIndex]);
				for (var keyIndex = 0; keyIndex < keys.length; ++keyIndex) {
					if (keys[keyIndex] !== 'interval') {
						if (licenses[keys[keyIndex]] === undefined) {
							licenses[keys[keyIndex]] = 0;
						}
						licenses[keys[keyIndex]] += temps[tempIndex][keys[keyIndex]];
					}
				}
			}
		}
	}

	var milli = new Date();

	// Specific setup for data link (and not for Fundamentals)
	// Note. dfe license include datalink and java_web_apps_host as well.
	if ((licenses.portal === undefined && licenses.dfe === undefined) && (licenses.datalink !== undefined) && (licenses.java_web_apps_host !== undefined)) {
		var workserverDict = {
			"last_modification": Math.round(milli.getTime()),
			"active": true,
			"running": false,
			"keep_alive": 0,
			"workers": new Object(),
			"render_count" : pMaxProcs
		};

		workserverDict.workers[uniqueWorkerId('wk_javawebappshost', workserverDict)] = portalSetupWorker('javaWebAppsHost');
		return workserverDict;
	}


	var workserverDict = {
		"last_modification": Math.round(milli.getTime()),
		"active": true,
		"running": false,
		"keep_alive": 0,
		"workers": new Object(),
		"file_store_mapping": {},
		"render_count" : pMaxProcs
	};


	if (gCurrentWorkServer.toLowerCase() === pServerName.toLowerCase()) {
		workserverDict.file_store_mapping[$('#filestore_name').val()] = pFilePath;
		workserverDict.workers[uniqueWorkerId('wk_indexer', workserverDict)] = portalSetupWorker('indexer');
	}

	workserverDict.workers[uniqueWorkerId('wk_garbagecollector', workserverDict)] = portalSetupWorker('garbagecollector');
	workserverDict.workers[uniqueWorkerId('wk_metadata', workserverDict)] = portalSetupWorker('metadata');
	workserverDict.workers[uniqueWorkerId('wk_preview', workserverDict)] = portalSetupWorker('preview');

	if (licenses.quantum !== undefined) {
		workserverDict.workers[uniqueWorkerId('wk_quantumcombined', workserverDict)] = portalSetupWorker('quantumcombined');
		if (pMaxProcs > 1) {
			workserverDict.workers[uniqueWorkerId('wk_quantumcombined', workserverDict)] = portalSetupWorker('quantumcombined');
		}
	}

	if (pMaxProcs > 1) {
		workserverDict.workers[uniqueWorkerId('wk_preview', workserverDict)] = portalSetupWorker('preview');
	}

	if (licenses.quantumpackz !== undefined) {
		for (var i = 0; (i < (licenses.quantumpackz * 2)) && (i < pMaxProcs); ++i) {
			workserverDict.workers[uniqueWorkerId('wk_quantumpackz', workserverDict)] = portalSetupWorker('quantumpackz');
		}
	}

	if (licenses.quantumrip !== undefined) {
		for (var i = 0; (i < (licenses.quantumrip * 2)) && (i < pMaxProcs); ++i) {
			workserverDict.workers[uniqueWorkerId('wk_quantumrip', workserverDict)] = portalSetupWorker('quantumrip');
		}
	}

	if ((licenses.quantum !== undefined) && (licenses.datalink !== undefined)) {
		workserverDict.workers[uniqueWorkerId('wk_quantumdata', workserverDict)] = portalSetupWorker('quantumdata');
	}

	if ((licenses.quantum !== undefined) && (licenses.datalink !== undefined)) {
		workserverDict.workers[uniqueWorkerId('wk_quantumjava', workserverDict)] = portalSetupWorker('quantumjava');
	}

	if (licenses.java_web_apps_host !== undefined) {
		workserverDict.workers[uniqueWorkerId('wk_javawebappshost', workserverDict)] = portalSetupWorker('javaWebAppsHost');
	}

	if (licenses.share !== undefined) {
		workserverDict.workers[uniqueWorkerId('wk_quantumshare', workserverDict)] = portalSetupWorker('quantumshare');
		workserverDict.workers[uniqueWorkerId('wk_shareschuler', workserverDict)] = portalSetupWorker('sharescheduler');
	}
	
	if (licenses.proofscope !== undefined) {
		for (var i = 0; (i < (licenses.proofscope * 4)) && (i < pMaxProcs); ++i) {
			workserverDict.workers[uniqueWorkerId('wk_renderer', workserverDict)] = portalSetupWorker('renderer');
		}
	} else if (licenses.proofscope_dot !== undefined) {
		for (var i = 0; (i < (licenses.proofscope_dot * 4)) && (i < pMaxProcs); ++i) {
			workserverDict.workers[uniqueWorkerId('wk_renderer', workserverDict)] = portalSetupWorker('renderer');
		}
	}

	return workserverDict;
}


function saveSetup()
{
	// Input Checking
	var ok = true;
	$("#admin_meta").empty();
	$("#filestore_meta").empty();
	$("#webserver_meta").empty();
	$("#smtp_meta").empty();

	if ($('#admin_username').parents('.req-portal').css('display') === "none") {
		$("#admin_username").val('admin');
		$("#admin_password").val('admin');
	} else {
		if ($("#admin_username").val() == "") {
			ok = false;
			$("#admin_meta").append("Admin password is required.<br/>");
		}

		if ($("#admin_password").val() == "") {
			ok = false;
			$("#admin_meta").append("Admin password is required.<br/>");
		}

		if ($("#admin_password").val() != $("#admin_password_rep").val()) {
			ok = false;
			$("#admin_meta").append("Passwords don't match.<br/>");
		}
	}
	
	if ($('#filestore_path').parents('.req-portal').css('display') === "none") {
	} else {
		if ($("#filestore_path").val() == "") {
			ok = false;
			$("#filestore_meta").append("Filestore location is required.<br/>");
		}
	}

	if ($('#filestore_name').val() === "") {
		ok = false;
		$("#filestore_meta").append("Filestore name is required.<br/>");
	}
	
	if ($('#portal_url').parents('.req-portal').css('display') === "none") {
		$("#portal_url").val(document.URL.substring(0, document.URL.lastIndexOf("/") + 1));
	} else {
		if ($("#portal_url").val() == "") {
			ok = false;
			$("#webserver_meta").append("Web Server URL is required.<br/>");
		}
	}
	
	if ($('#smtp_server').parents('.req-portal').css('display') === "none") {
	} else {
		if ($("#smtp_server").val() == "") {
			ok = false;
			$("#smtp_meta").append("SMTP Server is required.<br/>");
		}

		if ($("#smtp_from").val() == "") {
			ok = false;
			$("#smtp_meta").append("Sender E-mail address is required.<br/>");
		}
	}
	
	if (ok) {
		var path = $('#filestore_path').val();

		if ($('#filestore_user').val() !== '') {
			path = { type: 'smb', path: $('#filestore_path').val(), user: $('#filestore_user').val(), password: $('#p_filestore_pwd').val() };
		}

		var maxWorkerCount = 100000;

		if (gAllLicenses.portal === undefined) {
			maxWorkerCount = 1;
		}

		var workserverConfig = {};

		if (gLicenseData.licenses === undefined) {
			var siteData = gLicenseData.sites[$('#site_name').val()].servers;
			gLicenseData.licenses = {};
			for (var i = 0; i < Object.keys(siteData).length; ++i) {
				gLicenseData.licenses[Object.keys(siteData)[i]] = siteData[Object.keys(siteData)[i]];
				if (gLicenseData.licenses[Object.keys(siteData)[i]].base === undefined) {
					gLicenseData.licenses[Object.keys(siteData)[i]].base = {};
				}
				if (gLicenseData.licenses[Object.keys(siteData)[i]].temporary === undefined) {
					gLicenseData.licenses[Object.keys(siteData)[i]].temporary = [];
				}
			}
		}

		for (var i = 0; i < Object.keys(gLicenseData.licenses).length; ++i)
		{
			var workserverName = Object.keys(gLicenseData.licenses)[i];
			if (workserverName.toLowerCase() === gCurrentWorkServer.toLowerCase()) {
				workserverName = gCurrentWorkServer;
			}
			workserverConfig[workserverName] = portalSetupWorkserver(workserverName, path, maxWorkerCount);
		}

		var initDict = {
			method: "portal.setup",
			admin_username: $("#admin_username").val(),
			admin_password: $("#admin_password").val(),
			portal_url: $("#portal_url").val(),
			int_units: parseInt($("#int_units").val()),
			smtp_server: $("#smtp_server").val(),
			smtp_port: $("#smtp_port").val(),
			smtp_ssl: $("#smtp_ssl").is(':checked'),
			smtp_login: $("#smtp_username").val(),
			smtp_password: $("#smtp_password").val(),
			smtp_from: $("#smtp_from").val(),
			work_servers: workserverConfig
		};
	
		if (gAllLicenses.portal === undefined && gAllLicenses.quantumrip !== undefined) {
			initDict.deep_zoom = 1;
		}

		if (gIsMultisite === true) {
			initDict.site_name = $('#site_name').val();
		}

		$('#setup_progress').text('Initializing Database for Cloudflow...');
	
		return $.post("/portal.cgi", JSON.stringify(initDict), function (pData) {
			$('#setup_progress').text('');

			if (pData.error !== undefined) {
				$("#setup_error").text("Your Cloudflow setup failed!<br/>Error: " + pData.error + "!");
			} else {
				if ((gAllLicenses.portal === undefined) && (gAllLicenses.patchplanner !== undefined)) {
					window.location = '/?config=patchplanner';
				} else {
					window.location = '/';
				}
			}
		});
	}
}


function send_test_mail()
{
	var testDict = {
		method: "portal.send_test_mail",
		smtp_server: $("#smtp_server").val(),
		smtp_port: $("#smtp_port").val(),
		smtp_ssl: $("#smtp_ssl").is(':checked'),
		smtp_login: $("#smtp_username").val(),
		smtp_password: $("#smtp_password").val(),
		smtp_from: $("#smtp_from").val(),
		smtp_to: $("#smtp_to").val()
	}

	$('#send-test-mail').hide();
	$('#send-test-mail-loading').show();

	$.post("/portal.cgi", JSON.stringify(testDict), function (pData) {
		$('#send-test-mail-loading').hide();
		$('#send-test-mail').show();
		$("#smtp_send_email_result").empty();
		
		if ((pData.error !== undefined) && (pData.error !== "")) {
			$("#smtp_send_email_result").css('color', 'red');
			$("#smtp_send_email_result").append("Sending test e-mail failed ("+pData.error+").</br>");
		} else {
			$("#smtp_send_email_result").css('color', 'green');
			$("#smtp_send_email_result").append("Test e-mail sent.<br/>");
		}
	});
}


function check_file_store()
{
	var testDict = {
		method: "portal.check_file_store",
		path: $("#filestore_path").val(),
		test_file: $("#file_store_test_file").val()
	}

	$('#check-file-store').hide();
	$('#check-file-store-loading').show();

	$.post("/portal.cgi", JSON.stringify(testDict), function (pData) {
		$('#check-file-store-loading').hide();
		$('#check-file-store').show();
		$("#check_file_store_result").empty();

		if (pData.error != undefined) {
			$("#check_file_store_result").css('color', 'red');
			$("#check_file_store_result").append("Check failed ("+ pData.error +").</br>");
		} else {
			$("#check_file_store_result").css('color', 'green');
			$("#check_file_store_result").append("File Store settings ok.<br/>");
		}
	});
}


function gmailTest()
{
	if ($("#smtp_server").val() === "smtp.gmail.com") {
		$("#smtp_port").val("465");
		$("#smtp_ssl").attr('checked', true);
	}
}


function setupConfig()
{
	api_async.license.get_license({}, function (pLicenseData) {
		$('#tabs a').text('Initial Configuration');
		$('#license').hide();
		$('#setup').show();
		for (var key in gAllLicenses) {
			if (typeof key === typeof '') {
				$('.req-' + key).show();
			}
		}

		$("#portal_url").val(document.URL.substring(0, document.URL.lastIndexOf("/") + 1));
		$("#save").click(saveSetup);
		$("#send-test-mail").click(send_test_mail);
		$("#check-file-store").click(check_file_store);
		$("#smtp_server").focusout(gmailTest);
		$('#check-file-store-loading').hide();
		$('#send-test-mail-loading').hide();
	});
}


function processLicenses(pSiteName, pData)
{
	if (pData.base !== undefined) {
		var licList = Object.keys(pData.base);
		for (var licIndex = 0; licIndex < licList.length; ++licIndex) {
			var licCode = licList[licIndex];
			if (gAllLicenses[licCode] === undefined) {
				gAllLicenses[licCode] = [];
			}
			gAllLicenses[licCode].push(pSiteName);
		}
	}

	if (pData.temporary !== undefined) {
		for (var tempIndex = 0; tempIndex < pData.temporary.length; ++tempIndex) {
			var licList = Object.keys(pData.temporary[tempIndex]);
			for (var licIndex = 0; licIndex < licList.length; ++licIndex) {
				var licCode = licList[licIndex];
				if (gAllLicenses[licCode] === undefined) {
					gAllLicenses[licCode] = [];
				}
				gAllLicenses[licCode].push(pSiteName);
			}
		}
	}
}


function processLicensesForSite(pSiteName, pData)
{
	var serverList = Object.keys(pData);
	for (var serverIndex = 0; serverIndex < serverList.length; ++serverIndex) {
		var serverName = serverList[serverIndex];
		var server = pData[serverName];
		processLicenses(pSiteName, server);
	}
}


function licenseOk(pData)
{
	var licensedWorkServers = [];
	var sitesOfWorkservers = {};

	if (pData.sites !== undefined) {
		sitesOfWorkservers = {};
		var siteNames = Object.keys(pData.sites);
		for (var i = 0; i < siteNames.length; ++i) {
			var serverNames = Object.keys(pData.sites[siteNames[i]].servers);
			for (var j = 0; j < serverNames.length; ++j) {
				if (sitesOfWorkservers[serverNames[j]] === undefined) {
					licensedWorkServers.push(serverNames[j]);
					sitesOfWorkservers[serverNames[j]] = [ siteNames[i] ];
				} else {
					sitesOfWorkservers[serverNames[j]].push(siteNames[i]);
				}
			}
		}
	} else if (pData.licenses !== undefined) {
		licensedWorkServers = Object.keys(pData.licenses);
	}

	gLicenseData = pData;
	gCurrentWorkServer = pData.current_server;
	$('.workserver_name').text(gCurrentWorkServer);
	var thisWorkServerIsLicensed = false;
	var allowedSites = [];

	for (var i = 0; i < licensedWorkServers.length; ++i) {
		if (licensedWorkServers[i].toLowerCase() === gCurrentWorkServer.toLowerCase()) {
			thisWorkServerIsLicensed = true;
			allowedSites = sitesOfWorkservers[licensedWorkServers[i]];
			break;
		}
	}

	if (thisWorkServerIsLicensed === false) {
		if (licensedWorkServers.length === 0) {
			$("#license-msg").text('This is not a valid license file, or the customer code or serial do not match.');
			$("#license-msg-list").hide();
		} else {
			$("#license-msg").text('This workserver (' + gCurrentWorkServer + ') is not included in the license. Please reinstall Cloudflow using one of the following options:');
			$("#license-msg-list").empty();
			for (var i = 0; i < licensedWorkServers.length; ++i) {
				var item = $("<li>");
				var b = $("<b>");
				b.text("-i " + licensedWorkServers[i]);
				item.append(b);
				if (Object.keys(sitesOfWorkservers).length > 0) {
					item.append(" (site " + sitesOfWorkservers[licensedWorkServers[i]].join(', ') + ")");
				}
				$("#license-msg-list").append(item);
			}
			$("#license-msg-list").show();
		}
		$("#license-msg-box").show();
		return;
	}

	var now = (new Date()).getTime() / 1000;
	gAllLicenses = {};
	var siteList = [];
	if (pData.sites !== undefined) {
		siteList = Object.keys(pData.sites);
	}
	if (siteList.length === 0) {
		gIsMultisite = false;
		$('tr.site').hide();
		processLicensesForSite('*', pData.licenses);
	} else {
		gIsMultisite = true;
		$('tr.site').show();
		for (var siteIndex = 0; siteIndex < siteList.length; ++siteIndex) {
			var siteName = siteList[siteIndex];
			if (allowedSites.indexOf(siteName) >= 0) {
				var option = $('<option>');
				option.attr('value', siteName);
				option.text(siteName);
				$('#site_name').append(option);
			}
			processLicensesForSite(siteName, pData.sites[siteName].servers);
		}
		if (pData.shared !== undefined) {
			processLicenses('*', pData.shared);
		}
	}

	if (gAllLicenses.portal !== undefined) {
		$('#navbar').text('Cloudflow');
	} else if (gAllLicenses.quantumrip !== undefined) {
		$('#navbar').text('Standalone RIP');
	} else if (gAllLicenses.patchplanner !== undefined) {
		$('#navbar').text('Patchplanner');
	} else if (gAllLicenses.datalink  !== undefined) {
		$('#navbar').text('DataLink');
		$('#datalink_license').show();
		$('#save').hide();
		saveSetup().then(function() {
			window.location = '/';
		});
	}

	setupConfig();
}


function setupLicense()
{
	$('#license').show();
	$('#setup').hide();
	$('#license-loading').hide();
	$('#license-msg-box').hide();
	$('#license-msg-list').hide();

	$('#license-upload').on('click', function (pEvent) {
		var code = $('#license-code').val();
		var serial = $('#license-serial').val();
		if (code === "") {
			$("#license-msg")._t("nixps-cloudflow-license.msg-no_customer_code");
			$("#license-msg-list").hide();
			$("#license-msg-box").show();
		} else if (serial === "") {
			$("#license-msg")._t("nixps-cloudflow-license.msg-no_serial");
			$("#license-msg-box").show();
			$("#license-msg-list").hide();
		} else {
			if ($.browser.msie) {
				$('#license-file').css('opacity', 0.01);
			}
			$('#license-file').click();
			$('#license-file').css('opacity', 0);
		}
	});

	$("#license-download").on('click', function() {
		var code = $('#license-code').val();
		var serial = $('#license-serial').val();
		if (code === "") {
			$("#license-msg")._t("nixps-cloudflow-license.msg-no_customer_code");
			$("#license-msg-list").hide();
			$("#license-msg-box").show();
		} else if (serial === "") {
			$("#license-msg")._t("nixps-cloudflow-license.msg-no_serial");
			$("#license-msg-list").hide();
			$("#license-msg-box").show();
		} else {
			$("#license-msg-box").hide();
			$('#license-download').hide();
			$('#license-upload').hide();
			$('#license-loading').show();

			var fn = function () {
				api_async.license.download_new(code, serial, function (pData) {
					$('#license-loading').hide();
					$('#license-download').show();
					$('#license-upload').show();
					licenseOk(pData);
				}, function (pData) {
					$('#license-loading').hide();
					$('#license-upload').show();
					$('#license-download').show();
					$("#license-msg")._t('nixps-cloudflow-license.msg-download_failed', [pData.error]);
					$("#license-msg-list").hide();
					$("#license-msg-box").show();
				});
			};
			
			api_async.license.reset(fn, fn);
		}
	});
	
	$('#license-file').change(function () {
		$("#license-msg-box").hide();
		$('#license-download').hide();
		$('#license-upload').hide();
		$('#license-loading').show();
		var fn = function () {
			var files = $('#license-file')[0].files;
			var reader = new FileReader();
			reader.onloadend = function () {
				$('#license-loading').hide();
				$('#license-download').show();
				$('#license-upload').show();
				var data = this.result;
				var valid = (typeof data === typeof "");
				var parsedData;
				if (valid) {
					try {
						parsedData = JSON.parse(data);
						valid = parsedData.customer_code !== undefined;
					} catch (e) {
						valid = false;
					}
				}
				if (valid) {
					api_async.license.install($("#license-code").val(), $("#license-serial").val(), data, function (pData) {
						$('#license-loading').hide();
						$('#license-download').show();
						$('#license-upload').show();
						licenseOk(pData);
					}, function(pData) {
						$('#license-loading').hide();
						$('#license-upload').show();
						$('#license-download').show();
						$("#license-msg")._t('nixps-cloudflow-license.msg-upload_failed', [pData.error]);
						$("#license-msg-box").show();
					});
				} else {
					$("#license-msg").text("This is not a license file.");
					$("#license-msg-box").show();
				}
			};
			reader.readAsText(files[0]);
			// voodoo magic to reset the file input
			$('#license-file').wrap('<form>').closest('form').get(0).reset();
			$('#license-file').unwrap();
		};

		api_async.license.reset(fn, fn);
	});
}


$(document).ready(function() {

	$("#tabs").tabs();
	
	initTranslations('en', function () {
		setupLicense();
	});
});
