/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 * 
 *   created by guillaume on May 19, 2016 12:10:03 PM
 */
/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */

(function ($) {
    
    /**
     * @description remove cloudflow:// from the beginning of the string
     * @private
     * @param {string} pUrl the url to be handled
     * @return {unresolved}
     */
    function removePrefix(pUrl) {
        if (typeof pUrl === "string" && pUrl.substr(0, 12) === "cloudflow://") {
            return pUrl.substr(12);
        } else {
            return pUrl;
        }
    }
    /**
     * @namespace nixps-asset.BreadCrumb
     * @description a component to make a breadcrumb of the url
     */
    $.widget("nixps-asset.BreadCrumb", $.Widget, {
        
        options: {
            /**
             * @name nixps-asset.BreadCrumb#callback
             * @description the callback function, run when user press a link 
             * @function {function}
             * @default undefined
             */
            callback: undefined,
            
            /**
             * @name nixps-asset.BreadCrumb#url
             * @description the current url
             * @type {string}
             * @default undefined
             */
            url: undefined,
            
            /**
             * @name nixps-asset.BreadCrumb#base_url
             * @description the bas url
             * @type {string}
             * @default 'portal.cgi'
             */
            base_url: 'portal.cgi',
            
            /**
             * @name nixps-asset.BreadCrumb#separatorHTML
             * @description Specify here the html we must set between the folder nodes
             * @type {string | HTML}
             * @default "&nbsp; &gt; &nbsp;"
             */
            separatorHTML: "&nbsp; &gt; &nbsp;",
            
            /**
             * @name nixps-asset.BreadCrumb#rootIcon
             * @description insert
             * @type {string}
             * @default false
             */
            rootIcon: false,
            
            /**
             * @name nixps-asset.BreadCrumb#rootUrl
             * @description the root of the url 
             * @type {string}
             * @default ""
             */
            rootUrl: ""
        },
        
        /**
         * @description create the component
         * @name nixps-asset.BreadCrumb#_create
         * @function
         * @private
         * @returns {undefined}
         */
        _create: function () {
            this._controlOptions();
            this.element.addClass(this.widgetFullName);

            this.element.append("<span class='breadcrumb-span' />");

            this._draw();

        },
        
        /**
         * @description redraw the component
         * @function
         * @name nixps-asset.BreadCrumb#redraw
         */
        redraw: function () {
            this._draw();
        },
        
        /**
         * @description draws the dialog according to the current state
         * @function
         * @private
         * @name nixps-asset.BreadCrumb#_draw
         * @return {undefined} 
         */
        _draw: function () {
            if (typeof this.options.url === "string") {
                this.update_root(this.options.url);
            }
        },
        
        /**
         * @name nixps-asset.BreadCrumb#update_root
         * @description Update the breabcrumb corresponding to the cloudflow url
         * @function
         * @param {string} p_url
         * @returns {undefined}
         */
        update_root: function(p_url) {
            this.element.children('span').empty();
            
            // first remove cloudflow
            p_url = removePrefix(p_url);
            var rootUrl = removePrefix(this.options.rootUrl);
            if (p_url.substr(0, rootUrl.length) === rootUrl) {
                p_url = p_url.substr(rootUrl.length);
            }

            var l_parts_with_emptys = p_url.split("/");
            var l_parts = [];
            // remove all empty strings...
            for (var i = 0; i < l_parts_with_emptys.length; i++) {
                if(l_parts_with_emptys[i] !== "") {
                    l_parts.push(l_parts_with_emptys[i]);
                }
            }
            var l_url = rootUrl;
            
            this._add_root_step(l_parts.length > 0);
            
            for (var l_part in l_parts)
            {
                l_url += l_parts[l_part] + "/";
                if (l_part == l_parts.length - 1)
                    // if last element
                    l_url = rootUrl + p_url;
                if (l_part > 0)
                    // if not first element
                    this.element.children('span').append(this.options.separatorHTML);    
                this.add_step(l_url, l_parts[l_part]);
            }
        },
        
        add_step: function (p_target, p_name) {
            if (this.options.callback === undefined) 
            {
                this.element.children('span').append($("<a>").attr('href', this.options.base_url + "?asset=" + encodeURIComponent(p_target)).text(p_name));
            } else {
                this.element.children('span').append($("<a>").attr('href', 'javascript:void(0)').text(decodeURIComponent(p_name)));
                var that = this;
                this.element.children('span').find("a:last").click(function (e) {
                    that.options.callback(p_target);
                });
            }
        },
        
        /**
         * @description Add a root icon if provided.
         * @function
         * @private
         * @param {boolean} pMustAddSeparator
         * @returns {undefined}
         */
        _add_root_step: function(pMustAddSeparator) {
            // first control if we realy need to add a root icon?
            if (typeof this.options.rootIcon === "string" && this.options.rootIcon.length > 0) {
                var that = this;
                this.element.children('span')
                            .append("<a href='javascript:void(0)' class='remove_focus_blue'>" + this.options.rootIcon + "</a>")
                            .find("a:first").click(function (e) {
                                   that.options.callback("");
                               });
                if (pMustAddSeparator === true) {
                    this.element.children('span').append(this.options.separatorHTML); 
                }
            }
        },
        
        /**
         * @description sets the option
         * @function
         * @private
         * @name nixps-asset.BreadCrumb#_setOptions
         */
        _setOptions: function (pOptions) {
            this._superApply(arguments);
            this._controlOptions();
            this._draw();
        },

        _controlOptions: function() {
            if (typeof this.options.rootUrl !== "string") {
                throw new Error("input option rootUrl must be a string");
            }
            if (this.options.rootUrl.length > 0 && this.options.rootUrl[this.options.rootUrl.length - 1] !== "/") {
                console.warn("changed option rootUrl to a folder");
                this.options.rootUrl += "/"; 
            }
        }

    });

})(jQuery);




