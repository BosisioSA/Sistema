/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 * 
 *   created by guillaume on Aug 3, 2017 11:28:13 AM
 */
/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */

(function ($) {
    /**
     * @description the most important nodes of the workflow
     * @private
     * @static
     * @type {Array}
     */
    var kMainNodes = ['Move Folder', 'Copy Folder'];
    var kEndingNodes = ['End'];
    var kErrorWaitingNodes =  ['Wait Error'];
    
    /**
     * @description return the name of the folder
     * @function
     * @private
     * @static
     * @param {string} pUrl
     * @return {unresolved}
     */
    function getFolderName(pUrl) {
        if (typeof pUrl === "string" && pUrl.length > 0) {
            if (pUrl[pUrl.length -1] !== "/") {
                // if input has no folder interface, make it one
                pUrl += "/";
            }
            // search beginning from element before last, 
            // last element has index pUrl.length - 1
            // element before has index  pUrl.length - 1 - 1 = pUrl.length - 2
            var outputFolderName =  pUrl.substring(pUrl.lastIndexOf('/', pUrl.length - 2) + 1, pUrl.lastIndexOf('/'));
            try {
                return decodeURI(outputFolderName);
            } catch(e) {
                return outputFolderName;
            }
        } 
        return pUrl;
    }
    
    /**
     * @namespace nixps-asset-RunningActionList
     * @description draw a list of all current action that are running
     * @example $('<div>').RunningActionList({});
     */
    $.widget("nixps-asset.RunningActionList", $.Widget, {

        options: {
            /**
             * @name nixps-asset.RunningActionList#whitepaperName
             * @description The name of the workflow who handles the asset actions
             * @type {String}
             * @default ""
             */
            whitepaperName: "Asset Actions Flow",
            
            /**
             * @name nixps-asset.RunningActionList#updateDelay
             * @description The number of milliseconds between two updates
             * @type {Number}
             * @default 3000
             */
            updateDelay: 3000,
            
            /**
             * @name nixps-asset.RunningActionList#sleepDelay
             * @description the number of milliseconds between two updates when system is sleeping
             * @type {Number}
             * @default 60000
             */
            sleepDelay: 60000,
            
            /**
             * @name nixps-asset.RunningActionList#allowToUpdate
             * @description Must we update the list or not, this function must decide it. This option will be given to the DynamicList component. 
             * see {@link nixps.DynamicList#allowToUpdate}
             * @type {Function}
             * @default function() {return true;}
             */
            allowToUpdate: function() {return true;}
        },

        /**
         * @description Create the component
         * @name nixps-asset-RunningActionList#_create
         * @function
         * @private
         * @returns {undefined}
         */
        _create: function () {
            this._controlOptions();
            this.element.addClass(this.widgetFullName);

            this.state = "active"; // the state of the system
            this.keepWakeUpLoop = 0; // the number count that the system needs to keep wakup before going to wintersleep
            // last 5 days
            var now = new Date();
            now.setDate(now.getDate() - 5);
            this.lastModificationDate = now.toISOString(); 
            this.watchItemIds = [];
            this._draw();

            this._on(this.element, {});
        },

        /**
         * @description Redraw the component
         * @function
         * @name nixps-asset-RunningActionList#redraw
         */
        redraw: function () {
            this._draw();
        },

        /**
         * @description Draws the dialog according to the current state
         * @function
         * @private
         * @name nixps-asset-RunningActionList#_draw
         * @return {undefined} 
         */
        _draw: function () {
            this.element.empty();
            var list = $('<div>');
            this.element.append(list);
            list.DynamicList({
                allowToUpdate: this.options.allowToUpdate,
                dataProvider: $.proxy(this._dataProvider, this),
                hasItemChanged: function(A, B){
                    return A.node !== B.node || A.modification !== B.modification;
                },
                makeItem: $.proxy(this._makeItem, this),
                updateItem: $.proxy(this._updateItem, this),
                updateDelay: this.options.updateDelay,
                keyUniqID: "id",
                emptyRowsPanel: $('<span>')._t('nixps-asset-runningactionlist.no_items'),
                update: $.proxy(this._updateHandler, this),
                drawed: $.proxy(this._updateHandler, this)
            });
            this.state = "active"; 
        },

        _dataProvider: function() {
            var that = this;
            var query = ['whitepaper_names', 'equal to', this.options.whitepaperName, 'and', 'done', 'does not exist', 'and', 'modification', 'greater than or equal to', this.lastModificationDate];
            if ($.isArray(this.watchItemIds) && this.watchItemIds.length > 0) {
                query.push("or", "_id", "in", this.watchItemIds);
            }
            return $.Deferred(function(pDefer){
                api_async.hub.get_overview_with_options(query, {}, function(pResults) {
                    if($.isArray(pResults.entries)) {
                    	// sort in desc order of ids, so must recent comes ahead
                        pDefer.resolve(pResults.entries.reverse());
                    } else {
                        console.error("results must be an array");
                        pDefer.reject("results must be an array");
                    }
                }, function(pError) {
                    console.error(pError);
                    pDefer.reject(pError);
                });
            });
        },
        
        /**
         * @description make a item of the list
         * @function
         * @private
         */
        _makeItem: function(pObject) {
        	var variables = this._getVariables(pObject);
            if (variables === null) {
                // workable is unknown ...
                // make empty skeleton and fill in later during the update ...
                return $('<div>').addClass('runninglist_item')
                        // add tempory progressbar to indicate something is happen but we dont know what.
                        .append($('<div>').addClass('progressBar progress tempProgressBar').append($('<div>').addClass('progress-bar progress-bar-striped active').css('width', '100%')));
            } else {
                // workable is known
                var container =  $('<div>').addClass('runninglist_item');
                this._buildDOMItem(container, this._getVariables(pObject), pObject);
                return container;
            }
        },
        
        /**
         * @description function called by dynamic list. this need to update the item
         * @function
         * @private
         * @param {type} pDOMObject
         * @param {type} pObject
         * @return {Boolean}
         */
        _updateItem: function(pDOMObject, pObject) {
            // only progress can change
            // update progress
            if ($.isArray(pObject.workables) && pObject.workables.length === 0) {
                // wait
                return true;
            } else {
                pDOMObject.find(".tempProgressBar").remove(); // remove tempory progressbar of unknowlage
                if ($.isArray(pObject.workables) && pObject.workables.length === 1 && pDOMObject.children().length === 0) {
                    // the item has no data, build from scratch
                    this._buildDOMItem(pDOMObject, this._getVariables(pObject), pObject);
                } else {
                    // the item has data, just update it
                    this._updateProgressBar(pDOMObject, pObject);
                }
            }
        },

        /**
         * @description draw the dom of one item if the list
         * @function
         * @private
         * @param {type} pParent
         * @param {type} pDetails
         * @param {type} pState
         * @return {undefined}
         */
        _buildDOMItem: function(pParent, pDetails, pObject) {
            pParent.append($('<span>').addClass('runninglist_action').append(this._getActionIcon(pDetails.action, pObject.state)))
                .append($('<span>').addClass('runninglist_source').text(pDetails.source).attr('title', pDetails.source))
                .append($('<span>').addClass('runninglist_toIcon fa fa-angle-right'))
                .append($('<span>').addClass('runninglist_target').text(pDetails.target).attr('title', pDetails.target))
                .append($('<div>').addClass('progressBar progress').append($('<div>').addClass('progress-bar progress-bar-striped active').css('width', '3%')));
            this._updateProgressBar(pParent, pObject);    
        },

        /**
         * @description function runsw after they have been updating
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _updateHandler: function(pEvent, pData) {
            if (pData !== undefined && pData.size === 0) {
                // there are no items at all
                this._setState("sleep");
            } else if (this.element.find('.runninglist_item.runninglist_error').length === pData.size) {
                // all the items are in error
                this.keepWakeUpLoop = 0;
                this._setState("doneError");
            } else if (this.element.find('.runninglist_item:not(.runninglist_done):not(.runninglist_error)').length === 0) {
                // size is not 0, so there are items
                // but there are no active items, so there are all done
                this.keepWakeUpLoop = 0;
                this._setState("done");
            } else {
                this._setState("active");
            }
        },

        /**
         * @description set in sleep or wake the system up
         * @function
         * @private
         * @param {Boolean} pNeedSleep Must we wake up of must we sleep
         * @return {undefined}
         */
        _setState: function(pState) {
            if (pState === "sleep" && this.state !== "sleep" && this.keepWakeUpLoop <= 0 /* prevent going to sleep*/) {
                // go sleeping
                this.state = "sleep";
                this.keepWakeUpLoop = 0;
                this.watchItemIds = [];
                this.element.children(".nixps-DynamicList").DynamicList("option", "updateDelay", this.options.sleepDelay);
                this._trigger("change", null, {state: "sleep"});
            } else if (pState === "active" && this.state !== "active") {
                // wake up 
                this.state = "active"; 
                this.element.children(".nixps-DynamicList").DynamicList("option", "updateDelay", this.options.updateDelay);
                this._trigger("change", null, {state: "active"});
            } else if (pState === "done" && this.state !== "done") {
                this.state = "done";
                this.watchItemIds = [];
                this.element.children(".nixps-DynamicList").DynamicList("option", "updateDelay", this.options.updateDelay);
                this._trigger("change", null, {state: "done"});
            } else if (pState === "doneError" && this.state !== "doneError") {
                // all the items are in error, set update delay on max
                this.state = "doneError";
                this.watchItemIds = [];
                this.element.children(".nixps-DynamicList").DynamicList("option", "updateDelay", this.options.sleepDelay);
                this._trigger("change", null, {state: "done"});
            }
            // decrement the keep wakeUp loop counter
            if (this.keepWakeUpLoop > 0) {
                this.keepWakeUpLoop--;
            }
        },

        /**
         * @description Wake the system and it must keep a little time online
         * @function
         * @name nixps-asset.RunningActionList#wakeUp
         * @return {undefined}
         */
        wakeUp: function(pItemID) {
            this.keepWakeUpLoop = 4;
            if (typeof pItemID === "string" && pItemID.length > 0 && $.inArray(pItemID, this.watchItemIds) === -1) {
                // add if item id is string and not yet in array
                this.watchItemIds.push(pItemID);
            }
            this._setState("active");
            this.element.children(".nixps-DynamicList").DynamicList("update");
        },

        /**
         * @description extract information of the backnd object 
         * @function
         * @private
         * @param {object} pJacket
         * @return {nixps-asset-RunningActionListL#11.nixps-asset-RunningActionListAnonym$0._getVariables.returnObject}
         */
        _getVariables: function(pJacket) {
            if (pJacket === undefined || $.isArray(pJacket.workables) === false || pJacket.workables.length <= 0) {
                // there is no workable information
                return null;
            }
            var workable = pJacket.workables[0];
            if (workable !== undefined && $.isArray(workable.data)) {
                var returnObject = {};
                for (var i = 0; i < workable.data.length; i++) {
                    returnObject[workable.data[i].name] = workable.data[i].value;
                }
                returnObject.source = getFolderName(returnObject.sourceFolderUrl);
                returnObject.target = getFolderName(returnObject.targetFolderUrl);
                return returnObject;
            }
            return null;
        },
        
        /**
         * @description return the corresponding icon
         * @function
         * @private
         * @param {string} pAction
         * @param {string} pState
         * @return {window.$|$}
         */
        _getActionIcon: function(pAction, pState) {
            if (pState === "error" || pState ==="fatal_error") {
                return $('<span>').addClass('fa fa-times fa-lg runninglist_erroricon');
            }
            switch(pAction) {
                case "cut":
                    return $('<span>').addClass('fa fa-scissors');
                case "copy":
                    return $('<span>').addClass('fa fa-copy');
                default: 
                    return $('<span>');
            }
        },
        
        /**
         * @description update the progress bar
         * @function
         * @private
         * @param {type} pParent
         * @param {type} pObject
         * @return {undefined}
         */
        _updateProgressBar: function(pParent, pObject) {
            var workable = pObject.workables[0];
            if ($.inArray(workable.node, kMainNodes) >= 0 && $.isPlainObject(workable.progress) && typeof workable.progress.value === "number" && workable.progress.value > 0) {
                var progress = workable.progress.value;
                if(progress < 0.03) {
                    progress = 0.03;
                }
                pParent.find('.progress-bar').css('width', Math.round(progress * 100) + '%');
            } else {
                if ($.inArray(workable.node, kEndingNodes) >= 0) {
                    pParent.find('.progress-bar').css('width', '100%').removeClass('active progress-bar-striped');
                    pParent.addClass("runninglist_done");
                } else if ($.inArray(workable.node, kErrorWaitingNodes) >= 0) {
                    pParent.addClass("runninglist_error");
                    pParent.find('.progress-bar').css('width', '100%').addClass("progress-bar-danger");
                } else {
                    pParent.find('.progress-bar').css('width', '3%');
                }
            }
        },
        
        isBussy: function() {
            var numberOfItems = this.element.find('.nixps-DynamicList').DynamicList('size');
            return typeof numberOfItems === "number" && numberOfItems > 0;
        },
        
        /**
         * @description Sets the option
         * @function
         * @private
         * @name nixps-asset-RunningActionList#_setOption
         */
        _setOption: function (pKey, pValue) {
            this._superApply(arguments);
            this._controlOptions();
            this._draw();
        },

        /**
         * @description Control the input options and throw a error if needed
         * @name nixps-asset-RunningActionList#_controlOptions
         * @function
         * @private
         * @returns {undefined}
         */
        _controlOptions: function () {
            if (typeof this.options.whitepaperName !== "string" || this.options.whitepaperName.length <= 0) {
                throw new Error('input option whitepaperName must be a not empty string');
            }
            if (typeof this.options.updateDelay !== "number" || this.options.updateDelay <= 0 || this.options.updateDelay > 2147483647) {
                throw new Error('input option updateDelay must be a positive number');
            }
            if (typeof this.options.sleepDelay !== "number" || this.options.sleepDelay < 0 || this.options.sleepDelay > 2147483647) {
                throw new Error('input option sleepDelay must be a positive number');
            }
            if ($.isFunction(this.options.allowToUpdate) === false) {
                throw new Error("input option allowToUpdate must be a function");
            }
        }

    });

})(jQuery);




