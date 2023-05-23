/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true, newcap: true*/
/*globals $, _, jsPlumb, console, api_sync, window */

///////////////////////////////////////////////////////////////////////////////////////
// PATCHPLANNER TAB
///////////////////////////////////////////////////////////////////////////////////////

(function() {

    /**
     * @brief adapts the ui when another output is selected
     */
    function outputChanged() {
        var output = $('#patchplanner_output').val();
	
    	if (typeof output !== 'string') {
    		return;
    	}
    
        if ('zund' === output.toLowerCase()
            || 'hpgl' === output.toLowerCase()) {
            $('[name=cut_gutter]').prop('disabled', false);
            $('[name=cut_gutter]').css({
                opacity: 1.0
            });
        }
        else {
            $('[name=cut_gutter]').prop('disabled', true);   
            $('[name=cut_gutter]').css({
                opacity: 0.7
            });
        }
    }

    function translateText(pKey) {
        switch(pKey) {
        case "valid": 
            return $.i18n._('nixps-cloudflow-patchplanner.check.folder_exists');

        case "defaultFont":
            return $.i18n._('nixps-cloudflow-patchplanner.check.sourcecodepro_in_fonts_exists');

        case "defaultMark":
            return $.i18n._('nixps-cloudflow-patchplanner.check.default_pdf_in_marks_exists');

        case "noneMark":
            return $.i18n._('nixps-cloudflow-patchplanner.check.none_pdf_in_marks_exists');
        }

        return "";
    }

    function createInputRow(pName) {
        return $("<tr>"
            +    "<td width='35px'><img src='portal/images/config_worker.svg'/></td>"
            +    "<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-patchplanner.' + pName).toUpperCase() + "</td>"
            +    "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"
            +    "<td class='description'><input id='patchplanner_" + pName + "' name='" + pName + "' value='' placeholder='" + $.i18n._('nixps-cloudflow-patchplanner.' + pName) + "' size='60'>"
            + "</td></tr>");
    }

    function createMetaRow(pName) {
        return $("<tr class='meta-row'>" 
            +    "<td width='35px'> </td>"
            + "<td colspan='3'><div class='meta-arrow' style='display: block;'>"
            + "<img class='meta-arrow-image' src='portal/images/dashboard_fold_arrow.png'>"
            + "<table class='results " + pName + "'><tbody></tbody></table>"
        + "</div></td></tr>");
    }

    function createOriginSettings(pSettings) {
        var template = "<div class='row'>"
                + "<label>origin</label><select name='origin'><option value='0.0,0.0'>Bottom left</option><option value='0.0,0.5'>Bottom center</option></select> of <select name='reference_box'><option value='mediabox'>Media Box</option><option value='trimbox'>Trim Box</option><option value='bleedbox'>Bleed Box</option><option value='cropbox'>Crop Box</option><option value='artbox'>Art Box</option></select>"
            + "</div>"
            + "<div class='row'>"
                + "<label>orientation</label><select name='orientation'><option value='left'>Left Handed</option><option value='right'>Right Handed</option></select>"
            + "</div>"
            + "<div class='row'>&nbsp;</div>"
            + "<div class='row'>"
                + "<label>offset x</label><input name='offset_x' value='${momsettings.offset_x}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>offset y</label><input name='offset_y' value='${momsettings.offset_y}'><label class='unit'>${unitname}</label>"
            + "</div>";

        var ptUnit = new nixps.cloudflow.Unit({ unit: 'pt' });
        var ppUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('length');
        var div = $.tmpl(template, {
            momsettings: {
                offset_x: ppUnit.toStringWithoutUnit(ptUnit.convert(pSettings.momsettings.offset_x, ppUnit)),
                offset_y: ppUnit.toStringWithoutUnit(ptUnit.convert(pSettings.momsettings.offset_y, ppUnit)),
            },
            unitname: ppUnit.getShortName()
        });

        div.find('select[name=origin]').val(pSettings.momsettings.origin_y.toFixed(1) + ',' + pSettings.momsettings.origin_x.toFixed(1));
        div.find('select[name=reference_box]').val(pSettings.momsettings.reference_box);
        if (pSettings.momsettings.pdf_coordinates === true) {
            div.find('select[name=orientation]').val("left");
        }
        else {
            div.find('select[name=orientation]').val("right");
        }

        return div;
    }

    function createSheetSettings(pSettings) {
        var template = "<h1>Margins</h1>"
            + "<div class='row'>"
                + "<label>left</label><input name='margin_left' value='${margins.left}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>right</label><input name='margin_right' value='${margins.right}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>top</label><input name='margin_top' value='${margins.top}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>bottom</label><input name='margin_bottom' value='${margins.bottom}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<h1>Default Size</h1>"
            + "<div class='row'>"
                + "<label>width</label><input name='default_width' value='${sheet.width}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>height</label><input name='default_height' value='${sheet.height}'><label class='unit'>${unitname}</label>"
            + "</div>";

        var ptUnit = new nixps.cloudflow.Unit({ unit: 'pt' });
        var ppUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('length');
        var div = $.tmpl(template, {
            margins: {
                left: ppUnit.toStringWithoutUnit(ptUnit.convert(pSettings.sheetsettings.margin_left, ppUnit)),
                right: ppUnit.toStringWithoutUnit(ptUnit.convert(pSettings.sheetsettings.margin_right,ppUnit)),
                top: ppUnit.toStringWithoutUnit(ptUnit.convert(pSettings.sheetsettings.margin_top, ppUnit)),
                bottom: ppUnit.toStringWithoutUnit(ptUnit.convert(pSettings.sheetsettings.margin_bottom, ppUnit))
            },
            sheet: {
                width: ppUnit.toStringWithoutUnit(ptUnit.convert(pSettings.sheetsettings.default_width, ppUnit)),
                height: ppUnit.toStringWithoutUnit(ptUnit.convert(pSettings.sheetsettings.default_height, ppUnit))
            },
            unitname: ppUnit.getShortName()
        });

        return div;
    }

    function createPatchPreferences(pPatchPreferences) {
        var template = "<h1>Patch Preferences</h1>"
            + "<h2>Slug Lines</h2>"
            + "<div class='row'>"
                + "<label>font size</label><input name='slugline_font_size' value='${slugline_font_size}'><label class='unit'>pt</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>slugline text</label><input size='40' name='slugline_text' value='${slugline_text}'>"
            + "</div>"
            + "<h2>Cut Marks</h2>"
            + "<div class='row'>"
                + "<label>line width</label><input name='cutmark_line_width' value='${cutmark_line_width}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>stroke color</label><select name='cutmark_stroke_color'><option value='black'>black</option><option value='white'>white</option></select>"
            + "</div>"
            + "<h2>Distortion Text</h2>"
            + "<div class='row'>"
                + "<label>text</label><input size='40' name='distortion_text' value='${distortion_text}'>"
            + "</div>"
            + "<div class='row'>"
                + "<label>font size</label><input name='distortion_font_size' value='${distortion_font_size}'><label class='unit'>pt</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>distance from right</label><input name='distortion_distance_cutmark_left' value='${distortion_distance_cutmark_left}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>offset from middle</label><input name='distortion_distance_cutmark_center' value='${distortion_distance_cutmark_center}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<h2>Marks</h2>"
            + "<div class='row'>"
                + "<label>distance from left</label><input name='mark_distance_left' value='${mark_distance_left}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>distance from right</label><input name='mark_distance_right' value='${mark_distance_right}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>vertical offset</label><input name='mark_vertical_offset' value='${mark_vertical_offset}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>snap to</label><select name='mark_snap'>"
                    + "<option value='top'>patch top</option>"
                    + "<option value='middle'>patch middle</option>"
                    + "<option value='bottom'>patch bottom</option>"
                + "</select>"
            + "</div>"
            + "<h2>Extra Marks on Tall Patches</h2>"
            + "<div class='row'>"
                + "<label>min height of tall patch</label><input name='min_tall_patch_height' value='${min_tall_patch_height}'><label class='unit'>${unitname}</label>"
            + "</div>"
            + "<div class='row'>"
                + "<label>proportion of tall patch</label><input name='tall_patch_proportion' value='${tall_patch_proportion}'>"
            + "</div>";
            // + "<h2>Output sheet</h2>"
            // + "<div class='row'>"
            //     + "<label>slug lines font size</label><input name='mark_vertical_offset' value='${mark_vertical_offset}'><label class='unit'>${unitname}</label>"
            // + "</div>";

        var preferences = $.extend({
			slugline_font_size: 6,
			slugline_text: '${index} - ${pdfname} - ${sepname}',
			cutmark_line_width: 0.5,
			cutmark_stroke_color: 'black',
			distortion_text: '${distortion}',
			distortion_font_size: 6,
			distortion_distance_cutmark_left: 4,
			distortion_distance_cutmark_center: -4,
			mark_distance_left: 23,
			mark_distance_right: 23,
			mark_vertical_offset: 0,
            mark_snap: "middle",
            min_tall_patch_height: 3 * 72,
            tall_patch_proportion: 2.5
        }, pPatchPreferences)

        var ptUnit = new nixps.cloudflow.Unit({ unit: 'pt' });
        var ppUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('length');
        var div = $.tmpl(template, {
			slugline_font_size: preferences.slugline_font_size,
			slugline_text: preferences.slugline_text,
			cutmark_line_width: ppUnit.toStringWithoutUnit(ptUnit.convert(preferences.cutmark_line_width, ppUnit)),
			cutmark_stroke_color: preferences.cutmark_stroke_color,
			distortion_text: preferences.distortion_text,
			distortion_font_size: preferences.distortion_font_size,
			distortion_distance_cutmark_left: ppUnit.toStringWithoutUnit(ptUnit.convert(preferences.distortion_distance_cutmark_left, ppUnit)),
			distortion_distance_cutmark_center: ppUnit.toStringWithoutUnit(ptUnit.convert(preferences.distortion_distance_cutmark_center, ppUnit)),
			mark_distance_left: ppUnit.toStringWithoutUnit(ptUnit.convert(preferences.mark_distance_left, ppUnit)),
			mark_distance_right: ppUnit.toStringWithoutUnit(ptUnit.convert(preferences.mark_distance_right, ppUnit)),
			mark_vertical_offset: ppUnit.toStringWithoutUnit(ptUnit.convert(preferences.mark_vertical_offset, ppUnit)),
            mark_snap: preferences.mark_snap,
			min_tall_patch_height: ppUnit.toStringWithoutUnit(ptUnit.convert(preferences.min_tall_patch_height, ppUnit)),
			tall_patch_proportion: preferences.tall_patch_proportion,
            unitname: ppUnit.getShortName()
        });

        div.find('select[name=cutmark_stroke_color]').val(preferences.cutmark_stroke_color);
        div.find('select[name=mark_snap]').val(preferences.mark_snap);

        return div;
    }

    function updateTable(result, success, canInstall) {
        var tableBody = $('#tabs-patchplanner table.results tbody');
        tableBody.empty();

        if (success === true) {
            $('#patchplanner-pref-table').find('.checkimage').attr('src', '/portal/images/patchplanner_install_ok.png');
        }
        else {
            $('#patchplanner-pref-table').find('.checkimage').attr('src', '/portal/images/patchplanner_install_error.png');
        }

        var tableRow = $('<tr>').append($('<td>').addClass('yesno')).append($('<td>').addClass('description'));

        _.each(_.pairs(result), function(pair) {
            var key = pair[0],
                pathResult = pair[1],
                tableBody = $('#tabs-patchplanner table.results.' + key).find('tbody');

            _.each(_.pairs(pathResult), function(pair) {
                var testName = pair[0],
                    testValue = pair[1];

                var row = tableRow.clone();
                if (testValue === "ok") {
                    row.children('.yesno')._t('nixps-cloudflow-patchplanner.check.success');
                    row.children('.yesno').addClass('yes');
                }
                else {
                    row.children('.yesno')._t('nixps-cloudflow-patchplanner.check.failed');
                    row.children('.yesno').addClass('no');
                }

                row.children('.description').text(translateText(testName));

                row.appendTo(tableBody);
            });

            if (canInstall === true) {
                $('#patchplanner-pref-table').find('.install_button').show();
            }
            else {
                $('#patchplanner-pref-table').find('.install_button').hide();
            }
        });
    }


    window.patchplanner_tab = {
    	default_preferences: {
    		job_marks_path: "cloudflow://PP_FILE_STORE/JobMarks/",
            font_path: "cloudflow://PP_FILE_STORE/Fonts/",
            marks_path: "cloudflow://PP_FILE_STORE/Marks/",
            mom_output_path: "cloudflow://PP_FILE_STORE/MOMOutput/",
            mirror_proofs_output_path: "cloudflow://PP_FILE_STORE/MirrorProofs/",
            drill_mount_output_path: "cloudflow://PP_FILE_STORE/DrillMount/",
            jobs_path: "cloudflow://PP_FILE_STORE/Jobs/",
            patch_sheets_path: "cloudflow://PP_FILE_STORE/PatchSheets/",
            pdf_output_path: "cloudflow://PP_FILE_STORE/PDFOutput/",
            pdf_overview_output_path: "cloudflow://PP_FILE_STORE/PDFOverview/",
            output: "normal",
            cut_gutter: 0,
            layout_direction: "top",
            output_patch_sizes: false,
            archive_path: 'cloudflow://PP_FILE_STORE/Archived/',
            archive_timeout: 60,
            archive_automatically: false
    	},

        //
        // General Methods
        //
        setup_ui: function(pPrereleaseFlags)
        {
        	this.m_json = null;

            var cutGutterUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('length');


            $('#config-navs').append("<li id='tabs-patchplanner-tab'><a href='#tabs-patchplanner'>" + $.i18n._('nixps-cloudflow-patchplanner.title') + "</a></li>");
            $('#config-tabs').append("<div id='tabs-patchplanner' class='tab'><table id='patchplanner-pref-table' class='tsw-table' style='margin-right:0px; margin-left:0px; width:100%'></table></div>");

    		// PATCHPLANNER
    		$('#patchplanner-pref-table').append("<tr class='ws_entry'>"+
    			"<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-patchplanner.title').toUpperCase() + "</td>"+
    			"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
    			"<td><img class='checkimage' style='margin-left: 20px;' />" + "<span class='installationText'>" + $.i18n._('nixps-cloudflow-patchplanner.check.title') + "</span>" + "</td></tr>");
    		$('#patchplanner-pref-table').append("<tr>"+
    			"<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
    			"<td width='*' class='name' >" + $.i18n._('nixps-cloudflow-patchplanner.job_marks_path').toUpperCase() + "</td>"+
    			"<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
    			"<td class='description'><input id='patchplanner_job_marks_path' name='job_marks_path' value='' placeholder='patchplanner job marks path' size='60'>"+
    			"<a style='margin-left: 10px;' class='green-button install_button'>" + $.i18n._('nixps-cloudflow-patchplanner.app_path.install') + "</a>"+
    			"<a style='margin-left: 10px;' class='green-button recheck_button'>" + $.i18n._('nixps-cloudflow-patchplanner.app_path.recheck') + "</a></td></tr>");
            $('#patchplanner-pref-table').append(createMetaRow("job_marks_path"));
            $('#patchplanner-pref-table').append(createInputRow("font_path"));
            $('#patchplanner-pref-table').append(createMetaRow("font_path"));
            $('#patchplanner-pref-table').append(createInputRow("marks_path"));
            $('#patchplanner-pref-table').append(createMetaRow("marks_path"));
            $('#patchplanner-pref-table').append(createInputRow("mom_output_path"));
            $('#patchplanner-pref-table').append(createMetaRow("mom_output_path"));
            $('#patchplanner-pref-table').append(createInputRow("mirror_proofs_output_path"));
            $('#patchplanner-pref-table').append(createMetaRow("mirror_proofs_output_path"));
            $('#patchplanner-pref-table').append(createInputRow("drill_mount_output_path"));
            $('#patchplanner-pref-table').append(createMetaRow("drill_mount_output_path"));
            $('#patchplanner-pref-table').append(createInputRow("jobs_path"));
            $('#patchplanner-pref-table').append(createMetaRow("jobs_path"));
            $('#patchplanner-pref-table').append(createInputRow("patch_sheets_path"));
            $('#patchplanner-pref-table').append(createMetaRow("patch_sheets_path"));
            $('#patchplanner-pref-table').append(createInputRow("pdf_output_path"));
            $('#patchplanner-pref-table').append(createMetaRow("pdf_output_path"));
            $('#patchplanner-pref-table').append(createInputRow("pdf_overview_output_path"));
            $('#patchplanner-pref-table').append(createMetaRow("pdf_overview_output_path"));
            $('#patchplanner-pref-table').append("<tr class='meta-row'>"+
                "<td width='35px' style='vertical-align: top; padding-top: 2px'><img src='portal/images/config_worker.svg'/></td>"+
                "<td width='*' class='name' style='vertical-align: top; padding-top: 6px'>" + $.i18n._('nixps-cloudflow-patchplanner.format').toUpperCase() + "</td>"+
                "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                "<td class='description'>" +
                "<div class='row' style='margin-top: 10px;'>" +
                "<label>" + $.i18n._('nixps-cloudflow-patchplanner.mounting_method') + "</label><select id='patchplanner_mounting'>"+
    			"<option value='mom'>" + $.i18n._('nixps-cloudflow-patchplanner.mom-mounting') + "</option>"+
    			"<option value='mirror'>" + $.i18n._('nixps-cloudflow-patchplanner.mirror-mounting') + "</option>" +
                "<option value='mirrormom'>" + $.i18n._('nixps-cloudflow-patchplanner.mirrormom-mounting') + "</option>" +
                "<option value='drillmount'>" + $.i18n._('nixps-cloudflow-patchplanner.drill-mounting') + "</option>" +
                "<option value='heaford'>" + $.i18n._('nixps-cloudflow-patchplanner.heaford-mounting') + "</option>" +
                "</select>" +
                "</div>" +
                "<div class='row' style='margin-top: 10px;'>" +
                "<label>" + $.i18n._('nixps-cloudflow-patchplanner.cutting_method') + "</label><select id='patchplanner_output'>"+
    			"<option value='manual'>" + $.i18n._('nixps-cloudflow-patchplanner.format-manual_cutting') + "</option>"+
    			"<option value='zund'>" + $.i18n._('nixps-cloudflow-patchplanner.format-zund_cutting') + "</option>"+
    			"<option value='hpgl'>" + $.i18n._('nixps-cloudflow-patchplanner.format-hpgl') + "</option></select>" +
                "</div>" +
                "<div class='row' style='margin-top: 10px;'>" +
                    "<label>cut gutter</label><input name='cut_gutter' value='0'><label class='unit'>" + cutGutterUnit.getShortName() + "</label>" +
                "</div>" +
                "<div class='row' style='margin-top: 10px;'>" +
                    "<label>start layout from</label><select id='layout_direction'><option value='top'>top</option><option value='bottom'>bottom</option></select>" +
                "</div>" +
                "<div class='row' style='margin-top: 10px;'>" +
                    "<label>" + $.i18n._('nixps-cloudflow-patchplanner.mom_outputs_sizes') + "</label><input type='checkbox' name='mom_outputs_sizes'>" +
                "</div>" +
                "<div class='row' style='margin-top: 10px;'>" +
                    "<label>" + $.i18n._('nixps-cloudflow-patchplanner.overview_sheet_font_size') + "</label><input type='text' name='overview_sheet_font_size'>pt" +
                "</div>" +
                "</td></tr>"
            );
            $('#patchplanner-pref-table').append("<tr class='meta-row'>"+
                "<td width='35px' style='vertical-align: top; padding-top: 2px'><img src='portal/images/config_worker.svg'/></td>"+
                "<td width='*' class='name' style='vertical-align: top; padding-top: 6px'>" + $.i18n._('nixps-cloudflow-patchplanner.origin').toUpperCase() + "</td>"+
                "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                "<td class='description momsettings'>"+
                "</td></tr>");
            $('#patchplanner-pref-table').append("<tr class='meta-row'>"+
                "<td width='35px' style='vertical-align: top; padding-top: 2px'><img src='portal/images/config_worker.svg'/></td>"+
                "<td width='*' class='name' style='vertical-align: top; padding-top: 6px'>" + $.i18n._('nixps-cloudflow-patchplanner.sheet').toUpperCase() + "</td>"+
                "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                "<td class='description sheetsettings'>"+
                "</td></tr>");
            $('#patchplanner-pref-table').append("<tr class='meta-row'>"+
                "<td width='35px' style='vertical-align: top; padding-top: 2px'><img src='portal/images/config_worker.svg'/></td>"+
                "<td width='*' class='name' style='vertical-align: top; padding-top: 6px'>" + $.i18n._('nixps-cloudflow-patchplanner.patches').toUpperCase() + "</td>"+
                "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                "<td class='description patchsettings'>"+
                "</td></tr>");
            $('#patchplanner-pref-table').append("<tr class='meta-row'>"+
                "<td width='35px' style='vertical-align: top; padding-top: 2px'><img src='portal/images/config_worker.svg'/></td>"+
                "<td width='*' class='name' style='vertical-align: top; padding-top: 6px'>" + $.i18n._('nixps-cloudflow-patchplanner.maintenance').toUpperCase() + "</td>"+
                "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                "<td class='description'>"+
                    "<div class='row'>" +
                        "<label>" + $.i18n._('nixps-cloudflow-patchplanner.archive_items_older_than') + "</label><input class='patchplanner_archive_timeout'>" + $.i18n._('nixps-cloudflow-patchplanner.days') +
                    "</div>" +
                    "<div class='row'>" +
                        "<label>" + $.i18n._('nixps-cloudflow-patchplanner.archive_folder') + "</label><input class='patchplanner_archive_path' size='60'>" +
                        "<a style='margin-left: 10px;' class='green-button patchplanner_archive_button'>" + $.i18n._('nixps-cloudflow-patchplanner.archive') + "</a>" +
                    "</div>" +
                    "<div class='row'>" +
                        "<label>" + $.i18n._('nixps-cloudflow-patchplanner.archive_automatically') + "</label><input class='patchplanner_archive_automatically' type='checkbox'>" +
                    "</div>" +
                    "<div class='row'>" +
                        "<label>" + $.i18n._('nixps-cloudflow-patchplanner.last_archive') + "</label><span class='patchplanner_last_archive'>" + $.i18n._('nixps-cloudflow-patchplanner.never_ran') + "</span>" +
                    "</div>" +
                "</td></tr>");
        },


        check_install: function()
        {
            var installer = new nixps.patchplanner.installer(this.m_json);
            config_pane.touch();

            $.when(installer.check_install(), installer.check_install_no_details(), installer.check_install_requirements()).then(function(result, success, canInstall) {
                updateTable(result, success, canInstall);
            }).fail(function(pError) {
                updateTable({}, false, false);
            });
        },
        

        enable_handlers: function()
        {
        	var that = this;
            var checkInstall = _.throttle(_.bind(that.check_install, that), 1000);
            var inputs = ["job_marks_path", "font_path", "marks_path", "mom_output_path", "mirror_proofs_output_path","drill_mount_output_path", "jobs_path", "patch_sheets_path", "pdf_output_path", "pdf_overview_output_path"];
            var inputids = _.map(inputs, function(id) {
                return "#patchplanner_" + id;
            });
            
            $('#patchplanner_mounting').on('change', function() {
                that.m_json.mounting = $('#patchplanner_mounting').val();
                config_pane.touch();
            });

            $('#patchplanner_output').on('change', function() {
                that.m_json.output = $('#patchplanner_output').val();
                outputChanged();
                config_pane.touch();
            });

        	$(inputids.join(", ")).on('blur', function(pEvent) {
                $(inputids.join(", ")).each(function() {
                    var targetfield = $(this).attr('name');
                    that.m_json[targetfield] = new nixps.cloudflow.URLPath($(this).val(), true).getFullPath();
                });
        		config_pane.touch();
        	});

        	$(inputids.join(", ")).on('keyup', function(pEvent) {
                $(inputids.join(", ")).each(function() {
                    var targetfield = $(this).attr('name');
                    that.m_json[targetfield] = new nixps.cloudflow.URLPath($(this).val(), true).getFullPath();
                });
                checkInstall();
        	});

            $('#patchplanner-pref-table').find('.recheck_button').on('click', function() {
                config_pane.touch();
                _.bind(that.check_install, that)();
            });


            $('#patchplanner-pref-table').find('.install_button').on('click', function() {
                var installer = new nixps.patchplanner.installer(that.m_json);
                try {
                    config_pane.touch();
                    installer.install();
                    that.check_install();
                }
                catch(pError) {
                    if (pError instanceof nixps.patchplanner.RequirementsError) {
                        $("<div>" + $.i18n._('nixps-cloudflow-patchplanner.error.requirements_failed.invalid_dir') + ".</div>").dialog({
                            autoOpen: true,
                            modal: true,
                            title: $.i18n._('nixps-cloudflow-patchplanner.error.requirements_failed.title'),
                            buttons: [ { 
                                text: $.i18n._('nixps-cloudflow-patchplanner.error.requirements_failed.close'),
                                click: function() {
                                   $(this).dialog('close');
                                }
                            } ]
                        });
                    }
                    else {
                        throw pError;
                    }
                }
            });

            $('[name=cut_gutter]').on('change', function() {
                var ptUnit = new nixps.cloudflow.Unit({ unit: 'pt' });
                var ppUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('length');

                that.m_json.cut_gutter = ppUnit.convert(parseFloat($("[name=cut_gutter]").val()), ptUnit);
                config_pane.touch();
            });


            $('#layout_direction').on('change', function() {
                that.m_json.layout_direction = $("#layout_direction").val();
                config_pane.touch();
            });

            $('#patchplanner-pref-table [name=mom_outputs_sizes]').on('click', function() {
                that.m_json.output_patch_sizes = $(this).is(':checked') === true;
                config_pane.touch();
            });

        },


        set_metadata: function(p_blob)
        {
            var that = this;

        	if (typeof p_blob !== "object") {
        		config_pane.m_json_blob.preferences.patchplanner = $.extend({}, this.default_preferences, true);
        		this.m_json = config_pane.m_json_blob.preferences.patchplanner;
        		config_pane.touch();
        	}
        	else {
                config_pane.m_json_blob.preferences.patchplanner = $.extend(this.default_preferences, config_pane.m_json_blob.preferences.patchplanner);
    	    	this.m_json = config_pane.m_json_blob.preferences.patchplanner;
        	}

            if ($.isPlainObject(this.m_json.momsettings) !== true) {
                this.m_json.momsettings = {
                    reference_box: 'artbox',
                    origin_x: 0,
                    origin_y: 0,
                    offset_x: 0,
                    offset_y: 0,
                    pdf_coordinates: true
                };

                config_pane.touch();
            }

            if ($.isPlainObject(this.m_json.sheetsettings) !== true) {
                this.m_json.sheetsettings = {
                    margin_left: 0,
                    margin_top: 0,
                    margin_right: 0,
                    margin_bottom: 0,
                    default_width: 2160,
                    default_height: 3096
                };

                config_pane.touch();
            }
            
            if (this.m_json.mounting === undefined) {
                this.m_json.mounting = "mom";
                config_pane.touch();
            }

        	$('#patchplanner_job_marks_path').val(decodeURIComponent(this.m_json.job_marks_path));
            $('#patchplanner_font_path').val(decodeURIComponent(this.m_json.font_path));
            $('#patchplanner_marks_path').val(decodeURIComponent(this.m_json.marks_path));
            $('#patchplanner_mom_output_path').val(decodeURIComponent(this.m_json.mom_output_path));
            $('#patchplanner_mirror_proofs_output_path').val(decodeURIComponent(this.m_json.mirror_proofs_output_path));
            $('#patchplanner_drill_mount_output_path').val(decodeURIComponent(this.m_json.drill_mount_output_path));
            $('#patchplanner_jobs_path').val(decodeURIComponent(this.m_json.jobs_path));
            $('#patchplanner_patch_sheets_path').val(decodeURIComponent(this.m_json.patch_sheets_path));
            $('#patchplanner_pdf_output_path').val(decodeURIComponent(this.m_json.pdf_output_path));
            $("#patchplanner_pdf_overview_output_path").val(decodeURIComponent(this.m_json.pdf_overview_output_path));
            $('#patchplanner_mounting').val(this.m_json.mounting);
            $('#patchplanner_output').val(this.m_json.output);
            $('#layout_direction').val(this.m_json.layout_direction);
            $(".patchplanner_archive_path").val(decodeURIComponent(this.m_json.archive_path));
            $(".patchplanner_archive_timeout").val(this.m_json.archive_timeout);
            $(".patchplanner_archive_automatically").prop('checked', this.m_json.archive_automatically);
            api_defer.preferences.get_for_realm('system', '', 'com.nixps.patchplanner', '').then(function (prefs) {
                var timestamp = prefs.preferences.last_archive_timestamp;
                var overviewSheetPreferences = prefs.preferences.overview_sheet_preferences;
                $(".patchplanner_last_archive").text(new Date(timestamp * 1000).toLocaleString());
                $('#patchplanner-pref-table .patchsettings').append(createPatchPreferences(prefs.preferences.patch_decorator_preferences));
                $('[name=overview_sheet_font_size]').val(overviewSheetPreferences && overviewSheetPreferences.font_size ? overviewSheetPreferences.font_size : 18);

                $('#patchplanner-pref-table .patchsettings').find('input, select').off('change');
                $('#patchplanner-pref-table .patchsettings').find('input, select').on('change', function(pEvent) {
                    var ptUnit = new nixps.cloudflow.Unit({ unit: 'pt' });
                    var ppUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('length');
    
                    var slugline_font_size = $('#patchplanner-pref-table .patchsettings [name=slugline_font_size]').val();
                    var slugline_text = $('#patchplanner-pref-table .patchsettings [name=slugline_text]').val();
                    var cutmark_line_width = $('#patchplanner-pref-table .patchsettings [name=cutmark_line_width]').val();
                    var cutmark_stroke_color = $('#patchplanner-pref-table .patchsettings [name=cutmark_stroke_color]').val();
                    var distortion_text = $('#patchplanner-pref-table .patchsettings [name=distortion_text]').val();
                    var distortion_font_size = $('#patchplanner-pref-table .patchsettings [name=distortion_font_size]').val();
                    var distortion_distance_cutmark_left = $('#patchplanner-pref-table .patchsettings [name=distortion_distance_cutmark_left]').val();
                    var distortion_distance_cutmark_center = $('#patchplanner-pref-table .patchsettings [name=distortion_distance_cutmark_center]').val();
                    var mark_distance_left = $('#patchplanner-pref-table .patchsettings [name=mark_distance_left]').val();
                    var mark_distance_right = $('#patchplanner-pref-table .patchsettings [name=mark_distance_right]').val();
                    var mark_vertical_offset = $('#patchplanner-pref-table .patchsettings [name=mark_vertical_offset]').val();
                    var mark_snap = $('#patchplanner-pref-table .patchsettings [name=mark_snap]').val();
                    var min_tall_patch_height = $('#patchplanner-pref-table .patchsettings [name=min_tall_patch_height]').val();
                    var tall_patch_proportion = $('#patchplanner-pref-table .patchsettings [name=tall_patch_proportion]').val();
    
                    var settings = {
                        slugline_font_size: parseFloat(slugline_font_size),
                        slugline_text: slugline_text,
                        cutmark_line_width: ppUnit.convert(parseFloat(cutmark_line_width), ptUnit),
                        cutmark_stroke_color: cutmark_stroke_color,
                        distortion_text: distortion_text,
                        distortion_font_size: distortion_font_size,
                        distortion_distance_cutmark_left: ppUnit.convert(parseFloat(distortion_distance_cutmark_left), ptUnit),
                        distortion_distance_cutmark_center: ppUnit.convert(parseFloat(distortion_distance_cutmark_center), ptUnit),
                        mark_distance_left: ppUnit.convert(parseFloat(mark_distance_left), ptUnit),
                        mark_distance_right: ppUnit.convert(parseFloat(mark_distance_right), ptUnit),
                        mark_vertical_offset: ppUnit.convert(parseFloat(mark_vertical_offset), ptUnit),
                        min_tall_patch_height: ppUnit.convert(parseFloat(min_tall_patch_height), ptUnit),
                        tall_patch_proportion: tall_patch_proportion,
                        mark_snap: mark_snap
                    };
        
                    api_defer.preferences.save_for_realm(settings, 'system', '', 'com.nixps.patchplanner', 'patch_decorator_preferences');
                });          
            });
            var ptUnit = new nixps.cloudflow.Unit({ unit: 'pt' });
            var ppUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('length');
            $('#patchplanner-pref-table [name=mom_outputs_sizes]').prop('checked', this.m_json.output_patch_sizes === true);
            $('[name=cut_gutter]').val(ppUnit.toStringWithoutUnit(ptUnit.convert(this.m_json.cut_gutter, ppUnit)));
            outputChanged();

            $('#patchplanner-pref-table .momsettings').append(createOriginSettings(this.m_json));
            $('#patchplanner-pref-table .sheetsettings').append(createSheetSettings(this.m_json));
            
            this.check_install();

            $('#patchplanner-pref-table .momsettings').find('input, select').off('change');
            $('#patchplanner-pref-table .momsettings').find('input, select').on('change', function(pEvent) {
                var ptUnit = new nixps.cloudflow.Unit({ unit: 'pt' });
                var ppUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('length');

                that.m_json.momsettings.reference_box = $('#patchplanner-pref-table .momsettings [name=reference_box]').val();
                var origin = $('#patchplanner-pref-table .momsettings [name=origin]').val();
                var origin_x = parseFloat(origin.split(',')[1]);
                var origin_y = parseFloat(origin.split(',')[0]);
                that.m_json.momsettings.origin_x = origin_x;
                that.m_json.momsettings.origin_y = origin_y;
                that.m_json.momsettings.offset_x = ppUnit.convert(parseFloat($('#patchplanner-pref-table .momsettings [name=offset_x]').val()), ptUnit);
                that.m_json.momsettings.offset_y = ppUnit.convert(parseFloat($('#patchplanner-pref-table .momsettings [name=offset_y]').val()), ptUnit);
                that.m_json.momsettings.pdf_coordinates = $('#patchplanner-pref-table .momsettings [name=orientation]').val() === 'left';
                config_pane.touch();
            });

            $('#patchplanner-pref-table .sheetsettings').find('input').off('change');
            $('#patchplanner-pref-table .sheetsettings').find('input').on('change', function(pEvent) {
                var ptUnit = new nixps.cloudflow.Unit({ unit: 'pt' });
                var ppUnit = (new nixps.cloudflow.UnitPreferences()).getDefinition('length');

                that.m_json.sheetsettings.margin_left = ppUnit.convert(parseFloat($('#patchplanner-pref-table .sheetsettings [name=margin_left]').val()), ptUnit);
                that.m_json.sheetsettings.margin_right = ppUnit.convert(parseFloat($('#patchplanner-pref-table .sheetsettings [name=margin_right]').val()), ptUnit);
                that.m_json.sheetsettings.margin_top = ppUnit.convert(parseFloat($('#patchplanner-pref-table .sheetsettings [name=margin_top]').val()), ptUnit);
                that.m_json.sheetsettings.margin_bottom = ppUnit.convert(parseFloat($('#patchplanner-pref-table .sheetsettings [name=margin_bottom]').val()), ptUnit);
                that.m_json.sheetsettings.default_width = ppUnit.convert(parseFloat($('#patchplanner-pref-table .sheetsettings [name=default_width]').val()), ptUnit);
                that.m_json.sheetsettings.default_height = ppUnit.convert(parseFloat($('#patchplanner-pref-table .sheetsettings [name=default_height]').val()), ptUnit);
                config_pane.touch();
            });          

            $('#patchplanner-pref-table .patchplanner_archive_timeout').find('input').off('change');
            $('#patchplanner-pref-table .patchplanner_archive_timeout').on('change', function(pEvent) {
                var inputStr = $('#patchplanner-pref-table .patchplanner_archive_timeout').val();
                var timeout = parseInt(inputStr, 10);
                if (! isNaN(timeout)) {
                    that.m_json.archive_timeout = timeout;
                    config_pane.touch();
                }
            });

            $('#patchplanner-pref-table .patchplanner_archive_path').find('input').off('change');
            $('#patchplanner-pref-table .patchplanner_archive_path').on('change', function(pEvent) {
                var inputStr = $('#patchplanner-pref-table .patchplanner_archive_path').val();
                inputStr = inputStr.trim();
                if (inputStr.length > 0) {
                    that.m_json.archive_path = inputStr;
                    config_pane.touch();
                }
            });

            $('#patchplanner-pref-table .patchplanner_archive_button').off('click');
            $('#patchplanner-pref-table .patchplanner_archive_button').on('click', function() {
                config_pane.touch();
                var archivePath = that.m_json.archive_path;
                var jobsArchivePath = archivePath + '/Jobs/';
                var sheetsArchivePath = archivePath + '/Sheets/';
                var timeout = that.m_json.archive_timeout;
                var jobsPath = that.m_json.jobs_path;
                var sheetsPath = that.m_json.patch_sheets_path;
                api_defer.printplanner.archive_jobs_and_sheets(jobsPath, sheetsPath, jobsArchivePath, sheetsArchivePath, timeout * 24 * 60 * 60).then(function () {
                    return api_defer.preferences.get_for_realm('system', '', 'com.nixps.patchplanner', '');
                }).then(function (prefs) {
                    var timestamp = prefs.preferences.last_archive_timestamp;
                    $(".patchplanner_last_archive").text(new Date(timestamp * 1000).toLocaleString());
                    config_pane.touch();
                });
            });

            $('#patchplanner-pref-table .patchplanner_archive_automatically').off('click');
            $('#patchplanner-pref-table .patchplanner_archive_automatically').on('click', function() {
                var autoArchive = $('#patchplanner-pref-table .patchplanner_archive_automatically').prop('checked') === true;
                that.m_json.archive_automatically = autoArchive;
                config_pane.touch();
            });

            $('[name=overview_sheet_font_size]').off('change');
            $('[name=overview_sheet_font_size]').on('change', function () {
                var fontSize = $('[name=overview_sheet_font_size]').val();
                if (! isNaN(fontSize)) {
                    api_defer.preferences.save_for_realm({
                        font_size: parseInt(fontSize, 10)
                    }, 'system', '', 'com.nixps.patchplanner', 'overview_sheet_preferences');
                }
            });

        }

    };

}());

