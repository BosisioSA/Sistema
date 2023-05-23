/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 * 
 *   created by guillaume on mrt 8 2019
 */
/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */

(function ($) {

    var defaultURL = "/portal/images/asset/file_blanknote.svg";
    var loadingURL =  "/portal/images/loading-cloudflow.gif";
    var folderURL = "/portal/images/asset/20170307_icon_Folder.svg";

    /**
     * @namespace nixps-asset.AssetPreview
     * @description Show an asset preview
     * @version 1.0.0
     */
    $.widget("nixps-asset.AssetPreview", $.Widget, {
        version: "1.0.0",
        options: {
            /**
             * @name nixps-asset.AssetPreview#assetData
             * @description The data of the asset
             * @type {JSON}
             * @default {}
             */
            assetData: {},

            /**
             * @name nixps-cloudflow.AssetPreview#style_type
             * @description The type of style you want
             * @type {String}
             * @private
             */
            style_type: "default",
        },
        
        /**
         * @description create the component
         * @name nixps-asset.AssetPreview#_create
         * @function
         * @private
         * @returns {undefined}
         */
        _create: function () {
            this._controlOptions();
            this.element.addClass(this.widgetFullName).addClass("CloudflowStyle_" + this.options.style_type);


            this._draw();

            this._on(this.element, {
                "click .assetpreview_topbar .assetpreview_closebutton": this._closeHandler,
                "imageerror.assetpreview_image": this._imageErrorHandler
            })
        },
        
        /**
         * @description function runs when user want to close the preview
         * @function
         * @name nixps-asset.AssetPreview#_closeHandler
         * @private
         * @param {Object} pEvent 
         * @param {Object} pData 
         */
        _closeHandler: function(pEvent, pData) {
            this.close();
            this._trigger("close", pEvent, {});
        },

        /**
         * @description Function runs when imag is not found
         * @name nixps-asset.AssetPreview#_imageErrorHandler
         * @function
         * @private
         * @param {pObject} pError 
         */
        _imageErrorHandler: function(pError, pData) {
            var originalURL = this.element.children(".assetpreview_image").Image("option", "url");
            if (originalURL !== this._getFallbackURL()) {
                this.element.children(".assetpreview_image").Image("option", "url", this._getFallbackURL());
            }
        },

        /**
         * @description draws the dialog according to the current state
         * @function
         * @private
         * @name nixps-asset.AssetPreview#_draw
         * @return {undefined} 
         */
        _draw: function () {
            this.element.empty();
            this.element.append($('<div>').addClass("assetpreview_topbar").append($("<div>").addClass("assetpreview_closebutton fa fa-times")));
            var url = defaultURL;
            if (typeof this.options.assetData.thumb === "string" && this.options.assetData.thumb.length > 0) {
                url = this.options.assetData.thumb;
            }
            var that = this;
            var previewThumb = $('<div>').addClass("assetpreview_image").Image({
                "url": loadingURL,
                "width": null,
                "height": null,
                "maxWidth": null,
                "maxHeight": null
            });
            this.element.append(previewThumb);
            $.when(this._getURL()).then(function(pURL){
                that.element.children(".assetpreview_image").Image({
                    "url": pURL
                });
            });
            if (this.options.assetData.filetype === "folder") {
                previewThumb.addClass("assetpreview_folder_image");
            }
            var title = $("<div>").addClass("assetpreview_title");
            if  (this.options.assetData.cloudflow !== undefined && this.options.assetData.cloudflow.parent === true) {
                title.text("-");
            } else if (typeof this.options.assetData.file_name === "string") {
                // first choose files
                title.text(this.options.assetData.file_name);
            } else if (typeof this.options.assetData.name === "string") {
                // in case of folders
                title.text(this.options.assetData.name);
            } else if (typeof this.options.assetData.document_name === "string") {
                // fall back files
                title.text(this.options.assetData.document_name);
            }
            this.element.append(title);
        },
        
        /**
         * @description retrieve the url of the preview to use 
         * @function
         * @name nixps-asset.AssetPreview#_getURL
         * @private
         * @returns {Deferred}
         */
        _getURL: function() {
            var that = this;
            var pageURL = "";
            if (this.options.assetData.filetype === "folder") {
                return folderURL;
            }
            if (this.options.assetData.cloudflow !== undefined && typeof this.options.assetData.cloudflow.file === "string") {
                pageURL = this.options.assetData.cloudflow.file;
            } else {
                return this._getFallbackURL();
            }
            return $.Deferred(function(pDefer) { 
                api_async.proofscope.get_view_info("?url=" + encodeURIComponent(pageURL), function(pResult) {
                    // control interface
                    if ($.isEmptyObject(pResult) || $.isEmptyObject(pResult.view) || $.isEmptyObject(pResult.view.parameters)) {
                        console.error("Result has wrong interface, expect pResult.view.parameters to be an object");
                        pDefer.resolve(that._getFallbackURL());
                        return;
                    }
                    if (!$.isArray(pResult.view.parameters.pageViews) || pResult.view.parameters.pageViews.length <= 0){
                        console.error("pageViews must be a not empty array");
                        pDefer.resolve(that._getFallbackURL());
                        return;
                    }
                    if ($.isEmptyObject(pResult.view.parameters.pageViews[0].parameters)) {
                        console.error("pResult.view.parameters.pageViews[0].parameters must be a full object");
                        pDefer.resolve(that._getFallbackURL());
                        return;
                    }
                    var asset_id = pResult.view.parameters.pageViews[0].parameters.assetID;
                    var view_id = pResult.view.parameters.pageViews[0].viewID;
                    if (typeof asset_id === "string" && asset_id.length > 0 &&  typeof view_id === "string" && view_id.length > 0) {
                        pDefer.resolve("/portal.cgi?proofscope=get_graphic_tile&view_id=" + view_id + "&asset_id=" + asset_id + "&page=0&zoom=1&row=0&column=0");
                    } else {
                        console.error("no image aviable: missing asset_id or view_id");
                        pDefer.resolve(that._getFallbackURL());
                    }
                }, function(pError) {
                    console.error(pError);
                    pDefer.resolve(that._getFallbackURL());
                });
            });
        },

        /**
         * @description get the fallback url to be used if the original is not working
         * @function
         * @name nixps-asset.AssetPreview#_getFallbackURL
         * @private
         * @return {String} The url to be used as fallback
         */
        _getFallbackURL: function(){
            if (typeof this.options.assetData.thumb === "string" && this.options.assetData.thumb.length > 0) {
                return this.options.assetData.thumb;
            } else {
                return defaultURL;
            }
        },

        /**
         * @description Close the preview component
         * @function
         * @name nixps-asset.AssetPreview#close
         * @returns {undefined}
         */
        close: function(){
            this.element.hide();
        },

        /**
         * @description reopen, make the asset viewer visible
         * @function
         * @name nixps-asset.AssetPreview#open
         * @returns {undefined}
         */
        open: function(){
            this.element.css("display", "");
        },
        
        /**
         * @description sets the options
         * @function
         * @private
         * @name nixps-asset.AssetPreview#_setOptions
         */
        _setOptions: function( options ) {
            var that = this;

            var redraw = false;
            $.each( options, function( key, value ) {
                if (that._setOption( key, value ) === true) {
                    redraw = true;
                };
            });
            
            if (redraw === true) {
                this._draw();
            }
         },
        
        /**
         * @description sets the option
         * @function
         * @private
         * @name nixps-asset.AssetPreview#_setOption
         */
        _setOption: function (pKey, pValue) {
            if (pKey === "style_type") {
                if (pValue !== this.options.style_type) {
                    this.element.removeClass("CloudflowStyle_" + this.options.style_type).addClass("CloudflowStyle_" + pValue);
                }
                this._superApply(arguments);
                this._controlOptions();
                return false;
            }
            if (pKey === "assetData") {
                if (pValue._id !== this.options.assetData._id || pValue.modtime !== this.options.assetData.modtime) {
                    this._superApply(arguments);
                    this._controlOptions();
                    return true;
                } else {
                    this._superApply(arguments);
                    this._controlOptions();
                    return false
                }
            }
            this._superApply(arguments);
            this._controlOptions();
            return true;
        },
        
        /**
         * @description control the input options and throw a error if needed
         * @name nixps-asset.AssetPreview#_controlOptions
         * @function
         * @private
         * @returns {undefined}
         */
        _controlOptions: function () {
            if ($.isPlainObject(this.options.assetData) === false) {
                throw new Error('input option assetData must be a json object');
            }
        }

    });

})(jQuery);