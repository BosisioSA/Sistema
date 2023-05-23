/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 * 
 *   created by guillaume on Jan 6, 2017 1:40:00 PM
 */
/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */

(function ($) {
    function isFolder(pUrl) {
        if(typeof pUrl !== "string" || pUrl.length <= 0) {
            throw new Error("url parameter must be a not empty string");
        }
        return pUrl[pUrl.length - 1] === "/";
    }
    
    function isFileStore(pUrl) {
        if (isFolder(pUrl) === true && pUrl.indexOf("cloudflow://") === 0) {
            // remove "cloudflow://" and last char "/",
            // if we found no "/" in the rest, this means we are in a file store
            return pUrl.substr(12).slice(0, -1).indexOf("/") === -1;
        }
        return false;
    }
    
    function getFileName(pUrl) {
        if(typeof pUrl !== "string" || pUrl.length <= 0) {
            throw new Error("url parameter must be a not empty string");
        }
        return pUrl.substring(pUrl.lastIndexOf('/') + 1);
    }
    
    function getPath(pUrl) {
        return pUrl.substring(0, pUrl.lastIndexOf('/', pUrl.length - 2) + 1);
    }
    
    function getFolderName(pUrl) {
        if(isFolder(pUrl)) {
            // search beginning from element before last, 
            // last element has index pUrl.length - 1
            // element before has index  pUrl.length - 1 - 1 = pUrl.length - 2
            return pUrl.substring(pUrl.lastIndexOf('/', pUrl.length - 2) + 1, pUrl.lastIndexOf('/'));
        } 
        return pUrl;
    }
    
    function displayAssetName(pUrl) {
        if(isFolder(pUrl)) {
            return decodeURIComponent(getFolderName(pUrl));
        } else {
            return decodeURIComponent(getFileName(pUrl));
        }
    }
    
    function controlName(pName) {
        if (typeof pName !== "string" || pName.length <= 0) {
            return "may not be empty";
        }
        if (pName[0] === " " || pName[0] === "." || pName[pName.length - 1] === " " || pName[pName.length - 1] === ".") {
            return "may not begin or end with a space or period";
        }
        var regExp = new RegExp('[<>:"~%/|?*\\\\]');
        if (regExp.test(pName) === true) {
            return "may not contains special character";
        }
        if (pName.length > 255) { 
            return "name is to long";
        }
        return null;
    }
    
    /**
     * @description This function looks up if the user is being wrinting or not.
     * This is inportant to known when to paste.
     * @function
     * @static
     * @private
     * @returns {Boolean} true if the user is busy with other things than assets, if he is typing/ selecting text, false if there is no selecting text 
     * and the active element is not on a editable component
     */
    function isSelectingText() {
       if(typeof window.getSelection().type === "string" &&  window.getSelection().type === "Range"){
           return true;
       }
       if (document.activeElement) {
           return $(document.activeElement).is('[contenteditable=true], input, textarea');
       }
       return false;
    };
    
    /**
     * @description The url of the asset that is currently in the clipboard. This is the cashes
     * @static
     * @type String
     */
    var clipBoard = "";
    
    /**
     * @description The last clipboard action the user want to do "cut" | "copy"
     * @static
     * @type String
     */
    var lastClipBoardAction = "";
    
    /**
     * @description the name of the site where the clipboard action cut or copy was made.
     * @static
     * @type {string}
     */
    var lastClipBoardSite = null;
    
    /**
     * @description the incremental unic id to get connect the correct return value to a file
     * @static
     * @type Number
     */
    var inMakingCallID = 0;
    
    
    var supportSessionStorage = storageAvailable("sessionStorage");
    /**
     * @namespace nixps-asset.AssetActionList
     * @description Draw a component to handle file or folder actions.
     * @example $('<div>').AssetActionList({url:"cloudflow://PP_FILE_STORE/..."});
     */
    $.widget("nixps-asset.AssetActionList", $.Widget, {

        options: {
            /**
             * @description url of the file or folder
             * @name nixps-asset.AssetActionList#url
             * @type {string}
             * @default ""
             */
            url: "",
            
            /**
             * @description define the buttons to be show and how they must react
             * @name nixps-asset.AssetActionList#buttons
             * @type {array}
             */
            buttons: [
                {name: "assetaction_download", file: "show", folder: "hide", filestore: "hide"},
                {name: "assetaction_addfolder", file: "hide", folder: "show", filestore: "show"},
                {name: "assetaction_createwebpage", file: "hide", folder: "hide", filestore: "hide"},
                {name: "assetaction_rename", file: "show", folder: "hide", filestore: "hide"},
                {name: "assetaction_delete", file: "show", folder: "show", filestore: "hide"},
                {name: "assetaction_cut", file: "show", folder: "show", filestore: "hide"},
                {name: "assetaction_copy", file: "show", folder: "show", filestore: "hide"},
                {name: "assetaction_paste", file: "disable", folder: function() {
                        if (this.isClipBoardEmpty()) {
                            return "disable";
                        } else {
                            return "enable";
                        }
                }, filestore: "hide"}
            ],
            
            /**
             * @description The name of the site, this who is currently active
             * @name nixps-asset.AssetActionList#site
             * @type {string}
             * @default null
             */
            site: null,
            
            /**
             * @description Pass here the refrences of the FreezeOverlay component
             * @name nixps-asset.AssetActionList#freezeOverlayElement
             * @type {jqueryComponent}
             * @default null
             */
            freezeOverlayElement: null,
            
            /**
             * @description is the list active in a contextmenu
             * @type {boolean}
             * @default false
             */
            inContextmenu: false
        },

        /**
         * @description Create the component
         * @name nixps-asset.AssetActionList#_create
         * @function
         * @private
         * @returns {undefined}
         */
        _create: function () {
            // put the dialog in a variable
            this.dialog = $('body');
            
            this._controlOptions();
            this.element.addClass(this.widgetFullName);
            
            this._draw();

            // restore Clipboard if possible
            this._restoreClipBoard();

            this._on(this.element, {
                "dropdownlisthide": this._listHideHandler,
                "dropdownlistshow": this._listShowHandler,
                "click .assetaction_download": this._downloadActionHandler,
                "click .assetaction_rename": this._renameActionHandler,
                "click .assetaction_delete": this._deleteActionHandler,
                "click .assetaction_addfolder": this._newFolderActionHandler,
                "click .assetaction_createwebpage": this._createWebPageActionHandler,
                "click .assetaction_cut": this._cutActionHandler,
                "click .assetaction_copy": this._copyActionHandler,
                "click .assetaction_paste": this._pasteActionHandler
            });
        },

        /**
         * @description function runs when list is hided
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _listHideHandler: function(pEvent, pData) {
            // inform others that the list was visible and is now hided
            this._trigger("hide", pEvent, pData);
        },
        
        /**
         * @description function runs before the list should open
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _listShowHandler: function(pEvent, pData) {
            // update the past text because an other component instance can have change the values ...
            if (this.isClipBoardEmpty() === false) {
                this.element.DropdownList('changeText', 'assetaction_paste', displayAssetName(clipBoard));
                this.element.find('.assetaction_paste').addClass('assetaction_nameToPaste').attr('title', $.i18n._("nixps-asset-assetactionlist.paste") + " " + displayAssetName(clipBoard));
            }
        },

        /**
         * @description User want to download a file
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _downloadActionHandler: function(pEvent, pData) {
            if(isFolder(this.options.url) === false) {
                location.href = "/portal.cgi?asset=download_file&url=" + encodeURIComponent(this.options.url);
            }
        },

        /**
         * @description fucntion runs when user clicked on rename button
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _renameActionHandler: function(pEvent, pData) {
            var that = this;
            var defaultText = displayAssetName(this.options.url);
            this.dialog.Dialog('prompt', $.i18n._('nixps-asset-assetactionlist.rename'), $.i18n._('nixps-asset-assetactionlist.rename_message'), defaultText, true)
                    .done(function(pResult) {
                        // show waiting panel because renaming can take a time
                        that._showWaitingPanel($.i18n._('nixps-asset-assetactionlist.rename_waitingtext'));
                        // user clicked on decision button
                        if(pResult !== undefined && pResult.type === "ok" && typeof pResult.newValue === "string" && pResult.newValue.length > 0) {
                            // trim and encodeURI result
                            pResult.newValue = $.trim(pResult.newValue);
                            
                            if(pResult.newValue === defaultText) {
                                // name does not changed, so do nohting!
                                that._hideWaitingPanel();
                                return true; 
                            }
                            // the name seems good
                            var oldUrl = that.options.url;
                            var newUrl;
                            // make the new url, depending of the asset was a file or a folder
                            if (isFolder(oldUrl)) {
                                //       path of parent + newname + '/' ending slace, make it a folder   
                                newUrl = oldUrl.substring(0, oldUrl.lastIndexOf('/', oldUrl.length - 2) + 1) + encodeURIComponent(pResult.newValue) + '/';
                            } else {
                                //       path of file + newname of file
                                newUrl = oldUrl.substring(0, oldUrl.lastIndexOf('/') + 1) + encodeURIComponent(pResult.newValue);
                            }
                            that._moveItem(oldUrl, newUrl, true).done(function(pResults) {
                                // rename is done and backend has new value
                                // pResult contains new name
                                if (pResults !== undefined && typeof pResults.moved_file === "string" && pResults.moved_file.length > 0) {
                                    that.options.url = pResults.moved_file;
                                } else {
                                    console.error('return value has wrong format!');
                                    that.options.url = newUrl;
                                }
                                if (that.options.site === lastClipBoardSite && oldUrl === clipBoard) {
                                // file that just has been renamed, that is still in the clipboard: update clipboard!!
                                    clipBoard = that.options.url;
                                    that.element.DropdownList('changeText', 'assetaction_paste', displayAssetName(clipBoard));
                                    that._storeClipBoard();
                                }
                                that._trigger('renamed', null, {oldUrl: oldUrl, newUrl: that.options.url});
                            }).fail(function(pError){
                                that._showErrorMessage(pError, "nixps-asset-assetactionlist.rename_errormessagetitle");
                            }).always(function(){
                                // always hide, even if action fails
                                that._hideWaitingPanel();
                            });
                        } else {
                            that._hideWaitingPanel();
                            // user clicked cancel or put empty newName
                        }
                    });
        },
        
        /**
         * @description function runs when user clicked on delete button
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _deleteActionHandler: function(pEvent, pData) {
            var that = this;
            this.dialog.Dialog('show_yes_no', $.i18n._('nixps-asset-assetactionlist.delete'), $.i18n._('nixps-asset-assetactionlist.delete_message', [displayAssetName(this.options.url)]), {})
                    .done(function(pResult) {
                        // user clicked on decision button
                        if(pResult !== undefined && pResult.type === "yes") {
                            that._removeItem().done(function(pResults){
                                if (that.options.site === lastClipBoardSite && that.options.url === clipBoard) {
                                    // file removed that is still in the clipboard, clean clipboard!!
                                    clipBoard = "";
                                    lastClipBoardSite = null;
                                    lastClipBoardAction = "";
                                    that.element.DropdownList('disableItem', 'assetaction_paste')
                                                .DropdownList('changeText', 'assetaction_paste', $.i18n._('nixps-asset-assetactionlist.paste'));
                                    that.element.find('.assetaction_paste').removeClass('assetaction_nameToPaste').attr('title', "");
                                    that._storeClipBoard();
                                }
                                that._trigger('deleted', null, {url: that.options.url, folder: isFolder(that.options.url)});
                            }).fail(function(pError){ 
                                // could not persisten remove
                                that._showErrorMessage(pError, 
                                        $.i18n._("nixps-asset-assetactionlist.delete_errormessagetitle"),
                                        $.i18n._("nixps-asset-assetactionlist.delete_errormessage", [displayAssetName(that.options.url)])
                                );
                            });
                        }
                        // user clicked non
                    });
        },

        /**
         * @description function runs when user want to add a folder
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _newFolderActionHandler: function(pEvent, pData) {
            var that = this;
            this.dialog.Dialog('prompt', $.i18n._('nixps-asset-assetactionlist.addfolder'), $.i18n._('nixps-asset-assetactionlist.addfolder_message'), $.i18n._('nixps-asset-assetactionlist.newfoldername'), true)
                .done(function(pResult) {
                    // show waiting panel because renaming can take a time
                    that._showWaitingPanel($.i18n._('nixps-asset-assetactionlist.addfolder_waitingtext'));
                    if(pResult !== undefined && pResult.type === "ok" && typeof pResult.newValue === "string" && pResult.newValue.length > 0) {
                        // trim and encodeURI result
                        pResult.newValue = $.trim(pResult.newValue);
                        that._createFolder(pResult.newValue).done(function(pResult){
                            that._trigger('added', null, {});  
                        }).always(function(){
                            that._hideWaitingPanel();
                        });
                    } else {
                        that._hideWaitingPanel();
                    }

                });
        },

        /**
         * @description function runs when user want to create a new webpage
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @return {undefined}
         */
        _createWebPageActionHandler: function(pEvent, pData) {
            // go to pagebuilder with folder url, the pagebuilder html will detect folder and present "create new"
            window.location = "/pagebuilder/pagebuilder.html?url=" + encodeURI(encodeURIComponent(this.options.url));
        },

        /**
         * @description function runs when user click on the cut action button, to move a file or folder
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _cutActionHandler: function(pEvent, pData) {
            this._cutAssetToClipBoard();
        },

        /**
         * @description function runs when user click on the copy action button, to copy a file or folder
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _copyActionHandler: function(pEvent, pData) {
            this._copyAssetToClipBoard();
        },
        
        /**
         * @description function runs when user click on the paste action button, to paste a file or folder
         * @function
         * @private
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _pasteActionHandler: function(pEvent, pData) {
            this._pasteAssetfromClipBoard();
        },
        
        /**
         * @description Redraw the component
         * @function
         * @name nixps-asset.AssetActionList#redraw
         */
        redraw: function () {
            this._draw();
        },

        /**
         * @description Draws the dialog according to the current state
         * @function
         * @private
         * @name nixps-asset.AssetActionList#_draw
         * @return {undefined} 
         */
        _draw: function () {
            this.element.empty().DropdownList({
                buttonText: $.i18n._('nixps-asset-assetactionlist.title')
            });
            var addFolderIcon = "<span class='fa-stack'><span class='fa fa-plus fa-stack-1x' style='left: -1px; top:0px; font-size: 0.70em;'></span><span class='fa fa-folder-o fa-stack-2x' style='font-size:1.3em; top:2px; left: -4px;'></span></span>";            
            this.element.DropdownList('addListItem', 'assetaction_download', "<span class='fa fa-download'></span>", $.i18n._('nixps-asset-assetactionlist.download'), true, $.noop);
            this.element.DropdownList('addListItem', 'assetaction_addfolder', addFolderIcon, $.i18n._('nixps-asset-assetactionlist.addfolder'), true, $.noop);
            this.element.DropdownList('addListItem', 'assetaction_createwebpage', "<span class='fa fa-plus'></span>", $.i18n._('nixps-asset-assetactionlist.createwebpage'), true, $.noop);
            this.element.DropdownList('addListItem', 'assetaction_rename', "<span class='fa fa-pencil'></span>", $.i18n._('nixps-asset-assetactionlist.rename'), true, $.noop);
            this.element.DropdownList('addListItem', 'assetaction_delete', "<span class='fa fa-trash-o'></span>", $.i18n._('nixps-asset-assetactionlist.delete'), true, $.noop);
            //    disable the paste actions for the moment!
            this.element.DropdownList('addListItem', 'assetaction_cut', "<span class='fa fa-scissors'></span>", $.i18n._('nixps-asset-assetactionlist.cut'), true, $.noop);
            this.element.DropdownList('addListItem', 'assetaction_copy', "<span class='fa fa-copy'></span>", $.i18n._('nixps-asset-assetactionlist.copy'), true, $.noop);
            this.element.DropdownList('addListItem', 'assetaction_paste', "<span class='fa fa-clipboard'></span>", $.i18n._('nixps-asset-assetactionlist.paste'), false, $.noop);
       
            if (this.isClipBoardEmpty() === false) {
                this.element.DropdownList('changeText', 'assetaction_paste', displayAssetName(clipBoard));
                this.element.find('.assetaction_paste').addClass('assetaction_nameToPaste').attr('title', $.i18n._("nixps-asset-assetactionlist.paste") + " " + displayAssetName(clipBoard));
            }
            
            this.element.toggleClass('assetactionlist_contextmenu', this.options.inContextmenu === true);
            if(this.options.inContextmenu === true) {
                this.element.find('.dropdownButton').hide();
            }
        },
        
        /**
         * @description Activate the cut action on the current asset.
         * @name nixps-asset.AssetActionList#cutToClipBoard
         * @function
         * @returns {undefined}
         */
        cutToClipBoard: function() {
            if(isSelectingText() === false) {
                return this._cutAssetToClipBoard();
            }
        },
        
        /**
         * @description Activate the copy action on the current asset.
         * @name nixps-asset.AssetActionList#copyToClipBoard
         * @function
         * @returns {undefined}
         */
        copyToClipBoard: function() {
            if(isSelectingText() === false) {
                return this._copyAssetToClipBoard();
            }
        },
        
        /**
         * @description Activate the paste action on the current asset.
         * @name nixps-asset.AssetActionList#pasteFromClipBoard
         * @function
         * @returns {undefined}
         */
        pasteFromClipBoard: function() {
            if(isSelectingText() === false) {
                return this._pasteAssetfromClipBoard();
            }
        },
        
        
        /**
         * @description open the action list as contextmenu, disable button and open at correct place
         * @function
         * @name nixps-asset.AssetActionList#openOnContextMenu
         * @param {eventObject} pEvent
         * @returns {undefined}
         */
        openOnContextMenu: function(pEvent) {
            // update the past text because an other component instance can have change the values ...
            if (this.isClipBoardEmpty() === false) {
                this.element.DropdownList('changeText', 'assetaction_paste', displayAssetName(clipBoard));
                this.element.find('.assetaction_paste').addClass('assetaction_nameToPaste').attr('title', $.i18n._("nixps-asset-assetactionlist.paste") + " " + displayAssetName(clipBoard));
            }
            this.element.addClass('assetactionlist_contextmenu');
            this.element.DropdownList('openListWithoutButton')
                        .css({
                            'position': 'absolute',
                            'top': pEvent.pageY,
                            'left': pEvent.pageX
                        });
            // calc height of component, 
            // add heights of children because the element is absolute and had height zero
            var elementHeight = 0;
            this.element.children().each(function(){
                elementHeight += $(this).height();
            });
            // if the top of the element and his height are below the bottom screen
            if ($(window).height() < pEvent.clientY + elementHeight) {
                // than remove the difference from the top position
                this.element.css("top", function (index, value) {
                    return parseInt(value) - (pEvent.clientY + elementHeight - $(window).height()) - 5;
                });
            }
        },
        
        /**
         * @description Move a file or folder to a specific folder.
         * @name nixps-asset-AssetActionList#move
         * @function
         * @param {string} pFromUrl the url of the file or folder to be moved.
         * @param {string} pToUrl The url of the folder to move to.
         * @param {string} pSiteName The name of the current site.
         * @returns {Deferred}
         */
        move: function(pOldUrl, pNewUrl, pSiteName) {
            // important, we suppose the api calls are running on the correct current site!!!
            var that = this;
            return this._moveItem(pOldUrl, pNewUrl).done(function(pResult){
                // control if we just moved a file of the clipboard, in this case, update the clipboard
                if(pSiteName === lastClipBoardSite && clipBoard.length > 0 && pOldUrl === clipBoard) {
                    if (typeof pResult.moved_file === "string" && pResult.moved_file.length > 0) {
                        clipBoard = pResult.moved_file;
                    } else if (typeof pResult.moved_folder === "string" && pResult.moved_folder.length > 0) {
                        clipBoard = pResult.moved_folder;
                    }
                    that._storeClipBoard();
                    that.element.DropdownList('changeText', 'assetaction_paste', displayAssetName(clipBoard));
                    that.element.find('.assetaction_paste').addClass('assetaction_nameToPaste').attr('title', $.i18n._("nixps-asset-assetactionlist.paste") + " " + displayAssetName(clipBoard));
                }
            }).fail(function (pError) {
                // could not persistent move
                that._showErrorMessage(pError,
                        $.i18n._("nixps-asset-assetactionlist.move_errormessagetitle"),
                        $.i18n._("nixps-asset-assetactionlist.move_errormessage", [displayAssetName(pOldUrl)]));
            });;
        },
        
        /**
         * @description Copy a file or folder to a specific folder.
         * @name nixps-asset-AssetActionList#copy
         * @function
         * @param {string} pFromUrl the url of the file or folder to be copied.
         * @param {string} pToUrl The url of the folder to copy to.
         * @returns {Deferred}
         */
        copy: function(pFromUrl, pToUrl) {
            var that = this;
            return this._copyItem(pFromUrl, pToUrl).fail(function (pError) {
                // could not persistent copy
                that._showErrorMessage(pError,
                        $.i18n._("nixps-asset-assetactionlist.copy_errormessagetitle"),
                        $.i18n._("nixps-asset-assetactionlist.copy_errormessage", [displayAssetName(pFromUrl)]));
            });;
        },
        
        /**
         * @description returns if the clipboard is currently in use
         * @name nixps-asset.AssetActionList#isClipboardEmpty
         * @function
         * @returns {boolean} true if clipboard is empty, false if clipboard is currently in use
         */
        isClipBoardEmpty: function() {
            return typeof clipBoard !== "string" || clipBoard.length <= 0 || $.inArray(lastClipBoardAction, ["cut", "copy"]) === -1;
        },
        
        /**
         * @description Cut the asset in the clipboard
         * @function
         * @private
         * @returns {undefined}
         */
        _cutAssetToClipBoard: function() {
            clipBoard = this.options.url;
            lastClipBoardAction = "cut";
            lastClipBoardSite = this.options.site;
            this._storeClipBoard();
            this.element.DropdownList('changeText', 'assetaction_paste', displayAssetName(clipBoard));
            this.element.find('.assetaction_paste').addClass('assetaction_nameToPaste').attr('title', $.i18n._("nixps-asset-assetactionlist.paste") + " " + displayAssetName(clipBoard));
            // do not update paste, you can not cut someting in his self
        },
        
        /**
         * @description Copy the asset in the clipboard
         * @function
         * @private
         * @returns {undefined}
         */
        _copyAssetToClipBoard: function() {
            clipBoard = this.options.url;
            lastClipBoardAction = "copy";
            lastClipBoardSite = this.options.site;
            this._storeClipBoard();
            this.element.DropdownList('changeText', 'assetaction_paste', displayAssetName(clipBoard));
            this.element.find('.assetaction_paste').addClass('assetaction_nameToPaste').attr('title', $.i18n._("nixps-asset-assetactionlist.paste") + " " + displayAssetName(clipBoard));
            // do not update paste, you can not copy someting in his self
        },
        
        /**
         * @description past a asset from the clipboard to the current location
         * @function
         * @private
         * @returns {Boolean}
         */
        _pasteAssetfromClipBoard: function() {
            if (typeof clipBoard !== "string" || clipBoard.length <= 0) {
                // clipBoard is empty, disabled it for the security
                this.element.DropdownList('disableItem', 'assetaction_paste')
                            .DropdownList('changeText', 'assetaction_paste', $.i18n._('nixps-asset-assetactionlist.paste'));
                this.element.find('.assetaction_paste').removeClass('assetaction_nameToPaste').attr('title', "");
                // clipboard is empty, do nothing
                return true;
            }
            if (lastClipBoardSite !== this.options.site) {
                // we do not support copy, from differnet sites
                console.error('no support for cross border site copy and paste');
                return true;
            }
            var that = this;
            var pasteDef;
            var oldUrl = clipBoard;
            if (lastClipBoardAction === "copy") {
                // apply the copy actions
                pasteDef = this._copyItem(clipBoard, this.options.url).done(function(pResult) {
                    that._trigger('copied', null, {'oldUrl': oldUrl, 'newUrl': pResult.copied_file, clipBoard: true, returnObject: pResult});
                });
            } else if (lastClipBoardAction === "cut") {
                // apply the cut actions
                pasteDef = this._moveItem(oldUrl, this.options.url).done(function (pResult) {
                    that._trigger('moved', null, {'oldUrl': oldUrl, 'newUrl': pResult.moved_file, clipBoard: true, returnObject: pResult});
                });
                // init the paste
                clipBoard = "";
                lastClipBoardAction = "";
                this.element.DropdownList('disableItem', 'assetaction_paste')
                            .DropdownList('changeText', 'assetaction_paste', $.i18n._('nixps-asset-assetactionlist.paste'));
                this.element.find('.assetaction_paste').removeClass('assetaction_nameToPaste').attr('title', "");
                this._storeClipBoard();
            } else {
                throw new Error('invalid lastClipboard value found: ' + lastClipBoardAction);
            }
            
            return pasteDef.fail(function (pError) {
                // could not persistent move
                that._showErrorMessage(pError,
                        $.i18n._("nixps-asset-assetactionlist.paste_errormessagetitle"),
                        $.i18n._("nixps-asset-assetactionlist.paste_errormessage", [displayAssetName(oldUrl)]));
            });
        },
        
        /**
         * @description Try to store the information of the clipboard
         * @function
         * @private
         * @returns {boolean} true if it could store succesfully, false otherwise
         */
        _storeClipBoard: function() {
            try {
                sessionStorage.setItem('nixps.asset.AssetActionList.clipboard', JSON.stringify({clipBoard: clipBoard, action: lastClipBoardAction, site: lastClipBoardSite, laststoretime: Date.now()}));
                return true;
            } catch(e) {
                // in case of session does not exits or 
                // limit is set to zero, like a private window in Safari
                return false;
            }
        },
        
        /**
         * @description restore the clipboard from the storage. If we found something
         * @function
         * @private
         * @returns {undefined}
         */
        _restoreClipBoard: function() {
            // only restore if nothing is found, otherwise the clipboard has already something
            if (this.isClipBoardEmpty() && typeof sessionStorage === "object" && sessionStorage.length > 0 && supportSessionStorage === true) {
                var dataString = sessionStorage.getItem('nixps.asset.AssetActionList.clipboard');
                if (typeof dataString === "string" && dataString.length > 0) {
                    try {
                        var data = JSON.parse(dataString);
                        // if data correspond to interfase of storing...
                        if (!$.isEmptyObject(data) && typeof data.clipBoard === "string" && typeof data.action === "string" && (typeof data.site === "string" || data.site === null)) {
                            // if copy was not made last 12h
                            if (typeof data.laststoretime === "number" && (Date.now() - (12 * 3600 * 1000)) < data.laststoretime) {
                                clipBoard = data.clipBoard;
                                lastClipBoardAction = data.action;
                                lastClipBoardSite = data.site;
                                // if clipboard is filled: change text
                                if (this.isClipBoardEmpty() === false) {
                                    this.element.DropdownList('changeText', 'assetaction_paste', displayAssetName(clipBoard));
                                    this.element.find('.assetaction_paste').addClass('assetaction_nameToPaste').attr('title', $.i18n._("nixps-asset-assetactionlist.paste") + " " + displayAssetName(clipBoard));
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Could not parse data from storage for clipboard');
                    }
                }
            }
        },
        
        /**
         * @description Remove a item from backend
         * @function
         * @private
         * @returns {Deferred}
         */
        _removeItem: function() {
            var that = this;
            return $.Deferred(function(pDefer){
                if (isFolder(that.options.url)) {
                    api_async.file.delete_folder(that.options.url, false, function(pResults) { 
                        pDefer.resolve(pResults);
                    }, function(pError) {
                        pDefer.reject(pError);
                    });
                } else {
                    api_async.file.delete_file(that.options.url, pDefer.resolve, pDefer.reject);
                } 
            });
        },
        
        /**
         * @description Move a item to a new location
         * @function
         * @private
         * @param {url} pOldUrl The url to move from.
         * @param {url} pNewUrl The new url where to move.
         * @param {Boolean} pErrorOnOverwrite Set on true if you want to error in case of rewrite existing file.
         * @returns {Deferred}
         */
        _moveItem: function(pOldUrl, pNewUrl, pErrorOnOverwrite) {
            if(typeof pOldUrl !== "string" || pOldUrl.length <= 0) {
                throw new Error('parameter pOldUrl must be a not empty string');
            }
            if(typeof pNewUrl !== "string" || pNewUrl.length <= 0) {
                throw new Error('parameter pNewUrl must be a not empty string');
            }
            var that = this;
            if(pOldUrl !== pNewUrl) {
                return $.Deferred(function(pDefer){
                    // control if we have a folder
                    if(isFolder(pOldUrl)) {
                        // We have a folder to move 
                        inMakingCallID ++;
                        that._trigger('needdummy', null, {name: getFolderName(pOldUrl), parentUrl: pNewUrl, inMakingID: inMakingCallID, isFolder: true, deletingPath: getPath(pOldUrl)});
//                        (function (pCallID) {
                            /** @todo only admins can run this comment **/
//                            api_async.file.move_folder(pOldUrl, pNewUrl, {from_contents: true, create_folders: true, unique_name_mode: "Sequential", delete_enclosing_folder: true}, function (pResults) {
//                                that._trigger('removedummy', null, {inMakingID: pCallID, succes: true, isFolder: true});
//                                pDefer.resolve(pResults);
//                            }, function (pError) {
//                                that._trigger('removedummy', null, {inMakingID: pCallID, succes: false, isFolder: true});
//                                pDefer.reject(pError);
//                            });
//                        })(inMakingCallID);
                           (function(pCallID) {
                                api_async.hub.start_from_whitepaper_with_variables("Asset Actions Flow", "Input", {"action": "cut", "sourceFolderUrl": pOldUrl, "targetFolderUrl": pNewUrl}, function(pResult){
                                    that._trigger('removedummy', null, {inMakingID: pCallID, succes: true, isFolder: true});
                                    pDefer.resolve(pResult);
                                }, function(pError) {
                                    that._trigger('removedummy', null, {inMakingID: pCallID, succes: false, isFolder: true});
                                    pDefer.reject(pError);
                                });
                        })(inMakingCallID);
                    } else {
                         // we have a file to move
                        inMakingCallID ++;
                        that._trigger('needdummy', null, {name: getFileName(pOldUrl), parentUrl: pNewUrl, inMakingID: inMakingCallID, isFolder: false, deletingPath: getPath(pOldUrl)});
                        (function (pCallID) {
                            var options = {
                                delete_enclosing_folder: false 
                            };
                            if (pErrorOnOverwrite === true) {
                                options.overwrite = false;
                            } else {
                                options.overwrite = true;
                                options.unique_name_mode = "Sequential";
                            }
                            api_async.file.move_file_with_options(pOldUrl, pNewUrl, options, function (pResults) {
                                that._trigger('removedummy', null, {inMakingID: pCallID, succes: true, isFolder: false});
                                pDefer.resolve(pResults);
                            }, function (pError) {
                                that._trigger('removedummy', null, {inMakingID: pCallID, succes: false, isFolder: false});
                                pDefer.reject(pError);
                            });
                        })(inMakingCallID);
                    }
                });
            } else {
                // url is the same so item is already moved, not nessessary to move
                return $.Deferred().resolve({moved_file: pOldUrl});
            }
        },
        
        /**
         * @description Copy a file or folder to a specific folder
         * @function
         * @private
         * @param {string} pOldUrl The url of the file/folder to copy from.
         * @param {string} pNewFolderUrl The url of the folder to copy to.
         * @returns {Deferred}
         */
        _copyItem: function(pOldUrl, pNewFolderUrl) {
            if (typeof pOldUrl !== "string" || pOldUrl.length <= 0) {
                throw new Error('parameter pOldUrl must be a not empty string');
            }
            if (typeof pNewFolderUrl !== "string" || pNewFolderUrl.length <= 0) {
                throw new Error('parameter pNewUrl must be a not empty string');
            }
            if(!isFolder(pNewFolderUrl)) {
                throw new Error('second argument must be a folder url');
            }
            if(pOldUrl === pNewFolderUrl) {
                return $.Deferred().reject("can not copy folder to himself");
            } else {
                var that = this;
                return $.Deferred(function(pDefer){
                    // control if we have a folder
                    if(isFolder(pOldUrl)) {
                        // We have a folder to copy
                        inMakingCallID ++;
                        that._trigger('needdummy', null, {name: getFolderName(pOldUrl), parentUrl: pNewFolderUrl, inMakingID: inMakingCallID, isFolder: true});
//                        (function(pCallID) {
//                            api_async.file.copy_folder(pOldUrl, pNewFolderUrl, {from_contents: false, create_folders: true, unique_name_mode: "Sequential"}, function(pResult) {
//                                that._trigger('removedummy', null, {inMakingID: pCallID, succes: true, isFolder: true});
//                                pDefer.resolve(pResult);
//                            }, function(pError) {
//                                that._trigger('removedummy', null, {inMakingID: pCallID, succes: false, isFolder: true});
//                                pDefer.reject(pError);
//                            });
//                        })(inMakingCallID);
                        (function(pCallID) {
                            api_async.hub.start_from_whitepaper_with_variables("Asset Actions Flow", "Input", {"action": "copy", "sourceFolderUrl": pOldUrl, "targetFolderUrl": pNewFolderUrl}, function(pResult){
                                that._trigger('removedummy', null, {inMakingID: pCallID, succes: true, isFolder: true});
                                pDefer.resolve(pResult);
                            }, function(pError) {
                                that._trigger('removedummy', null, {inMakingID: pCallID, succes: false, isFolder: true});
                                pDefer.reject(pError);
                            });
                        })(inMakingCallID);
                    } else {
                        // we have a file to copy
                        inMakingCallID ++;
                        that._trigger('needdummy', null, {name: getFileName(pOldUrl), parentUrl: pNewFolderUrl, inMakingID: inMakingCallID, isFolder: false});
                        (function(pCallID) {
                            api_async.file.copy_file_with_options(pOldUrl, pNewFolderUrl,{overwrite: true, create_folders: true, unique_name_mode: "Sequential"}, function(pResult) {
                                that._trigger('removedummy', null, {inMakingID: pCallID, succes: true, isFolder: false});
                                pDefer.resolve(pResult);
                            }, function(pError) {
                                that._trigger('removedummy', null, {inMakingID: pCallID, succes: false, isFolder: false});
                                pDefer.reject(pError);
                            });
                        })(inMakingCallID);
                    }
                });
            } 
        },

        /**
         * @description create a new folder
         * @function
         * @private
         * @param {string} pNewFolderName the name of the new folder, not encoded
         * @return {Deferred}
         */
        _createFolder: function(pNewFolderName) {
            if (typeof pNewFolderName !== "string" || pNewFolderName.length <= 0) {
                throw new Error("parameter pNewFolderName must be a not empty string");
            }
            // pNewFolderName may not be encoded !!
            var that = this;
            if (isFolder(this.options.url)) {
                return $.Deferred(function(pDefer){
                    api_async.file.create_folder(that.options.url, pNewFolderName, function(pResults){
                       pDefer.resolve(pResults); 
                    }, function(pError) {
                        console.error(pError);
                        pDefer.reject(pError);
                    });
                });
            }
        },

        /**
         * @description show the error message to the user
         * @function
         * @private
         * @param {object} pError return error object
         * @param {type} pTitle the title to show to the users
         * @returns {undefined}
         */
        _showErrorMessage: function(pError, pTitle, pMessage) {
            // could not persist renaming
            console.error(pError);
            var textMessage = "";
            if (typeof pMessage === "string" && pMessage.length > 0) {
                textMessage = pMessage;
            } else if(pError !== undefined && $.isArray(pError.messages) && pError.messages.length > 0 &&
                    typeof pError.messages[0].description === "string" && pError.messages[0].description.length > 0) {
                textMessage = pError.messages[0].description;
            }
            $('#notify-area').notify("create", "closeable-error", 
                {title: $.i18n._(pTitle), 
                 text: textMessage},
                {expires: false});
        },

        /**
         * @description show a waiting panel, useing the standard FreezeOverlay
         * @function
         * @private
         * @param {string} pTextToShow text to show during the waiting
         * @returns {undefined}
         */
        _showWaitingPanel: function (pTextToShow) {
            if (this.options.freezeOverlayElement !== null) {
                this.options.freezeOverlayElement.FreezeOverlay({text: pTextToShow}).FreezeOverlay('show');
            }
        },

        /**
         * @description hide the waiting panel
         * @function
         * @private
         * @returns {undefined}
         */
        _hideWaitingPanel: function () {
            if (this.options.freezeOverlayElement !== null) {
                this.options.freezeOverlayElement.FreezeOverlay('hide');
            }
        },

        /**
         * @description Sets the option
         * @function
         * @private
         * @name nixps-asset.AssetActionList#_setOption
         */
        _setOption: function (pKey, pValue) {
            this._superApply(arguments);
            this._controlOptions();
            if (pKey === "url") {
                // new url
                // restore Clipboard if possible
                this._restoreClipBoard();
                // set buttons to correct state
                var assetType = (isFolder(pValue)) ? (isFileStore(pValue) ? "filestore": "folder") : "file";
                var action;
                for (var i = 0; i < this.options.buttons.length; i++) {
                    // assetType can be a string or a function
                    action = (typeof this.options.buttons[i][assetType] === "string") ? this.options.buttons[i][assetType] : this.options.buttons[i][assetType].apply(this, [this.options.url]);
                    if (action === "show") {
                        this.element.DropdownList('showItem', this.options.buttons[i].name);
                    } else if (action === "hide") {
                        this.element.DropdownList('hideItem', this.options.buttons[i].name);
                    } else if (action === "disable") {
                        this.element.DropdownList('disableItem', this.options.buttons[i].name).DropdownList('showItem', this.options.buttons[i].name);
                    } else {
                        this.element.DropdownList('enableItem', this.options.buttons[i].name).DropdownList('showItem', this.options.buttons[i].name);
                    }
                }
            } else if (pKey === "inContextmenu") {
                this._draw();
            } else if ($.inArray(pKey, ["freezeOverlayElement", "site", "buttons", "hide"]) >= 0) {
                // for now no changing needed
                // do not update on new freezeOverlay element
            } else {
                console.warn('update unknow option');
                this._draw();
            }
        },

        /**
         * @description Control the input options and throw a error if needed
         * @name nixps-asset.AssetActionList#_controlOptions
         * @function
         * @private
         * @returns {undefined}
         */
        _controlOptions: function () {
            if (typeof this.options.url !== "string" || this.options.url.length <= 0) {
                throw new Error('input option url must be a not empty string');
            }
            // the current working site
            if (this.options.site === null || this.options.site === undefined || this.options.site === "") {
                this.options.site = null;
            } else if (typeof this.options.site !== "string") {
                throw new Error('input option site must be a string');
            }
            if (this.dialog === undefined || this.dialog.hasClass('nixps-Dialog') === false) {
                console.error('missing Dialog component on body');
            }
        },
        
        _destroy: function() {

        }

    });
    
    
    function storageAvailable(type) {
        try {
            var storage = window[type],
                x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        }
        catch(e) {
            return e instanceof DOMException && (
                // everything except Firefox
                e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === 'QuotaExceededError' ||
                // Firefox
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
                // acknowledge QuotaExceededError only if there's something already stored
                storage.length !== 0;
        }
    }


})(jQuery);