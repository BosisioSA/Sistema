/* 
 *   NiXPS Hybrid Software Development    
 *   created by guillaume on Apr 18, 2018 5:54:37 PM
 */
/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */

(function ($) {
    /**
     * @namespace nixps-config.SettingPart
     * @description draw a setting form
     * @example $('<div>').SettingPart({});
     * @version 1.0.0
     */
    $.widget("nixps-config.SettingPart", $.Widget, {

        options: {
            /**
             * @description The title to be show
             * @name nixps-config.SettingPart#title
             * @type {String}
             * @default ""
             */
            title: "",
            
            applicationID: "",
            
            subkey: "",
            
            /**
             * @description  The json structire of the form to show
             * @type {Object}
             * @default {}
             */
            formJSON: {},
            
            /**
             * @description The json of the layout of the form to show
             * @type {Object}
             * @default null
             */
            layoutJSON: null
        },

        /**
         * @description Create the component
         * @name nixps-config.SettingPart#_create
         * @function
         * @private
         * @returns {undefined}
         */
        _create: function () {
            this._controlOptions();
            this.element.addClass(this.widgetFullName);
            
            this.settingsObject = {};
            
            // draw skeleton
            this.element.append($('<div>').addClass("settingspart_header"));
            var content = $('<div>').addClass("settingspart_content");
            this.element.append(content);
            content.FormRenderer({
                formJSON: this.options.formJSON,
                layoutJSON: this.options.layoutJSON,
                variableDictionary: $.i18n.dict
            });

            this._draw();

            this._on(this.element, {
                "formrendererchange": this._changeHandler
            });
        },

        /**
         * @description function runs when the user do some changes
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _changeHandler: function(pEvent, pData) {
            var form = this.element.children(".settingspart_content.nixps-cloudflow-FormRenderer");
            if (form.FormRenderer("isValid") === true) {
                var settingsObject = form.FormRenderer("getValues");
                var newObject = $.extend({}, this.settingsObject, settingsObject);
                if (_.isEqual(this.settingsObject, newObject) === false) {
                    this.settingsObject = newObject;
                    this._saveSettingsObject(this.settingsObject, this.options.applicationID, this.options.subkey);
                }
            }
        },

        /**
         * @description Redraw the component
         * @function
         * @name nixps-config.SettingPart#redraw
         */
        redraw: function () {
            this._draw();
        },

        /**
         * @description Draws the component according to the current state
         * @function
         * @private
         * @name nixps-config.SettingPart#_draw
         * @return {undefined} 
         */
        _draw: function () {
            this.element.children(".settingspart_header").text(this.options.title);
            var that = this;
            this._getSettingsObject(this.options.applicationID, this.options.subkey).done(function(pSettingsObject){
                that.settingsObject = pSettingsObject;
                if ($.isPlainObject(that.settingsObject) && $.isEmptyObject(that.settingsObject) === false) {
                    that.element.children(".settingspart_content").FormRenderer('setValues', that.settingsObject);
                }
            });
            
        },

        /**
         * @description Sets the option
         * @function
         * @private
         * @name nixps-config.SettingPart#_setOption
         */
        _setOption: function (pKey, pValue) {
            this._superApply(arguments);
            this._controlOptions();
            this._draw();
        },

        _getSettingsObject: function(pApplicationID, pSubKey) {
            if (typeof pApplicationID !== "string") {
                throw new Error("parameter pApplicationID must be a string");
            }
            if (typeof pSubKey !== "string") {
                throw new Error("parameter pSubKey must be a string");
            }
            return $.Deferred(function(pDefer) {
                api_async.preferences.get_for_realm("system", "", pApplicationID, pSubKey, function(preferences) {
                    if (preferences !== undefined && $.isPlainObject(preferences.preferences)) {
                        pDefer.resolve(preferences.preferences);
                    } else {
                        pDefer.reject("wrong returning interface");
                    }
                }, function(pError) {
                    pDefer.reject(pError);
                });
            });
        },

        _saveSettingsObject: function(pObject, pApplicationID, pSubKey) {
            if (typeof pApplicationID !== "string") {
                throw new Error("parameter pApplicationID must be a string");
            }
            if (typeof pSubKey !== "string") {
                throw new Error("parameter pSubKey must be a string");
            }
            return $.Deferred(function(pDefer) {
                api_async.preferences.save_for_realm(pObject, "system", "", pApplicationID, pSubKey, function(){
                    pDefer.resolve();
                }, function(pError) {
                    console.error(pError);
                    pDefer.reject(pError);
                });
            });
        },

        /**
         * @description Control the input options and throw an error if needed
         * @name nixps-config.SettingPart#_controlOptions
         * @function
         * @private
         * @returns {undefined}
         */
        _controlOptions: function () {
            if (typeof this.options.title !== "string") {
                throw new Error("input option title must be a string");
            }
        }

    });

})(jQuery);




