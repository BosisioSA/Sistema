/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 * 
 *   created by guillaume on Nov 30, 2017 11:42:01 AM
 */
/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */

(function ($) {
    /**
     * @namespace nixps-asset-RunningActionListButton
     * @description draw a component
     * @private
     * @example $('<div>').RunningActionListButton({});
     */
    $.widget("nixps-asset.RunningActionListButton", $.Widget, {

        options: {

        },

        /**
         * @description Create the component
         * @name nixps-asset-RunningActionListButton#_create
         * @function
         * @private
         * @returns {undefined}
         */
        _create: function () {
            this._controlOptions();
            this.element.addClass(this.widgetFullName);

            this._draw();

            this._on(this.element, {
                "click .runningListActionButton_mainbutton:not(.runningListActionButton_sleep)": this._clickOpenHandler, 
                "click .runningListActionButton_closebutton": this._clickCloseHandler 
            });
        },

        /**
         * @description function runs when user click on the button to view the list
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _clickOpenHandler: function(pEvent, pData) {
            this.element.children('.runningListActionButton_list').css('display', '');
        },
        
        /**
         * @description functio runs hwn user click on the close button
         * @function
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _clickCloseHandler: function(pEvent, pData) {
            this.element.children('.runningListActionButton_list').hide();
        },

        /**
         * @description Redraw the component
         * @function
         * @name nixps-asset-RunningActionListButton#redraw
         */
        redraw: function () {
            this._draw();
        },

        /**
         * @description Draws the dialog according to the current state
         * @function
         * @private
         * @name nixps-asset-RunningActionListButton#_draw
         * @return {undefined} 
         */
        _draw: function () {
            this.element.empty();
            // add button
            var button = $('<span>').addClass("fa runningListActionButton_mainbutton runningListActionButton_sleep");
            this.element.append(button);
            // add and set list
            var list = $('<div>').addClass("runningListActionButton_list");
            this.element.append(list);
            var that = this;
            list.RunningActionList({
                allowToUpdate: function(pElem) { return that.element.is(":visible"); },
                change: $.proxy(this._updateHandler, this)
            }).hide()
              .css({
                    'position': 'absolute', 
                    'top': -11, 
                    "right": -15, 
                    "z-index": 1
                })
            .append($('<span>').addClass("fa fa-times runningListActionButton_closebutton"));
        },

        /**
         * @description function runs when the list internal changed or updated
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _updateHandler: function(pEvent, pData) {
            if (pData !== undefined) {
                if (pData.state === "done") {
                    this.element.children(".runningListActionButton_mainbutton")
                            .removeClass("runningListActionButton_sleep")
                            .removeClass("fa-spinner")
                            .removeClass("fa-pulse")
                            .addClass("fa-file-o");
                } else if (pData.state === "sleep") {
                    this.element.children(".runningListActionButton_mainbutton")
                            .removeClass("fa-spinner")
                            .removeClass("fa-pulse")
                            .removeClass("fa-file-o")
                            .addClass("runningListActionButton_sleep");
                } else if (pData.state === "active") {
                    this.element.children(".runningListActionButton_mainbutton")
                            .removeClass("runningListActionButton_sleep")
                            .removeClass("fa-file-o")
                            .addClass("fa-spinner fa-pulse");
                }
            }
        },

        /**
         * @description Sets the option
         * @function
         * @private
         * @name nixps-asset-RunningActionListButton#_setOption
         */
        _setOption: function (pKey, pValue) {
            this._superApply(arguments);
            this._controlOptions();
            this._draw();
        },

        /**
         * @description Control the input options and throw a error if needed
         * @name nixps-asset-RunningActionListButton#_controlOptions
         * @function
         * @private
         * @returns {undefined}
         */
        _controlOptions: function () {

        }

    });

})(jQuery);




