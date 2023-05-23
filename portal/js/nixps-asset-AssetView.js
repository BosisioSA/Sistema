/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 *
 *   created by guillaume on Oct 7, 2016 9:01:55 AM
 */
/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */

(function ($) {
    // generic
    require("../../common/DropdownList/js/nixps-DropdownList.js");
    require("../../common/js/nixps-common-ServerQueryEditor.js");
    require("../../common/DynamicList/js/nixps-DynamicList.js");
    require("../../cloudflow/CloudflowQueryBuilder/js/nixps-cloudflow-CloudflowQueryManager.js");
    require("../../cloudflow/CloudflowQueryBuilder/js/nixps-cloudflow-CloudflowQueryBuilder.js");
    require("../../cloudflow/CloudflowQueryBuilder/js/nixps-cloudflow-CloudflowQueryPanel.js");

    require("./nixps-asset-AssetActionList.js");
    require("./nixps-asset-AssetHeader.js");
    require("./nixps-asset-AssetPreview.js");
    require("./nixps-asset-BookView.js");
    require("./nixps-asset-BreadCrumb.js");
    require("./nixps-asset-CompareLoader.js");
    require("./nixps-asset-MetadataView.js");
    require("./nixps-asset-RunningActionList.js");
    require("./nixps-asset-RunningActionListButton.js");
    require("../../cloudflow/IconView/js/nixps-cloudflow-IconView.js");
    require("../../cloudflow/IconView/js/nixps-cloudflow-ReaderView.js");
    require("../../cloudflow/ListView/js/nixps-cloudflow-ListView.js");
    require("../../cloudflow/FolderView/js/nixps-cloudflow-FolderView-main.js");
    require("../../cloudflow/KioskDialog/js/KioskDialog.js");

    var License = require("../../cloudflow/License/js/License.js");
    var User = require("../../cloudflow/User/js/User.js");
    var Sites = require("../../cloudflow/Sites/js/Sites.js");

    var kWhitepapername = 'JobticketLink';
    var kInputName = 'Input Name';

    function isStackView (pData) {
        return (pData.mime_types !== undefined) &&
                (pData.mime_types.indexOf("image/tiff") >= 0 || pData.mime_types.indexOf("image/vnd.esko.plateprep") >= 0 || pData.mime_types.indexOf("application/vnd.nixps.dominobmp") >= 0)  &&
                ('metadata' in pData === true && 'output_color_space' in pData.metadata === true && 'colorants' in pData.metadata.output_color_space === true && pData.metadata.output_color_space.colorants.length <= 1);
    }

    /**
     * @namespace nixps-asset-AssetView
     * @description The general view of the assets
     */
    $.widget("nixps-asset.AssetView", $.Widget, {
        widgetEventPrefix: "assetview",
        options: {
            /**
             * @name nixps-asset.AssetView#language
             * @description The language of the user
             * @type {String}
             * @default "en"
             */
            language: "en",

            /**
             * @name nixps-asset.AssetView#url
             * @description The url of the folder/file you want to see
             * @type {string}
             * @default ""
             */
            url: "",

            /**
             * @name nixps-asset.AssetView#sub
             * @description The sub of the folder/file you want to see
             * @type {string}
             * @default ""
             */
            sub: "",

            /**
             * @name nixps-asset.AssetView#site
             * @description The site of the current session. If "" then it means all sites, if null it means only localy, if the name of the site, it will go to that site
             * @type {string}
             * @default ""
             */
            site: "",

            /**
             * @name nixps-asset.AssetView#currentSite
             * @description The current site name of the local site
             * @type {string}
             * @default undefined
             */
            currentSite: undefined,

            /**
             * @name nixps-asset.AssetView#enableGoBackBrowsing
             * @description If you browse throug the files and folders, must you go back to previous place when pressing the go back button?
             * @type {boolean}
             * @default true
             */
            enableGoBackBrowsing: true,

            /**
             * @name nixps-asset.AssetView#enableUpload
             * @description must we enable uploading? set on true, we will still look to the permissions of the user
             * @type {boolean}
             * @default true
             */
            enableUpload: true,

            /**
             * @name nixps-asset.AssetView#licenseObject
             * @description Get the lincense object, json representations of the license. to speed up the code
             * @type {Object}
             * @default null
             * @private
             */
            licenseObject: null,

            /**
             * @name nixps-asset.AssetView#userObject
             * @description Get the user object, json representations of the user. to speed up the code
             * @type {Object}
             * @default null
             * @private
             */
            userObject: null,

            /**
             * @name nixps-asset.AssetView#sitesObject
             * @description Get the sites object, json representations of the sites. to speed up the code
             * @type {Object}
             * @default null
             * @private
             */
            sitesObject: null,

            /**
             * @description with folders must you see as root
             * @type {array}
             * @default []
             */
            rootFolders: [],

            /**
             * @description with files want you see in the root
             * @type {array}
             * @default []
             */
            rootFiles: [],

            /**
             * @description the title we must give to the root and job details
             * @type {string}
             * @default ""
             */
            rootFoldersAndFilesTitle: "",

            /**
             * @description the icon we can give to the root and job details
             * @type {string}
             * @default ""
             */
            rootFoldersAndFilesIcon: "",

            mode: "default",

            compareProofscopeInfo: {},

            /**
             * @name nixps-asset.AssetView#startUpOptions
             * @description Give all the options needed to start up.
             * <ol>
             * <li> openMode: how must we open (only "book" is supported) by urlparameter: open_mode=book</li>
             * <li> searchString: the search string we must search on by urlparameter: search=test </li>
             * <li> view: the view to open, icon or list view=icon </li>
             * <li> sortingColumn: how must we sort the columns</li>
             * </ol>
             * @type {Object}
             * @default {}
             */
            startUpOptions: { openMode: "", searchString: "", view: "", sortingColumn:[] }
        },
        /**
         * @description create the component
         * @name nixps-asset.AssetView#_create
         * @function
         * @private
         * @returns {undefined}
         */
        _create: function () {
            this._controlOptions();
            this.element.addClass(this.widgetFullName);

            // Properties
            this.m_selectedFiles = []; // all the information about the selected files, array of objects
            this.m_approvalIDs = []; // array of strings
            this.lock = false; // must we lock the fiel of folder?
            this.timerBlockID; // timer id of blocking refresh loop
            this.readersViewPossible = false;
            this.fileView; // are we viewing a file or a folder
            this.folderViewMode; // in which mode is the folder?
            this.sites; // the object to get all info of sites
            this.extraCustomButtons = []; // extra custom buttons on the header
            this._savePreferencesFunction = _.throttle(this._savePreferences, 500, {leading: false});
            this.lastSearchQuery = []; // the last query fo user seraching
            this.kRootQuery = []; // query applied to get the root of the system
            if (this.options.rootFolders.length > 0 || this.options.rootFiles.length > 0) {
                this.kRootQuery = ["cloudflow.folder", "in", this.options.rootFolders, "or", "cloudflow.file", "in", this.options.rootFiles];
            }

            this._draw();

            this.hasProofscopeLicense = false;
            this.hasProofscope3DLicense = false;
            this.enablePageBuilder = false;
            this.user; // curent user
            this.m_preferences;
            var licenseDef;
            var userDef;
            var sitesDef;
            if (this.options.licenseObject === null) {
                licenseDef = License.get();
            } else {
                licenseDef = License.fromJSON(this.options.licenseObject);
            }
            if (this.options.userObject === null) {
                userDef = User.get();
            } else {
                userDef = User.fromJSON(this.options.userObject);
            }
            if (this.options.sitesObject === null) {
                sitesDef = Sites.get();
            } else {
                sitesDef = Sites.fromJSON(this.options.sitesObject);
            }
            var that = this;
            $.when(licenseDef, userDef, this._getPreferences(), sitesDef).done(function (license_values, pUser, pPreferences, pSites) {
                // set licenses
                that.hasProofscopeLicense = license_values.check('proofscope');
                that.hasProofscope3DLicense = license_values.check('proofscope3d');

                that.isCFClient = false;
                that.enablePageBuilder = (pPreferences.pagebuilder_editbutton === true);
                CFClient.isCFClient().then(function(pIsCfClient) {
                    that.isCFClient = pIsCfClient;
                    $('.asset-actions > [data-action=openinfinder]').show();
                });

                // set user
                that.user = pUser;
                that.m_folder_div.FolderView('initPreferences', $.extend(true, {}, pPreferences));
                // remove system preferences
                delete that.m_preferences.assetLimit;

                // set permissions
                var mayDownload = that.user.hasPermission("MAY_UPLOAD");
                var mayManage = that.user.hasPermission("MANAGE_ASSETS");
                var selection = (pPreferences.select_when_browsing === true);
                if (mayDownload || mayManage || selection) {
                    // all setting are default on false
                    that.m_folder_div.FolderView('option', {
                        enableDownload: mayDownload,
                        enableDragging: mayManage,
                        enableSelecting: selection
                    });
                }
                var actionButtons = [];
                var buttonManageToggle = mayManage ? "show" : "hide";
                var buttonDownloadToggle = mayDownload ? "show" : "hide";

                actionButtons.push({name: "assetaction_download", file: buttonDownloadToggle, folder: "hide", filestore: "hide"});
                actionButtons.push({name: "assetaction_addfolder", file: "hide", folder: buttonManageToggle, filestore: buttonManageToggle});
                if (that.user.hasAdminPermissions() && that.enablePageBuilder === true) {
                    actionButtons.push({name: "assetaction_createwebpage", file: "hide", folder: buttonManageToggle, filestore: buttonManageToggle});
                } else {
                    actionButtons.push({name: "assetaction_createwebpage", file: "hide", folder: "hide", filestore: "hide"});
                }
                actionButtons = actionButtons.concat([
                            {name: "assetaction_rename", file: buttonManageToggle, folder: "hide", filestore: "hide"},
                            {name: "assetaction_delete", file: buttonManageToggle, folder: buttonManageToggle, filestore: "hide"},
                            {name: "assetaction_cut", file: buttonManageToggle, folder: buttonManageToggle, filestore: "hide"},
                            {name: "assetaction_copy", file: function(pURL){ 
                                if (buttonManageToggle == "hide") {
                                    return buttonManageToggle;
                                }
                                if (String.prototype.endsWith !== undefined && pURL.endsWith(".html")) {
                                    return "hide";
                                }
                                return "show";
                            }, folder: buttonManageToggle, filestore: "hide"},
                            {name: "assetaction_paste", file: (mayManage ? "disable" : "hide"), folder: function() {
                                    if (mayManage === false) {
                                        return "hide";
                                    }
                                    if (this.isClipBoardEmpty()) {
                                        return "disable";
                                    } else {
                                        return "enable";
                                    }
                            }, filestore: "hide"}
                        ]);
                that.fileActionDropdown.AssetActionList('option', 'buttons', actionButtons);
                that.fileActionContextMenu.AssetActionList('option', 'buttons', actionButtons);

                // update header
                that.element.children('.nixps-asset-AssetHeader').AssetHeader("option", {
                    "enableDownload": mayDownload,
                    "searchOnTyping": (that.m_preferences.searchOnTyping !== undefined) ? that.m_preferences.searchOnTyping : true   
                });

                // update sites
                that.sites = pSites;

                // preferences are already set by _getPreferences function
                // update this market...
                if (typeof that.options.url === "string") {
                    if (that.options.enableGoBackBrowsing === true) {
                        // this is only running if we start the session
                        // make a start point to handle the history, so replace the history state to have a start point
                        var l_url = window.location.protocol + "//" + window.location.host + "?asset=" + encodeURIComponent(that.options.url);
                        if (typeof that.options.sub === "string" && that.options.sub.length > 0) {
                            l_url += "&sub=" + that.options.sub;
                        }
                        if (typeof that.options.startUpOptions.searchString === "string" && that.options.startUpOptions.searchString.length > 0) {
                            l_url += "&search=" + that.options.startUpOptions.searchString;
                        }
                        history.replaceState({url: that.options.url, sub: that.options.sub, site: that.options.site}, '', l_url);
                    }
                    that.update(that.options.url, that.options.sub, that.options.site, true);
                }

                if (typeof that.options.startUpOptions.searchString === "string" && that.options.startUpOptions.searchString.length > 0) {
                    that.element.children('.nixps-asset-AssetHeader').AssetHeader('searchOnString', that.options.startUpOptions.searchString);
                }
            }).fail(function(pError) {
                console.error(pError);
            });

            this._on(this.element, {
                'assetheaderactionviewer': this._clickViewButtonHandler,
                'approvalviewchanged': this._approvalviewChangedHandler,
                'metadataviewapprovalfired': this._approvalviewChangedHandler,
                "folderviewopen": this._folderviewOpenHandler,
                "folderviewaction": this._folderviewActionHandler,
                "folderviewviewchange": this._folderviewChangeHandler,
                "folderviewviewpossibility": this._folderviewPossibilityHandler,
                "folderviewselect": this._folderviewSelectHandler,
                "folderviewsearch": this._folderviewSearchHandler,
                "folderviewchangepreferences": this._folderviewChangePrefHandler,
                "folderviewcontextmenu": this._folderviewContextMenuHandler,
                "assetactionlistrenamed": this._renamedHandler,
                "assetactionlistadded": this._addedHandler,
                "assetactionlistdeleted": this._deletedHandler,
                "assetactionlistmoved": this._updatefileactionHandler,
                "assetactionlistcopied": this._updatefileactionHandler,
                "folderviewdroppedasset": this._dropfileactionHandler,
                "assetactionlistneeddummy": this._needdummyfileactionHandler,
                "assetactionlistremovedummy": this._removedummyfileactionHandler,
                "metadataviewopen": this._metadataOpenHandler,

                "assetheaderactionopenfolderinos": this._showFolderInOsHandler,
                "assetheaderactionshowfileinos": this._showFileInOsHandler,
                "assetheaderactionopenfilewithpackz": this._openFileWithPackzHandler
            });
        },

        _showFolderInOsHandler: function (pEvent, pData) {
            api_defer.frame.os.get().then(function () {
                return api_defer.frame.os.open_folder_in_os(pData.url);
            }).fail(function (error) {
                $('#notify-area').notify("create", "closeable-error", {
                    title: $.i18n._('nixps-cloudflow-assets.title_frame_error_dialog_open_folder', [pData.url]),
                    text: $.i18n._("nixps-cloudflow-assets.frame_error_message", [JSON.stringify(error, null, 2)])
                });
            });
        },

        _showFileInOsHandler: function (pEvent, pData) {
            api_defer.frame.os.get().then(function () {
                return api_defer.frame.os.reveal_file_in_os(pData.url);
            }).fail(function (error) {
                $('#notify-area').notify("create", "closeable-error", {
                    title: $.i18n._('nixps-cloudflow-assets.title_frame_error_dialog_show_file', [pData.url]),
                    text: $.i18n._("nixps-cloudflow-assets.frame_error_message", [JSON.stringify(error, null, 2)])
                });
            });
        },

        _openFileWithPackzHandler: function (pEvent, pData) {
            api_defer.frame.os.get().then(function () {
                return api_defer.frame.os.open_file_in_application(pData.url, 'PACKZ');
            }).fail(function (error) {
                $('#notify-area').notify("create", "closeable-error", {
                    title: $.i18n._('nixps-cloudflow-assets.title_frame_error_dialog_open_packz', [pData.url]),
                    text: $.i18n._("nixps-cloudflow-assets.frame_error_message", [JSON.stringify(error, null, 2)])
                });
            });
        },

        /**
         * @description draws the dialog according to the current state
         * @function
         * @private
         * @name nixps-asset.AssetView#_draw
         * @return {undefined}
         */
        _draw: function () {
            var that = this;
            // create FreezeOverlay
            this.freezeOverlay = $('<div>').addClass('assetview_freezeOverlay');
            this.element.append(this.freezeOverlay);

            // Divs
            var header = $("<div>").AssetHeader({
                url: this.options.url,
                sub: this.options.sub,
                update: function (pEvent, pData) {
                    that.update(pData.url, pData.sub, that.options.site);
                },
                search: function (pEvent, pData) {
                    var searchQuery = pData.searchquery;
                    that.lastSearchQuery = searchQuery;
                    // if we are searching, force to search in the rootFolders and files
                    if (that.options.rootFolders.length > 0 || that.options.rootFiles.length > 0) {
                        if (searchQuery.length === 0) {
                            // if no extra search, just show rootFolders and rootFiles
                            searchQuery = that.kRootQuery;
                        } else {
                            // we are searching
                            searchQuery.push("and", "(");
                            // add rootFolders as enclosing folders to search query
                            if (that.options.rootFolders.length > 0) {
                                for (var i = 0; i < that.options.rootFolders.length; i++) {
                                    searchQuery.push("cloudflow.enclosing_folder", "begins with", that.options.rootFolders[i], "or");
                                }
                                searchQuery.pop(); // remove last "or"
                            } else {
                                // disable folders, we should not show folders!
                                searchQuery.push("cloudflow.folder", "does not exist");
                            }
                            // or it must contian the rootFiles
                            if (that.options.rootFiles.length > 0) {
                                searchQuery.push('or', "cloudflow.file", "in", that.options.rootFiles);
                            } // close extra searchQuery
                            searchQuery.push(")");
                        }
                    }
                    that.m_folder_div.show().FolderView("option", {"cf_url": that.options.url, "search_query": searchQuery});
                },
                changesearchmode: function(pEvent, pData) {
                    if (pData !== undefined && pData.searchOnTyping !== undefined) {
                        that.m_preferences.searchOnTyping = pData.searchOnTyping;
                        that._savePreferencesFunction();
                    }
                },
                actionreplace: function (pEvent, pData) {
                    if (that.lock === false) {
                        that.element.find(".asset-files-replace").click();
                    }
                },
                actionupload: function (pEvent, pData) {
                    if (that.lock === false) {
                        that.element.find(".asset-files").click();
                    }
                },
                actionopeninfinder: function (pEvent, pData) {
                    // function runs when user want to open the folder in finder
                    var button = $(pEvent.originalEvent.target);
                    button.prop('disabled', true);
                    CFClient.openInFinder(that.options.url).always(function(){
                        button.prop('disabled', false);
                    });
                },
                actionresetmetadata: function(pEvent) {
                    api_async.assets.reset_metadata(that.options.url, function (data) {
                        that._removeButton("resetmetadata");
                    }, function(pError) { console.error(pError); });
                },
                actionresetthumb: function(pEvent) {
                    api_async.assets.reset_thumb(that.options.url, function (data) {
                        that._removeButton("resetthumb");
                    }, function(pError) { console.error(pError); });
                },
                actionresetrender: function(pEvent) {
                    api_async.proofscope.request_rerender_by_url(that.options.url, function (data) {
                        that._removeButton("resetrender");
                    }, function(pError) { console.error(pError); });
                },
                actionapproval: function () {
                    that.element.find('.assetview_metadataview.nixps-asset-MetadataView').MetadataView('selectTab', "#tabs-approval");
                },
                actioniconview: function (pEvent, pData) {
                    that.folderViewMode = 'icon';
                    that.resetButtons();
                    that.m_folder_div.FolderView("option", "view", "icon");
                    that.element.removeClass("assetview_detailsview").children(".assetpreview.nixps-asset-AssetPreview:visible").AssetPreview("close");
                    that._closeAssetWorkFlow();
                    that._savePreferencesFunction();
                },
                actionlistview: function (pEvent) {
                    that.folderViewMode = 'list';
                    that.resetButtons();
                    that.m_folder_div.FolderView("option", "view", "list");
                    that._closeAssetWorkFlow();
                    that._savePreferencesFunction();
                },
                actionreaderview: function (pEvent) {
                    that.folderViewMode = 'reader';
                    that.resetButtons();
                    that.m_folder_div.FolderView("option", { "lockFolder": that.lock, "view": "reader"});
                    that._closeAssetWorkFlow();
                    that._savePreferencesFunction();
                },
                actionviewbook: function () {
                    that._openBook();
                },
                actioncompare: function (pEvent, pData) {
                    if (that.options.mode === "compareView") {
                        // actual forward to compare
                        if (that.options.enableGoBackBrowsing === true && typeof that.options.compareProofscopeInfo.url === "string" && that.options.compareProofscopeInfo.url.length > 0) {
                            var fileA_Url = window.location.protocol + "//" + window.location.host + '?asset=' +  encodeURIComponent(that.options.compareProofscopeInfo.url);
                            history.pushState({ url: fileA_Url, site: that.options.site}, '', fileA_Url);
                        }

                        if(that.options.mode === "compareView" && typeof that.options.compareProofscopeInfo.proofscopePart === "string" && that.options.compareProofscopeInfo.proofscopePart.length > 0) {
                            var differenceViewOptions = {
                                viewer : "Difference",
                                viewer_parameters : {
                                    aView : that.options.compareProofscopeInfo.proofscopeView,
                                    bView : that._calcProofscopeInfo(that.assetData).proofscopeView
                                }
                            };
                            api_async.proofscope.create_view_file_url_with_options("", that.options.compareProofscopeInfo.proofscopePart, differenceViewOptions, function(p_data) {
                                if (typeof p_data.url === "string" && p_data.url.length > 0) {
                                    window.location = p_data.url + "&topbar=true";
                                } else {
                                    console.error('return url is not a string');
                                }
                            }, console.error);
                        }
                    } else if(that.options.mode === "default") {
                        var mode = 'compareView';

                        that.element.find('.asset-properties').hide();
                        that.element.find('.assetview_compareloader').CompareLoader({
                            language: that.options.language,
                            url: that.options.url,
                            site: that.options.site,
                            currentSite: that.options.currentSite,
                            rootFolders: that.options.rootFolders,
                            rootFiles: that.options.rootFiles,
                            rootFoldersAndFilesTitle: that.options.rootFoldersAndFilesTitle,
                            rootFoldersAndFilesIcon: that.options.rootFoldersAndFilesIcon,
                            enableGoBackBrowsing: false,
                            enableUpload: that.options.enableUpload,
                            licenseObject: that.options.licenseObject,
                            userObject: that.options.userObject,
                            sitesObject: that.options.sitesrObject,
                            mode: mode,
                            proofscopeInfo: that._calcProofscopeInfo(that.assetData)
                        });
                        that.element.children('.nixps-asset-AssetHeader').AssetHeader('option', 'buttons', []);
                    }
                },
                actionstackviewer: function (pEvent, pData) {
                    api_async.proofscope.create_view_file_url_with_options("", that.assetData.cloudflow.part, {viewer: "Stack"}, function (pDataCreateView) {
                        window.location = pDataCreateView.url + "&topbar=true";
                    }, function (pError) {
                        console.error(pError);
                    });
                },
                actionstackcompare: function (pEvent, pData) {
                    that.element.find('.asset-properties').hide();
                    that.element.find('.assetview_compareloader').CompareLoader({
                        language: that.options.language,
                        url: that.options.url,
                        site: that.options.site,
                        currentSite: that.options.currentSite,
                        rootFolders: that.options.rootFolders,
                        rootFiles: that.options.rootFiles,
                        rootFoldersAndFilesTitle: that.options.rootFoldersAndFilesTitle,
                        rootFoldersAndFilesIcon: that.options.rootFoldersAndFilesIcon,
                        enableGoBackBrowsing: false,
                        enableUpload: that.options.enableUpload,
                        licenseObject: that.options.licenseObject,
                        userObject: that.options.userObject,
                        sitesObject: that.options.sitesrObject,
                        mode: "compareView",
                        proofscopeInfo: that._calcProofscopeInfo(that.assetData)
                    });
                    that.element.children('.nixps-asset-AssetHeader').AssetHeader('option', 'buttons', []);
                },
                actioneditpage: function (pEvent, pData) {
                    window.location = "/pagebuilder/pagebuilder.html?url=" + encodeURI(encodeURIComponent(that.options.url));
                },
                actionrunworkflow: function (pEvent, pData) {
                    /* hide when clicked on*/
                    that.freezeOverlay.FreezeOverlay({text: ""}).css({top: 320}).FreezeOverlay('show');
                    that.extraCustomButtons = [];
                    that.resetButtons();
                    that._removeButton('orderbyactions');
                    that.assetWorkflow.KioskDialog('startAndOpen', kWhitepapername, kInputName, [that.options.url], {}).done(function () {
                        that.assetWorkflow.show();
                        that.m_folder_div.hide();
                    });
                }
            }).show();
            this.element.append(header);

            // Create the bottom-div
            var compareLoader = $("<div class='asset-properties assetview_compareloader'/>").hide();
            this.element.append(compareLoader);

            // create bookshelf
            this.bookShelf = $('<div>').addClass('bookTable').hide();
            this.element.append(this.bookShelf);

            // create workflow panel
            this.assetWorkflow = $('<div>').addClass('assetWorkflow bootstrap').hide();
            this.element.append(this.assetWorkflow);

            var metadataView = $("<div class='asset-properties assetview_metadataview'/>").hide();
            this.element.append(metadataView);

            this.m_folder_div = $("<div class='folder-view'>");
            this.element.append(this.m_folder_div);
            this.m_folder_div.FolderView({
                enableSelecting: false,
                enableMultipleSelection: false,
                enableContextMenu: true,
                initOrderBy: this.options.startUpOptions.sortingColumn
            }).hide();

            this.element.append("<input class='asset-files' type='file' name='files[]' data-url='/portal.cgi' style='display:none' multiple>" +
                    "	<input class='asset-files-replace' type='file' name='files[]' style='display:none'>");
            this._initFileUploading();

            this.folderActionDropDown = this._makeFolderActionList();
            this.orderByDropDown = this._makeOrderByList();
            this.fileActionDropdown = $('<span>').addClass('asset-fileActionList').attr('dropdown', 'dropdown').AssetActionList({url: this.options.url, freezeOverlayElement: this.freezeOverlay, site: this._getCurrentSiteName()});
            this.fileActionContextMenu = $('<span>').AssetActionList({url: this.options.url, site: this._getCurrentSiteName(), inContextmenu: true});
            this.element.append(this.fileActionContextMenu);
            this._makeAssetWorkFlow();
            this.element.append($('<div>').addClass('assetpreview'));
        },

        /**
         * @description Get the name of the current site
         * @function
         * @private
         * @returns {String}
         */
        _getCurrentSiteName: function() {
            if (this.options.site === "") {
                return this.options.currentSite;
            }
            return this.options.site;
        },

        /**
         * @name nixps-asset.AssetView#resetButtons
         * @description remove all buttons and decide which button we must show
         * @function
         * @returns {undefined}
         */
        resetButtons: function() {
            var buttons = [];
            if (this.fileView === 'folder') {
                buttons = buttons.concat(this._createFolderViewButtons());
                if (this.lock === false && this.options.url !== "" && this.options.url !== "cloudflow://" && this.options.enableUpload && this.user.hasPermission('MAY_UPLOAD')) {
                    buttons.push({action:'upload', class: "asset-upload", html: $.i18n._('nixps-cloudflow-assets.action-upload_file') + '…'});
                }
                if (this.readersViewPossible === true) {
                    buttons.push({action:'viewbook', label: 'nixps-cloudflow-assets.action-view_book'});
                }
                if (this.folderViewMode  === 'reader') {
                    this._updateFolderActionList(this.folderActionDropDown);
                    buttons.push({action: 'folderactions', content: this.folderActionDropDown, dropdown: true, externalLinked: true});
                } else if (this.folderViewMode === 'icon' && this.options.url.length > 0) {
                    this._updateOrderByList(this.orderByDropDown);
                    buttons.push({action: 'orderbyactions', content: this.orderByDropDown, dropdown: true, externalLinked: true});
                }
                if (this.options.url !== "") {
                    // Open folder in CFClient, should be hidden in the browser
                    buttons.push({action:'openinfinder', label: 'nixps-cloudflow-assets.action-openinfinder'});

                    buttons.push({
                        action: 'openfolderinos',
                        class: "asset-showFolderInOs frame-os-feature-inline-block",
                        label: 'nixps-cloudflow-assets.show_folder_in_os'
                    });

                }

                // control permission
                if (this.user.hasPermission('MANAGE_ASSETS') && this.options.url !== "") {
                    this.fileActionDropdown.AssetActionList('option', {url : this.options.url});
                    buttons.push({action: 'fileactions', content: this.fileActionDropdown, dropdown: true, externalLinked: true});
                }
                if (this.options.site !== "") {
                    buttons = buttons.concat(this.extraCustomButtons);
                }
            } else {
                if (this.user.hasPermission("MAY_UPLOAD") && this.lock === false && this.options.sub.length <= 0) {
                    buttons.push({action: 'replace', class: "asset-replace", html: $.i18n._("nixps-cloudflow-assets.action-replace_file") + '…'});
                }

                var approvalButton = this._createApprovalButton(this.assetData);
                if (approvalButton !== undefined) {
                    buttons.push(approvalButton);
                }

                buttons.push({
                    action: 'showfileinos',
                    class: "asset-showFileInOs frame-os-feature-inline-block",
                    label: 'nixps-cloudflow-assets.show_file_in_os'
                });
                buttons.push({
                    action: 'openfilewithpackz',
                    class: "asset-openFileWithPackz frame-packz-app-feature-inline-block",
                    label: 'nixps-cloudflow-assets.open_file_with_packz'
                });

                var assetViewButton = this._createAssetViewButtons(this.assetData);
                if (assetViewButton !== undefined) {
                    buttons.push(assetViewButton);
                }
                var resetButtons = this._createResetButtons(this.assetData);
                if (resetButtons !== undefined) {
                    buttons.push(resetButtons);
                }
                // control permission
                if (this.user.hasPermission('MANAGE_ASSETS') && this.lock === false) {
                    this.fileActionDropdown.AssetActionList('option', {url : this.options.url});
                    buttons.push({action: 'fileactions', content: this.fileActionDropdown, dropdown: true, externalLinked: true});
                }
                if (this.user.hasAdminPermissions() && this.lock === false) {
                    if((this.assetData.filetype === "text/html" ||
                        this.assetData.filetype === "application/json" ||
                        this.assetData.file_extension === ".js" ||
                        this.assetData.file_extension === ".md" ||
                        this.assetData.filetype === "text/plain" ||
                        this.assetData.filetype === "application/x-xliff+xml" ||
                        this.assetData.file_extension === ".css") && this.enablePageBuilder === true) {
                        buttons.push({action: 'editpage', label: 'nixps-cloudflow-assets.action-editpage'});
                    }
                }
                buttons = buttons.concat(this.extraCustomButtons);
                var compareButtons = this._createCompareButtons(this.assetData);
                if (compareButtons !== undefined) {
                    buttons.push(compareButtons);
                }
            }
            this.element.children('.nixps-asset-AssetHeader').AssetHeader('option', 'buttons', buttons);

            if (this.isCFClient !== true) {
                $('.asset-actions > [data-action=openinfinder]').hide();
            }
        },

        _removeButton: function(pAction) {
            if (typeof pAction !== "string" || pAction.length <= 0) {
                throw new Error("pAction must be a string");
            }
            var buttons = this.element.children('.nixps-asset-AssetHeader').AssetHeader('option', 'buttons');
            var newButtons = [];
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].action !== pAction) {
                    newButtons.push(buttons[i]);
                }
            }
            this.element.children('.nixps-asset-AssetHeader').AssetHeader('option', 'buttons', newButtons);
        },

        _replaceButton: function(pButton) {
            if($.isEmptyObject(pButton) || typeof pButton.action !== "string" || pButton.action.length <= 0) {
                throw new Error('could not replace a invalid button');
            }
            var buttons = this.element.children('.nixps-asset-AssetHeader').AssetHeader('option', 'buttons');
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].action === pButton.action) {
                    buttons[i] = pButton;
                    break;
                }
            }
            this.element.children('.nixps-asset-AssetHeader').AssetHeader('option', 'buttons', buttons);
        },

        _createFolderViewButtons: function() {
            var buttons = [];
            if (this.folderViewMode  === 'list') {
                buttons.push({action: 'iconview', label: "nixps-cloudflow-assets.action-switch-icon_view"});
            } else if (this.folderViewMode === 'icon') {
                buttons.push({action: 'listview', label: "nixps-cloudflow-assets.action-switch-list_view"});
            } else {
                buttons.push({action: 'listview', label: "nixps-cloudflow-assets.action-switch-list_view"});
                buttons.push({action: 'iconview', label: "nixps-cloudflow-assets.action-switch-icon_view"});
            }
            if (this.folderViewMode !== 'reader' && this.readersViewPossible === true) {
                buttons.push({action:'readerview', label: 'nixps-cloudflow-assets.action-switch-readers_view'});
            }
            return buttons;
        },

        _createApprovalButton: function (pData) {
            // show and set approval only if it is a file and not a sub page
            if (this.fileView === "file" && this.options.sub.length <= 0) {
                if (pData.approvals !== undefined && pData.approvals.length !== 0) {
                    var aggregatedAssessment = "";
                    for (var i = 0; i < pData.approvals.length; ++i) {
                        var checkAssessment = pData.approvals[pData.approvals.length - 1 - i].assessment;
                        if ((aggregatedAssessment === "" && checkAssessment !== "cancel") || checkAssessment === "pending") {
                            aggregatedAssessment = checkAssessment;
                        }
                    }
                    if (aggregatedAssessment === "") {
                        return { action: 'approval', class: ".asset-approval", label: 'nixps-cloudflow-assets.status_no_approval'};
                    } else if (aggregatedAssessment === "reject") {
                        return { action: "approval", html: ("<span class='approval-rejected'><img src='portal/images/approval_rejected.png'/>" + $.i18n._('nixps-cloudflow-assets.status_rejected') + "</span>") };
                    } else if (aggregatedAssessment === "accept") {
                        return { action: "approval", html: ("<span class='approval-accepted'><img src='portal/images/approval_accepted.png'/>" + $.i18n._('nixps-cloudflow-assets.status_approved') + "</span>") };
                    } else {
                        return { action: "approval", html: ("<span class='approval-waiting'><img src='portal/images/approval_waiting.png'/>" + $.i18n._('nixps-cloudflow-assets.status_waiting_approval') + "</span>") };
                    }
                } else {
                    return { action: "approval", class:".asset-approval", label: 'nixps-cloudflow-assets.status_no_approval'};
                }
            }
        },

        _createAssetViewButtons: function(pData) {
            if (this.hasProofscopeLicense === true && this.fileView === "file") {
                var viewButton = { action:'viewer', label: 'nixps-cloudflow-assets.action-view_file'};
                var stackViewbutton = {action:'stackviewer', label: 'nixps-cloudflow-assets.action-view_combined_file'};
                if(pData.filetype === "text/html" || (pData.filetype === "application/json" && pData.file_extension === ".lmslayout")) {
                    return viewButton;
                } else if(this.options.mode === "default" && pData.proofscope !== undefined && pData.proofscope.uuid !== undefined) {
                    if (isStackView(pData) === false) {
                        return viewButton;
                    } else {
                        return stackViewbutton;
                    }
                } else if (this.options.mode === "default" && this.hasProofscope3DLicense === true && pData.proofscope3d !== undefined && pData.proofscope3d.id !== undefined) {
                    return viewButton;
                }
            }
        },

        _createCompareButtons: function(pData) {
            if (this.hasProofscopeLicense === true && this.fileView === "file" && pData.proofscope !== undefined && pData.proofscope.uuid !== undefined) {
                if (this.options.mode === "default") {
                    if (isStackView(pData) === true) {
                        return {action:'stackcompare', class:'asset-stack-compare', label: 'nixps-cloudflow-assets.action-compare_combined_asset'};
                    } else {
                        return {action:'compare', class:'asset-compare assetButton', label: 'nixps-cloudflow-assets.action-compare_asset'};
                    }
                } else if (this.options.mode === "compare") {
                    return {action: 'compare', class:"asset-compare", html: '<img src="portal/images/compare_icon.png"/>' + $.i18n._('nixps-cloudflow-assets.action-compare_asset')};
                } else if (this.options.mode === "compareView") {
                    if (isStackView(pData) === true) {
                        return {action: 'compare', class:"asset-compare", html: '<img src="portal/images/compare_icon.png"/> ' + $.i18n._('nixps-cloudflow-assets.action-compare_combined_asset')};
                    } else {
                        return {action: 'compare', class:"asset-compare", html: '<img src="portal/images/compare_icon.png"/>' + $.i18n._('nixps-cloudflow-assets.action-compare_asset')};
                    }
                }
            }
        },

        _createResetButtons: function(pData) {
            if (pData.filetype === undefined || pData.filetype === "application/unknown") {
                return {action:'resetmetadata', class: 'asset-reset-metadata', label: 'nixps-cloudflow-assets.action-recalculate_metadata'};
            } else if (pData.filetype.indexOf('text') !== 0 && (pData.filetype === "application/json" && pData.file_extension === ".lmslayout") === false && (pData.thumb === undefined || pData.thumb === "")) {
                return {action:'resetthumb', class: 'asset-reset-thumb', label: 'nixps-cloudflow-assets.action-recalculate_thumb'};
            } else if (pData.proofscope !== undefined && pData.proofscope.uuid !== undefined && this.user.hasPermission("ADMIN_USER")) {
                return {action:'resetrender', class: 'asset-reset-render',  label: 'nixps-cloudflow-assets.action-rerender_asset'};
            }
        },

        /**
         * @description function runs when user click on the view buttons
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _clickViewButtonHandler: function(pEvent, pData) {
            var that = this;
            // internal function only used in this function
            function setGeneralSearchInUrl() {
                // look up if user is being searching, add this in the current url history
                // so if user goes back, a general search is going back
                var searchString = that.element.children('.nixps-asset-AssetHeader').AssetHeader('getSearchString');
                if (typeof searchString === "string" && searchString.length > 0) {
                    // save general search in url
                    window.history.replaceState({url: that.options.url, sub: that.options.sub, site: that.options.site}, null, location.href + "&search=" + searchString);
                }
            }
            var destinationUrl = "";
            if ($.isPlainObject(this.assetData) === true && this.assetData.filetype === "application/json" && this.assetData.file_extension === ".lmslayout") {
                setGeneralSearchInUrl();
                // showing lms
                destinationUrl = "/portal.cgi?lms=mainPageNewUI&layoutPath=" + this.assetData.cloudflow.part;
                window.location = destinationUrl;
            }
            if ($.isPlainObject(this.assetData) === true && this.assetData.filetype === "text/html") {
                // showing html pages
                var url = this.options.url;
                if (url.indexOf('cloudflow://') === 0) {
                    url = url.slice(12); // remove the cloudflow:// pre string
                }
                setGeneralSearchInUrl();
                // file names with %20 will now fall in error, this need to be fixed ...
                window.location = '/portal.cgi/' + url;
            }
            if (this.hasProofscopeLicense === true && this.options.mode === "default") {
                if (this.assetData.filetype.indexOf("vnd.nixps-layout") >= 0) {
					setGeneralSearchInUrl();
                    window.location = '/portal.cgi?cloudflow=' + encodeURIComponent(this.options.url);
                }
                if ( (this.assetData.proofscope !== undefined && this.assetData.proofscope.uuid !== undefined) ||
                      (this.hasProofscope3DLicense === true && this.assetData.proofscope3d !== undefined && this.assetData.proofscope3d.id !== undefined)) {
                    setGeneralSearchInUrl();
                    if (typeof this.assetData.metadata.page_limit === 'number') {
                        var maxPages = this.assetData.metadata.page_limit;
                        window.location = "/portal.cgi?proofscope&url=" + encodeURIComponent(this.assetData.cloudflow.part) + "&topbar=true&max_pages=" + maxPages;
                    } else {
                        window.location = "/portal.cgi?proofscope&url=" + encodeURIComponent(this.assetData.cloudflow.part) + "&topbar=true";
                    }
                }
            }
        },

        /**
         * @description when user change approval, we need to change the button approval
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _approvalviewChangedHandler: function (pEvent, pData) {
            var newButton = {action: 'approval'};
            if (pData.state === "accept") {
                newButton.html = "<span class='approval-accepted'><img src='portal/images/approval_accepted.png'/>" + $.i18n._('nixps-cloudflow-assets.status_approved') + "</span>";
            } else if (pData.state === "reject") {
                newButton.html = "<span class='approval-rejected'><img src='portal/images/approval_rejected.png'/>" + $.i18n._('nixps-cloudflow-assets.status_rejected') + "</span>";
            } else if (pData.state === "pending") {
                newButton.html = "<span class='approval-waiting'><img src='portal/images/approval_waiting.png'/>" + $.i18n._('nixps-cloudflow-assets.status_waiting_approval') + "</span>";
            } else {
                newButton.html = $.i18n._('nixps-cloudflow-assets.status_no_approval');
            }
            this._replaceButton(newButton);
            pEvent.stopPropagation();
        },

        _folderviewOpenHandler: function (pEvent, pData) {
            if (pData.site === true) {
                // clicked on a site
                if (pData.parent === true) {
                    // we go back to overview of all sites
                    this.update("X", "", "");
                } else {
                    // we want to go to other site
                    if (pData.name === this.options.currentSite) {
                        // go to local file stores
                        this.update("X", "", pData.name);
                    } else {
                        // go to other site then local
                        var that = this;
                        this._goToOtherSite(pData.name).fail(function (pError) {
                            // could not forwards, go to overview again
                            that.update("X", "", "");
                        });
                    }
                }
            } else if (pData.cloudflow.folder !== undefined) {
                // clicked on folder
                this.update(pData.cloudflow.folder, "", this.options.site);
            } else {
                // clicked on file
                this.update(pData.cloudflow.file, "", this.options.site);
            }
            pEvent.stopPropagation();
        },


        _folderviewActionHandler: function (pEvent, pData) {
            if (pData.action !== undefined) {
                if (pData.action === "replace" && $.isPlainObject(pData.file) && $.isPlainObject(pData.file.cloudflow) &&
                        typeof pData.file.cloudflow.file === "string" && pData.file.cloudflow.file.length > 0) {
                    // if action is replacement and if data contains url
                    this.replaceUrl = pData.file.cloudflow.file;
                    this.element.find(".asset-files-replace").fileupload("option", "url", '/portal.cgi?asset=upload_file&url=' + encodeURIComponent(pData.file.cloudflow.file) + '&overwrite=true');
                    this.element.find(".asset-files-replace").click();
                }
            }
            pEvent.stopPropagation();
        },


        _folderviewChangeHandler: function (pEvent, pData) {
            // this is only called in icon view
            if (!$.isEmptyObject(pData) && pData.view === "reader" && this.fileView === "folder") {
                this.readersViewPossible = true;
                this.folderViewMode = 'reader';
                this.resetButtons();
            }
            pEvent.stopPropagation();
        },


        _folderviewPossibilityHandler: function (pEvent, pData) {
            // this is called in all situations (list/icon view)
            if (!$.isEmptyObject(pData) && pData.view === "reader" && this.fileView === "folder" && this.readersViewPossible === false) {
                this.readersViewPossible = true;
                this.resetButtons();
                if (this.options.startUpOptions.openMode === "book") { // did user ask to view directly the book pages
                    this._openBook();
                    // destroy open mode
                    this.options.startUpOptions.openMode = "";
                }
            }
            pEvent.stopPropagation();
        },


        _folderviewSelectHandler: function(pEvent, pData) {
            this.m_selectedFiles = pData.selected_items;
            this._updateFolderActionList(this.folderActionDropDown);
            if ($.isArray(pData.files) && pData.files.length === 1) {
                this.element.children(".assetpreview.nixps-asset-AssetPreview:visible").AssetPreview({
                    assetData: pData.files[0]
                });
            }
            pEvent.stopPropagation();
        },

        _folderviewSearchHandler: function (pEvent, pData) {
            if(typeof pData.searchString === "string" && pData.searchString.length > 0) {
                this.element.children('.nixps-asset-AssetHeader').AssetHeader('searchOnString', pData.searchString);
            }
            pEvent.stopPropagation();
        },

        _folderviewChangePrefHandler: function(pEvent, pData) {
            if($.isPlainObject(pData.preferences)) {
                // merge preferences from folderView to assetView
                this.m_preferences.fileorder = pData.preferences.fileorder;
                this.m_preferences.fileasc = pData.preferences.fileasc;
                this._savePreferencesFunction();
            }
            pEvent.stopPropagation();
        },

        _folderviewContextMenuHandler: function(pEvent, pData) {
            if (typeof pData.url === "string" && pData.url.length > 0 && this.lock === false) {
                var that = this;
                this.fileActionContextMenu.AssetActionList({
                    "url": pData.url,
                    "hide": function() {
                        that.m_folder_div.FolderView('cleanContextmenuLayer');
                        that.fileActionContextMenu.hide();
                        $('body').removeClass('holdScroll');
                    }
                }).show().AssetActionList('openOnContextMenu', pEvent);

                $('body').addClass('holdScroll');
            }
            pEvent.stopPropagation();
        },

        _renamedHandler: function(pEvent, pData) {
            // file is already renamed
            if(pData !== undefined && typeof pData.newUrl === "string" && pData.newUrl.length > 0) {
                if (this.fileView === 'file') {
                    // if we are internaly in a file, update file metadata
                    this.update(pData.newUrl, "", this.options.site);
                } else {
                    // if we have a folder view,  update view
                    this.update(this.options.url, "", this.options.site);
                }
            } else {
                throw new Error('invalid data from event');
            }
        },

        _addedHandler: function(pEvent, pData) {
            // if we have a folder view,  update view
            this.update(this.options.url, "", this.options.site);
        },

        _deletedHandler: function(pEvent, pData) {
            // file is already removed, go to parent
            if(pData !== undefined && pData.folder === true) {
                // folder is deleted
                var newUrl;
                // if we are viewing the folder itselfs go to parent
                if (this.options.url === pData.url) {
                    newUrl = nixps_utils.get_path(this.options.url.slice(0, this.options.url.length - 1));
                } else {
                // if we are viewing a other folder, then just update the view
                    newUrl = this.options.url;
                }
                this.update(newUrl, "", this.options.site);
            } else {
                // file is deleted
                // if we are in file of folder view, the get_path function giva always the good result
                // if folder it stays in that same folder,
                // if in file we go to parent folder
                this.update(nixps_utils.get_path(this.options.url), "", this.options.site);
            }

        },

        _updatefileactionHandler: function(pEvent, pData) {
            // update the folder because something has moved or copied
            var jacket_id = null;
            if (pData !== undefined && pData.returnObject !== undefined && typeof pData.returnObject.jacket_id === "string" && pData.returnObject.jacket_id.length > 0) {
                jacket_id = pData.returnObject.jacket_id;
            }
            this.element.find('.nixps-asset-RunningActionList').RunningActionList("wakeUp", jacket_id);
        },

        _dropfileactionHandler: function(pEvent, pData) {
            var that = this;
            if (pData !== undefined && typeof pData.from === "string" && pData.from.length > 0 && typeof pData.to === "string" && pData.to.length > 0) {
                if(pData.copy === true) {
                    this.fileActionDropdown.AssetActionList('copy', pData.from, pData.to).always(function() {
                        that.update(that.options.url, "", that.options.site);
                    }).fail(function(pError) {
                        that.m_folder_div.FolderView('errorDropped');
                        console.error(pError);
                    });
                } else {
                    this.fileActionDropdown.AssetActionList('move', pData.from, pData.to, that._getCurrentSiteName()).always(function() {
                        that.update(that.options.url, "", that.options.site);
                    }).fail(function(pError) {
                        that.m_folder_div.FolderView('errorDropped');
                        console.error(pError);
                    });
                }
            } else {
                // if wrong data interface, just update and we will see ...
                that.update(that.options.url, that.options.sub, that.options.site);
            }
        },

        _needdummyfileactionHandler: function(pEvent, pData) {
            if (pData !== undefined && typeof pData.name === "string" && pData.name.length > 0 && pData.inMakingID !== undefined &&
                    typeof pData.parentUrl === "string" && pData.parentUrl.length > 0) {
                if (pData.isFolder === true) {
                    this.m_folder_div.FolderView('addFolderInMaking', pData.name, pData.inMakingID, pData.parentUrl);
                } else {
                    this.m_folder_div.FolderView('addFileInMaking', pData.name, pData.inMakingID, pData.parentUrl);
                }
            } else {
                // if wrong data interface, just update and we will see ...
                this.update(this.options.url, this.options.sub, this.options.site);
            }
        },

        _removedummyfileactionHandler: function(pEvent, pData) {
            if (pData !== undefined && pData.inMakingID !== undefined) {
                if (pData.isFolder === true) {
                    this.m_folder_div.FolderView('removeFolderInMaking', pData.inMakingID);
                } else {
                    this.m_folder_div.FolderView('removeFileInMaking', pData.inMakingID);
                }
            } else {
                // if wrong data interface, just update and we will see ...
                this.update(this.options.url, this.options.sub, this.options.site);
            }
        },

        _metadataOpenHandler: function (pEvent, pData) {
            if (typeof pData.url === "string" && typeof pData.sub === "string") {
                this.update(pData.url, pData.sub, this.options.site);
            }
            pEvent.stopPropagation();
        },

        /**
         * @description function runs when user want to search with the browser
         * @function
         * @private
         * @param {type} pEvent
         * @returns {undefined}
         */
        _commandFKeyHandler: function(pEvent) {
            // do nothing if user is already using the inner search
            // because the amount of results could be to big!
            var searchArray = this.m_folder_div.FolderView("option", "search_query");
            var isSearching = $.isArray(searchArray) && searchArray.length > 0;
            if (isSearching === false) {
                // the user is not using the inner cloudflow seaching tool
                this.m_folder_div.FolderView('action', 'browserSearch');
            }
            pEvent.stopPropagation();
        },

        /**
         * @description Function runs when user want to cut the current asset
         * @function
         * @private
         * @param {type} pEvent
         * @returns {undefined}
         */
        _commandXKeyHandler: function(pEvent) {
            this.fileActionDropdown.AssetActionList('cutToClipBoard');
        },

        /**
         * @description function runs when user want to copy the current asset.
         * @function
         * @private
         * @param {type} pEvent
         * @returns {undefined}
         */
        _commandCKeyHandler: function(pEvent) {
            this.fileActionDropdown.AssetActionList('copyToClipBoard');
        },

        /**
         * @description function runs when user want to paste to the current asset
         * @function
         * @private
         * @param {type} pEvent
         * @returns {undefined}
         */
        _commandVKeyHandler: function(pEvent) {
            this.fileActionDropdown.AssetActionList('pasteFromClipBoard');
        },

        /**
         * @description function runs when user press the space bar 
         * @function
         * @private
         * @param {Object} pEvent 
         * @returns {undefined}
         */
        _commandSpaceKeyHandler: function(pEvent) {
            if (this.fileView === "file" || this.folderViewMode !== 'list') {
                return;
            }
            var selectedItems = this.m_folder_div.FolderView("getSelectedItems");
            if ($.isArray(selectedItems) && selectedItems.length === 1 && $.isPlainObject(selectedItems[0])) {
                if (this.element.children(".assetpreview.nixps-asset-AssetPreview").is(":visible")) {
                    this.element.removeClass("assetview_detailsview").children(".assetpreview").AssetPreview("close");
                } else {
                    var that = this;
                    this.element.addClass("assetview_detailsview").children(".assetpreview").AssetPreview({
                        assetData: selectedItems[0],
                        style_type: "assetview",
                        close: function(){
                            that.element.removeClass("assetview_detailsview");
                        }
                    }).css("display", "");
                }
            }
            pEvent.stopPropagation();
            pEvent.preventDefault();
        },

        _initFileUploading: function () {
            var that = this;
            // File Upload Component
            this.element.find(".asset-files").fileupload({
                dataType: 'json',
                dropZone: $('#dropzone'),
                pasteZone: null,
                add: function (e, data) {
                    // function called before uploading file
                    if ($.isArray(data.files) && data.files.length > 0) {
                        that.freezeOverlay.FreezeOverlay({text: ""});
                        that.freezeOverlay.FreezeOverlay('show');
                        // control if there are files with the same name
                        $.when(that.m_folder_div.FolderView('containsFile', data.files[0].name, true)).then(function(pContainsFile){
                            that.freezeOverlay.FreezeOverlay('hide');
                            if (pContainsFile === true) {
                                $('body').Dialog('show_yes_no', $.i18n._('nixps-cloudflow-assets.messagetitle_overwrite', [data.files[0].name]),
                                    $.i18n._("nixps-cloudflow-assets.messagetitle_message", [data.files[0].name]), "", function () {
                                        that.element.find(".asset-files").fileupload("option", "url", '/portal.cgi?asset=upload_file&url=' + encodeURIComponent(that.options.url + data.files[0].name) + '&overwrite=true');
                                        data.submit();
                                }, function () {
                                    // no call submit
                                });
                            } else {
                                data.submit();
                            }
                        }, function(){
                            that.freezeOverlay.FreezeOverlay('hide');
                        });
                    }
                },
                send: function (e, data) {
                    //$.cookie("current_url", that.options.url, {path: '/'});
                    that._replaceButton({action: 'upload', class:"asset-upload", disabled: true, label:'nixps-cloudflow-assets.action-upload_file_starting' });
                },
                done: function (e, data) {
                    that.update(that.options.url, that.options.sub, that.options.site);
                },
                progress: function (e, data) {
                    var l_progress = parseInt(data.loaded / data.total * 100, 10);
                    that._replaceButton({action: 'upload', class:"asset-upload", disabled: true, html: "<img src='portal/images/upload-icon.png'/> " + $.i18n._('nixps-cloudflow-assets.action-upload_file_progress', [l_progress])});
                }
            });

            // internal function only used by fileupload for replacing file
            var loopUpdateFunction = function (pUrl, pSub, pDelay) {
                api_async.request.metadata(pUrl, pSub, function (pMetaData) {
                    if (pMetaData.filetype === undefined || pMetaData.filetype === "application/unknown" || pMetaData.mime_types === undefined) {
                        //setTimeout(function() {loopUpdateFunction(pUrl, pSub, Math.min(20000, pDelay + 250));}, pDelay);
                        setTimeout(function () {
                            loopUpdateFunction(pUrl, pSub, pDelay);
                        }, pDelay);
                    } else {
                        that.freezeOverlay.FreezeOverlay('hide');
                        that.update(that.options.url, that.options.sub, that.options.site);
                    }
                }, function (pError) {
                    that.freezeOverlay.FreezeOverlay('hide');
                    that.update(that.options.url, that.options.sub, that.options.site);
                });
            };

            // File Replace Component
            this.element.find(".asset-files-replace").fileupload({
                pasteZone: null,
                dataType: 'json',
                url: "",
                send: function (e, data) {
                    $.cookie("current_url", '', {path: ''});
                    that._replaceButton({action: 'replace', class:'asset-replace', disabled: true, label:'nixps-cloudflow-assets.action-upload_file_starting'});
                    that.freezeOverlay.FreezeOverlay({text: $.i18n._('nixps-cloudflow-assets.action-recalculate_information')});
                    that.freezeOverlay.FreezeOverlay('show');
                },
                done: function (e, data) {
                    that._replaceButton({action: 'replace', class:'asset-replace', html: $.i18n._('nixps-cloudflow-assets.action-replace_file') + '…'});
                    loopUpdateFunction(that.replaceUrl, that.options.sub, 1000);
                },
                progress: function (e, data) {
                    var l_progress = parseInt(data.loaded / data.total * 100, 10);
                    that._replaceButton({action: 'replace', class:'asset-replace', disabled: true, html: "<img src='portal/images/upload-icon.png'/> " + $.i18n._('nixps-cloudflow-assets.action-upload_file_progress', [l_progress])});
                },
                fail: function (e, data) {
                    console.error(data);
                    that._replaceButton({action: 'replace', class:'asset-replace', html: $.i18n._('nixps-cloudflow-assets.action-replace_file') + '…'});
                    that.freezeOverlay.FreezeOverlay('hide');
                    $('#notify-area').notify("create", "closeable-error", {title: $.i18n._("nixps-cloudflow-assets.errorreplace_title"), text: $.i18n._("nixps-cloudflow-assets.errorreplace_message")});
                }
            });
        },

        /**
         * @description Gp to a new file of folder with url, this will updates and redraw to components
         * @function
         * @param {string} pUrl the new url to go to
         * @param {string} pSub
         * @param {string} pSite The site you work on
         * @param {boolean} pRestoreHistory set on true if we go in history, do not store this step
         * @returns {undefined}
         */
        update: function (p_url, p_sub, p_site, pRestoreHistory) {
            var l_url = window.location.protocol + "//" + window.location.host + "?asset=" + encodeURIComponent(p_url);

            if (typeof p_sub === "string" && p_sub.length > 0) {
                l_url += "&sub=" + p_sub;
            } else {
                p_sub = "";
            }
            if (this.options.enableGoBackBrowsing === true && pRestoreHistory !== true) {
                history.pushState({url: p_url, sub: p_sub, site: p_site}, '', l_url);
            }
            if (p_url === "X" || p_url === "cloudflow://" || p_url === undefined || p_url === "") {
                p_url = "";
            } else {
                if (p_url.substr(0, 12) !== "cloudflow://") {
                    p_url = "cloudflow://" + p_url;
                }
            }
            if (p_site === undefined) {
                p_site = null;
            }

            this.options.url = p_url;
            this.options.sub = p_sub;
            this.options.site = p_site;
            this.m_folder_div.hide();
            this.assetWorkflow.hide();
            this.element.find('.asset-properties').hide();

            this.rootSituationQuery = [];
            var rootUrl = "";
            // if we want to show are in a situation with the sepcific files and folders
            if (this.options.rootFolders.length > 0 || this.options.rootFiles.length > 0) {
                this.rootSituationQuery = this.kRootQuery;
                var url = this.options.url;
                this.options.url = "";
                // loop over all folders and look if the current url is not part of a folder?
                // look if we are not in one of the specific folders or sub folder
                for (var i = 0; i < this.options.rootFolders.length; i++) {
                    if (url.substr(0, this.options.rootFolders[i].length) === this.options.rootFolders[i]) {
                        // if current url is a sub folder
                        // reset settings, we are browsing normal.
                        this.rootSituationQuery = [];
                        this.options.url = url;
                        // get sub folder
                        rootUrl = this.options.rootFolders[i].substr(0, this.options.rootFolders[i].lastIndexOf('/', this.options.rootFolders[i].lastIndexOf('/')-1) + 1);
                        break;
                    }
                }
                // if we are not in a specific sub folder.
                if (this.rootSituationQuery.length > 0) {
                    // if we are in a specific file ?
                    if($.inArray(url, this.options.rootFiles) >= 0) {
                        // reset settings, we are browsing normal.
                        this.rootSituationQuery = [];
                        this.options.url = url;
                        rootUrl = this.options.url.substr(0, this.options.url.lastIndexOf('/') + 1);
                    } else {
                        // we are not in a specific (sub)folder or file, but there are specific specified
                        // show the root ...
                        // root of the rootFolders and rootfiles
                        this.element.children('.nixps-asset-AssetHeader').AssetHeader('option', {
                            url: "",
                            sub: "",
                            labelFileStoreRoot: "nixps-cloudflow-assets.jobs-assetheader-root",
                            labelAllFileStores: $.i18n._("nixps-cloudflow-assets.jobs-assetheader-allfilesandfolders", [this.options.rootFoldersAndFilesTitle]),
                            rootUrl: rootUrl,
                            rootTitle: this.options.rootFoldersAndFilesIcon + this.options.rootFoldersAndFilesTitle
                        });
                        // speed up, call directly the metadata
                        this._updateMetadata([]); // same return value as all filestores
                        return true;
                    }
                }
            }

            this.element.children('.nixps-asset-AssetHeader').AssetHeader('option', {
                'url': p_url,
                'sub': p_sub,
                labelFileStoreRoot: undefined,
                labelAllFileStores: undefined,
                rootUrl: rootUrl,
                rootTitle: this.options.rootFoldersAndFilesIcon + this.options.rootFoldersAndFilesTitle
            });

            if (this.options.site === "" && this.options.url === "") {
                // we are in highest level, with possible multiple sites
                if (this.sites.areMultipleSites()) {
                    this._updateMetadata({sites_root: true});
                } else {
                    // user has no sites, persist this and continue
                    this.options.site = null;
                    api_async.request.metadata(this.options.url, this.options.sub, $.proxy(this._updateMetadata, this));
                }
            } else if (this.options.url === "") {
                // we are in filestore overview in one specific site
                // this gives all filestores, and returns for now an empty array, so skip this and call direclty updateMetadata
                this._updateMetadata([]);
            } else {
                var that = this;
                var has_tagFunction = api_async.asset;
                if (this.options.url[this.options.url.length - 1] === "/") {
                    // if last cahr is / than the url is a folder;
                    has_tagFunction = api_async.folder;
                    this.blockView();
                }
                $.when($.Deferred(function (pDefer) {
                            has_tagFunction.has_tag(that.options.url, 'nixps.locked', pDefer.resolve, pDefer.reject);
                        }),
                        $.Deferred(function (pDefer) {
                            api_async.request.metadata(that.options.url, that.options.sub, pDefer.resolve, pDefer.reject);
                        }))
                        .done(function (pTagResults, pMetadata) {
                            if (pTagResults.has_tag === true) {
                                that.lock = true;
                            } else {
                                that.lock = false;
                            }

                            that._updateMetadata(pMetadata);
                        }).fail(function (pError) {
                            if(pError !== undefined  && pError.error_code === "Folder not found") {
                                // url has a folder structure, rip of last char, to create folder url of parent
                                // go to parent and hope this still exsits? at least, try to prevent infinit loops
                                if(typeof that.options.url === "string" && that.options.url.length > 0) {
                                    that.update(nixps_utils.get_path(that.options.url.slice(0,-1)), "", that.options.site);
                                }
                                if($.isArray(pError.messages) && pError.messages.length > 0 && pError.messages[0] !== undefined && typeof pError.messages[0].description === "string") {
                                    $('#notify-area').notify("create", "closeable-error", {title: pError.messages[0].type, text:  pError.messages[0].description}, {expires: 10000});
                                }
                            } else {
                                console.error(pError);
                                throw new Error(pError);
                            }
                        });
            }
        },


        _getPreferences: function () {
            var that = this;
            return $.Deferred(function (pDefer) {
                api_async.preferences.get_for_current_user("workspace", "assetview", function (pResults) {
                    if ($.isEmptyObject(pResults.preferences)) {
                        that.m_preferences = {};
                    } else {
                        that.m_preferences = pResults.preferences;
                    }
                    if (that.m_preferences.fileview === undefined) {
                        that.m_preferences.fileview = 'icon';
                        that._savePreferencesFunction();
                    }
                    if(that.options.startUpOptions !== undefined && typeof that.options.startUpOptions.view === "string" && that.options.startUpOptions.view.length > 0) {
                        that.folderViewMode = that.options.startUpOptions.view;
                    } else {
                        that.folderViewMode = that.m_preferences.fileview;
                    }
                    pDefer.resolve(that.m_preferences);
                }, function (pError) {
                    // if there is a error, do not stop, just continou, it is not something critical
                    that.m_preferences = {};
                    that.m_preferences.fileview = 'icon';
                    if(that.options.startUpOptions !== undefined && typeof that.options.startUpOptions.view === "string" && that.options.startUpOptions.view.length > 0) {
                        that.folderViewMode = that.options.startUpOptions.view;
                    } else {
                        that.folderViewMode = 'icon';
                    }
                    console.error(pError);
                    pDefer.resolve(that.m_preferences);
                });
            });
        },


        _savePreferences: function () {
            var userPref = $.extend({}, this.m_preferences);
            if (this.folderViewMode === 'icon' || this.folderViewMode === "reader") {
                userPref.fileview = 'icon';
            } else if (this.folderViewMode === 'list') {
                userPref.fileview = 'list';
            }
            userPref.urlEncode = undefined;
            userPref.pagebuilder_editbutton = undefined;
            userPref.select_when_browsing = undefined;
            api_async.preferences.save_for_current_user(userPref, "workspace", "assetview");
        },


        /**
         * New metadata received from the server
         */
        _updateMetadata: function (pData) {
            $(document).unbind('drop dragover');

            this.assetData = pData;
            // default hiding readerpossibilitys
            this.readersViewPossible = false;

            this.element.children('.nixps-asset-AssetHeader').AssetHeader('option', {lock: this.lock, assetData: pData});

            if (pData.filetype === undefined) {
                this.fileView = "folder";
                if (this.lock === false && this.options.url !== "" && this.options.url !== "cloudflow://") {
                    // activate upload only if folder is not blocked
                    $('#dropdaddy').show();
                } else {
                    $('#dropdaddy').hide();
                }
                if (this.folderViewMode === "reader") {
                    // in a new folder, we do not know if we have a book?
                    this.folderViewMode = "icon";
                }

                // Set the bottom view
                this.m_folder_div.FolderView("option", {
                        "cf_url": this.options.url,
                        "search_query": this.lastSearchQuery.length > 0 ?  this.lastSearchQuery : this.rootSituationQuery,
                        "searchOnFolders": this.options.rootFolders.length > 0,
                        "site": this.options.site,
                        "view": (this.folderViewMode === 'list') ? "list" : "iconChooser",
                        "lockFolder": this.lock
                }).show();

                if (this.options.enableUpload && this.user.hasPermission('MAY_UPLOAD')) {
                    this.element.find(".asset-files").fileupload("option", "url", '/portal.cgi?asset=upload_file&url=' + encodeURIComponent(this.options.url));

                    $(document).bind('dragover', function (e) {
                        var dropZone = $('#dropzone'),
                                timeout = window.dropZoneTimeout;
                        if (!timeout) {
                            dropZone.fadeIn(0.3);
                        } else {
                            clearTimeout(timeout);
                        }
                        window.dropZoneTimeout = setTimeout(function () {
                            window.dropZoneTimeout = null;
                            dropZone.fadeOut(0.3);
                        }, 100);
                    });

                    $(document).bind('drop dragover', function (e) {
                        e.preventDefault();
                    });
                }
            } else {
                this.fileView = "file";
                if (this.lock === false && this.options.sub.length <= 0) {
                    this.replaceUrl = this.options.url;
                    this.element.find(".asset-files-replace").fileupload("option", "url", '/portal.cgi?asset=upload_file&url=' + encodeURIComponent(this.options.url) + '&overwrite=true');
                }

                // the folder can be showed after the hide, so to be certain hide again
                this.m_folder_div.hide();
                // (Safari) when go back from compare,
                // there can be a update when the compareloader is still there, this cause
                // calling .MetadataView() twice, with errors, so remove compareloader before!
                this.element.find('.assetview_compareloader').empty();
                this.element.find('.assetview_metadataview').MetadataView({
                    language: this.options.language,
                    url: this.options.url,
                    sub: this.options.sub,
                    user: this.user,
                    fileData: pData,
                    encode_url_in_infopanel: (this.m_preferences !== undefined) ? this.m_preferences.urlEncode : true
                });

                $(document).bind('drop dragover', function (e) {
                    e.preventDefault();
                });
            }

            this.resetButtons();
            this._trigger("update", null, {
                shortSiteName: this.sites.getShortSiteName(),
                file_name: pData.file_name
            });
        },

        /**
         * @description Go to the other site
         * @function
         * @private
         * @param {string} pSiteName The name of the other site
         * @returns {Deferred}
         */
        _goToOtherSite: function(pSiteName) {
            if (typeof pSiteName !== "string" || pSiteName.length < 0) {
                throw new Error('pSiteName must be a not empty string');
            }
            var that = this;
            this.freezeOverlay.FreezeOverlay({text: $.i18n._('nixps-cloudflow-assets.remote_logging')}).FreezeOverlay('show');
            // if done => redirect , otherwise it fails
            return this.sites.redirectTo(pSiteName, this.user.getUserName(), "asset=X&site=" + pSiteName).done(function(pUrl){
                window.location = pUrl;
                that.freezeOverlay.FreezeOverlay('hide');
            }).fail(function (pError) {
                    that.freezeOverlay.FreezeOverlay('hide');
                    $('#notify-area').notify("create", "closeable-error", {title: $.i18n._('nixps-cloudflow-assets.errortitle_connectionsite'),
                        text: $.i18n._('nixps-cloudflow-assets.errormessage_connectionsite', [pSiteName])}, {expires: 120000});
                });
        },

        _calcProofscopeInfo: function(pData) {
            if (this.fileView === "file") {
                var proofscopeInfo = {
                    url: this.options.url,
                    proofscopePart: pData.cloudflow.part
                };
                if (pData.proofscope !== undefined && pData.proofscope.uuid !== undefined) {
                    if (isStackView(pData) === true) {
                        proofscopeInfo.proofscopeView = {
                            viewer: "Stack",
                            parameters: {
                                itemFinder: {
                                    assetID: pData._id,
                                    finders: [{type: 'MatchNameUntilLastUnderscore'}]
                                }
                            }
                        };
                    } else if ('metadata' in pData === false || 'number_of_pages' in pData.metadata === false || pData.metadata.number_of_pages <= 1) {
                        proofscopeInfo.proofscopeView = {
                            viewer: "Graphic",
                            parameters: {
                                assetID: pData._id
                            }
                        };
                    } else {
                        proofscopeInfo.proofscopeView = {
                            viewer: "MultiPage",
                            parameters: {
                                assetID: pData._id
                            }
                        };

                        if (typeof pData.metadata.page_limit === 'number') {
                            proofscopeInfo.proofscopeView.parameters.maximumNrPages = pData.metadata.page_limit;
                        }
                    }
                }
                return proofscopeInfo;
            }
        },

        /**
         * @description open the book view
         * @function
         * @private
         * @returns {undefined}
         */
        _openBook: function () {
            var that = this;
            this.bookShelf.BookView({
                url: that.options.url,
                close: function (pEvent, pData) {
                    // make dialog and remove after decision
                    var popup = $('<div>').addClass('dialog-confirm').attr('title', $.i18n._('nixps-cloudflow-assets.folderactions-title-approval'));
                    popup.append($('<p>')._t("nixps-cloudflow-assets.allow-approvalConfirmMessage"));
                    popup.dialog({
                        closeOnEscape: true,
                        resizable: true,
                        minHeight: 175,
                        minWidth: 700,
                        modal: true,
                        autoOpen: true,
                        dialogClass: 'approvalConfirmationDialog',
                        buttons: [{
                                text: $.i18n._('nixps-cloudflow-assets.allow-cancel'),
                                click: function () {
                                    $(this).remove();
                                },
                                class: 'colored-button'
                            },
                            {
                                text: $.i18n._('nixps-cloudflow-assets.allow-rejectSelecting'),
                                click: function () {
                                    var rejectDef = {};
                                    if ($.isArray(pData.rejectIDs) && pData.rejectIDs.length > 0) {
                                        rejectDef = that._folderActionlistApproveAll(pData.rejectIDs, 'reject');
                                    }
                                    $.when(rejectDef).done(function (pRejectResults) {
                                        if ($.isArray(pData.rejectIDs) && pData.rejectIDs.length > 0) {
                                            that._callbackFunctionApprove(pData.rejectIDs, 'reject');
                                        }
                                    }).fail(function (pError) {
                                        $('#notify-area').notify("create", "closeable-error", {title: $.i18n._("nixps-cloudflow-assets.errorapprove_title"), text: $.i18n._("nixps-cloudflow-assets.errorapprove_message")});
                                        throw new Error(pError);
                                    });
                                    $(this).remove();
                                },
                                class: 'colored-button'
                            },
                            {
                                text: $.i18n._('nixps-cloudflow-assets.allow-rejectApproveRest'),
                                click: function () {
                                    var rejectDef = {};
                                    var acceptDef = {};
                                    if ($.isArray(pData.rejectIDs) && pData.rejectIDs.length > 0) {
                                        rejectDef = that._folderActionlistApproveAll(pData.rejectIDs, 'reject');
                                    }
                                    if ($.isArray(pData.pendingIDs) && pData.pendingIDs.length > 0) {
                                        acceptDef = that._folderActionlistApproveAll(pData.pendingIDs, 'accept');
                                    }
                                    $.when(rejectDef, acceptDef).done(function (pRejectResults, pAcceptResults) {
                                        if ($.isArray(pData.pendingIDs) && pData.pendingIDs.length > 0) {
                                            that._callbackFunctionApprove(pData.pendingIDs, 'accept');
                                        }
                                        if ($.isArray(pData.rejectIDs) && pData.rejectIDs.length > 0) {
                                            that._callbackFunctionApprove(pData.rejectIDs, 'reject');
                                        }
                                    }).fail(function (pError) {
                                        $('#notify-area').notify("create", "closeable-error", {title: $.i18n._("nixps-cloudflow-assets.errorapprove_title"), text: $.i18n._("nixps-cloudflow-assets.errorapprove_message")});
                                        throw new Error(pError);
                                    });
                                    $(this).remove();
                                },
                                class: 'colored-button'
                            }]
                        ,
                        open: function () {
                            $(this).parent().find('button:last').focus();
                        }
                    });
                }
            }).show();
        },

        /**
         * @desc make the sort dropdown list
         * @function
         * @private
         * @return undefined
         **/
        _makeOrderByList: function () {
            var that = this;
            // make the list container and events
            var dropDownList = $('<span>').addClass('asset-folderOrderByList')
                                        .attr('dropdown', 'dropdown')
                                        .DropdownList({buttonText: $.i18n._('nixps-cloudflow-assets.action-sortbyactions')});
            // make all the list items
            dropDownList.DropdownList('addListItem',
                    "actionSortFilenameAsc",
                    $('<span>').addClass('fa fa-sort-amount-asc'),
                    $.i18n._("nixps-cloudflow-assets.sortbyactions-filename"),
                    true,
                    function () { that.m_folder_div.FolderView("action", "sort", ['file_name', 'ascending']); that._updateOrderByList(that.orderByDropDown);});
            dropDownList.DropdownList('addListItem',
                    "actionSortFilenameDes",
                    $('<span>').addClass('fa fa-sort-amount-asc fa-flip-vertical'),
                    $.i18n._("nixps-cloudflow-assets.sortbyactions-filename"),
                    true,
                    function () { that.m_folder_div.FolderView("action", "sort", ['file_name', 'descending']); that._updateOrderByList(that.orderByDropDown);});
            dropDownList.DropdownList('addListItem',
                    "actionSortFiletypeAsc",
                    $('<span>').addClass('fa fa-sort-amount-asc'),
                    $.i18n._("nixps-cloudflow-assets.sortbyactions-filetype"),
                    true,
                    function () { that.m_folder_div.FolderView("action", "sort", ['filetype', 'ascending']); that._updateOrderByList(that.orderByDropDown);});
            dropDownList.DropdownList('addListItem',
                    "actionSortFiletypeDes",
                    $('<span>').addClass('fa fa-sort-amount-asc fa-flip-vertical'),
                    $.i18n._("nixps-cloudflow-assets.sortbyactions-filetype"),
                    true,
                    function () { that.m_folder_div.FolderView("action", "sort", ['filetype', 'descending']); that._updateOrderByList(that.orderByDropDown);});
            dropDownList.DropdownList('addListItem',
                    "actionSortFilePathAsc",
                    $('<span>').addClass('fa fa-sort-amount-asc'),
                    $.i18n._("nixps-cloudflow-assets.sortbyactions-filepath"),
                    true,
                    function () { that.m_folder_div.FolderView("action", "sort", ['cloudflow.enclosing_folder', 'ascending']); that._updateOrderByList(that.orderByDropDown);});
            dropDownList.DropdownList('addListItem',
                    "actionSortFilePathDes",
                    $('<span>').addClass('fa fa-sort-amount-asc fa-flip-vertical'),
                    $.i18n._("nixps-cloudflow-assets.sortbyactions-filepath"),
                    true,
                    function () { that.m_folder_div.FolderView("action", "sort", ['cloudflow.enclosing_folder', 'descending']); that._updateOrderByList(that.orderByDropDown);});
            dropDownList.DropdownList('addListItem',
                    "actionSortModtimeAsc",
                    $('<span>').addClass('fa fa-sort-amount-asc'),
                    $.i18n._("nixps-cloudflow-assets.sortbyactions-modtime"),
                    true,
                    function () { that.m_folder_div.FolderView("action", "sort", ['modtime', 'ascending']); that._updateOrderByList(that.orderByDropDown);});
            dropDownList.DropdownList('addListItem',
                    "actionSortModtimeDes",
                    $('<span>').addClass('fa fa-sort-amount-asc fa-flip-vertical'),
                    $.i18n._("nixps-cloudflow-assets.sortbyactions-modtime"),
                    true,
                    function () { that.m_folder_div.FolderView("action", "sort", ['modtime', 'descending']); that._updateOrderByList(that.orderByDropDown);});
            return dropDownList;
        },

        /**
         * @description update the dropdown menu of the orderBy
         * @function
         * @private
         * @param {type} pDropDown
         * @returns {undefined}
         */
        _updateOrderByList: function (pDropDown) {
            // init to default state
            pDropDown.DropdownList('showItem', 'actionSortFilenameAsc');
            pDropDown.DropdownList('showItem', 'actionSortFiletypeAsc');
            pDropDown.DropdownList('showItem', 'actionSortFilePathAsc');
            pDropDown.DropdownList('showItem', 'actionSortModtimeAsc');
            pDropDown.DropdownList('hideItem', 'actionSortFilenameDes');
            pDropDown.DropdownList('hideItem', 'actionSortFiletypeDes');
            pDropDown.DropdownList('hideItem', 'actionSortFilePathDes');
            pDropDown.DropdownList('hideItem', 'actionSortModtimeDes');
            // change according to current sorting state
            var orderByQuery = this.m_folder_div.FolderView('getOrderByQuery');
            if ($.isArray(orderByQuery) && orderByQuery.length >= 2) {
                if (orderByQuery[1] === "ascending") {
                    if (orderByQuery[0] === "file_name") {
                        pDropDown.DropdownList('showItem', 'actionSortFilenameDes');
                        pDropDown.DropdownList('hideItem', 'actionSortFilenameAsc');
                    } else if (orderByQuery[0] === "filetype") {
                        pDropDown.DropdownList('showItem', 'actionSortFiletypeDes');
                        pDropDown.DropdownList('hideItem', 'actionSortFiletypeAsc');
                    } else if (orderByQuery[0] === "cloudflow.enclosing_folder") {
                        pDropDown.DropdownList('showItem', 'actionSortFilePathDes');
                        pDropDown.DropdownList('hideItem', 'actionSortFilePathAsc');
                    } else if (orderByQuery[0] === "modtime") {
                        pDropDown.DropdownList('showItem', 'actionSortModtimeDes');
                        pDropDown.DropdownList('hideItem', 'actionSortModtimeAsc');
                    }
                }
                // do the check work
                pDropDown.DropdownList("uncheckAll");
                if (orderByQuery[0] === "file_name") {
                    pDropDown.DropdownList('checkItem', 'actionSortFilenameAsc');
                    pDropDown.DropdownList('checkItem', 'actionSortFilenameDes');
                } else if (orderByQuery[0] === "filetype") {
                    pDropDown.DropdownList('checkItem', 'actionSortFiletypeAsc');
                    pDropDown.DropdownList('checkItem', 'actionSortFiletypeDes');
                } else if (orderByQuery[0] === "cloudflow.enclosing_folder") {
                    pDropDown.DropdownList('checkItem', 'actionSortFilePathAsc');
                    pDropDown.DropdownList('checkItem', 'actionSortFilePathDes');
                } else if (orderByQuery[0] === "modtime") {
                    pDropDown.DropdownList('checkItem', 'actionSortModtimeAsc');
                    pDropDown.DropdownList('checkItem', 'actionSortModtimeDes');
                }
            }
        },


        /**
         * @desc make the action list
         * @function
         * @return undefined
         **/
        _makeFolderActionList: function () {
            var that = this;
            // make the list container and events
            var dropDownList = $('<span>').addClass('asset-folderactions')
                                        .attr('dropdown', 'dropdown')
                                        .DropdownList({buttonText: $.i18n._('nixps-cloudflow-assets.action-folderactions')});
            // make all the list items
            dropDownList.DropdownList('addListItem',
                    "actionSelectAll",
                    $('<span>').addClass('fa fa-square'),
                    $.i18n._("nixps-cloudflow-assets.folderactions-selectall"),
                    true,
                    function () {
                        that.m_folder_div.FolderView("action", "selectAll");
                    });
            dropDownList.DropdownList('addListItem',
                    "actionUnselectAll",
                    $('<span>').addClass('fa fa-square-o'),
                    $.i18n._("nixps-cloudflow-assets.folderactions-unselectall"),
                    false,
                    function () {
                        that.m_folder_div.FolderView("action", "unselectAll");
                    });
            dropDownList.DropdownList('addListItem',
                    "actionApprove",
                    '<img class="approvalstate accept" src="/portal/images/approval_accepted.png">',
                    $.i18n._('nixps-cloudflow-assets.folderactions-approveallselect'),
                    false,
                    function () {
                        $('body').Dialog("show_yes_no", $.i18n._('nixps-cloudflow-assets.folderactions-approveallselect'),
                                $.i18n._("nixps-cloudflow-assets.allow-acceptallselect"), "", function () {
                            that._folderActionlistApproveAll(that.m_approvalIDs, 'accept').done(function (pResults) {
                                that._callbackFunctionApprove(that.m_approvalIDs, 'accept', true);
                            }).fail(function (pError) {
                                $('#notify-area').notify("create", "closeable-error", {title: $.i18n._("nixps-cloudflow-assets.errorapprove_title"), text: $.i18n._("nixps-cloudflow-assets.errorapprove_message")});
                                throw new Error(pError);
                            });
                        }, $.noop);
                    });
            dropDownList.DropdownList('addListItem',
                    "actionReject",
                    '<img class="approvalstate reject" src="/portal/images/approval_rejected.png">',
                    $.i18n._('nixps-cloudflow-assets.folderactions-rejectallselect'),
                    false,
                    function () {
                        $('body').Dialog("show_yes_no", $.i18n._('nixps-cloudflow-assets.folderactions-rejectallselect'),
                                $.i18n._("nixps-cloudflow-assets.allow-rejectallselect"), "", function () {
                            that._folderActionlistApproveAll(that.m_approvalIDs, 'reject').done(function (pResults) {
                                that._callbackFunctionApprove(that.m_approvalIDs, 'reject', true);
                            }).fail(function (pError) {
                                $('#notify-area').notify("create", "closeable-error", {title: $.i18n._("nixps-cloudflow-assets.errorapprove_title"), text: $.i18n._("nixps-cloudflow-assets.errorapprove_message")});
                                throw new Error(pError);
                            });
                        }, $.noop);
                    });
            return dropDownList;
        },


        _callbackFunctionApprove: function (approvalIDs, pChoose, pEnableSelect) {
            if (!$.isArray(approvalIDs) || approvalIDs.length === 0) {
                throw new Error('assessIDs must be a array');
            }
            var query = ['approval_id', 'in', approvalIDs];
            var that = this;
            api_async.approval.list(query, ['iterations', 'approval_id'], function (pResult) {
                if ($.isArray(pResult.results) && pResult.results.length > 0) {
                    for (var i = 0; i < pResult.results.length; i++) {
                        // if there are more participiants do noting
                        if (pResult.results[i].iterations[pResult.results[i].iterations.length - 1].participants.length > 1) {
                            that.m_folder_div.FolderView('redraw');
                            return false;
                        }
                        // if assessment, or results does not match: do nothing
                        if (pResult.results[i].iterations[pResult.results[i].iterations.length - 1].participants[0].assessment !== pChoose) {
                            that.m_folder_div.FolderView('redraw');
                            return false;
                        }
                    }
                    // if there is only one participant and the result correspond, than change the approval states
                    if (pEnableSelect === true) {
                        if (pChoose === "accept") {
                            that.m_folder_div.FolderView("action", 'acceptUI');
                        } else if (pChoose === "reject") {
                            that.m_folder_div.FolderView("action", 'rejectUI');
                        }
                    } else {
                        if (pChoose === "accept") {
                            that.m_folder_div.FolderView("action", 'acceptUI', approvalIDs);
                        } else if (pChoose === "reject") {
                            that.m_folder_div.FolderView("action", 'rejectUI', approvalIDs);
                        }
                    }
                }
            }, function (pError) {
                console.error(pError);
            });
        },


        /**
         * @desc function shows and disables the action possibilities according to the seleceted files
         * @function
         * @private
         * @return undefined
         **/
        _updateFolderActionList: function (pDropDown) {
            // enable and disable selection buttons
            var dropDown = pDropDown;
            if ($.isArray(this.m_selectedFiles) && this.m_selectedFiles.length > 0) {
                dropDown.DropdownList('enableItem', 'actionUnselectAll');
            } else {
                dropDown.DropdownList('disableItem', 'actionUnselectAll');
            }

            if (this.lock === true) {
                dropDown.DropdownList('hideItem', 'actionApprove');
                dropDown.DropdownList('hideItem', 'actionReject');
            } else if (this.hasProofscopeLicense === true) {
                dropDown.DropdownList('showItem', 'actionApprove');
                dropDown.DropdownList('showItem', 'actionReject');
                // enable and disable approval buttons
                this.m_approvalIDs = [];
                if ($.isArray(this.m_selectedFiles) && this.m_selectedFiles.length > 0) {
                    this.m_approvalIDs = $.map(this.m_selectedFiles, function (elem, index) {
                        if ($.isArray(elem.approvals) && elem.approvals.length > 0) {
                            for (var assesmentIndex = 0; assesmentIndex < elem.approvals.length; ++assesmentIndex) {
                                var checkAssessment = elem.approvals[elem.approvals.length - 1 - assesmentIndex].assessment;
                                if (checkAssessment === "pending") {
                                    var assessID = elem.approvals[elem.approvals.length - 1 - assesmentIndex].id;
                                }
                            }
                            return assessID;
                        }
                    });
                }
                if ($.isArray(this.m_approvalIDs) && this.m_approvalIDs.length > 0) {
                    dropDown.DropdownList('enableItem', 'actionApprove');
                    dropDown.DropdownList('enableItem', 'actionReject');
                } else {
                    dropDown.DropdownList('disableItem', 'actionApprove');
                    dropDown.DropdownList('disableItem', 'actionReject');
                }
            }
        },


        /**
         * @desc function does the approval call to backend
         * @parm pChoose {string} containing accept or reject, the choose of the user
         * @returns $.Deferred
         **/
        _folderActionlistApproveAll: function (pApprovalIDs, pChoose) {
            if (pChoose !== "accept" && pChoose !== "reject") {
                throw new Error('invalid approval state');
            }

            var defers = [];
            if ($.isArray(pApprovalIDs) && pApprovalIDs.length > 0) {
                var mailaddress = "";
                if (typeof this.user.getEmail() === "string" && this.user.getEmail().length > 0) {
                    mailaddress = this.user.getEmail();
                }
                for (var i = 0; i < pApprovalIDs.length; i++) {
                    (function (SelectedFileIndex) {
                        defers.push(new $.Deferred(function (pDefer) {
                            api_async.approval.assess(pApprovalIDs[SelectedFileIndex], mailaddress, pChoose, pDefer.resolve, pDefer.reject);
                        }));
                    }(i));
                }
            }

            return $.when.apply($, defers);
        },

        /**
         * @description function runs when user press a button
         * @function
         * @param {object} pEvent
         * @param {string} pCommand
         * @returns {undefined}
         */
        shortCutKeyCommand: function(pEvent, pCommand) {
            // control pCommand argument
            if (typeof pCommand !== "string" || pCommand.length < 0) {
                throw new Error('parameter pCommand must be a not empty string');
            }
            // we handle the childs, because it can be changed to a flat stucture in the futur
            // and then we need only change this interfase
            //
            //
            // if child is active, delegate for that child!
            // :visible(=active) :last(=just one child)
            var childs = this.element.find('.nixps-asset-AssetView:visible:last');
            if (childs.length > 0) {
                // child is visible (=active)
                childs.AssetView('shortCutKeyCommand', pEvent, pCommand);
            } else {
                // runs separated handler functions
                if (pCommand === "cmdF") {
                    this._commandFKeyHandler(pEvent);
                } else if (pCommand === "cmdX") {
                    this._commandXKeyHandler(pEvent);
                } else if (pCommand === "cmdC") {
                    this._commandCKeyHandler(pEvent);
                } else if (pCommand === 'cmdV') {
                    this._commandVKeyHandler(pEvent);
                } else if (pCommand === 'space') {
                    this._commandSpaceKeyHandler(pEvent);
                } else {
                    throw new Error('pCommand ' + pCommand + " is not supported");
                }
            }
        },

        blockView: function () {
            var that = this;
            api_async.folder.has_tag(that.options.url, 'nixps.block', function (pResults) {
                // control if the tag blocking is there
                if (pResults.has_tag === true) {
                    // do specific logic, in future load logic
                    // get all approvals
                    api_async.asset.list_with_options(["sub", "equal to", "", "and", "cloudflow.enclosing_folder", "equal to", that.options.url],
                            [], ["approvals"], {"use_index": "Asset_EnclosingFolderURL"}, function (pResults) {
                        //  is result good interfase? otherwise do not block
                        if ($.isArray(pResults.results)) {
                            var block = false;
                            // loop over approvals, if some has no approvals, break and loop
                            for (var i = 0; i < pResults.results.length; i++) {
                                if (!$.isArray(pResults.results[i].approvals)) {
                                    block = true;
                                    break;
                                }
                            }
                            if (block === true) {
                                // make freeze
                                that.freezeOverlay.FreezeOverlay({text: $.i18n._('nixps-cloudflow-assets.blocked_view')});
                                that.freezeOverlay.FreezeOverlay('show').css({top: 128});
                                // set repeat loop
                                that.timerBlockID = setTimeout(function () {
                                    that.blockView();
                                }, 10000);
                            } else {
                                that.unblockView();
                            }
                        } else {
                            that.unblockView();
                        }
                    });
                } else {
                    //tag is not there, or was removed.
                    that.unblockView();
                }
            });
        },
        /**
         * @description unblock the ui, so user can play and view, replace the files.
         * @function
         * @returns {undefined}
         **/
        unblockView: function () {
            if (this.freezeOverlay.is(':visible:nixps-FreezeOverlay')) {
                this.freezeOverlay.FreezeOverlay('hide').css({top: ''});
                this.freezeOverlay.FreezeOverlay('option', 'text', "");
                clearTimeout(this.timerBlockID);
            }
        },


        _makeAssetWorkFlow: function () {
            var that = this;
            // make and prepare kiosk dialog in background
            this.assetWorkflow.KioskDialog({
                language: that.options.language,
                refreshDelay: 1000,
                whitepaper: kWhitepapername,
                inputname: kInputName,
                enableTopBar: true,
                enableRefreshButton: false,
                enableSystemFlows: true,
                close: function (pEvent, pData) {
                    // if closed is fired, we suppose it was add a moment open
                    // so we suppose it was allowed at that time
                    if (that.fileView === "folder") {
                        that.m_folder_div.show();
                    }
                    that.extraCustomButtons = [{action:'runworkflow', class:'asset-run-workflow externButton', label: 'nixps-cloudflow-assets.action-run_workflow'}];
                    that.resetButtons();
                    that.freezeOverlay.FreezeOverlay('hide').css({top: ''});
                },
                workflowend: function (pEvent, pData) {
                    $(this).KioskDialog('close');
                    if (that.fileView === "folder") {
                        that.m_folder_div.show();
                    }
                },
                hold: function (pEvent, pData) {
                    that.freezeOverlay.FreezeOverlay('hide').css({top: ''});
                }
            }).css({
                position: 'absolute',
                width: '100%',
                bottom: 0,
                top: 291,
                background: '#FFF'
            });

            return this._updateAssetWorkFlow();
        },

        _updateAssetWorkFlow: function() {
            var that = this;
            return this.assetWorkflow.KioskDialog('existWorkflow', kWhitepapername, kInputName).done(function (pExist) {
                // if exist than add click event listener
                if (pExist === true) {
                    /* show when found, default hided */
                    that.extraCustomButtons = [{action:'runworkflow', class:'asset-run-workflow externButton', label: 'nixps-cloudflow-assets.action-run_workflow'}];
                } else {
                    that.extraCustomButtons = [];
                }
            }).fail(function(pError) {
                that.extraCustomButtons = [];
            });
        },

        _closeAssetWorkFlow: function () {
            if (this.assetWorkflow.is(':nixps-cloudflow-KioskDialog') && this.assetWorkflow.KioskDialog('isOpen')) {
                this.assetWorkflow.KioskDialog('close');
            }
        },

        /**
         * @description sets the option
         * @function
         * @private
         * @name nixps-asset.AssetView#_setOption
         */
        _setOption: function (pKey, pValue) {
            this._superApply(arguments);
            this._controlOptions();
            this._draw();
        },

        /**
         * @description control the input options and throw a error if needed
         * @name nixps-asset.AssetView#_controlOptions
         * @function
         * @private
         * @returns {undefined}
         */
        _controlOptions: function () {
            if (this.options.startUpOptions.openMode !== undefined && this.options.startUpOptions.openMode !== "" && this.options.startUpOptions.openMode !== "book") {
                throw new Error('input option openMode must be undefind or a empty string or must be equal to "book');
            }
            if (this.options.startUpOptions !== undefined && typeof this.options.startUpOptions.view === "string" && this.options.startUpOptions.view.length > 0) {
                if($.inArray(this.options.startUpOptions.view, ['icon', 'list']) < 0) {
                    throw new Error('option in startUpOptions view must be icon or list');
                }
            }
            if(this.options.startUpOptions !== undefined && $.isFunction(Query)) {
                // if there are startupoptions and if the utility file Query is available to be used for control
                // so start check interface
                var result = Query.hasGoodOrderByQueryInterface(this.options.startUpOptions.sortingColumn, ["file_name", "filetype", "modtime", "cloudflow.enclosing_folder"]);
                // result is true or is a string containing the error message
                if (typeof result === "string") {
                    // notify wrong url parameters
                    $('#notify-area').notify("create", "closeable-error", {title: $.i18n._("nixps-cloudflow-assets.errormessage_urlparameters"), text: result}, {expires: false});
                    throw new Error(result);
                }
            }
            if (typeof this.options.url !== "string") {
                throw new Error('input option url must be a string');
            }
            if (typeof this.options.sub !== "string") {
                throw new Error('input option sub must be a string');
            }
            if (typeof this.options.enableGoBackBrowsing !== "boolean") {
                throw new Error('input option enableGoBackBrowsing must be a boolean');
            }
            if ($.isArray(this.options.rootFolders) === false) {
                throw new Error('input option rootFolders must be a array');
            }
            if ($.isArray(this.options.rootFiles) === false) {
                throw new Error('input option rootFiles must be a array');
            }
            if (typeof this.options.rootFoldersAndFilesTitle !== "string") {
                throw new Error('input option rootFoldersAndFilesTitle must be a string');
            }
        }

    });

})(jQuery);
