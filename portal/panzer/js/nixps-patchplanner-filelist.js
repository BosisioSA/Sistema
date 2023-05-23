/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window*/

/*global panzer_layout_edition_sheet, _*/
/*global nixps, namespace */

(function( $ ) {

    $.widget("nixps-patchplanner.filelist", {


        /**
         * @brief constructor
         */
        _create: function() {
            this._on(true, this.element, {
                'filelist_itemclick :nixps-patchplanner-filelist_item': this._selectHandler,
                'filelist_iteminfoiconclicked :nixps-patchplanner-filelist_item': this._infoIconClickedHandler,
                'filelist_itemclosebuttonclicked :nixps-patchplanner-filelist_item': this._closeButtonClickedHandler,
                'filelist_itemdblclick :nixps-patchplanner-filelist_item': this._fileDblClickHandler,
                'filelist_patchclick :nixps-patchplanner-filelist_patch': this._selectHandler
            });

            this.patchInfo = new nixps.patchplanner.PatchInfo();
            this.projectName = false;
        },


        /**
         * @brief handles the item selection
         */
        _selectHandler: function(pEvent) {
            this.element.find(':nixps-patchplanner-filelist_item').filelist_item('select', false);
            this.element.find(':nixps-patchplanner-filelist_patch').filelist_patch('select', false);

            var target = $(pEvent.target);
            if (target.is(':nixps-patchplanner-filelist_item')) {
                target.filelist_item('select', true);
            }
            else if (target.is(':nixps-patchplanner-filelist_patch')) {
                target.filelist_patch('select', true);
            }
        },


        /**
         * @brief handles the file double clicks
         */
        _fileDblClickHandler: function(pEvent) {
            var filelist_item = $(pEvent.target);
            if (! filelist_item.hasClass('element')) {
                filelist_item = filelist_item.parents('.element');
            }

            if (filelist_item.hasClass('patch')) {
                return false;
            }

            $('#layout .sidebar .filelist .element').removeClass('selected');
            filelist_item.addClass('selected');
            filelist_item.focus();

            this._trigger('openitem', null, {
                path: filelist_item.filelist_item('option', 'path')
            });
        },


        /** 
         * @brief handles a click on the info panel
         */
        _infoIconClickedHandler: function(pEvent) {
            // Is there an old job settings panel?
            var oldJobSettingsPanel =  $(':nixps-patchplanner-job_settings');
            if (oldJobSettingsPanel.length > 0) {
                this._closeButtonClickedHandler(pEvent, {
                    reload: false
                });
            }

            var path = $(pEvent.target).filelist_item('option', 'path');

            var session = new nixps.patchplanner.Session();
            var layoutDocument = session.load_layout_document();
            var jobSettings = new nixps.patchplanner.job_settings(path, layoutDocument.get_file_data(path));
            var mounting_method = layoutDocument.get_settings().mounting_method;
            var jobSettingsPanel = $('<div>');
            jobSettingsPanel.css({
                'left': $(':nixps-patchplanner-filelist .closebutton:visible').offset().left + $(':nixps-patchplanner-filelist .closebutton:visible').width()
            });
            var patchMargins = jobSettings.get_patch_margins();
            jobSettingsPanel.job_settings({
                jobpath: path,
                margin_top: jobSettings.get_margin_top(),
                margin_left: jobSettings.get_margin_left(),
                distortion: jobSettings.get_distortion(),
                cilinder_circumference: jobSettings.get_cilinder_circumference(),
                cilinder_width: jobSettings.get_cilinder_width(),
                slugline_base_name: jobSettings.get_slugline_base_name(),
                thickness_paper: jobSettings.get_paper_thickness(),
                thickness_tape: jobSettings.get_tape_thickness(),
                thickness_mylar: jobSettings.get_mylar_thickness(),
                thickness_plate: jobSettings.get_plate_thickness(),
                mounting_method: mounting_method,
                mirror_mounting_distortion: jobSettings.get_mirror_mount_distortion(),
                mirror_mounting_separation: jobSettings.get_mirror_mount_separation(),
                mark: new nixps.cloudflow.URLPath(jobSettings.get_mark()),
                patch_margin_left: patchMargins.left,
                patch_margin_right: patchMargins.right,
                patch_margin_top: patchMargins.top,
                patch_margin_bottom: patchMargins.bottom,
                drill_mount_die_separation:jobSettings.get_drill_mount_die_separation(),
                drill_mount_carrier_box:jobSettings.get_drill_mount_carrier_box()

            });
 
            if (session.isJobSession() === false) {
                jobSettingsPanel.job_settings('option', 'readonly', true);
            }
            else {
                if (session.isJobMOMPresent() === true) {
                    jobSettingsPanel.job_settings('option', 'readonly', true);
                }
                else {
                    jobSettingsPanel.job_settings('option', 'readonly', false);
                }
            }
            
            jobSettingsPanel.appendTo($('body'));
        },


        /**
         * @brief handles a click on the close button
         */
        _closeButtonClickedHandler: function(pEvent, pParameters) {
            var session = new nixps.patchplanner.Session();

            if ((session.isJobSession() === true) && (session.isJobMOMPresent() === true)) {
                $(':nixps-patchplanner-job_settings').remove();
                return;
            }

            // Get the options
            var options = $(':nixps-patchplanner-job_settings').job_settings('option');

            // Create the job settings based on these options
            var job_settings = new nixps.patchplanner.job_settings(options.jobpath);
            job_settings.set_margins(options.margin_left, options.margin_top);
            job_settings.set_distortion(options.distortion);
            job_settings.set_cilinder_circumference(options.cilinder_circumference);
            job_settings.set_cilinder_width(options.cilinder_width);
            job_settings.set_slugline_base_name(options.slugline_base_name);
            job_settings.set_paper_thickness(options.thickness_paper);
            job_settings.set_tape_thickness(options.thickness_tape);
            job_settings.set_plate_thickness(options.thickness_plate);
            job_settings.set_mylar_thickness(options.thickness_mylar);
            job_settings.set_mark(options.mark);
            job_settings.set_patch_margins({
                left: options.patch_margin_left,
                right: options.patch_margin_right,
                top: options.patch_margin_top,
                bottom: options.patch_margin_bottom
            });
            job_settings.set_mirror_mount_distortion(options.mirror_mounting_distortion);
            job_settings.set_mirror_mount_separation(options.mirror_mounting_separation);
            job_settings.set_drill_mount_die_separation(options.drill_mount_die_separation);
            job_settings.set_drill_mount_carrier_box(options.drill_mount_carrier_box);

            // Save it
            var layout_document = session.load_layout_document();
            layout_document.set_file_data(options.jobpath, job_settings.to_json());
            $(':nixps-patchplanner-job_settings').remove();

            session.saveLayoutDocument(layout_document);

            // Reload the project
            if ((session.isJobSession() === true) && (session.isJobMOMPresent() === false)) {
                if ((pParameters.reload === undefined) || (pParameters.reload === true)) {
                    loadProject();
                }
            }
        },


        /** 
         * @brief adds a file in the item list, with its patches
         */
        addFile: function(pItem, pPatches) {
            this.element.append(pItem);
            var that = this;
            _.each(pPatches, function(pPatch) {
                that.element.append(pPatch);
            });

            this.redraw();
        },


        /**
         * @brief removes the file in the item list
         */
        removeFile: function(pFilePath, pPatchIDs) {
            if (! pFilePath instanceof cloudflow_path) {
                throw new Error('invalid parameter');
            }

            this.element.children(':nixps-patchplanner-filelist_item[path="' + pFilePath.get_full_path() + '"]').remove();            
            for(var i = 0; i < pPatchIDs.length; i++) {
                var id = pPatchIDs[i];
                this.element.children(':nixps-patchplanner-filelist_patch[patchid=' + id + ']').remove();
            }
        },


        /**
         * @brief removes the patch with id
         */
        removePatch: function(pPatchID) {
            if ((typeof pPatchID !== 'string') || (pPatchID.length === 0)) {
                throw new Error('invalid parameter');
            }

            this.element.children().each(function(pIndex, pItem) {
                var item = $(pItem);
                if (item.is(":nixps-patchplanner-filelist_patch")) {
                    if (pPatchID === item.filelist_patch('option', 'id')) {
                        item.remove();
                    }
                }
            });
        },


        /**
         * @brief returns the selected item
         */
        getSelectedItem: function() {
            return this.element.find('.selected');
        },


        /**
         * @brief clears the filelist
         */
        clear: function() {
            this.element.empty();
            this.patchInfo = new nixps.patchplanner.PatchInfo();
        },


        /**
         * @brief redraws the file list
         */
        redraw: function() {
            (_.throttle(_.bind(this._draw, this), 500))();
        },


        /**
         * @brief redraws the file list
         */
        _draw: function() {
            if ((typeof this.projectName !== "string") || (this.projectName.length === 0)) {
                this.projectName = (new nixps.patchplanner.Session()).getProjectName();
            }

            var editor = panzer.get_application().get_layout_panel().get_editor();
            var labelPositions = editor.editor('getLabelPositions');
            var resourceIDs = _.map(labelPositions, function(pLabel) {
                return pLabel.refid;
            });
            var patchInfo = this.patchInfo;
            var projectName = this.projectName;

            this.element.find(':nixps-patchplanner-filelist_patch').each(function(pIndex, pPatchItem) {
                var item = $(pPatchItem);
                var patchID = item.filelist_patch('option', 'id');
                if (_.contains(resourceIDs, patchID) === true) {
                    item.filelist_patch('option', 'placed', _.contains(resourceIDs, patchID));
                    item.filelist_patch('option', 'sheetName', false);
                }
                else {
                    try {
                        var info = patchInfo.getJobPatchInfo(patchID);
                        if (info.sheets.length > 0) {
                            // Only handle 'foreign' patches this way
                            if (info.sheets[0] !== projectName) {
                                item.filelist_patch('option', 'placed', true);
                                item.filelist_patch('option', 'sheetName', info.sheets[0]);
                            }
                            else {
                                // The patch 'was' placed in the sheet, but not anymore (still on disk)
                                item.filelist_patch('option', 'placed', false);
                                item.filelist_patch('option', 'sheetName', false);
                            }
                        }
                        else {
                            item.filelist_patch('option', 'placed', false);
                            item.filelist_patch('option', 'sheetName', false);
                        }
                    }
                    catch(pError) {
                        item.filelist_patch('option', 'placed', false);
                        item.filelist_patch('option', 'sheetName', false);
                    }
                }
            });
        }

    });
}(jQuery));
