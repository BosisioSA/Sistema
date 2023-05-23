/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 * 
 *   created by guillaume on Jan 12, 2017 1:31:19 PM
 */
/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */
/**
 * {
        "PACKZ_PYTHON" : "file:///Macintosh%20HD/Applications/cloudflow_osx_dev_b17138/quantumpackz-17138/Resource/PACKZflow/Resources/",
        "PACKZFLOW" : "file:///Macintosh%20HD/Applications/cloudflow_osx_dev_b17138/quantumpackz-17138/Resource/PACKZflow/Resources/PACKZflow.app/Contents/MacOS/PACKZflow",
        "system_webapp_sqlink" : "localhost:8080/sqlink"
      },
 * 
 */
(function ($) {
    /**
     * @namespace nixps-config-LogicalsList
     * @description draw a component
     * @example $('<div>').LogicalsList({});
     */
    $.widget("nixps-config.LogicalsList", $.Widget, {

        options: {
            /**
             * @description The object containing logicals
             * @type {object}
             * @default {}
             */
            logicalsObject: {}
        },

        /**
         * @description Create the component
         * @name nixps-config-LogicalsList#_create
         * @function
         * @private
         * @returns {undefined}
         */
        _create: function () {
            this._controlOptions();
            this.element.addClass(this.widgetFullName);

            this._draw();

            this._on(this.element, {

            });
        },

        /**
         * @description Redraw the component
         * @function
         * @name nixps-config-LogicalsList#redraw
         */
        redraw: function () {
            this._draw();
        },

        /**
         * @description Sraws the dialog according to the current state
         * @function
         * @private
         * @name nixps-config-LogicalsList#_draw
         * @return {undefined} 
         */
        _draw: function () {
            this.element.empty().Table({
                columns: [{label: $.i18n._("nixps-cloudflow-workservers.logicals_name"), type:"string", key: "name", sortable: false},
                          {label: $.i18n._("nixps-cloudflow-workservers.logicals_value"), type:"string", key: "value", sortable: false}],
                dataProvider: $.proxy(this._dataProvider, this),
                dataUpdater: $.proxy(this._dataUpdater, this),
                keyUniqID: 'id',
                editCellEvent: "dblclick",
                maxRows: 20
            });
        },

        _dataProvider: function(pQuery, pOrderBy, pSkip, pLimit) { 
            var outputArray = [];
            $.each(this.options.logicalsObject, function(pKey, pValue) {
                outputArray.push({id: pKey, name: pKey, value: pValue});
            });
            outputArray.sort(function(a, b) {
                if(a === b) { return 0; }
                else if (a > b) {return 1; }
                else return -1; 
            });
            return outputArray;
        },

        _dataUpdater: function(pNewLogical) {
            // set new data
            if (this.options.logicalsObject[pNewLogical.name] === pNewLogical.value) {
                // value is the same, no differnces detected, or value exsists in other row
                return $.Deferred().resolve();
            } else {
                // here is a differences
                this.options.logicalsObject[pNewLogical.name] = pNewLogical.value;
                if (pNewLogical.id !== pNewLogical.name) {
                    // the key changed, remove the old one
                    delete this.options.logicalsObject[pNewLogical.id];
                }
                this._trigger('update', null, {logicals: this.options.logicalsObject});
                return $.Deferred();
            }
        },

        /**
         * @description Sets the option
         * @function
         * @private
         * @name nixps-config-LogicalsList#_setOption
         */
        _setOption: function (pKey, pValue) {
            this._superApply(arguments);
            this._controlOptions();
            this._draw();
        },

        /**
         * @description Control the input options and throw a error if needed
         * @name nixps-config-LogicalsList#_controlOptions
         * @function
         * @private
         * @returns {undefined}
         */
        _controlOptions: function () {
            if($.isPlainObject(this.options.logicalsObject) === false) {
                throw new Error('input option logicalsObject must be a object');
            }
        }

    });

})(jQuery);




