/* 
 *   NiXPS Hybrid Software Development    
 *   created by guillaume on Apr 9, 2018 5:11:57 PM
 */
/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */

(function ($) {
    /**
     * @namespace nixps-cloudflow-FolderMappingTable
     * @description Draw list of all mappings
     * @example $('<div>').FolderMappingTable({});
     * @version 1.0.0
     */
    $.widget("nixps-cloudflow.FolderMappingTable", $.Widget, {
        version: "1.0.0",
        options: {},

        /**
         * @description Create the component
         * @name nixps-cloudflow.FolderMappingTable#_create
         * @function
         * @private
         * @returns {undefined}
         */
        _create: function () {
            this.element.addClass(this.widgetFullName);

            this.dead = false;
            this.mappings = []; // The model containing all the mappings in a flat plain object
            this.types = {
                "Posix": $.i18n._("nixps-cloudflow-FolderMappingTable.type_posix"),
                "UNC": $.i18n._("nixps-cloudflow-FolderMappingTable.type_unc"),
                "DOS": $.i18n._("nixps-cloudflow-FolderMappingTable.type_dos"),
                "URL": $.i18n._("nixps-cloudflow-FolderMappingTable.type_url")
            }; // all the possible mappings notations

            this._draw();

            this._on(this.element, {
                "click .wanttoadd:not(.actionbuttom_disabled)": this._wantToAddHandler,
                "click .remove:not(.actionbuttom_disabled)": this._removeHandler,
                "click .addnew_cancelbutton": this._cancelAddNewHandler,
                "click .addnew_savebutton": this._saveAddNewHandler,
                "click .fmt_addNew": this._addNewHandler
            });
        },
        
        /**
         * @description User want to add a new mapping
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         * @function
         * @private
         */
        _wantToAddHandler: function(pEvent, pData) {
            var row = $(pEvent.target).closest("td");
            var newRow = this.element.children(".foldermappingtable").Table("insertOneCollapseRow", row);
            this._createNewContainer(newRow);
        },

        /**
         * @description The user want to remove an item from the list
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _removeHandler: function(pEvent, pData) {
            var clickTarget = $(pEvent.target);
            var rowObject = this.element.children(".foldermappingtable").Table("getRowObject", clickTarget);
            if ($.isPlainObject(rowObject) && typeof rowObject.id === "number") {
                clickTarget.closest("tr").addClass("row_disabled").find(".actionbutton").addClass("actionbuttom_disabled");
                if ($('body').hasClass("nixps-Dialog")) {
                    var that = this;
                    $('body').Dialog("show_yes_no", 
                        $.i18n._("nixps-cloudflow-FolderMappingTable.removemessage_header"), 
                        $.i18n._("nixps-cloudflow-FolderMappingTable.removemessage_message"), 
                        {}, 
                        function() {
                            // user choose yes
                            that._removeMapping(rowObject.id);
                        },
                        function() {
                            // user choose no
                            // clear blocking classes
                            clickTarget.closest("tr").removeClass("row_disabled").find(".actionbutton").removeClass("actionbuttom_disabled");
                        });
                } else {
                    this._removeMapping(rowObject.id);
                }
            }
        },

        /**
         * @description Function runs when user click on the cancel button when hi wantted to add a new rule
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _cancelAddNewHandler: function(pEvent, pData) {
            this.element.find(".wanttoadd.actionbuttom_disabled").removeClass("actionbuttom_disabled");
            $(pEvent.target).closest(".tableInlineRow").remove();
            this.element.find(".fmt_addNew").prop("disabled", false);
        },
        
        /**
         * @description Function runs when use clicked on the save button
         * @function
         * @private
         * @returns {undefined} 
         */
        _saveAddNewHandler: function(pEvent, pData) {
            // get data and update model
            var editpanel = $(pEvent.target).closest(".addnew_container");
            var rowData = {
                from_notation: editpanel.find(".from_notation").Select("getValue"),
                from_path: editpanel.find(".from_path").Input("getValue"),
                to_notation: editpanel.find(".to_notation").Select("getValue"),
                to_path: editpanel.find(".to_path").Input("getValue")
            };
            this.mappings.push(rowData);
            // save to backend and refresh table
            var that = this;
            $.when(this._saveMappings()).always(function() {
                that.element.children(".foldermappingtable").Table("refreshData", null, true);
            });
            $(pEvent.target).closest(".tableInlineRow").remove();
            this.element.find(".fmt_addNew").prop("disabled", false);
        },

        /**
         * 
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _addNewHandler: function(pEvent, pData) {
            var container = $('<div>').addClass("tableInlineRow createNewContainer");
            this.element.prepend(container);
            this._createNewContainer(container);
        },

        /**
         * @description Redraw the component
         * @function
         * @name nixps-cloudflow.FolderMappingTable#redraw
         */
        redraw: function () {
            this._draw();
        },

        /**
         * @description Draws the dialog according to the current state
         * @function
         * @private
         * @name nixps-cloudflow.FolderMappingTable#_draw
         * @return {undefined} 
         */
        _draw: function () {
            this.element.empty();
            var table = $("<div>").addClass("foldermappingtable");
            this.element.append(table);
            table.Table({
                additionalTypes: [{type: "action", renderFunction: this._actionRenderFunction}],
                columns: [
                    {type: "enum", label: $.i18n._("nixps-cloudflow-FolderMappingTable.tableheader_from_notation"), key: "from_notation", sortable: false, searchable: false, options: {keyValues:this.types}, cellClass: "notation_type_value", headerClass: "fix_width_100"},
                    {type: "string", label: $.i18n._("nixps-cloudflow-FolderMappingTable.tableheader_from_path"), key: "from_path", sortable: true, searchable: true, headerClass: "path_header"},
                    {type: "enum", label: $.i18n._("nixps-cloudflow-FolderMappingTable.tableheader_to_notation"), key: "to_notation", sortable: false, searchable: false, options: {keyValues:this.types}, cellClass: "notation_type_value", headerClass: "fix_width_100"},
                    {type: "string", label: $.i18n._("nixps-cloudflow-FolderMappingTable.tableheader_to_path"), key: "to_path", sortable: true, searchable: true, headerClass: "path_header"},
                    {type: "action", label: "", key: ".", sortable: false, searhable: false}
                ],
                dataProvider: $.proxy(this._dataProvider, this),
                dataUpdater: $.proxy(this._dataUpdater, this),
                keyUniqID: "id",
                editCellEvent: "dblclick"
            });
            this.element.prepend($('<button>').attr("type", "button").addClass("fmt_addNew colored-button")._t("nixps-cloudflow-FolderMappingTable.addbutton_text").prepend($("<span>").addClass("fa fa-plus")));
        },
        
        _createNewContainer: function(newRow) {
            this.element.find("table").find(".wanttoadd").addClass("actionbuttom_disabled");
            this.element.find(".fmt_addNew").prop("disabled", true);
            newRow.addClass("addnew_container");
            // draw add 
            var editpanel = $('<div>').addClass("addnew_editpanel");
            newRow.append(editpanel);
            var frompart = $('<div>').addClass("addnew_part addnew_partfrom");
            editpanel.append(frompart);
            frompart.append($('<div>').addClass("from_title")._t("nixps-cloudflow-FolderMappingTable.frompart_title"));
            frompart.append($('<div>').addClass("from_notation").Select({
                keyValues: this.types
            }));
            frompart.append($('<div>').addClass("from_path").Input({
                type: "text"
            }));
            var topart = $('<div>').addClass("addnew_part addnew_partto");
            editpanel.append(topart);
            topart.append($('<div>').addClass("to_title")._t("nixps-cloudflow-FolderMappingTable.topart_title"));
            topart.append($('<div>').addClass("to_notation").Select({
                keyValues: this.types
            }));
            topart.append($('<div>').addClass("to_path").Input({
                type: "text"
            }));
            var footer = $('<div>').addClass("addnew_buttonpanel");
            newRow.append(footer);
            footer.append($('<button>').attr("type", "button")._t("nixps-cloudflow-FolderMappingTable.cancelbutton_text").addClass("colored-button addnew_cancelbutton"));
            footer.append($('<button>').attr("type", "button")._t("nixps-cloudflow-FolderMappingTable.savebutton_text").addClass("colored-button addnew_savebutton"));
        },
        
        /**
         * @description create the column for the action buttons
         * @function
         * @private
         * @param {type} pMapping
         * @return {unresolved}
         */
        _actionRenderFunction: function(pMapping) {
            return $('<div>').addClass("actions")
                    .append($("<span>").addClass("actionbutton fa fa-plus wanttoadd"))
                    .append($("<span>").addClass("actionbutton fa fa-trash remove"));
        },

        /**
         * @description Sets the option
         * @function
         * @private
         * @name nixps-cloudflow.FolderMappingTable#_setOption
         */
        _setOption: function (pKey, pValue) {
            this._superApply(arguments);
            this._draw();
        },

        /**
         * @description Give this function as option to the table component
         * @function
         * @private
         * @param {type} pQuery
         * @param {type} pOrderBy
         * @param {type} pSkip
         * @param {type} pLimit
         * @return {Deferred}
         */
        _dataProvider: function(pQuery, pOrderBy, pSkip, pLimit){
            var that = this;
            return $.Deferred(function(pDefer){
                api_async.preferences.get_for_realm("system", "", "com.nixps.rewritepath", "mappings", function(pPref) {
                    if (pPref !== undefined && $.isArray(pPref.preferences)) {
                        that.mappings = [];
                        for (var i=0; i < pPref.preferences.length; i++) {
                            that.mappings.push({
                                id: i,
                                from_notation: pPref.preferences[i].from.notation,
                                from_path: pPref.preferences[i].from.path,
                                to_notation: pPref.preferences[i].to.notation,
                                to_path: pPref.preferences[i].to.path
                            });
                        }
                        pDefer.resolve(Query.apply(that.mappings, pQuery, pOrderBy, pSkip, pLimit));
                    } else if (pPref !== undefined && $.isEmptyObject(pPref.preferences)) {
                        // ther are no items
                        pDefer.resolve([]);
                    } else {
                        pDefer.reject("wrong returning interface");
                    }
                }, function(pError) {
                   console.error(pError);
                   pDefer.reject(pError);
                });
            });
        },

        /**
         * @description Give this function as option to the table component
         * @function
         * @private
         * @param {type} pNewObject
         * @return {Deferred}
         */
        _dataUpdater: function(pNewObject) {
            if ($.isPlainObject(pNewObject) && typeof pNewObject["id"] === "number" && pNewObject["id"] >= 0) {
                for (var i=0; i< this.mappings.length; i++) {
                    if (this.mappings[i].id === pNewObject["id"]) {
                        // update model
                        this.mappings[i] = pNewObject;
                        // update to backend
                        return this._saveMappings();
                    }
                }
            }
        },

        /**
         * @desccription remove a specific mapping
         * @function
         * @private
         * @param {Number} id the id of the mapping we need to remove
         * @returns Deferred
         */
        _removeMapping: function(pID) {
            for (var i=0; i< this.mappings.length; i++) {
                if (this.mappings[i].id === pID) {
                    // update model, remove item
                    this.mappings.splice(i, 1);
                    // update to backend
                    var that = this;
                    return $.when(this._saveMappings()).always(function() {
                        that.element.children(".foldermappingtable").Table("refreshData", null, true);
                    });
                }
            }
        },

        /**
         * @description Save the model to the backend
         * @function
         * @private
         * @returns Deferred
         */
        _saveMappings: function() {
            if ($.isArray(this.mappings) === false) {
                throw new Error("parameter must be an array");
            }
            var outputMappings = []; 
            for (var i=0; i<this.mappings.length; i++) {
                outputMappings.push({
                    from: {
                        notation: this.mappings[i].from_notation,
                        path: this.mappings[i].from_path
                    },
                    to: { 
                        notation: this.mappings[i].to_notation,
                        path: this.mappings[i].to_path
                    }
                });
            }
            return $.Deferred(function(pDefer){
                api_async.preferences.save_for_realm(outputMappings, "system", "", "com.nixps.rewritepath", "mappings", pDefer.resolve, pDefer.reject);
            });
        },
        
        _destroy: function() {
            this.dead = true;
        }

    });

})(jQuery);




