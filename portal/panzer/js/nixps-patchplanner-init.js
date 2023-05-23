/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, document, lang_en, window, gVariables */
/*global nixps, _, cloudflow_path , console */

/**
 * This file contains the application entry point
 */


function loadProject() {
	disableLayoutSavesOnChanges();

		$(':nixps-patchplanner-job_settings').remove();

		var session = new nixps.patchplanner.Session();
		var isJob = session.isJobSession();

		// Clear the filelist, clear the editor
		var sidebar_filelist = panzer.get_application().get_layout_panel().get_sidebar().get_filelist();
		sidebar_filelist.filelist('clear');

		var editor = panzer.get_application().get_layout_panel().get_editor();
		editor.editor('clear');
		if (isJob === true) {
			if (session.isJobMOMPresent() === true) {
				editor.editor('option', 'tools', []);
				editor.editor('option', 'readonly', true);
				$(":nixps-patchplanner-FileListToolbar").FileListToolbar("option", "tools", []);
			}
			else {
				editor.editor('option', 'tools', ['marks']);
				editor.editor('option', 'readonly', false);
				$(":nixps-patchplanner-FileListToolbar").FileListToolbar("option", "tools", ["upload", "remove"]);
			}
		}
		else {
			editor.editor('option', 'tools', [ 'rotate', 'remove', 'snap', 'clear']);
			$(":nixps-patchplanner-FileListToolbar").FileListToolbar("option", "tools", ["addjob", "remove"]);
			editor.editor('option', 'readonly', false);
		}

		// recreate the toolbar corresponding to the session (job vs sheet mode)
		createToolbar();

		// Load the layout document and populate the editor
		var layout_document = session.load_layout_document();

	    var filelist = layout_document.get_filelist();

	    // Set the editor size according to the sheet size
	    var sheet = layout_document.get_sheet();
		panzer.get_application().get_layout_panel().get_editor().editor('setSize', sheet.get_width(), sheet.get_height());

		// Add the files and patches
	    _.each(filelist, function(p_filepath) {
	    	var patchids = layout_document.get_patchids(p_filepath);
			var patches_list = _.map(patchids, function(p_id, p_index) {
				return {
					id: p_id,
					patch: layout_document.get_patch(p_id)
				};
			});
			patches_list.sort(function(a, b) {
				return parseInt(a.patch.get_data().index, 10) - parseInt(b.patch.get_data().index, 10);
			});
			var patch_elements = _.map(patches_list, function(pPatch) {
				return $("<div>").filelist_patch({
					id: pPatch.id,
					patch: pPatch.patch
				});
			});

			var file_item = $("<div>").filelist_item({
				path: p_filepath,
				metadatafinished: function() {
					var asset_path = $(this).filelist_item('option', 'path');

					var session = new nixps.patchplanner.Session();
					var layout_document = session.load_layout_document();

					var job_settings = new nixps.patchplanner.job_settings(asset_path);
		            layout_document.set_file_data(asset_path, job_settings.to_json());

					session.saveLayoutDocument(layout_document);
				}
			});

			sidebar_filelist.filelist('addFile', file_item, patch_elements);
	    });


		// Setup the double click on the file list to start proofscope
		if (session.isJobSession() && session.isJobMOMPresent() === false) {
			panzer.get_application().get_layout_panel().get_sidebar().get_filelist().bind('filelistopenitem', function(p_event, p_parameters) {
				save_project();

				// Get the path
				var path = p_parameters.path;

				var session = new nixps.patchplanner.Session();
				session.set_patchscope_asset_url(path.get_full_path().substr('cloudflow://'.length));

		        var redirect_url = '/portal.cgi?patchplanner=patchscope';
		        window.location.href = redirect_url;
			});
		}
		else {
			panzer.get_application().get_layout_panel().get_sidebar().get_filelist().off('filelistopenitem');
		}

		var cloudflowSettings = new nixps.patchplanner.CloudflowSettings(get_overrides());
	 	var cut_gutter = cloudflowSettings.getCutGutter();

	// Add the patches to the sheet
		var sheet_objects = layout_document.get_sheet().get_resource_objects();
		var sheet_height = layout_document.get_sheet().get_height();
		var editor = panzer.get_application().get_layout_panel().get_editor();
		_.each(sheet_objects, function(p_object)
		{
			var id = p_object.id;
			var resource =  p_object.resource;
			var left = p_object.left;
			var bottom = p_object.bottom;
			var rotation = p_object.rotation;
			var distortion = (p_object.scale_v === undefined) ? 1.0 : p_object.scale_v;

			var patch = layout_document.get_patch(resource);
			var clip_box = patch.get_clip_box();
			var imageurl = nixps.patchplanner.util.get_rendered_patch_url;

            var jobSettings = new nixps.patchplanner.job_settings(patch.get_file(), layout_document.get_file_data(patch.get_file()));
            var patchMargins = jobSettings.get_patch_margins();


			var height = clip_box.height * distortion;
			if (((rotation / 90) % 2) === 1) {
				height = clip_box.width;
			}

			var label = $('<div>').editor_label({
				id: id,
				refid: resource,
				url: imageurl,
				ptleft: left,
				pttop: sheet_height - bottom - height,
				ptwidth: clip_box.width,
				ptheight: clip_box.height,
				ptleftmargin: patchMargins.left,
				ptrightmargin: patchMargins.right,
				pttopmargin: patchMargins.top,
				ptbottommargin: patchMargins.bottom,
				rotation: rotation,
				distortion: distortion,
                snap: function() {
                    return $('#patchplanner-snap').is(":checked");
                },
				gutter:cut_gutter
			});

	        editor.editor('addLabel', label);
		});

		// Set the margins
		var settings = layout_document.get_settings();
		if ((typeof settings.sheetMarginLeft === "string")
			&& (typeof settings.sheetMarginRight === "string")
			&& (typeof settings.sheetMarginTop === "string")
			&& (typeof settings.sheetMarginBottom === "string")) {
			editor.editor("setMargins", {
				left: parseFloat(settings.sheetMarginLeft),
				right: parseFloat(settings.sheetMarginRight),
				top: parseFloat(settings.sheetMarginTop),
				bottom: parseFloat(settings.sheetMarginBottom)
			});
		}

		sidebar_filelist.filelist('redraw');

		enable_application();

	enableLayoutSavesOnChanges();
}

function calculate_layout()
{
	return $.Deferred(function(pDefer) {
		var freezePanel = $('<div>').appendTo('body').freeze_panel({ text: 'Calculate Layout' });

		save_project();

	 	var session = new nixps.patchplanner.Session();
		var layout_document = session.load_layout_document();
		var patchInfo = new nixps.patchplanner.PatchInfo();
		var cloudflowSettings = new nixps.patchplanner.CloudflowSettings(get_overrides());

		var patchids = layout_document.get_patchids();

	 	try {
	 		var exclude = [];
	 		if (session.isJobSession() === false) {
		 		var jobs = patchInfo.getJobsForPatchIds(patchids);
		 		var availableIds = [];
		 		for(var i = 0; i < jobs.length; i++) {
		 			availableIds = availableIds.concat(patchInfo.getAvailablePatchesForJob(jobs[i], session.getProjectName()));
		 		}
				exclude = _.difference(patchids, availableIds);
	 		}

	 		var cutGutter = 0;
	 		if (session.isJobSession() === false) {
				cutGutter = cloudflowSettings.getCutGutter();
	 		}
	 		var startFromBottom = false;
	 		if (session.isJobSession() === false) {
				startFromBottom = cloudflowSettings.getLayoutStart() === "bottom";
	 		}
		    var result = api_async.printplanner.bin_pack(layout_document.to_json(), 45, 45, exclude, cutGutter, startFromBottom, function(pResult) {
			    if (pResult.error !== undefined) {
			    	throw new Error('Layout calculation failed');
			    }

				var new_layout_document = new nixps.patchplanner.layout_document(pResult);

				session.saveLayoutDocument(new_layout_document);
				loadProject();
	    		freezePanel.remove();
	    		pDefer.resolve();
		    }, function() {
				freezePanel.remove();
				pDefer.reject();
		    });
	 	}
	 	catch(exception) {
	   		freezePanel.remove();
	 		alert('Layout calculation failed');
	 		pDefer.reject();
	 	}
	});
}

function save_project()
{
	// Get the layout document
	var session = new nixps.patchplanner.Session();
	var layout_document = session.load_layout_document();

	var editor = panzer.get_application().get_layout_panel().get_editor();

	var sheet = new nixps.layout.sheet(editor.editor('getWidth'), editor.editor('getHeight'));
	var labels = editor.editor('getLabelPositions');
	_.each(labels, function(p_label) {
		// Get the resource
		var resource = layout_document.get_patch(p_label.refid);

		// Get layout document file data
		var file_data = layout_document.get_file_data(resource.get_file());

		// Get the distortion for that file
		var distortion = 1.0;
		if (typeof file_data.distortion === "string") {
			distortion = parseFloat(file_data.distortion);
		}

		var height = p_label.height * distortion;
		if (((p_label.rotation / 90) % 2) === 1) {
			height = p_label.width;
		}

		sheet.add_resource_object(p_label.id, p_label.refid, p_label.left, sheet.get_height() - (p_label.top + height), 1.0, distortion, p_label.rotation);
	});

	layout_document.set_sheet(sheet);

	// Adapt the layout settings
	var settings = layout_document.get_settings();
	var editorMargins = editor.editor('getMargins');


	settings.sheetMarginLeft = editorMargins.left.toString();
	settings.sheetMarginRight = editorMargins.right.toString();
	settings.sheetMarginTop = editorMargins.top.toString();
	settings.sheetMarginBottom = editorMargins.bottom.toString();
	layout_document.set_settings(settings);



	session.saveLayoutDocument(layout_document);
}



function remove_rogue_numbers(pDocument) {
	var cleaned = new nixps.patchplanner.layout_document(pDocument.to_json());

	var files = cleaned.get_filelist();
	for(var i = 0; i < files.length; i++) {
		var file = files[i];
		var markPath = cleaned.get_mark(file);
		if (markPath.get_name() === "NONE.pdf") {
			// Remove the numbers
			var ids = cleaned.get_patchids(file);
			for(var j = 0; j < ids.length; j++) {
				id = ids[j];
				var decorator = cleaned.get_decorator(id);
				decorator.mJSON = _.map(decorator.mJSON, function(pElement) {
					return {
						objects: _.filter(pElement.objects, function(pObject) {
							var matches = pObject.id.match(/left_number/);
							return (matches === null) || (pObject.id.match(/left_number/).length === 0);
						})
					};
				});
				cleaned.set_decorator(id, decorator);
			}
		}
	}

	return cleaned;
}
//TODO: put layer name in the json at the time the object is created
function assign_layers(pDocument) {
	var layout = new nixps.patchplanner.layout_document(pDocument.to_json());
	var files = layout.get_filelist();
	for(var i = 0; i < files.length; i++) {
		var file = files[i];
		var ids = layout.get_patchids(file);
		for(var j = 0; j < ids.length; j++) {
			var id = ids[j];
			var decorator = layout.get_decorator(id);

			decorator.set_object_layer_name(1,"Slug Lines");
			decorator.set_object_layer_name(2,"Distortion");

			if (decorator.get_mark_ids().length > 0) {
				decorator.set_object_layer_name(5,"Patch IDs");
				decorator.set_object_layer_name(6,"Patch IDs");
			}

			layout.set_decorator(id, decorator);
		}
	}
	return layout;
}
function get_separation_document(file,color,pDocument){
	var layout = new nixps.patchplanner.layout_document(pDocument.to_json());

	var ids = layout.get_patchids(file);
	for(var j = 0; j < ids.length; j++) {
		var id = ids[j];
		var patch = layout.get_patch(id);
		var seperation_name = patch['m_json']['data']['sepname'];
		if(seperation_name !== color){
			layout.hide_patch(id);
		}
	}
	return layout;
}

function exportJobMOMResult(exportResult) {

	if (exportResult === true) {
		alert("Export done.");
		var session = new nixps.patchplanner.Session();
		var editor = panzer.get_application().get_layout_panel().get_editor();
		if (session.isJobMOMPresent() === true) {
			$('#project').JobToolbar('option', 'momExported', true);
			editor.editor('option', 'tools', []);
			editor.editor('option', 'readonly', true);
			$(":nixps-patchplanner-FileListToolbar").FileListToolbar("option", "tools", []);
		} else {
			editor.editor('option', 'tools', ['marks']);
			$('#project').JobToolbar('option', 'momExported', false);
			editor.editor('option', 'readonly', false);
			$(":nixps-patchplanner-FileListToolbar").FileListToolbar("option", "tools", ["upload", "remove"]);
		}
	}
	else {
		alert("Export failed.");
	}
}
function exportJobMOM() {
	// A helper function to check if the export result is successful
	function exportSucceeded(result) {
		return ($.isPlainObject(result) === true) && ($.isPlainObject(result.results) === true) && (result.results.ok === 1);
	}

	var session = new nixps.patchplanner.Session();
	var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();

	var momSettings = cloudflowSettings.getMOMSettings();

	// Load the layout document
	var layoutDocument = session.load_layout_document();

	// Load the filelist, should be exactly one file
	var fileList = layoutDocument.get_filelist();
	if (fileList.length !== 1) {
		return;
	}

	// Export the mom for the file
	var fileEntry = fileList[0];
	var filePath = fileEntry.getFullPath();
	var fileSettings = layoutDocument.get_file_data(fileEntry);

	// Check if there is already a mom with that name
  	var momPath = cloudflowSettings.getMOMOutputPath();
  	var mirrorProofsPath = cloudflowSettings.getMirrorProofsOutputPath();


	layoutDocument.set_settings($.extend(layoutDocument.get_settings(), fileSettings));
	session.saveLayoutDocument(layoutDocument);

	var allSettings = layoutDocument.get_settings();
	var mountingMethod = allSettings.mounting_method;
	var momOutputSizes = cloudflowSettings.outputPatchSizes();
	var momOutputFile = cloudflowSettings.getJobsPath().toChild(session.getProjectName()).toFile(fileSettings.slugline_base_name + ".xml");
	var momExportFile = cloudflowSettings.getMOMOutputPath().toFile(fileSettings.slugline_base_name + ".xml");
	var mirrorOutputFile = cloudflowSettings.getJobsPath().toChild(session.getProjectName()).toFile(fileSettings.slugline_base_name + "_mount.pdf");
	var mirrorExportFile = cloudflowSettings.getMirrorProofsOutputPath().toFile(fileSettings.slugline_base_name + "_mount.pdf");
	var csvOutputFile = cloudflowSettings.getJobsPath().toChild(session.getProjectName()).toFile(fileSettings.slugline_base_name + ".csv");
	var csvExportFile = cloudflowSettings.getMOMOutputPath().toFile(fileSettings.slugline_base_name + ".csv");

	var exportResult = false;
	if (mountingMethod === "mom") {
		var result = api.printplanner.mom_file_exists(fileSettings.slugline_base_name + ".xml", momPath.getFullPath());
		if (result.mom_exists === true) {
			var overwrite = confirm("A MOM file with the name " + fileSettings.slugline_base_name + ".xml exists, overwrite?");
			if (overwrite === false) {
				return;
			}
		}

		var resultMomOutput = api_sync.printplanner.create_mom(layoutDocument.to_json(), momOutputFile.getFullPath(), filePath, momSettings.toJSON(), momOutputSizes);
		var resultMomExport = api_sync.printplanner.create_mom(layoutDocument.to_json(), momExportFile.getFullPath(), filePath, momSettings.toJSON(), momOutputSizes);

		exportResult = exportSucceeded(resultMomExport) === true && exportSucceeded(resultMomOutput) === true;
		exportJobMOMResult(exportResult);
	}
	else if (mountingMethod === "mirror") {
		var result = api.printplanner.mom_file_exists(fileSettings.slugline_base_name + "_mount.pdf", mirrorProofsPath.getFullPath());
		if (result.mom_exists === true) {
			var overwrite = confirm("A mount file with the name " + fileSettings.slugline_base_name + "_mount.pdf exists, overwrite?");
			if (overwrite === false) {
				return;
			}
		}

		var resultMirrorOutput = api_sync.printplanner.create_mirror_mounting_pdf(layoutDocument.to_json(), mirrorOutputFile.getFullPath(), filePath, allSettings.mirror_mount_separation, parseFloat(allSettings.mirror_mount_distortion), momOutputSizes);
		var resultMirrorExport = api_sync.printplanner.create_mirror_mounting_pdf(layoutDocument.to_json(), mirrorExportFile.getFullPath(), filePath, allSettings.mirror_mount_separation, parseFloat(allSettings.mirror_mount_distortion), momOutputSizes);

		exportResult = exportSucceeded(resultMirrorOutput) === true && exportSucceeded(resultMirrorExport) === true;
		exportJobMOMResult(exportResult);
	}//Alex
	else if (mountingMethod === "drillmount") {
		layoutDocument = assign_layers(layoutDocument);
		exportResult = true;
		console.log("Commit Job Patching for Drill Mount");
		var result = api.printplanner.mom_file_exists(fileSettings.slugline_base_name + ".xml", momPath.getFullPath());
		if (result.mom_exists === true) {
			var overwrite = confirm("A MOM file with the name " + fileSettings.slugline_base_name + ".xml exists, overwrite?");
			if (overwrite === false) {
				return;
			}
		}

		var resultMomOutput = api_sync.printplanner.create_mom(layoutDocument.to_json(), momOutputFile.getFullPath(), filePath, momSettings.toJSON(), momOutputSizes);
		var resultMomExport = api_sync.printplanner.create_mom(layoutDocument.to_json(), momExportFile.getFullPath(), filePath, momSettings.toJSON(), momOutputSizes);

		nixps.patchplanner.util.get_asset_separation_names(fileEntry).then(function (names) {
			for (var i = 0; i < names.length; i++) {
				var sep_name = names[i];
				var drillMountOutputFile = cloudflowSettings.getJobsPath().toChild(session.getProjectName()).toFile(fileSettings.slugline_base_name + "_" + sep_name + ".pdf");
				var drillMountExportFile = cloudflowSettings.getDrillMountOutputPath().toFile(fileSettings.slugline_base_name + "_" + sep_name + "_mount.pdf");
				var die = allSettings.drill_mount_die_separation;
				if(sep_name !== die){
					var sep_document = get_separation_document(fileEntry,sep_name,layoutDocument);
					var resultDrillMountOutput = api_sync.printplanner.create_drill_mounting_pdf(sep_document.to_json(), drillMountOutputFile.getFullPath(), filePath, die, parseFloat(allSettings.distortion), momOutputSizes);
					var resultDrillMountExport = api_sync.printplanner.create_drill_mounting_pdf(sep_document.to_json(), drillMountExportFile.getFullPath(), filePath, die, parseFloat(allSettings.distortion), momOutputSizes);
					exportResult = exportResult && exportSucceeded(resultDrillMountOutput) === true && exportSucceeded(resultDrillMountExport) === true;
				}
			}
			exportJobMOMResult(exportResult);
		});
	}
	else if (mountingMethod === "mirrormom") {
		var resultMOM = api.printplanner.mom_file_exists(fileSettings.slugline_base_name + ".xml", momPath.getFullPath());
		var resultMirror = api.printplanner.mom_file_exists(fileSettings.slugline_base_name + "_mount.pdf", mirrorProofsPath.getFullPath());
		if (resultMOM.mom_exists === true && resultMirror.mom_exists === true) {
			var overwrite = confirm("A MOM file (" + fileSettings.slugline_base_name + ".xml) and mirror mount file (" + fileSettings.slugline_base_name + "_mount.pdf) exist, overwrite?");
			if (overwrite === false) {
				return;
			}
		}
		else if (resultMOM.mom_exists === true) {
			var overwrite = confirm("A MOM file with the name " + fileSettings.slugline_base_name + ".xml exists, overwrite?");
			if (overwrite === false) {
				return;
			}
		}
		else if (resultMirror.mom_exists === true) {
			var overwrite = confirm("A mount file with the name " + fileSettings.slugline_base_name + "_mount.pdf exists, overwrite?");
			if (overwrite === false) {
				return;
			}
		}

		var resultMomOutput = api_sync.printplanner.create_mom(layoutDocument.to_json(), momOutputFile.getFullPath(), filePath, momSettings.toJSON(), momOutputSizes);
		var resultMomExport = api_sync.printplanner.create_mom(layoutDocument.to_json(), momExportFile.getFullPath(), filePath, momSettings.toJSON(), momOutputSizes);
		var resultMirrorOutput = api_sync.printplanner.create_mirror_mounting_pdf(layoutDocument.to_json(), mirrorOutputFile.getFullPath(), filePath, allSettings.mirror_mount_separation, parseFloat(allSettings.mirror_mount_distortion), momOutputSizes);
		var resultMirrorExport = api_sync.printplanner.create_mirror_mounting_pdf(layoutDocument.to_json(), mirrorExportFile.getFullPath(), filePath, allSettings.mirror_mount_separation, parseFloat(allSettings.mirror_mount_distortion), momOutputSizes);

		exportResult = exportSucceeded(resultMirrorOutput) === true
			&& exportSucceeded(resultMirrorOutput) === true
			&& exportSucceeded(resultMomExport) === true
			&& exportSucceeded(resultMomOutput) === true;
		exportJobMOMResult(exportResult);
	} else if (mountingMethod === "heaford") {
		var result = api.printplanner.mom_file_exists(fileSettings.slugline_base_name + ".csv", momPath.getFullPath());
		if (result.mom_exists === true) {
			var overwrite = confirm("A CSV file with the name " + fileSettings.slugline_base_name + ".csv exists, overwrite?");
			if (overwrite === false) {
				return;
			}
		}

		var resultCsvOutput = api_sync.printplanner.create_heaford_mounting_pdf(layoutDocument.to_json(), csvOutputFile.getFullPath(), filePath, momSettings.toJSON());
 		var resultCsvExport = api_sync.printplanner.create_heaford_mounting_pdf(layoutDocument.to_json(), csvExportFile.getFullPath(), filePath, momSettings.toJSON());
		var resultMomOutput = api_sync.printplanner.create_mom(layoutDocument.to_json(), momOutputFile.getFullPath(), filePath, momSettings.toJSON(), momOutputSizes);
		var resultMomExport = api_sync.printplanner.create_mom(layoutDocument.to_json(), momExportFile.getFullPath(), filePath, momSettings.toJSON(), momOutputSizes);
 
		exportResult = exportSucceeded(resultCsvExport) === true && 
			exportSucceeded(resultCsvOutput) === true && 
			exportSucceeded(resultMomExport) === true && 
			exportSucceeded(resultMomOutput) === true;
		exportJobMOMResult(exportResult);
	} else {
		exportJobMOMResult(exportResult);
	}
}


function export_pdf()
{
	// Create a directory for the sheet
	var session = new nixps.patchplanner.Session();
	var layout_document = session.load_layout_document();
	var filelist = layout_document.get_filelist();


	var freezePanel = $('<div>').appendTo('body').freeze_panel({ text: 'Export to PDF' });

	_.defer(function() {
		save_project();


		var session = new nixps.patchplanner.Session();
		var layout_document = session.load_layout_document();
		var mom_settings = (new nixps.patchplanner.CloudflowSettings()).getMOMSettings();


		layout_document = assign_layers(layout_document);

		//>>> Clean layout document from rogue numbers (with NONE.pdf mark)
		layout_document = remove_rogue_numbers(layout_document);
        var cloudflowSettings = new nixps.patchplanner.CloudflowSettings(get_overrides());
        if (cloudflowSettings.getOutputFormat() === "hpgl") {
			layout_document.m_document.m_json.data.cutting = "HPGL";
		} else if (cloudflowSettings.getOutputFormat() === "zund") {
			layout_document.m_document.m_json.data.cutting = "ZUND";
		} else {
            layout_document.m_document.m_json.data.cutting = cloudflowSettings.getOutputFormat();
        }
		//<<< End clean

		var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();
		var l_pdf_path = cloudflowSettings.getPDFOutputPath();
		var l_pdf_file = l_pdf_path.toFile(session.getProjectName() + ".pdf");

		api_defer.preferences.get_for_realm('system', '', 'com.nixps.patchplanner', 'overview_sheet_preferences').then(function (overviewSheetPreferences) {
			var l_pdf_overview_path = cloudflowSettings.getPDFOverviewOutputPath();
			var l_overview_file = l_pdf_overview_path.toFile(session.getProjectName() + "_overview.pdf");
			var font_size = 18;
			if (overviewSheetPreferences.preferences && overviewSheetPreferences.preferences.font_size) {
				font_size = overviewSheetPreferences.preferences.font_size;
			}

			api_async.printplanner.create_cheatsheet_pdf(layout_document.to_json(), l_overview_file.getFullPath(), font_size);
		});

		api_async.printplanner.create_pdf(layout_document.to_json(), l_pdf_file.getFullPath(), function() {
			freezePanel.remove();
		},
		function() {
			freezePanel.remove();
		});
	});
}


function open_settings()
{
	var session = new nixps.patchplanner.Session();
	var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();

	var dialogTemplate =
		"<div class='settings-dialog'>"
			+ "<div class='settings-tabs'>"
				+ "<ul>"
				  + "<li><a href='#settings-dialog-tab-1'>Marks</a></li>"
				+ "</ul>"
				+ "<div id='settings-dialog-tab-1'>"
					+ "<h1>Marks</h1>"
					+ "<div class='marks_container'>"
					+ "</div>"
					+ "<h1>Upload</h1>"
					+ "<div class='upload_container'>"
						+ "<div class='mark_upload'></div>"
					+ "</div>"
				+ "</div>"
			+ "</div>"
		+ "</div>";


	var settingsDialogDiv = $(dialogTemplate);
	settingsDialogDiv.find('.marks_container').markslistview();

	var upload_controller = upload.setup_ui(settingsDialogDiv.find('.mark_upload'), {
		url: '?' + cloudflowSettings.getMarksPath().getFullPath(),
		multiple: true,
		check_file_cb: function (p_filename, p_size, p_type) {
		    if (p_type !== "application/pdf") {
		        upload_controller.add_failed_entry(p_filename, 'Not a PDF file');
		        return false;
		    }
		    return true;
		},
		got_files_cb: function(pFilename, pAssetURL) {
			var marksPath = cloudflowSettings.getMarksPath();
			api_sync.file.move_file(pAssetURL, marksPath.getFullPath());
			settingsDialogDiv.find('.marks_container').markslistview('redraw');
		}
	});

	settingsDialogDiv.children('.settings-tabs').tabs();
	settingsDialogDiv.appendTo($('body'));

	settingsDialogDiv.dialog({
		title: "Settings",
		modal: true,
		open: function() {
			$(this).dialog('widget').css({
				'z-index': 30000
			});
		},
		buttons: [
			{
				text: "Save",
				click: function() {
					$(this).dialog("close");
					$(this).dialog("destroy");
					$(this).children('.settings-tabs').tabs('destroy');
					$(this).remove();
				}
			},
			{
				text: "Cancel",
				click: function() {
					$(this).dialog("close");
					$(this).dialog("destroy");
					$(this).children('.settings-tabs').tabs('destroy');
					$(this).remove();
				}
			}
		],
		maxWidth: 550,
		minWidth: 550,
		minHeight: 550,
		resizable: false,
		position: {
			my: 'center center',
			at: 'center center-150',
			of: $('#layout.patchplanner')
		}
	});
}

function get_format_settings()
{
 	var cutGutterUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('length');
	var div = $('<div></div>');
	div.append("<h1>" + $.i18n._('nixps-cloudflow-patchplanner.format').toUpperCase() + "</h1>");
	//patchplanner_mounting
	/*div.append(
		"<div class='row'>" +
            "<label>" + $.i18n._('nixps-cloudflow-patchplanner.mounting_method') + "</label><select style='width:200px' id='patchplanner_mounting'>"+
			"<option value='mom'>" + $.i18n._('nixps-cloudflow-patchplanner.mom-mounting') + "</option>"+
			"<option value='mirror'>" + $.i18n._('nixps-cloudflow-patchplanner.mirror-mounting') + "</option>" +
            "<option value='mirrormom'>" + $.i18n._('nixps-cloudflow-patchplanner.mirrormom-mounting') + "</option>" +
            "</select>" +
         "</div>"
	);*/
	//patchplanner_output
	div.append(
		"<div class='row' style='margin-top: 10px;'>" +
			"<label>" + $.i18n._('nixps-cloudflow-patchplanner.cutting_method') + "</label><select class='patchplanner_output'>"+
			"<option value='manual'>" + $.i18n._('nixps-cloudflow-patchplanner.format-manual_cutting') + "</option>"+
			"<option value='zund'>" + $.i18n._('nixps-cloudflow-patchplanner.format-zund_cutting') + "</option>"+
			"<option value='hpgl'>" + $.i18n._('nixps-cloudflow-patchplanner.format-hpgl') + "</option></select>" +
		"</div>"
	);
	//cut_gutter
	div.append(
		"<div class='row' style='margin-top: 10px;'>" +
           "<label>cut gutter</label><input name='cut_gutter' value='${cut_gutter}'><label class='unit'>" +cutGutterUnit.getShortName() +"</label>" +
        "</div>"
    );
    //layout_direction
	div.append(
		"<div class='row' style='margin-top: 10px;'>" +
           "<label>start layout from</label><select class='layout_direction'><option value='top'>top</option><option value='bottom'>bottom</option></select>" +
        "</div>"
    );
    //mom_outputs_sizes
	/*div.append(
		"<div class='row' style='margin-top: 10px;'>" +
            "<label>" + $.i18n._('nixps-cloudflow-patchplanner.mom_outputs_sizes') + "</label><input type='checkbox' name='mom_outputs_sizes'>" +
        "</div>"
	);*/


	return div.html();
}
function get_origin_settings()
{
	var div = $('<div></div>');

	div.append("<h1>" + $.i18n._('nixps-cloudflow-patchplanner.origin').toUpperCase() + "</h1>");
	//origin - reference_box
	div.append(
		"<div class='row'>"+
			"<label>origin</label>"+
			"<select name='origin'>"+
				"<option value='0.0,0.0'>Bottom left</option>"+
				"<option value='0.0,0.5'>Bottom center</option>"+
			"</select> of "+
			"<select name='reference_box'>"+
				"<option value='mediabox'>Media Box</option>"+
				"<option value='trimbox'>Trim Box</option>"+
				"<option value='bleedbox'>Bleed Box</option>"+
				"<option value='cropbox'>Crop Box</option>"+
				"<option value='artbox'>Art Box</option>"+
			"</select>"+
		"</div>"
    );
	//orientation
    div.append(
    	"<div class='row'>"+
    		"<label>orientation</label><select name='orientation'><option value='left'>Left Handed</option><option value='right'>Right Handed</option></select>"+
    	"</div>"
    );
    //offset_x
    div.append(
   		"<div class='row'>&nbsp;</div>"+
   		"<div class='row'>"+
   			"<label>offset x</label><input name='offset_x' value='${momsettings.offset_x}'><label class='unit'>${unitname}</label>"+
   		"</div>"
   	);
    //offset_y
    div.append(
    	"<div class='row'>"+
    		"<label>offset y</label><input name='offset_y' value='${momsettings.offset_y}'><label class='unit'>${unitname}</label>"+
    	"</div>"
    );

    return div.html();
}

function get_overrides(){
	 var session = new nixps.patchplanner.Session();
	 var layoutDocument = session.load_layout_document();
	 var overrides = layoutDocument.get_overrides();

	 if(!overrides.layout_direction){
	 	var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();
	 	overrides = cloudflowSettings.getSettings();
	 }
	 return overrides;
}

function set_overrides(overrides){
	 var session = new nixps.patchplanner.Session();
	 var layoutDocument = session.load_layout_document();
	 var settings = layoutDocument.set_overrides(overrides);
}


function open_sheet_size()
{
	var unit = (new nixps.cloudflow.UnitPreferences()).getDefinition("length");
	var ptUnit = new nixps.cloudflow.Unit({ unit: 'pt' });

	var dialogTemplate =
		"<div class='patch-sheet-size-dialog'>"
			+ get_format_settings()
		 	//+ get_origin_settings()
			+ "<h1>Patch Sheet Size</h1>"
			+ "<div class='row'>"
				+ "<label>width</label><input name='width' value='${sheet.width}'><label class='unit'>${unitname}</label>"
			+ "</div>"
			+ "<div class='row'>"
				+ "<label>height</label><input name='height' value='${sheet.height}'><label class='unit'>${unitname}</label>"
			+ "</div>"
			+ "<h1>Sheet Margins</h1>"
			+ "<div class='row'>"
				+ "<label>left</label><input name='left' value='${margins.left}'><label class='unit'>${unitname}</label>"
			+ "</div>"
			+ "<div class='row'>"
				+ "<label>right</label><input name='right' value='${margins.right}'><label class='unit'>${unitname}</label>"
			+ "</div>"
			+ "<div class='row'>"
				+ "<label>top</label><input name='top' value='${margins.top}'><label class='unit'>${unitname}</label>"
			+ "</div>"
			+ "<div class='row'>"
				+ "<label>bottom</label><input name='bottom' value='${margins.bottom}'><label class='unit'>${unitname}</label>"
			+ "</div>"

		+ "</div>";

	var editor = panzer.get_application().get_layout_panel().get_editor();
	var margins = editor.editor('getMargins');
	var pSettings = get_overrides();
	var settingsDialogDiv = $.tmpl(dialogTemplate, {
		sheet: {
			width: unit.toStringWithoutUnit(ptUnit.convert(editor.editor('getWidth'), unit)),
			height: unit.toStringWithoutUnit(ptUnit.convert(editor.editor('getHeight'), unit)),
		},
		margins: {
			left: unit.toStringWithoutUnit(ptUnit.convert(margins.left, unit)),
			right: unit.toStringWithoutUnit(ptUnit.convert(margins.right, unit)),
			top: unit.toStringWithoutUnit(ptUnit.convert(margins.top, unit)),
			bottom: unit.toStringWithoutUnit(ptUnit.convert(margins.bottom, unit)),
		},
		unitname: unit.getShortName(),
		/*momsettings:{
			 offset_x: unit.toStringWithoutUnit(ptUnit.convert(pSettings.momsettings.offset_x, unit)),
             offset_y: unit.toStringWithoutUnit(ptUnit.convert(pSettings.momsettings.offset_y, unit))
		},*/
		cut_gutter:unit.toStringWithoutUnit(ptUnit.convert(pSettings.cut_gutter, unit)),
	});


	settingsDialogDiv.find('.layout_direction').val(pSettings.layout_direction);
	settingsDialogDiv.find('.patchplanner_output').val(pSettings.output);
	//settingsDialogDiv.find('#patchplanner_mounting').val(pSettings.mounting);

	//settingsDialogDiv.find('select[name=origin]').val(pSettings.momsettings.origin_y.toFixed(1) + ',' + pSettings.momsettings.origin_x.toFixed(1));
    //settingsDialogDiv.find('select[name=reference_box]').val(pSettings.momsettings.reference_box);
/*
    if (pSettings.momsettings.pdf_coordinates === true) {
        settingsDialogDiv.find('select[name=orientation]').val("left");
    }
    else {
        settingsDialogDiv.find('select[name=orientation]').val("right");
    }
    settingsDialogDiv.find('input[name=mom_outputs_sizes]').prop('checked', pSettings.output_patch_sizes === true);
	settingsDialogDiv.appendTo($('body'));
	settingsDialogDiv.find('input[name=mom_outputs_sizes]').on('click', function() {
         pSettings.output_patch_sizes = $(this).is(':checked') === true;
    });	*/

	settingsDialogDiv.dialog({
		title: "Settings",
		modal: true,
		buttons: [
			{
				text: "Save",
				click: function() {
					var width = parseFloat($(this).find('input[name=width]').val());
					var height = parseFloat($(this).find('input[name=height]').val());
					var width_pt = unit.convert(width, ptUnit);
					var height_pt = unit.convert(height, ptUnit);

					var mleft = parseFloat($(this).find('input[name=left]').val());
					var mright = parseFloat($(this).find('input[name=right]').val());
					var mtop = parseFloat($(this).find('input[name=top]').val());
					var mbottom = parseFloat($(this).find('input[name=bottom]').val());

					var left_pt = unit.convert(mleft, ptUnit);
					var right_pt = unit.convert(mright, ptUnit);
					var top_pt = unit.convert(mtop, ptUnit);
					var bottom_pt = unit.convert(mbottom, ptUnit);

					var editor = panzer.get_application().get_layout_panel().get_editor();
					editor.editor('setSize', width_pt, height_pt);
					editor.editor('setMargins', {
						left: left_pt,
						right: right_pt,
						top: top_pt,
						bottom: bottom_pt
					});

                    //Overrides
                    pSettings.layout_direction = $(this).find('.layout_direction').val();
					pSettings.output = $(this).find('.patchplanner_output').val();
					//pSettings.mounting = $('#patchplanner_mounting').val();
					pSettings.cut_gutter = unit.convert(parseFloat($(this).find('input[name=cut_gutter]').val()), ptUnit);
					//Mom settings
					//pSettings.momsettings.pdf_coordinates = $(this).find('select[name=orientation]').val() === 'left';
					//pSettings.momsettings.offset_x = unit.convert(parseFloat($(this).find('input[name=offset_x]').val()), ptUnit);
					//pSettings.momsettings.offset_y = unit.convert(parseFloat($(this).find('input[name=offset_y]').val()), ptUnit);
					//pSettings.momsettings.reference_box = $(this).find('select[name=reference_box]').val();
	                //var origin = $(this).find('select[name=origin]').val();
	                //pSettings.momsettings.origin_x = parseFloat(origin.split(',')[1]);
	                //pSettings.momsettings.origin_y = parseFloat(origin.split(',')[0]);

					set_overrides(pSettings);

					save_project();

					$(this).dialog( "close" );
					$(this).remove();
				}
			},
			{
				text: "Cancel",
				click: function() {
					$(this).dialog ("close");
					$(this).remove();
				}
			}
		],
		maxWidth: 380,
		minWidth: 380,
		resizable: false,
		position: {
			my: 'center center',
			at: 'center center-150',
			of: $('#layout.patchplanner')

		}
	});
}


function disable_application() {
	$('button.needsproject').button('option', 'disabled', true);
	$('<div>').addClass('freezePanel').appendTo($('.layoutcontent'));
}


function enable_application() {
	$('button.needsproject').button('option', 'disabled', false);
	var session = new nixps.patchplanner.Session();
	if (session.isJobSession() && session.isJobMOMPresent()) {
		$('button.exportButton').button('disable');
	}
	$('.freezePanel').remove();
}


function newDialog() {
	$('<div>').appendTo('body').NewDialog({
		'createsheet': function(pEvent, pData) {
			var sheetname = pData.name;

			if ((typeof sheetname !== "string") || (sheetname.length === 0)) {
				return;
			}

			// get the session
			var session = new nixps.patchplanner.Session();

			// get the creation settings
			var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();
			var sheetSettings = cloudflowSettings.getSheetSettings();
			var sheetMargins = sheetSettings.getMargins();

			// create and save a blank sheet using the settings
			var layoutDocument = new nixps.patchplanner.layout_document(sheetSettings.getDefaultWidth(), sheetSettings.getDefaultHeight());
			var settings = layoutDocument.get_settings();
			settings.sheetMarginLeft = sheetMargins.left.toString();
			settings.sheetMarginRight = sheetMargins.right.toString();
			settings.sheetMarginTop = sheetMargins.top.toString();
			settings.sheetMarginBottom = sheetMargins.bottom.toString();

			layoutDocument.set_settings(settings);

			session.setProjectName(sheetname);
			session.setJobSession(false);
			session.saveLayoutDocument(layoutDocument);

			location.reload();

			// load the newly created sheet
			// loadProject();
		},
		'createjob': function(pEvent, pData) {
			var jobname = pData.name;

			if ((typeof jobname !== "string") || (jobname.length === 0)) {
				return;
			}

			// get the session
			var session = new nixps.patchplanner.Session();

			// create and save a blank sheet using the settings
			var layoutDocument = new nixps.patchplanner.layout_document(72 * 100, 72 * 100);
			var settings = layoutDocument.get_settings();
			settings.sheetMarginLeft = 0;
			settings.sheetMarginRight = 0;
			settings.sheetMarginTop = 0;
			settings.sheetMarginBottom = 0;
			layoutDocument.set_settings(settings);
			session.setProjectName(jobname);
			session.setJobSession(true);
			session.saveLayoutDocument(layoutDocument);

			location.reload();
			// Load the newly created job
			// loadProject();
		}
	});
}


function openDialog() {
	$('<div>').appendTo('body').OpenDialog({
		opensheet: function(pEvent, pData) {
			var session = new nixps.patchplanner.Session();
			session.setProjectName(pData.name);
			session.setJobSession(false);
			loadProject();
		},
		openjob: function(pEvent, pData) {
			var session = new nixps.patchplanner.Session();
			session.setProjectName(pData.name);
			session.setJobSession(true);
			loadProject();
		}
	});
}


function copySheet() {
	var name = prompt('Copy patch sheet as');
	if ((typeof name === "string")  && (name.length > 0)) {
		var applicationPaths = new nixps.patchplanner.application_paths();

		var session = new nixps.patchplanner.Session();
		var currentSheet = session.getProjectName();
		var currentSheetPath = application_paths.get_sheets_folder().to_file(currentSheet + ".json");
		var newSheetPath = application_paths.get_sheets_folder().to_file(name + ".json");

		if (api.file.fileExists(newSheetPath.get_full_path()).result === false) {
			api.file.copy_file(currentSheetPath.get_full_path(), newSheetPath.get_full_path());
			loadProject();
			var editor = panzer.get_application().get_layout_panel().get_editor();
			editor.editor('removeAll');
		}
		else {
			alert('There is already a sheet with that name, cannot overwrite');
		}
	}
}


function createToolbar() {
	var session = new nixps.patchplanner.Session();

	$('#project').remove();
	var toolbar = $('<div>').attr('id', 'project').appendTo('body');

    if ($('.nixps-cloudflow-CloudflowBar').length > 0) {
        // we are in new ui modus
        $('#project').ActivityBar({
            title: '',
            icon: $('<div>').addClass('svgIcon').load('/portal/icons/non-active/main-icon-patchplanner.svg')
        });
    }

	if (session.isJobSession()) {
		toolbar.JobToolbar({
			'new': newDialog,
			'open': openDialog,
			'export': exportJobMOM,
			'settings': open_settings
		});

		if (session.hasProjectName()) {
			toolbar.JobToolbar('option', 'jobName', session.getProjectName());
			toolbar.JobToolbar('option', 'momExported', session.isJobMOMPresent());
		}
	}
	else {
		toolbar.SheetToolbar({
			'new': newDialog,
			'open': openDialog,
			'copy': copySheet,
			'size': open_sheet_size,
			'calculate': calculate_layout,
			'export': export_pdf,
			'settings': open_settings
		});

		if (session.hasProjectName()) {
			toolbar.SheetToolbar('option', 'sheetName', session.getProjectName());
		}
	}
}


function enableLayoutSavesOnChanges() {
	// Set the change callback of the editor
	var editor = panzer.get_application().get_layout_panel().get_editor();
	var filelist = panzer.get_application().get_layout_panel().get_sidebar().get_filelist();
	var saveProjectThrottled = _.throttle(save_project, 500);
	editor.on('editorlayoutchanged', function() {
		saveProjectThrottled();
		filelist.filelist('redraw');
	});
}

function disableLayoutSavesOnChanges() {
	var editor = panzer.get_application().get_layout_panel().get_editor();
	editor.off('editorlayoutchanged');
}

/**
 * Entrypoint
 */
function init_patchplanner()
{
	// Create the base folders
	var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();

	// Check if we need to archive
	api_defer.preferences.get_for_realm('system', '', 'com.nixps.patchplanner', '').then(function (prefs) {
		var preferences = prefs.preferences;
		var last_archive_timestamp = preferences.last_archive_timestamp;
		var autoArchive = cloudflowSettings.archiveAutomatically();

		if (autoArchive === true && (Date.now() / 1000) - last_archive_timestamp > (24 * 60 * 60)) {
			var archiveFolder = cloudflowSettings.getArchiveFolder();
			var jobsPath = cloudflowSettings.getJobsPath();
			var sheetsPath = cloudflowSettings.getPatchSheetsPath();
			var jobsArchiveFolder = archiveFolder.toChild('Jobs');
			var sheetsArchiveFolder = archiveFolder.toChild('Sheets');
			var archiveTimeout = cloudflowSettings.getArchiveTimeout() * 24 * 60 * 60;
			api_defer.printplanner.archive_jobs_and_sheets(jobsPath.getFullPath(), sheetsPath.getFullPath(), jobsArchiveFolder.getFullPath(), sheetsArchiveFolder.getFullPath(), archiveTimeout);
		}
	});

	// Render the marks if needed
	var marks = nixps.patchplanner.util.get_folder_contents_list(cloudflowSettings.getMarksPath());
	_.each(marks, function(pMarkPath) {
		api_async.proofscope.render(pMarkPath.url);
	});

	// Get the pp session
	var session = new nixps.patchplanner.Session();

	// Create the corresponding toolbar
	createToolbar();

	// Create the div for the sheet editor
	$('body').append('<div id="layout" class="patchplanner">');

	// Create and run the application
	var app = new nixps.patchplanner.application();
	panzer.set_application(app);
	panzer.get_application().run();
	panzer.get_application().get_layout_panel().get_editor().editor('option', 'zoom', 0.25);

	// Setup the double click on the file list to start proofscope
	if (session.isJobSession()) {
		panzer.get_application().get_layout_panel().get_sidebar().get_filelist().bind('filelistopenitem', function(p_event, p_parameters) {
			var session = new nixps.patchplanner.Session();
			if (session.isJobMOMPresent()) {
				return;
			}

			save_project();

			// Get the path
			var path = p_parameters.path;

			var session = new nixps.patchplanner.Session();
			session.set_patchscope_asset_url(path.get_full_path().substr('cloudflow://'.length));

	        var redirect_url = '/portal.cgi?patchplanner=patchscope';
	        window.location.href = redirect_url;
		});
	}

	// Disable the application
	disable_application();

	// Load the project in the current session
	if (session.hasProjectName()) {
		loadProject();
		if (session.isJobSession() && (session.isJobMOMPresent() === false)) {
			function tryCalculate() {
				calculate_layout().fail(function() {
					window.CALCULATE_TRIALS = window.CALCULATE_TRIALS - 1;
					if (window.CALCULATE_TRIALS > 0) {
						tryCalculate();
					}
				});
			}

			// Try 5 times
			window.CALCULATE_TRIALS = 5;
			tryCalculate();
		}
	}

	enableLayoutSavesOnChanges();

	// TODO implement proper keybindings
	// Prevent the backspace key from navigating back.
	$(document).unbind('keydown').bind('keydown', function (event) {
	    var doPrevent = false;
	    if (event.keyCode === 8) {
	        var d = event.srcElement || event.target;
	        if ((d.tagName.toUpperCase() === 'INPUT' && (d.type.toUpperCase() === 'TEXT' || d.type.toUpperCase() === 'PASSWORD' || d.type.toUpperCase() === 'FILE'))
	             || d.tagName.toUpperCase() === 'TEXTAREA') {
	            doPrevent = d.readOnly || d.disabled;
	        }
	        else {
	            doPrevent = true;
	        }
	    }

	    if (doPrevent) {
	        event.preventDefault();
	    }
	});
}
