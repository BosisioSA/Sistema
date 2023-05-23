/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 *
 *   created by guillaume on Sep 28, 2016 5:06:06 PM
 */
/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */

(function ($) {

    function getDedicatedFileIcon(pFileType) {
        switch (pFileType) {
            // images
            case "application/pdf":
                return "/portal/images/asset/file_pdf.svg";
            case "application/vnd.adobe.illustrator":
                return "/portal/images/asset/file_ai.svg";
            case "image/jpeg":
                return "/portal/images/asset/file_jpg.svg";
            case "image/png":
                return "/portal/images/asset/file_png.svg";
            case "image/tiff":
                return "/portal/images/asset/file_tiff.svg";
            case "application/x-font-opentype":
            case "application/x-font-truetype":
                return "/portal/images/asset/file_font.svg";
            case "text/xml":
                return "/portal/images/asset/file_xml.svg";
            case "text/html":
                return "/portal/images/asset/file_HTML.svg";
            // unsupported images
            case "application/postscript":
            case "application/ic3d-ic3":
            case "application/x-cad-cff2":
            // resources
            case "application/vnd.iccprofile":

            case "application/vnd.nixps-curve+json":
            // other most common file types
            case "application/vnd.ms-excel":
            case "application/zip":
            case "application/json":

            default:
                return "/portal/images/asset/file_blanknote.svg";
        }
    }

    var kLabelFileStoreRoot = 'nixps-cloudflow-assets.filetype-filestore_root';
    var kLabelAllFileStores = 'nixps-cloudflow-assets.all_filestores';

    /**
     * @namespace nixps-asset.AssetHeader
     * @description The header of asset information panel
     * @example $('<div>').AssetHeader({});
     */
    $.widget("nixps-asset.AssetHeader", $.Widget, {

        options: {
            /**
             * @name nixps-asset.AssetHeader#url
             * @description The usrl if the file/folder we are lokking to.
             * @type {String}
             * @default ""
             */
            url: '',

            /**
             * @name nixps-asset.AssetHeader#sub
             * @description This is the sub of a file. This is used to see the details of a separated page of one composed files that have multiple pages.
             * @type {String}
             * @default ""
             */
            sub: '',

            /**
             * @name nixps-asset.AssetHeader#baselocation
             * @description The base url of the folders you want to see
             * @type {string}
             * @default ""
             */
            baselocation: "",

            /**
             * @name nixps-asset.AssetHeader#buttons
             * @description The buttons to show ans some attributes to handle. Each item is a object containing next key/value.
             * <ol>
             *  <li> class: the class names that will be added </li>
             *  <li> action: the name to be append on "action" for the event name, that will be use when user on click. event name will be "action"[action value] </li>
             *  <li> label: the i18n label code to be added as text, as button text </li>
             * </ol>
             * @type {array}
             */
            buttons: [
                /*{ class: 'asset-replace assetButton', action:'replace', label: 'nixps-cloudflow-assets.action-replace_file'},
		        { class: 'asset-approval assetButton', action:'approval', label: ''},
                { class: 'asset-listview folderButton', action:'listview', label: 'nixps-cloudflow-assets.action-switch-list_view'},
                { class: 'asset-iconview folderButton', action:'iconview',label: 'nixps-cloudflow-assets.action-switch-icon_view'},
                { class: 'asset-readerview folderButton', action:'readerview', label: 'nixps-cloudflow-assets.action-switch-readers_view'},
                { class: 'asset-upload folderButton', action:'upload', label: 'nixps-cloudflow-assets.action-upload_file'},
                { class: 'asset-viewer assetButton internButton', action:'viewer', label: 'nixps-cloudflow-assets.action-view_file'},
                { class: 'asset-viewbook folderButton', action:'viewbook', label: 'nixps-cloudflow-assets.action-view_book'},
                { class: 'asset-folderactions', action:'folderactions',label: '', dropdown: true},
                { class: 'asset-stack-viewer', action:'stackviewer',label: 'nixps-cloudflow-assets.action-view_combined_file'},
                { class: 'asset-reset-metadata internButton', action:'resetmetadata',label: 'nixps-cloudflow-assets.action-recalculate_metadata'},
                { class: 'asset-reset-thumb internButton', action:'resetthumb',label: 'nixps-cloudflow-assets.action-recalculate_thumb'},
                { class: 'asset-reset-render assetButton internButton', action:'resetrender', label: 'nixps-cloudflow-assets.action-rerender_asset'},
                { class: 'asset-run-workflow externButton', action:'runworkflow',label: 'nixps-cloudflow-assets.action-run_workflow'},
                { class: 'asset-compare assetButton internButton', action:'compare', label: 'nixps-cloudflow-assets.action-compare_asset'},
                { class: 'asset-stack-compare', action:'stackcompare', label: 'nixps-cloudflow-assets.action-compare_combined_asset'}*/
            ],

            /**
             * @name nixps-asset.AssetHeader#lock
             * @description must we block the file or folder for some actions or not?
             * @type {boolean}
             * @default false
             */
            lock: false,

            /**
             * @name nixps-asset.AssetHeader#assetData
             * @description The data of the file/folder to show all the needed information on the header
             * @type {object}
             * @default {}
             */
            assetData: {},

            /**
             * @description the label for using as "filestore root"
             * @default 'nixps-cloudflow-assets.filetype-filestore_root'
             * @type {string}
             */
            labelFileStoreRoot: kLabelFileStoreRoot,

            /**
             * @description the label for using as "All Silestores"
             * @default 'nixps-cloudflow-assets.all_filestores'
             * @type {string}
             */
            labelAllFileStores: kLabelAllFileStores,

            /**
             * @description the root url to show in the breadcrumb to customize it
             * @type {string}
             * @default ""
             */
            rootUrl: "",

            /**
             * @description The title to give on the breadcrumb, to customise this
             * @type {string}
             * @default ""
             */
            rootTitle: "",
            
            /**
             * @description must we be able to download the file
             * @type {Boolean}
             * @default false
             */
            enableDownload: false,

            /**
             * @name nixps-asset.AssetHeader#searchOnTyping
             * @description must we search durint typing or not?
             * @type {Boolean}
             * @default true
             */
            searchOnTyping: true
        },

        /**
         * @description create the component
         * @name nixps-asset.AssetHeader#_create
         * @function
         * @private
         * @returns {undefined}
         */
        _create: function () {
            this._controlOptions();
            this.element.addClass(this.widgetFullName).addClass('asset-preview');

            this.fileView = "folder";
            this.lastSearchString = ""; // save the last search string, to force searching only if there is a change
            this._draw();

            var fileactionlistbutton = $('<div>').addClass("fileactionlistbutton").css({
                    'position': 'absolute', 'top': 10, "right": 15, "z-index": 1
                });;
            this.element.append(fileactionlistbutton);
            this._delay(function(){
                this.element.find(".fileactionlistbutton").RunningActionListButton({});
            });

            this.m_advanced_search = null;
            this.searchThrottle = _.debounce($.proxy(this._search, this), 900);

            this._on(this.element, {
               "keyup .asset-search": this._keyUpSearchHandler,
               "click .search-icon": this._clickSearchIconHandler,
               "click .asset-actions button": this._clickActionHandler,
               "click .more-search-settings": this._clickMoreSearchSettingsHandler,
               "cloudflowquerypanelchange": this._advancedQueryChangeHandler,
               "click .removeSearchTextIcon": this._removeSearchTextHandler,
               "click .downloadButton": this._downloadClickHandler,
               "click .searchwhiletypingicon": this._seachTypeModeChangeHandler
            });
        },

        /**
         * @description function runs when user is being serching, pressing key in the search input field
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _keyUpSearchHandler: function(pEvent, pData) {
            // do not take shortcut if pForce is set on true
            if (this.element.find('.asset-search').val() !== this.lastSearchString) {
                this.element.children('.search-container').addClass('searching');
            }
            if (this.options.searchOnTyping === false && pEvent.which !== $.ui.keyCode.ENTER) {
                // block if key is not "enter" > do the search if user press ENTER
                return;
            }
            this.element.children('.search-container').removeClass('searching');
            this.searchThrottle();
        },

        /**
         * @description function runs when user seach by clicking the search button
         * @function
         * @private
         * @param {Object} pEvent 
         * @param {Object} pData 
         */
        _clickSearchIconHandler: function(pEvent, pData){
            if (this.options.searchOnTyping === true) {
                return;
            }
            this.searchThrottle();
            // remove class to hide some
            this.element.children('.search-container').removeClass('searching');
        },

        /**
         * @description fucntion runs when user click on a button, that is not a internal button, internal buttons are managed by the component itself
         * others are manage by outside the component
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _clickActionHandler: function(pEvent, pData) {
            var action = $(pEvent.target).closest('[data-action]').attr('data-action');
            this._trigger('action' + action, pEvent, {url: this.options.url});
        },

        /**
         * @description function runs when user click on the search more, to show and hide the advanced search module.
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _clickMoreSearchSettingsHandler: function(pEvent, pData) {
            if (this.m_advanced_search === null) {
                this._search(true, ["file_name", "contains", ""]); // force to open and create panel
            }
            if (this.element.find('.asset-advanced-search').is(':hidden')) {
                this.element.find('.asset-advanced-search').show();
                this.element.find('.search-container .more-search-settings')._t('nixps-cloudflow-assets.action-advanced-search-hide');
            } else {
                this.element.find('.asset-advanced-search').hide();
                this.element.find('.search-container .more-search-settings')._t('nixps-cloudflow-assets.action-advanced-search-show');
            }
        },

        /**
         * @description fucntion runs when the user changed some thing in the query
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _advancedQueryChangeHandler: function(pEvent, pData) {
            this.searchThrottle(true);
        },  

        /**
         * @description function runs when user want to remove a searchtext
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _removeSearchTextHandler: function(pEvent, pData) {
            this.element.find('input.asset-search').val("");
            this._search();
            this.element.find('.asset-search').removeClass('searching');
        },
        
        /**
         * @description function runs when user click on download button
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _downloadClickHandler: function(pEvent, pData) {
            if (typeof this.options.url === "string" && this.options.url.length > 0 && this.fileView === "file") {
                location.href = this.options.baselocation + "/portal.cgi?asset=download_file&url=" + encodeURIComponent(this.options.url);
            }
        },

        /**
         * @description function runs when user clicked on the seach while typing icon
         * @function
         * @private
         * @param {Object} pEvent 
         * @param {Object} pData 
         */
        _seachTypeModeChangeHandler: function(pEvent, pData){
            var currentOn = $(pEvent.currentTarget).closest(".search-container").hasClass("searchOnTyping");
            if (currentOn === true) {
                this.options.searchOnTyping = false;
                $(pEvent.currentTarget).closest(".search-container").removeClass("searchOnTyping");
            } else {
                this.options.searchOnTyping = true;
                $(pEvent.currentTarget).closest(".search-container").addClass("searchOnTyping")
            }
            this._trigger("changesearchmode", pEvent, {"searchOnTyping": this.options.searchOnTyping});
        },

        /**
         * @description redraw the component
         * @function
         * @name nixps-asset.AssetHeader#redraw
         */
        redraw: function () {
            this._draw();
        },

        /**
         * @description draws the dialog according to the current state
         * @function
         * @private
         * @name nixps-asset.AssetHeader#_draw
         * @return {undefined}
         */
        _draw: function () {
            var rootIcon = "<img class='filestoreIcon' src='/portal/images/asset/20170307_icon_Filestore.svg'><span class='breadcrumb_rootname'></span>";
            this.element.append($('<div>').addClass('asset-breadcrumb').BreadCrumb({url: this.options.url, rootIcon: rootIcon, callback: $.proxy(this._breadCrumbClickHandler, this)}))
                        .append("<div class='asset-thumb'><center><img src='/portal/images/no_thumb.png' /><div class='loadingtext'>" + $.i18n._('nixps-cloudflow-assets.loadingtext') + "</div><span class='fa fa-download fa-lg downloadButton'></span></center></div>")
                        .append("<div class='asset-text'><span class='asset-name'/><br/><span class='fa fa-lock lockIcon' style='margin-right:5px;display:none;' /><span class='asset-type'/></div>");
            var actions = $("<div class='asset-actions'>");
            this.element.append(actions);

            this._drawButtons();

            this.element.append("<span class='search-container " + ((this.options.searchOnTyping) ? "searchOnTyping" : "") + "'>  <span class='more-search-settings' data-enable='false' >" + $.i18n._("nixps-cloudflow-assets.action-advanced-search-show") + "</span>" +
                "  <span class='fa fa-reply-all fa-rotate-270 searchwhiletypingicon' title='" + $.i18n._("nixps-cloudflow-assets.searchontyping_tooltip") + "'></span>"+
                "	<input class='asset-search'/><span class='fa fa-search search-icon'></span><span class='fa fa-times removeSearchTextIcon'></span> "+
                "   </span>");

            // used to show general messages like expering licenses
            this.element.append("<div style='margin: 5px 15px' class='global-msgs'></div>");

            // Create search panel skeleton
            this.element.append($("<div class='asset-advanced-search query-builder'/>").hide());

            this._setLocking();
            this._setLoadingThumb();
        },

        /**
         * @description redraw all the buttons form options "buttons"
         * @function
         * @private
         * @returns {undefined}
         */
        _drawButtons: function() {
            var that = this;
            var actions = this.element.find('.asset-actions');
            actions.children('[data-externalLinked=true]').detach();
            actions.children().remove();
            for (var i=0; i< this.options.buttons.length; i++) {
                if (this.options.buttons[i].dropdown !== true) {
                    // if normal button
                    actions.append($('<button>').addClass(this.options.buttons[i].class)
                                                ._t(this.options.buttons[i].label)
                                                .attr('data-action', this.options.buttons[i].action)
                                                .attr('data-externalLinked', (this.options.buttons[i].externalLinked === true) ? "true": null)
                                                .prop('disabled', this.options.buttons[i].disabled === true)
                                                .each(function() {
                                                    if( typeof that.options.buttons[i].html === "string" && that.options.buttons[i].html.length > 0) {
                                                        $(this).html(that.options.buttons[i].html);
                                                    }
                                                }));
                } else {
                    // if dropdown
                    var content = $(that.options.buttons[i].content);
                    content.attr('data-externalLinked', (this.options.buttons[i].externalLinked === true) ? "true": null);
                    actions.append(content);
                }
            }
        },

        /**
         * @description function runs when user press a item on the breadcrumb
         * @function
         * @private
         * @param {string} pUrl
         * @param {string} pSub
         * @returns {undefined}
         */
        _breadCrumbClickHandler: function(pUrl, pSub) {
            this._trigger('update', null,  {url: pUrl, sub: pSub});
        },

        /**
         * @name nixps-asset.AssetHeader#AssetHeader
         * @description Get the current pagenumber, one based
         * @function
         * @returns {Number}
         */
        _getPageNumber: function() {
            if (typeof this.options.sub === "string" && this.options.sub.indexOf('p_') === 0) {
                return parseInt(this.options.sub.slice(2)) + 1;
            }
            return null;
        },

        /**
         * @name nixps-asset.AssetHeader#_updateData
         * @description Update the panel of new data
         * @function
         * @private
         * @param {object | assetData} pData -  all the data of the asset, needed to show all the information
         * @returns {undefined}
         */
        _updateData: function() {
            if (this.options.assetData.filetype === undefined) {
                if (this.options.assetData.sites_root === true) {
                    this.fileView = "site";
                    this.element.find('.asset-advanced-search').hide();
                    this.element.find(".search-container").hide();
                    this.element.find(".downloadButton").hide();
                } else {
                    this.fileView = "folder";
                    // show advanced search if user was searching before
                    if(this.m_advanced_search !== null && this.m_advanced_search.CloudflowQueryPanel("getValue").length > 0) {
                        this.element.find('.asset-advanced-search').show();
                    }
                    this.element.find(".search-container").show();
                    this.element.find(".downloadButton").hide();
                }
            } else {
                this.fileView = "file";
                // hide search panel
                this.element.find('.asset-advanced-search').hide();
                this.element.find(".search-container").hide();
                this.element.find(".downloadButton").css("display", (this.options.enableDownload === true) ? "" : "none");
            }
            // show the parent panel of buttons
            this.element.find('.asset-actions').show();

            this._setThumb(this.options.assetData);
            this._setName(this.options.assetData);
            this._setType(this.options.assetData);
        },

        _setLocking: function() {
            if (this.options.lock === true) {
                this.element.find('.lockIcon').show();
            } else {
                this.element.find('.lockIcon').hide();
            }
        },

        _setUrl: function() {
            if (this.options.url === "") {
                // hide if all sites and all file stores
                this.element.find('.asset-breadcrumb').hide();
            } else {
                this.element.find('.asset-breadcrumb').BreadCrumb('update_root', this.options.url).show();
            }
            // for now we suppose this.fileView has old value
            // if previues was folder en next is folder do not set loading
            if( !(this.fileView === "folder" && this.options.url[this.options.url.length - 1] === "/")) {
                this._setLoadingThumb();
            }
            this._setName();
        },

        _setName: function(pData) {
            if (!$.isEmptyObject(pData) && pData.sites_root === true) {
                // overview sites
                this.element.find(".asset-name")._t('nixps-cloudflow-assets.all_sites');
            } else if (!$.isEmptyObject(pData) && typeof pData.file_name === "string" && pData.file_name.length > 0) {
                // name of file
                this.element.find(".asset-name").text(pData.file_name);
            } else if (this.options.url === "") {
                // local filestore when no sites found
                this.element.find(".asset-name")._t(this.options.labelAllFileStores);
            } else {
                // folder view
                var final_path = this.options.url;
                if (final_path[final_path.length - 1] === "/")
                {
                    final_path = final_path.substring(0, final_path.length - 1);
                }
                this.element.find(".asset-name").text(decodeURIComponent(final_path.substring(final_path.lastIndexOf('/') + 1)));
            }
        },

        _setType: function(pData) {
            if (this.fileView === "site") {
                this.element.find(".asset-type")._t('nixps-cloudflow-assets.filetype-sites_root');
            } else if (this.fileView === "folder") {
                if (this.options.url.indexOf("/") === -1) {
                    this.element.find(".asset-type")._t(this.options.labelFileStoreRoot);
                } else {
                    this.element.find(".asset-type")._t('nixps-cloudflow-assets.filetype-folder');
                }
            } else {
                var fileName = nixps_utils.get_descriptive_filetype(pData.filetype);
                // Prefix pagecount for relevant filetypes
                if (typeof this._getPageNumber() === "number") {
                    fileName = $.i18n._('nixps-cloudflow-assets.filetype-document_with_multiple_pages', [this._getPageNumber(), ""]);
                } else if (pData.pagecount > 1) {
                    fileName = $.i18n._('nixps-cloudflow-assets.filetype-document_with_multi_page', [fileName]);
                }

                this.element.find(".asset-type").text(fileName);
            }
        },

        _setThumb: function(pData) {
            // start setting thumbnail
            if (this.fileView === "site") {
                // temp for the moment
                this.element.find('.asset-thumb img').attr('src', "/portal/images/asset/20170307_icon_Site.svg").addClass("transparent thumbIcon").removeClass('loading');
            } else if (this.fileView === "folder") {
                if (this.options.url.indexOf("/") === -1) {
                    this.element.find('.asset-thumb img').attr('src', "/portal/images/asset/20170307_icon_Filestore.svg").addClass("transparent thumbIcon").removeClass('loading');
                } else {
                    this.element.find(".asset-thumb img").attr("src", "/portal/images/asset/20170307_icon_Folder.svg").addClass("transparent thumbIcon").removeClass('loading');
                }
            // or if it is a file
            } else if (typeof pData.thumb === "string" && pData.thumb.length > 0) {
                this.element.find(".asset-thumb img").attr("src", this.options.baselocation + pData.thumb)
                                                     .removeClass('loading thumbIcon')
                                                     .error(function() {
                                                        var wrongUrl = $(this).attr("src");
                                                        if(pData !== undefined && typeof pData.filetype === "string" && pData.filetype.length > 0) {
                                                            var newThumb = getDedicatedFileIcon(pData.filetype);
                                                            if (wrongUrl !== newThumb) {
                                                                $(this).attr("src", newThumb);
                                                            }
                                                        }
                                                     });
            } else if (pData.filetype === "application/json" && pData.file_extension === ".lmslayout") {
                var that = this;
                api_async.file.read_string(pData.cloudflow.part, function(pString) {
                    var layout = JSON.parse(pString.contents);
                    if ($.isPlainObject(layout.lms) === true && typeof layout.lms.thumbnail === "string") {
                        that.element.find(".asset-thumb img").attr('src', layout.lms.thumbnail).removeClass('loading thumbIcon');
                    }
                    else if ($.isPlainObject(layout.data) === true && typeof layout.data.thumbnail === "string") {
                        that.element.find(".asset-thumb img").attr('src', layout.data.thumbnail).removeClass('loading thumbIcon');
                    }
                    else {
                        // Transparent image
                        that.element.find(".asset-thumb img").attr('src', "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
                    }
                }, function(pError) {
                    that.element.find(".asset-thumb img").attr('src', "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
                });
            } else {
                var dedicatedThumb = getDedicatedFileIcon(pData.filetype);
                this.element.find(".asset-thumb img").attr("src", dedicatedThumb).removeClass('loading thumbIcon');
            }
        },

        _setLoadingThumb: function() {
            this.element.find(".asset-thumb img").attr("src", "/portal/images/loading-cloudflow.gif").addClass("transparent loading");
        },

        _setRootSettings: function() {
            if (typeof this.options.rootUrl === "string" && this.options.rootUrl.length > 0) {
                var breadCrumbOptions = {'rootUrl': this.options.rootUrl};
                if (typeof this.options.rootTitle === "string" && this.options.rootTitle.length > 0) {
                    breadCrumbOptions.rootIcon = this.options.rootTitle;
                }
                this.element.find('.asset-breadcrumb').BreadCrumb('option', breadCrumbOptions);
            }
        },

        _search: function (pForce, pStartUpQuery) {
            var query = [];
            var searchString = this.element.find('.asset-search').val();
            // do not take shortcut if pForce is set on true
            if (pForce !== true && searchString === this.lastSearchString) {
                return null; // there is no change found, do nothing
            }
            // there was a change, save the new search
            this.lastSearchString = searchString;
            if (typeof searchString === "string" && searchString.length > 0) {
                query = ["searchstring", "contains text like", searchString];
            }
            if (pForce === true && this.m_advanced_search === null) {
                var that = this;
                var setOperators = ['equal', 'contains', 'begins_with', 'ends_with', 'is_like', 'contains_text_like', 'begins_like', 'ends_like'];
                var validation = {
                    allow_empty_value: true
                };
                
                this.m_advanced_search = this.element.find('.asset-advanced-search').CloudflowQueryPanel({
                    allow_groups: true,
                    saveContext: "nixps.assetview",
                    showConfigurationButton: true,
                    collection: [
                    {
                        id: 'document_name',
                        field: 'document_name',
                        label: $.i18n._('nixps-cloudflow-assets.search_field-document_name'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    },
                    {
                        id: 'file_extension',
                        field: 'file_extension',
                        label: $.i18n._('nixps-cloudflow-assets.search_field-file_extension'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    },
                    {
                        id: 'file_name',
                        field: 'file_name',
                        label: $.i18n._('nixps-cloudflow-assets.search_field-file_name'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    },
                    {
                        id: 'mime_types',
                        field: 'mime_types',
                        label: $.i18n._('nixps-cloudflow-assets.search_field-mime_type'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    },
                    {
                        id: 'metadata.output_color_space.colorants.name',
                        field: 'metadata.output_color_space.colorants.name',
                        label: $.i18n._('nixps-cloudflow-assets.search_field-colorant_name'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    },
                    {
                        id: 'metadata.layers.name',
                        field: 'metadata.layers.name',
                        label: $.i18n._('nixps-cloudflow-assets.search_field-layer_name'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    },
                    {
                        id: 'metadata.references.file_name',
                        field: 'metadata.references.file_name',
                        label: $.i18n._('nixps-cloudflow-assets.search_field-referenced_file_name'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    },
                    {
                        id: 'metadata.originals.file_name',
                        field: 'metadata.originals.file_name',
                        label: $.i18n._('nixps-cloudflow-assets.search_field-file_name_of_original_file'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    },
                    {
                        id: 'metadata.output_color_space.colorants.halftones.parameters',
                        field: 'metadata.output_color_space.colorants.halftones.parameters',
                        label: $.i18n._('nixps-cloudflow-assets.search_field-halftone'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    },
                    {
                        id: 'metadata.barcodes.type',
                        field: 'metadata.barcodes.type',
                        label: $.i18n._('nixps-cloudflow-assets.search_field-barcode_type'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    },
                    {
                        id: 'metadata.barcodes.code',
                        field: 'metadata.barcodes.code',
                        label: $.i18n._('nixps-cloudflow-assets.search_field-barcode_code'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    },
                    {
                        id: 'metadata.job.job_id',
                        field: 'metadata.job.job_id',
                        label: $.i18n._('nixps-cloudflow-assets.search_field-job_id'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    },
                    {
                        id: 'metadata.tags',
                        field: 'metadata.tags',
                        label: $.i18n._('nixps-cloudflow-assets.metadata-tag_tab_title'),
                        type: 'string',
                        operators: setOperators,
                        validation: validation
                    }, {
                        id: 'approvals.assessment',
                        field: 'approvals.assessment',
                        label: $.i18n._('nixps-cloudflow-assets.list_column-approval'),
                        type: 'string',
                        input: 'select',
                        values: {
                            'accept': $.i18n._('nixps-cloudflow-assets.status_approved'),
                            'pending': $.i18n._('nixps-cloudflow-assets.status_waiting_approval'),
                            'reject': $.i18n._('nixps-cloudflow-assets.status_rejected')
                        },
                        operators: ['equal', 'not_equal'],
                        validation: validation
                    }
                ]
            });

                var startUpQuery = [];
                if ($.isArray(pStartUpQuery) && pStartUpQuery.length > 0) {
                    startUpQuery = pStartUpQuery;
                }
                this.m_advanced_search.CloudflowQueryPanel("setValue", startUpQuery);

                var that = this;

                if (typeof this.timer === "number") {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
            }


            if (this.m_advanced_search !== null) {
                var advancedQuery = this.m_advanced_search.CloudflowQueryPanel("getValue");
                if (advancedQuery.length !== 0) {
                    if (query.length !== 0) {
                        query = query.concat(['and', '(']).concat(advancedQuery);
                        query.push(')');
                    } else {
                        query = advancedQuery;
                    }
                }
            }

            this._trigger("search", null, {searchquery: query});
        },

        _setOptions: function(pOptions) {
            var that = this;

            $.each( pOptions, function( key, value ) {
                that._setOption( key, value );
            });

            this._controlOptions();

            if (typeof pOptions.rootUrl === "string" || typeof pOptions.rootTitle === "string") {
                this._setRootSettings();
            }
            if (typeof pOptions.url === "string" || typeof pOptions.sub === "string") {
                this._setUrl();
            }
            if ($.isPlainObject(pOptions.assetData) === true || $.isArray(pOptions.assetData)) {
                this._updateData();
            }
            if ($.isArray(pOptions.buttons)) {
                this._drawButtons();
            }
            if (typeof pOptions.lock === "boolean") {
                this._setLocking();
            }
            if (typeof pOptions.site === "string") {
                this._setName();
            }
            if (typeof pOptions.baselocation === "string") {
                if (this.options.assetData !== undefined) {
                    this._setThumb(this.options.assetData);
                }
            }
            if (typeof pOptions.searchOnTyping === "boolean") {
                this.element.children(".search-container").toggleClass("searchOnTyping", this.options.searchOnTyping);
            }
        },

        /**
         * @description sets the option
         * @function
         * @private
         * @name nixps-asset.AssetHeader#_setOption
         */
        _setOption: function (pKey, pValue) {
            this._superApply(arguments);
        },

        /**
         * @name nixps-asset.AssetHeader#getSearchString
         * @description get the current text in the search input field
         * @function
         * @return {unresolved}
         */
        getSearchString: function() {
            return this.element.find(".asset-search").val();
        },

        /**
         * @name nixps-asset.AssetHeader#searchOnString
         * @description Set the search input field to a specific string. The search event is also fired
         * @function
         * @param {string} pSearchString - The text to search on
         * @returns {undefined}
         */
        searchOnString: function(pSearchString) {
            if (typeof pSearchString === "string" && pSearchString.length > 0) {
                this.element.find(".asset-search").val(pSearchString);
                // someone force to search, save in last save
                this.lastSearchString = pSearchString;
                this.element.find('.asset-search').addClass('searching');
                this._trigger("search", null, {searchquery: ["searchstring", "contains text like", pSearchString]});
            }
        },

        /**
         * @description control the input options and throw a error if needed
         * @name nixps-asset.AssetHeader#_controlOptions
         * @function
         * @private
         * @returns {undefined}
         */
        _controlOptions: function () {
            if (typeof this.options.url !== "string") {
                throw new Error('input option url must be a string');
            } else if (this.options.url === "X") {
                this.options.url = "";
            }
            if (typeof this.options.sub !== "string") {
                throw new Error('input option sub must be a string');
            }
            if (typeof this.options.baselocation !== "string") {
                throw new Error('input option baselocation must be a string');
            }
            if (typeof this.options.lock !== "boolean") {
                throw new Error('input option lock must be a boolean');
            }
            if (!$.isArray(this.options.buttons)) {
                throw new Error('input option buttons must be a array');
            } else if (this.options.buttons.length > 0) {
                for (var i=0; i< this.options.buttons.length; i++) {
                    if ($.isEmptyObject(this.options.buttons[i]) || !$.isPlainObject(this.options.buttons[i])) {
                        throw new Error('input option buttons element ' + i + " must be a object");
                    }
                    if (typeof this.options.buttons[i].action !== "string" || this.options.buttons[i].action.length <= 0) {
                        throw new Error('input option buttons element ' + i + " must have a action parameter");
                    }
                }
            }
            if (typeof this.options.labelFileStoreRoot !== "string") {
                this.options.labelFileStoreRoot = kLabelFileStoreRoot;
            }
            if (typeof this.options.labelAllFileStores !== "string") {
                this.options.labelAllFileStores = kLabelAllFileStores;
            }
            if (typeof this.options.enableDownload !== "boolean") {
                throw new Error("AssetHeader._controlOptions input option enableDownload must be a boolean");
            }
            if (typeof this.options.searchOnTyping !== "boolean") {
                throw new Error("AssetHeader._controlOptions input option searchOnTyping must be a boolean");
            }
        }

    });

})(jQuery);
