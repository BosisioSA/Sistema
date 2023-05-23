/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window, jQuery, cloudflow_path */

/*global panzer_layout_edition_sheet, _*/
/*global nixps, namespace */

(function( $ ) {

    function fileUploaded(p_filename, p_asset_url, p_mounting_method) {
        console.log(p_mounting_method);
        
        var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();
        var session = new nixps.patchplanner.Session();

        // p_asset_url = decodeURI(p_asset_url);
        var assetPath = new nixps.cloudflow.URLPath(p_asset_url);
        var assetDirectory = assetPath.toParent();

        // Create the jobs folder
        var targetFolder = cloudflowSettings.getJobsPath().toChild(session.getProjectName());
        api_sync.file.move_file(p_asset_url, targetFolder.getFullPath());

        var l_filename = assetPath.getName();
        var newAssetPath = targetFolder.toFile(assetPath.getName());

        var filelist = panzer.get_application().get_layout_panel().get_sidebar().get_filelist();
        var filelist_item = $("<div>").filelist_item({
            path: newAssetPath
        });

        filelist.filelist('addFile', filelist_item);

        // Add the selected file to the layout document
        var layout_document = session.load_layout_document();
        layout_document.add_file(newAssetPath);
        var layout_document_settings = layout_document.get_settings();
        layout_document_settings.mounting_method = p_mounting_method;
        layout_document.set_settings(layout_document_settings);
        session.saveLayoutDocument(layout_document);
        
        // Set the job settings for the file when the metadata is available
        filelist_item.on('filelist_itemmetadatafinished', function() {
            var asset_path = $(this).filelist_item('option', 'path');

            var session = new nixps.patchplanner.Session();
            var layout_document = session.load_layout_document();

            var job_settings = new nixps.patchplanner.job_settings(asset_path);
            layout_document.set_file_data(asset_path, job_settings.to_json());

            session.saveLayoutDocument(layout_document);
        });
    }


    $.widget("nixps-patchplanner.FileListToolbar", {

        options: {

            tools: ["upload", "remove"]

        },


        _create: function() {
            var uploadButton = $("<button>").addClass("upload").text("Upload");
            uploadButton.button({
                text: true,
                icons: {
                    primary: 'icon-add-job'
                }
            });
            uploadButton.appendTo(this.element);

            var addJobButton = $("<button>").addClass("addjob").text("Add job");
            addJobButton.button({
                text: true,
                icons: {
                    primary: 'icon-add-job'
                }
            });
            addJobButton.appendTo(this.element);

            var removeButton = $("<button>").addClass("remove").text("Remove");
            removeButton.button({
                text: true,
                icons: {
                    primary: 'icon-remove-job'
                }
            });
            removeButton.appendTo(this.element);


            this._on(this.element, {
                'click .upload': this._uploadHandler,
                'click .remove': this._removeHandler,
                'click .addjob': this._addJobHandler
            });

            this.option("tools", this.options.tools);
        },


        _uploadHandler: function() {
            var session = new nixps.patchplanner.Session();
            var layoutDocument = session.load_layout_document();
            var fileList = layoutDocument.get_filelist();

            if (fileList.length > 0) {
                alert('File is already imported');
            }
            else {
                var uploadOverlay = new nixps.patchplanner.upload_overlay($('#layout.patchplanner'), fileUploaded);
                uploadOverlay.show();
            }
        },


        _removeHandler: function() {
            var session = new nixps.patchplanner.Session();
            var editor = panzer.get_application().get_layout_panel().get_editor();
            var filelist = panzer.get_application().get_layout_panel().get_sidebar().get_filelist();
            var layout_document = session.load_layout_document();
            var selected = filelist.filelist('getSelectedItem');

            if (selected.is(':nixps-patchplanner-filelist_item')) {
                var path = selected.filelist_item('option', 'path');

                var filename = path.get_name();

                var confirmMessage = $('<p>Are you sure you want to delete: "' + decodeURIComponent(filename) + '"?</p>');
                confirmMessage.dialog({
                    title: "Delete job?",
                    width: 350,
                    autoOpen: true,
                    modal: true,
                    buttons: {
                        "Delete": function() {
                            var patchids = layout_document.get_patchids(path);
                            for(var i = 0; i < patchids.length; i++) {
                                editor.editor('removeWithRefID', patchids[i], (i === patchids.length - 1));
                            }
                            filelist.filelist('removeFile', path, patchids);
                            layout_document.remove_file(path);  

                            // The job owns the file, not the sheet
                            if (session.isJobSession() === true) {
                                api_sync.file.delete_file(path.getFullPath());
                            }

                            session.saveLayoutDocument(layout_document);

                            $(this).dialog('close');
                        },
                        "Cancel": function() {
                            $(this).dialog('close');
                        }
                    }
                });

            }
            else if (selected.is(':nixps-patchplanner-filelist_patch')) {
                if (session.isJobSession() === false) {
                    return;
                }

                var patchid = selected.filelist_patch('option', 'id');
                var patch = layout_document.get_patch(patchid);
                var file = patch.get_file();

                editor.editor('removeWithRefID', patchid);
                filelist.filelist('removePatch', patchid);
                layout_document.remove_patch(patchid);

                var patchids = layout_document.get_patchids(file);
                for(var i = 0; i < patchids.length; i++) {
                    var id = patchids[i];
                    var patch = layout_document.get_patch(id);
                    var patch_element = filelist.find(':nixps-patchplanner-filelist_patch[patchid=' + id + ']');
                    patch_element.filelist_patch('option', 'patch', patch);
                }

                for(var i = 0; i < patchids.length; i++) {
                    var id = patchids[i];
                    var label = editor.editor('getWithRefID', id).editor_label('reload');
                }

                session.saveLayoutDocument(layout_document);
            }
        },


        _addJobHandler: function() {
            var addJobDialog = $('<div>').appendTo('body').AddJobDialog({
                jobadded: function(pEvent, pData) {
                    var jobname = pData.jobname;
                    var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();
                    var session = new nixps.patchplanner.Session();
                    var assetPath = session.getPDFFromJob(jobname);

                    var jobPath = cloudflowSettings.getJobsPath().toChild(jobname).toFile(jobname + ".json");
                    var jobLayoutJSON = api_sync.file.read_json_from_url(jobPath.getFullPath());
                    var jobLayoutDocument = new nixps.patchplanner.layout_document(jobLayoutJSON);

                    var filelist = panzer.get_application().get_layout_panel().get_sidebar().get_filelist();
                    var filelist_item = $("<div>").filelist_item({
                        path: assetPath
                    });

                    // Add the selected file to the layout document
                    var layout_document = session.load_layout_document();
                    layout_document.add_file(assetPath);
                    var patchids = jobLayoutDocument.get_placed_patchids(assetPath);
                    layout_document.set_job_decorator(assetPath, jobLayoutDocument.get_job_decorator(assetPath));
                    layout_document.set_file_data(assetPath, jobLayoutDocument.get_file_data(assetPath));
                    for(var i = 0; i < patchids.length; i++) {
                        var patch = jobLayoutDocument.get_patch(patchids[i]);
                        layout_document.m_document.m_json.resources[patchids[i]] = [ patch.to_json() ];
                        layout_document.set_decorator(patchids[i], jobLayoutDocument.get_decorator(patchids[i]));
                    }
                    session.saveLayoutDocument(layout_document);

                    loadProject();
                }
            });
        },


        /**
         * @brief sets the option
         */
        _setOption: function(pKey, pValue) {
            if (pKey === "tools") {
                if ($.isArray(pValue) === false) {
                    pValue = [ "upload", "remove" ];
                }
                this._super(pKey, pValue);

                if (pValue.indexOf("upload") < 0) {
                    this.element.find('.upload').hide();
                }
                else {
                    this.element.find('.upload').show();
                }

                if (pValue.indexOf("remove") < 0) {
                    this.element.find('.remove').hide();
                }
                else {
                    this.element.find('.remove').show();
                }

                if (pValue.indexOf("addjob") < 0) {
                    this.element.find('.addjob').hide();
                }
                else {
                    this.element.find('.addjob').show();
                }
            }
        }

    });

}(jQuery));

