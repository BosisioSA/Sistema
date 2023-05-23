/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 * 
 *   created by guillaume on Sep 28, 2016 9:32:37 AM
 */
/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */

(function ($) {
    /**
     * @namespace nixps-asset-CompareLoader
     * @description A panel to show a assetView for choosing a other file to compare with
     */
    $.widget("nixps-asset.CompareLoader", $.Widget, {
        widgetEventPrefix: "compareloader",
        options: {
            /**
             * @name nixps-asset.CompareLoader#language
             * @description The language of the user
             * @type {String}
             * @default "en"
             */
            language: "en",
            
            /**
             * @name nixps-asset.CompareLoader#url
             * @description The url of the folder view on creation.
             * @type {String}
             * @default ""
             */
            url: '',
            
            /**
             * @name nixps-asset.CompareLoader#site
             * @description The site of the currentviewer
             * @type {string}
             * @default ""
             */
            site: "",
            
            /**
             * @name nixps-asset.CompareLoader#currentSite
             * @description The name of the current local site
             * @type {string}
             * @default undefined
             */
            currentSite: undefined,
            
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
            
            /**
             * @name nixps-asset.CompareLoader#enableGoBackBrowsing
             * @description If you browse throug the files and folders, must you go back to previous place when pressing the go back button?
             * @type {boolean} 
             * @default true
             */
            enableGoBackBrowsing: true,
            
            /**
             * @name nixps-asset.CompareLoader#enableUpload
             * @description must we enable uploading? set on true, we will still look to the permissions of the user
             * @type {boolean}
             * @default true
             */
            enableUpload: true,
            
            /**
             * @name nixps-asset.CompareLoader#mode
             * @description the mode of the asset viewer
             * @type {String}
             * @default 'default'
             */
            mode: 'default',
            
            /**
             * @name nixps-asset.CompareLoader#proofscopeInfo
             * @description The information for comparing assets.
             * @type {object}
             * @default {}
             */
            proofscopeInfo: {}
        },
        
        /**
         * @description create the component
         * @name nixps-asset.CompareLoader#_create
         * @function
         * @private
         * @returns {undefined}
         */
        _create: function () {
            this._controlOptions();
            this.element.addClass(this.widgetFullName);
            this._draw();
        },
        
        /**
         * @description redraw the component
         * @function
         * @name nixps-asset.CompareLoader#redraw
         */
        redraw: function () {
            this._draw();
        },
        
        /**
         * @description draws the dialog according to the current state
         * @function
         * @private
         * @name nixps-asset.CompareLoader#_draw
         * @return {undefined} 
         */
        _draw: function () {
            this.element.empty()
                        .append("<div class='compare-with'>" + $.i18n._('nixps-cloudflow-assets.action-compare_asset-select_file') + ":</span>")
                        .css("top", "0px")
                        .animate({ "top" : "157px" }, 500);
            var assetView = $('<div>');
            this.element.append(assetView);
            assetView.AssetView({
                language: this.options.language,
                url: this.options.url.substring(0, this.options.url.lastIndexOf('/') + 1),
                sub: "",
                site: this.options.site,
                currentSite: this.options.currentSite,
                rootFolders: this.options.rootFolders,
                rootFiles: this.options.rootFiles,
                rootFoldersAndFilesTitle: this.options.rootFoldersAndFilesTitle,
                rootFoldersAndFilesIcon: this.options.rootFoldersAndFilesIcon,
                enableGoBackBrowsing: this.options.enableGoBackBrowsing,
                enableUpload: this.options.enableUpload,
                mode: this.options.mode,
                compareProofscopeInfo: this.options.proofscopeInfo,
                startUpOptions: {
                    openMode: "",
                    searchString: ""
                }
            });
            this.element.show();
        },
        
        _setOptions: function( options ) {
            var that = this;

            $.each( options, function( key, value ) {
                that._setOption( key, value );
            });
            
            this._draw();
         },
        
        /**
         * @description sets the option
         * @function
         * @private
         * @name nixps-asset.CompareLoader#_setOption
         */
        _setOption: function (pKey, pValue) {
            this._superApply(arguments);
            this._controlOptions();
            // only draw after reset all options
        },
        
        /**
         * @description control the input options and throw a error if needed
         * @name nixps-asset.CompareLoader#_controlOptions
         * @function
         * @private
         * @returns {undefined}
         */
        _controlOptions: function () {
            if (typeof this.options.url !== "string" || this.options.url.length <= 0) {
                throw new Error('input option url must be a not empty string');
            }
            if (this.options.mode !== "compare" && this.options.mode !== 'compareView') {
                throw new Error('input option mode must be "compare" or "compareView"');
            }
        }

    });

})(jQuery);