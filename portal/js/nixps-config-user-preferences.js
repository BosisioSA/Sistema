/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true, newcap: true*/
/*globals $, _, jsPlumb, console, api_sync, window, nixps, api_async */

///////////////////////////////////////////////////////////////////////////////////////
// USER PREFERENCES
///////////////////////////////////////////////////////////////////////////////////////


(function() {

    function saveUnits(units) {
        return $.Deferred(function(pDefer) {
            api_async.preferences.save_for_current_user(units, "", "units", function() {
                pDefer.resolve();
            }, function() {
                pDefer.reject();
            });
        });
    }

    function saveLanguage(language) {
        return $.Deferred(function(pDefer) {
            api_async.preferences.save_for_current_user(language, "", "language", function() {
                pDefer.resolve();
            }, function() {
                pDefer.reject();
            });
        });
    }


    function loadFromServer() {
        return $.Deferred(function(pDefer) {
            api_async.preferences.get_for_current_user("", "", function(preferences) {
                pDefer.resolve(preferences.preferences);
            }, function(error) {
                pDefer.reject(error);
            });
        });
    }

    function getVersion() {
        return $.Deferred(function(pDefer) {
            api_async.portal.version(function(pVersion){
                if(typeof pVersion.major !== "number" || pVersion.major < 0 ) {
                    pDefer.reject('missing major');
                }
                if(typeof pVersion.minor !== "number" || pVersion.minor < 0 ) {
                    pDefer.reject('missing minor');
                }
                pDefer.resolve(pVersion);
            }, pDefer.reject);
        });
    }

    function saveToServer(language, units) {
        return saveLanguage(language).then(function() {
            return saveUnits(units);
        });
    }


    function savePreferences() {
        var unitPreferences = {};
        $('.tsw-table').find('.unitdefinition').each(function(index, element) {
            var definitionRow = $(element);
            var select = definitionRow.find('select');
            var accuracy = definitionRow.find('input');
            var accuracyInt = parseInt(accuracy.val(), 10);

            if (! isNaN(accuracyInt) && (accuracyInt >= 0)) {
                unitPreferences[select.attr('definition')] = {
                    unit: select.val(),
                    accuracy: accuracyInt
                };
            }
        });


        var language = $('.tsw-table').find('.languageSelector').TranslatedLanguagesSelector('option', 'value');

        saveToServer(language, unitPreferences).then(function() {
            reloadPreferences();
        });
    }


    function saveClientMapping(includeNew) {
        var mapping = $('.tsw-table').find('.filestore-mapping');
        if (includeNew !== true) {
            mapping = $('.tsw-table').find('.filestore-mapping:not(.new)');
        }
        var newClientMapping = {};
        mapping.each(function(index, row) {
            newClientMapping[$(row).find('.filestore').val()] = $(row).find('.mapping').val();
        });

        return CFClient.saveClientMapping(newClientMapping);
    }


    var throttledSaveClientMapping = _.throttle(saveClientMapping, 500);


    function createMappingRow(filestore, mapping) {
        var row = $('<tr>')
            .addClass('filestore-mapping')
            .append($('<td>')
                .attr('width', '35px')
                .append($('<img>').attr('src', 'portal/images/config_worker.svg')))
            .append($('<td>').attr({
                    'width': '*',
                    'colspan': '2'
                })
                .addClass('name')
                .append($('<input>').addClass('filestore').css('width', 250).attr('type', 'text')))
            .append($('<td>').addClass('description')
                .append($('<input>').addClass('mapping').attr('type', 'text').css('width', 450))
                .append($('<button>').addClass('changeAction colored-button remove-mapping')
                    .text($.i18n._('nixps-cloudflow-user_preferences.cfclient_filestore_mapping.remove_button')))
                .append($('<button>').addClass('changeAction colored-button add-mapping')
                    .text($.i18n._('nixps-cloudflow-user_preferences.cfclient_filestore_mapping.add_button'))));

        row.find('.filestore').val(filestore);
        row.find('.mapping').val(mapping);
        return row;
    }


    function drawClientMapping() {
        var mappingTable = $('.cfclient-filestore-mappings');
        $('.tsw-table').find('.filestore-mapping').remove();

        CFClient.getClientMapping().then(function(mapping) {
            createMappingRow('','').addClass('new').insertAfter(mappingTable);

            var keys = Object.keys(mapping);
            for(var i = keys.length - 1; i >= 0; i--) {
                var filestore = keys[i];
                var target = mapping[filestore];
                var row = createMappingRow(filestore, target);
                row.insertAfter(mappingTable);
            }
        });
    }


    function reloadPreferences() {
        loadFromServer().then(function(preferences) {
            var table = $('.tsw-table');
            var languageSelector = table.find('.languageSelector');
            languageSelector.TranslatedLanguagesSelector('option', 'value', preferences.language);

            var units = preferences.units;
            var unitDefinitions = _.keys(units);
            for(var i = 0; i < unitDefinitions.length; i++) {
                var definition = unitDefinitions[i];

                $('select[name="' + definition + '"]').val(units[definition].unit);
                $('input[name="' + definition + '"]').val(units[definition].accuracy);
            }
        });

        CFClient.isCFClient().then(function(isCFClient) {
            $('.tsw-table').on('keydown', function(event) {
                var row = $(event.target).closest('.filestore-mapping:not(.new)');
                if (row.length === 0) {
                    return;
                }

                throttledSaveClientMapping();
            });

            $('.tsw-table').on('blur', function(event) {
                var row = $(event.target).closest('.filestore-mapping:not(.new)');
                if (row.length === 0) {
                    return;
                }

                saveClientMapping();
            });

            $('.tsw-table').on('click', function(event) {
                var removeButton = $(event.target).closest('.remove-mapping');
                var addButton = $(event.target).closest('.add-mapping');

                if (removeButton.length > 0) {
                    removeButton.closest('tr').remove();
                    saveClientMapping();
                }
                else if (addButton.length > 0) {
                    saveClientMapping(true).then(function() {
                        var newRow = $('.filestore-mapping.new').removeClass('new');
                        var row = createMappingRow().addClass('new');
                        row.insertAfter(newRow);
                    });
                }
            })

            if (isCFClient === false) {
                return;
            }

            var mappingTable = $('.cfclient-filestore-mappings');
            mappingTable.show();
            var mappingTableTitle = $('.cfclient-filestore-mappings-title');
            mappingTableTitle.show();

            drawClientMapping();
        });
    }

    function setUIVersion() {
        getVersion().done(function(version) {
            // cloudflow version
            var versionRow = $('.tsw-table tr.version');
            versionRow.find('.versionnumber')._t('nixps-cloudflow-login.version', [version.major + '.' + version.minor, version.build]);
            if (typeof version.rev === "number" && version.rev > 0) {
                versionRow.find('.update')._t('nixps-cloudflow-login.versionupdate', [version.rev]);
            }
            // packzflow version
            if (version.packzflow_major !== undefined && version.packzflow_minor !== undefined && version.packzflow_build !== undefined) {
                var packzflowVersionRow = $('.tsw-table tr.packzflow_version');
                packzflowVersionRow.find('.versionnumber')._t('nixps-cloudflow-login.version', [version.packzflow_major + '.' + version.packzflow_minor, version.packzflow_build]);
                if (typeof version.packzflow_rev === "number" && version.packzflow_rev > 0) {
                    packzflowVersionRow.find('.update')._t('nixps-cloudflow-login.versionupdate', [version.packzflow_rev]);
                }
            } else {
                // if information not found, hide sceleton
                $('.tsw-table tr.packzflow_version').hide();
            }
        }).fail(function() {
            $('.tsw-table tr.version').hide();
        });
    }

    /**
     * @description function runs when user press cancel button, to cancel and remove the input values
     * @param {type} pEvent
     * @param {type} pData
     * @returns {undefined}
     */
    function passwordCancelActionHandler(pEvent){
        // reset input fields
        $('.tsw-table .password.editPanel input').val("");
        // reset messages
        $('.tsw-table .messagePanel .message').html("");
    };

    /**
     * @description function runs when user press the confirm button to chane the pass word
     * @param {type} pEvent
     * @param {type} pData
     * @returns {Deferred|Boolean}
     */
    function passwordChangeActionHandler(pEvent) {
        if (!$.isPlainObject(pEvent.data) || !$.isPlainObject(pEvent.data.user)) {
            throw new Error('a valid user must be inserted in the event data');
        }
        $('.tsw-table .messagePanel').find('.nixps-cloudflow-Password .password_resulttext').removeClass('password_wrong');

        var newPassword = $('.tsw-table .password.editPanel .nixps-cloudflow-Password.newPassword').Password('getValue');
        var confirmPassword = $('.tsw-table .password.editPanel input.confirmPassword').val();
        if (newPassword !== confirmPassword) {
            // remove inputs by running change code
            passwordCancelActionHandler();
            // add error message
            $('.tsw-table .messagePanel .doneMessage.message').html("");
            $('.tsw-table .messagePanel .errorMessage.message')._t("nixps-cloudflow-user_preferences.password.passwordsnotmatch");
            return true;
        }

        $('.tsw-table .password.editPanel .changeAction').prop('disabled', true);

        var passwordComponent = $('.tsw-table .password.editPanel .nixps-cloudflow-Password').Password("isValid", pEvent.data.user.email);
    };

    function passwordCheckedHandler(pEvent, pData) {
        if(pData !== undefined && $.isEmptyObject(pData.result) === false && typeof pData.result.approved === "boolean") {
            if(pData.result.approved) {
                var currentPassword = $('.tsw-table .password.editPanel input.currentPassword').val();
                var newPassword = $('.tsw-table .password.editPanel .nixps-cloudflow-Password.newPassword').Password('getValue');
                var user = $(pEvent.target).data("user");
                if (user === undefined || typeof user._id !== "string" || user._id.length <= 0) {
                    $('.tsw-table .password.editPanel .changeAction').prop('disabled', false);
                    return false;
                }
                return $.Deferred(function(pDefer){
                    // remove inputs by running change code
                    passwordCancelActionHandler();
                    api_async.users.change_password(user._id, currentPassword, newPassword, function(pResult) {
                        pDefer.resolve(pResult);
                    }, function(pError) {
                        if($.isPlainObject(pError) && pError.error_code === "Incorrect password") {
                            // current password is incorrect
                            $('.tsw-table .messagePanel .errorMessage.message')._t("nixps-cloudflow-user_preferences.password.wrongpassword");
                        } else {
                            $('.tsw-table .messagePanel .errorMessage.message')._t("nixps-cloudflow-user_preferences.password.somethingwrong");
                            console.error(pError);
                        }
                        pDefer.reject(pError);
                    });
                }).done(function() {
                    $('.tsw-table .messagePanel .errorMessage.message').html("");
                    $('.tsw-table .messagePanel .doneMessage.message')._t('nixps-cloudflow-user_preferences.password.passwordchanged');
                }).always(function() {
                    $('.tsw-table .password.editPanel .changeAction').prop('disabled', false);
                });
            } else {
                $('.tsw-table .messagePanel').find('.nixps-cloudflow-Password .password_resulttext').addClass('password_wrong');
                // remove inputs by running change code
                passwordCancelActionHandler();
                $('.tsw-table .password.editPanel .changeAction').prop('disabled', false);
            }
        } else {
            console.error("wrong return detected");
            $('.tsw-table .password.editPanel .changeAction').prop('disabled', false);
        }
    };

    function passwordCheckedFailedHandler(pEvent, pData) {
        // remove inputs by running change code
        passwordCancelActionHandler();
        if(pData !== undefined && pData.error !== undefined) {
            $('.tsw-table .messagePanel .errorMessage.message')._t(pData.error);
        }
        $('.tsw-table .password.editPanel .changeAction').prop('disabled', false);
    };

    window.show_user_preferences_pane = function (user) {
        var tabs = $("<div>");
        tabs.addClass('nixps-config-user-preferences');
        tabs.appendTo('body');

        var container = $('<div>');
        container.addClass('panel');
        container.appendTo(tabs);

        var table = $("<table>");
        table.addClass('tsw-table');
        table.appendTo(container);

        // PREFERENCES
        table.append("<tr class='ws_entry'>"+
                          "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-user_preferences.localization.title') + "</td>"+
                          "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                          "<td></td>" +
                        "</tr>");
        table.append("<tr>"+
                        "<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
                        "<td width='*' class='name' >" + $.i18n._("nixps-cloudflow-user_preferences.localization.language").toUpperCase() + "</td>"+
                        "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                        "<td class='description'><div class='languageSelector'></td>" +
                    "</tr>");

        table.find('.languageSelector').TranslatedLanguagesSelector();

        // METADATA
        table.append("<tr class='ws_entry'>"+
                        "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-user_preferences.units.title') + "</td>"+
                        "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                        "<td></td>" +
                "</tr>");


        var unitPreferences = new nixps.cloudflow.UnitPreferences();
        var definitions = unitPreferences.getDefinitions();

        var lengthUnitSelector = $('<select>');
        lengthUnitSelector.css({
            width: 75
        });
        var lengthUnits = (new nixps.cloudflow.KnownUnits()).getLengthUnits();
        for(var i = 0; i < lengthUnits.length; i++) {
            var unit = lengthUnits[i];
            lengthUnitSelector.append($("<option>").attr('value', unit)._t('nixps-units.length.display-' + unit));
        }

        var resolutionUnitSelector = $('<select>');
        resolutionUnitSelector.css({
            width: 75
        });
        var resolutionUnits = (new nixps.cloudflow.KnownUnits()).getResolutionUnits();
        for(var i = 0; i < resolutionUnits.length; i++) {
            var unit = resolutionUnits[i];
            resolutionUnitSelector.append($("<option>").attr('value', unit)._t('nixps-units.resolution.display-' + unit));
        }

        var rulingUnitSelector = $('<select>');
        rulingUnitSelector.css({
            width: 75
        });
        var rulingUnits = (new nixps.cloudflow.KnownUnits()).getRulingUnits();
        for(var i = 0; i < rulingUnits.length; i++) {
            var unit = rulingUnits[i];
            rulingUnitSelector.append($("<option>").attr('value', unit)._t('nixps-units.ruling.display-' + unit));
        }


        var scalingUnitsSelector = $('<select>');
        scalingUnitsSelector.css({
            width: 75
        });
        var scalingUnits = (new nixps.cloudflow.KnownUnits()).getScalingUnits();
        for(var i = 0; i < scalingUnits.length; i++) {
            var unit = scalingUnits[i];
            if (unit.length === 0) {
                scalingUnitsSelector.append($("<option>").attr('value', unit).text(''));
            } else {
                scalingUnitsSelector.append($("<option>").attr('value', unit)._t('nixps-units.distortion.display-' + unit));
            }
        }


        var accuracy = $('<div>').css({
            display: 'inline-block',
            'margin-left': 50
        });
        accuracy.append($('<label>').css({
            'text-align': 'right'
        })._t('nixps-cloudflow-user_preferences.units.precision').append(':'));
        accuracy.append($('<input>').attr('type', 'number').css({
            'width': 50
        }));


        for(var i = 0; i < definitions.length; i++) {
            var definition = definitions[i];
            var selector = lengthUnitSelector.clone();
            if (definition === "resolution") {
                selector = resolutionUnitSelector.clone();
            }
            if (definition === "ruling") {
                selector = rulingUnitSelector.clone();
            }
            if (definition === "distortion" || definition === "scaling") {
                selector = scalingUnitsSelector.clone();
            }

            var unit = unitPreferences.getDefinition(definition);

            selector.attr("definition", definition);
            selector.val(unit.getShortName());
            var row = $("<tr class='unitdefinition'>"+
                "<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
                "<td width='*' class='name'>" + $.i18n._('nixps-cloudflow-user_preferences.units.' + definition).toUpperCase() + "</td>"+
                "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                "<td class='description'></td>" +
            "</tr>");
            row.find('.description').append(selector);

            var accuracyInput = accuracy.clone();
            accuracyInput.find('input').attr('name', definition);
            accuracyInput.find('input').val(unit.getAccuracy());

            row.find('.description').append(accuracyInput);
            table.append(row);
        }

        // CFClient filestore mappings
        table.append("<tr class='ws_entry cfclient-filestore-mappings-title' style='display: none;'>"+
                        "<td colspan='4' class='header'>" + $.i18n._('nixps-cloudflow-user_preferences.cfclient.filestoremappings') + "</td>"+
                          "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                          "<td></td>" +
                        "</tr>");
        table.append("<tr class='ws_entry cfclient-filestore-mappings' style='display: none;'>" +
                        "<td></td>"+
                        "<td colspan='2'>" + $.i18n._('nixps-cloudflow-user_preferences.cfclient_filestore_mapping.filestore_name_title') + "</td>" +
                        "<td class='description'>" + $.i18n._('nixps-cloudflow-user_preferences.cfclient_filestore_mapping.filestore_path_title') + "</td>" +
                        "</tr>");


        // PASSWORD
        if (user.isUsingActiveDirectory() === false) { // only show edit password if user is not using active directory
            table.append("<tr class='ws_entry password'>"+
                              "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-user_preferences.password.title') + "</td>"+
                              "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                              "<td></td>" +
                            "</tr>");

            table.append("<tr class='password editPanel'>  <td width='35px'></td>"+
                            "<td colspan='3' >" +
                              "<div class='editrow'><label class='currentPassword'>"+ $.i18n._('nixps-cloudflow-user_preferences.password.currentpassword') +"</label> <input class='currentPassword' type='password' /> </div>"+
                              "<div class='editrow'><label class='newPassword'>" + $.i18n._('nixps-cloudflow-user_preferences.password.newpassword') + "</label> <div class='newPassword'/></div> </div>"+
                              "<div class='editrow'><label class='confirmPassword'>"+ $.i18n._('nixps-cloudflow-user_preferences.password.confirmpassword') +"</label> <input class='confirmPassword' type='password' /> </div>"+
                            "<div class='messagePanel'>"+
                               "<span class='errorMessage message'></span><span class='doneMessage message'></span>"+
                            "</div>" +
                               "<div class='password actionPanel'>"+
                               "<button class='changeAction colored-button' disabled>"+ $.i18n._('nixps-cloudflow-user_preferences.password.changeaction') +"</button><button class='cancelAction'>"+ $.i18n._('nixps-cloudflow-user_preferences.password.cancelaction') +"</button>"+
                            "</div>" +
                            "</td>" +
                        "</tr>");

            table.find('div.newPassword').Password({
                checked: passwordCheckedHandler,
                checkedfailed: passwordCheckedFailedHandler
            }).data("user", user.getUserObject());

            table.find('div.newPassword, div.confirmPassword').on("change blur input", function(pEvent){
                var value = $(pEvent.target).closest("input").val();
                if (typeof value !== "string" || value.length <= 0) {
                    $('.tsw-table .password.actionPanel button.changeAction').prop("disabled", true);
                } else {
                    $('.tsw-table .password.actionPanel button.changeAction').prop("disabled", false);
                }
            });
            $('.tsw-table .password.actionPanel .cancelAction').on('click', passwordCancelActionHandler);
            $('.tsw-table .password.actionPanel .changeAction').on('click', {'user': user.getUserObject()}, passwordChangeActionHandler);
        }
        // VERSION
        table.append("<tr class='ws_entry version'>"+
                          "<td colspan='2' class='header'>" + $.i18n._('nixps-cloudflow-user_preferences.version.title') + "</td>"+
                          "<td class='running'><img src='portal/images/empty.png' height='26'/></td>"+
                          "<td></td>" +
                        "</tr>");

        table.append("<tr class='version'>"+
                        "<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
                        "<td colspan='1' class='name'>" +  $.i18n._('nixps-cloudflow-user_preferences.version.cloudflow_title').toUpperCase() + "</td>" +
                        "<td colspan='2' ><span class='versionnumber'></span> <span class='update'></span> </td>"+
                    "</tr>");

        table.append("<tr class='packzflow_version'>"+
                        "<td width='35px'><img src='portal/images/config_worker.svg'/></td>"+
                        "<td colspan='1' class='name'>" +  $.i18n._('nixps-cloudflow-user_preferences.version.packzflow_title').toUpperCase() + "</td>" +
                        "<td colspan='2' ><span class='versionnumber'></span> <span class='update'></span> </td>"+
                    "</tr>");

        setUIVersion();

        $('.tsw-table').find('select,input').on('change', function() {
            savePreferences();
        });

        reloadPreferences();
    };

})();
