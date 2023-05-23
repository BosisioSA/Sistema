/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */

(function ($) {
    
    function getApprovalID(pFileData) {
        if ($.isArray(pFileData.approvals) && pFileData.approvals.length > 0) {
            var assessID = null;
            for (var assesmentIndex = 0; assesmentIndex < pFileData.approvals.length; ++assesmentIndex) {
                var checkAssessment = pFileData.approvals[pFileData.approvals.length - 1 - assesmentIndex].assessment;
                if (checkAssessment === "pending") {
                    assessID = pFileData.approvals[pFileData.approvals.length - 1 - assesmentIndex].id;
                }
            }
            return assessID;
        }
        return null;
    };
    
    /**
     * @desc this component is a overlay that use the bookflip component to show the content of a folder as a book
     */
    $.widget("nixps-asset.BookView", $.Widget, {
        
        options: {
            /**
             * @description the url of the folder, so we can upload the pages
             * @type string
             */
            url: ""
        },
        
        _controlOptions: function() {
            if(typeof this.options.url !== "string" || this.options.url.length <= 0) {
                throw new Error('option url must be a non empty string');
            }
        },
        
        _create: function () {
            this._controlOptions();
            this.element.addClass(this.widgetFullName);
            // init variables
            this.pageUrls = {};
            // the array containing approvals
            this.approvalArray = [];
            
            this._drawStatic();
            this._draw();
            
            this._on(this.element, {
                'click .closeButton': this._closeButtonClickHandler,
                'bookturncreated' : this._createdHandler,
                'bookturnturning' : this._turningHandler,
                'bookturnchange': this._newPageHandler,
                'click .actionBar .rejectButton': this._actionBarClickHandler
            });
        },
        
        /**
         * @description function runs when user press close button
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _closeButtonClickHandler: function(pEvent, pData) {
            // first handle pending approvals
            // if there are some approval do something
            // if no, the array will be empty and no action is needed
            if ($.isArray(this.approvalArray) && this.approvalArray.length > 0) {
                var rejectIDs = $.map(this.approvalArray, function(pageInfo, index) {
                    if (pageInfo !== '' && !$.isEmptyObject(pageInfo) && pageInfo.action === 'reject') {
                        return pageInfo.approvalid;
                    }
                });
                var pendingIDs = $.map(this.approvalArray, function(pageInfo, index) {
                    if (pageInfo !== '' && !$.isEmptyObject(pageInfo) && pageInfo.action === 'pending') {
                        return pageInfo.approvalid;
                    }
                });
                // trigger event, so parent can decide what to do
                this._trigger('close', null, {pendingIDs : pendingIDs, rejectIDs: rejectIDs});
            }
            
            // close panel
            this.element.find('.screenOverlay').hide();
        },
        
        /**
         * @description function runs when book is readed, fired by book plugin
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _createdHandler: function(pEvent, pData) {
            if ($.isArray(this.approvalArray) && this.approvalArray.length > 0) {
                var mayShow = this.approvalArray[0] !== '' && this.approvalArray[0].action === 'pending';
                if (mayShow) {
                    this.element.find('.actionBar .right.rejectButton').show();
                }
            }
        },
        
        /**
         * @description function runs when user want a other page, when the book is bussy to change from page
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _turningHandler: function(pEvent, pData) {
            // disable buttons if book is bussy, is being flipping,
            // the buttons will reappear if page is done.
            this.element.find('.actionBar .rejectButton').attr('disabled','disabled').addClass('readonly');
        },
        
        
        /**
         * 
         * @param {type} pEvent
         * @param {type} pData
         * @returns {undefined}
         */
        _newPageHandler: function(pEvent, pData) {
            // only handle if there are approvals
            if ($.isArray(this.approvalArray) && this.approvalArray.length > 0) {
                // hide all buttons on default, and decide later on show
                this.element.find('.actionBar .rejectButton, .actionBar .rejected').removeAttr('disabled').removeClass('readonly').hide();
                
                var pageLeftIndex = pData.index;
                if (pageLeftIndex === 0) {
                    // if first page special case > we supose the book start with flap right on pagenumber zero
                    if (!$.isEmptyObject(this.approvalArray[0])) {
                        if (this.approvalArray[0].action === 'pending') {
                            this.element.find('.actionBar .right.rejectButton').show();
                        } else if (this.approvalArray[0].action === 'reject') {
                            this.element.find('.actionBar .right.rejected').show();
                        }
                    }
                } else {
                    // left page
                    if (!$.isEmptyObject(this.approvalArray[pageLeftIndex - 1])) {
                        if (this.approvalArray[pageLeftIndex - 1].action === 'pending') {
                            this.element.find('.actionBar .left.rejectButton').show();
                        } else if (this.approvalArray[pageLeftIndex - 1].action === 'reject') {
                            this.element.find('.actionBar .left.rejected').show();
                        }
                    }// right page
                    if ((this.approvalArray.length > (pageLeftIndex)) && !$.isEmptyObject(this.approvalArray[pageLeftIndex])) {
                        if (this.approvalArray[pageLeftIndex].action === 'pending') {
                            this.element.find('.actionBar .right.rejectButton').show();
                        } else if (this.approvalArray[pageLeftIndex].action === 'reject') {
                            this.element.find('.actionBar .right.rejected').show();
                        }
                    }
                }
            }
        },
        
        /**
         * @description function runs when user press a button on the actionBar
         * @returns {undefined}
         */
        _actionBarClickHandler: function(pEvent, pData) {
            var pageIndex; // zero based
            var currentPageNumber = this.element.find('.nixps-BookTurn').BookTurn('getCurrentPageNumber');
            if (currentPageNumber === 0) {
                pageIndex = 0;
            } else {
                if ($(pEvent.currentTarget).hasClass('left')) {
                    pageIndex = currentPageNumber - 1;
                } else if ($(pEvent.currentTarget).hasClass('right')) {
                    pageIndex = currentPageNumber;
                } else {
                    throw new Error('no left or right class found');
                }
            }
            // is model good? is pageIndex a good number ?
            if ($.isArray(this.approvalArray) && this.approvalArray.length > 0 && 
                    typeof pageIndex === "number" && pageIndex >= 0 &&
                    this.approvalArray.length >= pageIndex) {
                // control if we can approve this page?
                var pageInfo = this.approvalArray[pageIndex];
                if (!$.isEmptyObject(pageInfo) && pageInfo.action === 'pending') {
                    // change pageInfo in model action to reject
                    this.approvalArray[pageIndex].action = 'reject';
                } else {
                    throw new Error('page at nr ' + pageIndex + ' has no action');
                }
            } else {
                throw new Error('approvalArray and/or pageIndex are bad');
            }
            
            $(pEvent.currentTarget).hide().next('.rejected').show();
        },
        
        /**
         * @brief redraw
         */
        redraw: function () {
            this._draw();
        },
        
        _drawStatic: function() {
            // make static panels
            var screenOverlay = $('<div>').addClass('screenOverlay')
                                    .css({
                                            position: 'fixed',
                                            left: 0,
                                            right: 0,
                                            top: 0,
                                            bottom: 0,
                                            'z-index': 100100
                                    });
            var tableCover = $('<div>').addClass('tableCover')
                                       .css({
                                            position: 'fixed',
                                            top: '2%',
                                            bottom: '1%',
                                            width: '96%',
                                            left: '2%'
                                        });

            
            var closeButton = $('<div>').text('x')
                    .addClass('closeButton')
                    .css({
                        'position': 'absolute',
                        'top': 5,
                        'right': 25
                    });
            tableCover.append(closeButton);           
            
            screenOverlay.append(tableCover); // add tableCover to overlay
            this.element.append(screenOverlay.hide()); // add to body
        },
        
        /**
         * @brief draws the dialog according to the current state
         */
        _draw: function () {
            this.element.find('.tableCover .nixps-BookTurn, .tableCover .actionBar').remove();
            this.element.find('.screenOverlay').show();
            
            var that = this;
            $.when(this._getInfoPages(this.options.url)).done(function(pUrlPageDict) {
                var book = $('<div>');
                // first add to parent
                that.element.find('.tableCover').append(book);
                // when parents are know and add to DOM tree, we can add construct
                book.BookTurn({
                    getPage: $.proxy(that._getPage, that),
                    numberOfPages: Object.keys(pUrlPageDict).length,
                    mouseweel: true,
                    loadingPanelContent: $.i18n._('nixps-cloudflow-assets.book-loadingtext')
                });
                
                // add and draw the action bar
                if ($.isArray(that.approvalArray) && that.approvalArray.length > 0) {
                    var leftPageBar = $('<div>').addClass('leftPageBar').append(
                            $('<button>').addClass('left rejectButton button')._t('nixps-cloudflow-assets.folderactions-reject').hide()
                            .prepend($('<img class="approvalstate reject actionListIcon" src="/portal/images/approval_rejected.png">'))
                            ).append(
                            $('<button>').addClass('left rejected button')._t('nixps-cloudflow-assets.status_rejected').hide() 
                            );
                    var rightPageBar = $('<div>').addClass('rightPageBar').append(
                            $('<button>').addClass('right rejectButton button')._t('nixps-cloudflow-assets.folderactions-reject').hide()
                            .prepend($('<img class="approvalstate reject actionListIcon" src="/portal/images/approval_rejected.png">'))
                            ).append(
                            $('<button>').addClass('right rejected button')._t('nixps-cloudflow-assets.status_rejected').hide() 
                            );
                    var actionBar = $('<div>').addClass('actionBar').append(leftPageBar).append(rightPageBar);   
                    that.element.find('.tableCover').append(actionBar);
                }
            }).fail(function(pError){
                throw new Error('could not load pages');
            });
            
        },
        
        /**
         * @description get the image of the specific sub file
         * @param {type} pPageNumber
         * @returns {Deferred}
         */
        _getPage: function(pPageNumber) {
            if ($.isEmptyObject(this.pageUrls)) {
                throw new Error("dictionary pageUrls is missing");
            }
            
            var that = this;
            return $.Deferred(function(pDefer) { 
                var pageUrl = that.pageUrls[(pPageNumber + 1)];
                if (pageUrl === undefined) {
                    return pDefer.reject("empty page"); // empty image
                }
                api_async.proofscope.get_view_info("?url=" + encodeURIComponent(pageUrl), function(pResult) {
                    // control interfase
                    if ($.isEmptyObject(pResult) || $.isEmptyObject(pResult.view) || $.isEmptyObject(pResult.view.parameters)) {
                        pDefer.reject("Result has wrong interface, expect pResult.view.parameters to be an object");
                    }
                    if (!$.isArray(pResult.view.parameters.pageViews) || pResult.view.parameters.pageViews.length <= 0){
                        pDefer.reject("pageViews must be a not empty array");
                    }
                    if ($.isEmptyObject(pResult.view.parameters.pageViews[0].parameters)) {
                        pDefer.reject("pResult.view.parameters.pageViews[0].parameters must be a full object");
                    }
                    var asset_id = pResult.view.parameters.pageViews[0].parameters.assetID;
                    var view_id = pResult.view.parameters.pageViews[0].viewID;
                    if (typeof asset_id === "string" && asset_id.length > 0 &&  typeof view_id === "string" && view_id.length > 0) {
                        var page = $('<img>').attr('src', "/portal.cgi?proofscope=get_graphic_tile&view_id=" + view_id + "&asset_id=" + asset_id + "&page=0&zoom=1&row=0&column=0").css({
                                'max-height':  '100%',
                                'max-width': '100%' });
                        pDefer.resolve(page);
                    } else {
                        pDefer.reject("no image aviable: missing asset_id or view_id");
                    }
                }, function(pError) {
                    pDefer.reject(pError);
                });
            /*    api_async.asset.list([ "cloudflow.part", "equal to", pageUrl] , ['thumb'],  
                    function(pResults){
                        if($.isArray(pResults.results) && pResults.results.length > 0 && typeof pResults.results[0].thumb === "string") {
                            var page = $('<img>').attr('src', pResults.results[0].thumb).css({
                                'max-height':  '100%',
                                'max-width': '100%' });
                            pDefer.resolve(page);
                        } else {
                            pDefer.reject("no thumb aviable");
                        }
                    },
                    function(pError) {
                        pDefer.reject(pError);
                        console.error(pError);
                    });*/
            }).fail(function(pError){
                console.error(pError);
            });
        },
        
        /**
         * @description get all the urls of all the files in the folder. 
         * Those are the urls for the specific pages. 
         * This function saves them in the dictionary variable 'pageUrls' 
         * @param {type} pFolderUrl the url of the folder
         * @returns {Deferred}
         */
        _getInfoPages: function (pFolderUrl) {
            if (typeof pFolderUrl !== "string" || pFolderUrl.length <= 0) {
                throw new Error('inputparameter must be a non empty string');
            }
            
            var that = this;
            return $.Deferred(function (pDefer) {
                api_async.asset.list_with_options(
                    ["sub", "equal to", "", "and", "cloudflow.enclosing_folder", "equal to", pFolderUrl], 
                    [], 
                    ["cloudflow.file", "approvals"],
                    {"use_index" : "Asset_EnclosingFolderURL"}, function (pResult) {
                    if ($.isArray(pResult.results) && pResult.results.length > 0) {
                        var regExpBook = new RegExp("(.*)p([0-9]+)\.[a-z]+$"); // if has a name that end as <something> + 'p' + <number> + <extentie>
                        that.pageUrls = {};
                        // loop over all files
                        for (var i = 0; i < pResult.results.length; i++) {
                            if ($.isPlainObject(pResult.results[i].cloudflow) && typeof pResult.results[i].cloudflow.file === "string" && regExpBook.test(pResult.results[i].cloudflow.file)) { // if file has correct interfase
                                // add url to dictionary and the pagenumber is the key
                                // convert to number so 001 will be recognised as equal as 1
                                that.pageUrls[parseInt(pResult.results[i].cloudflow.file.replace(regExpBook, "$2"))] = pResult.results[i].cloudflow.file;
                            }
                        }
                        pResult.results.sort(function(a, b) {
                            // we suposse that the name is the same for all pages except for pagenumbers !!
                            if($.isPlainObject(a.cloudflow) && typeof a.cloudflow.file === "string" && 
                                $.isPlainObject(b.cloudflow) && typeof b.cloudflow.file === "string") {
                                if (a.cloudflow.file < b.cloudflow.file) {
                                    return -1;
                                } else if (a.cloudflow.file > b.cloudflow.file) {
                                    return 1;
                                } 
                                return 0;
                            } else {
                                return -1;
                            }
                        });
                        // approval stufs
                        that.approvalArray = that._getPendingApprovals(pResult.results);
                        
                        pDefer.resolve(that.pageUrls);
                    } else {
                        pDefer.reject('no array files found');
                    }
                }, function (pError) {
                    pDefer.reject(pError);
                });
            });
        },
        
        /**
         * @desc make the internal approval array model
         * @param {Array | pageInfo} pPageInfo
         * @returns {Array}
         */
        _getPendingApprovals: function(pPageInfo) {
            var found = false;
            var approvalArray = $.map(pPageInfo, function(elem, index) {
                var id = getApprovalID(elem);
                if( id !== null ) {
                    found = true;
                    return { approvalid: id, action: 'pending' };
                }
                return '';
            });
            
            if (found) {
                return approvalArray;
            } else {
                [];
            }
        },
        
//        _isPortrait: function(pArray) {
//            if($.isPlainObject(pArray[0].metadata) && 
//                        $.isPlainObject(pArray[0].metadata.page_boxes) && 
//                        $.isPlainObject(pArray[0].metadata.page_boxes.media) &&
//                        $.isPlainObject(pArray[0].metadata.page_boxes.media.size) &&
//                        typeof pArray[0].metadata.page_boxes.media.size.height === "number" &&
//                        typeof pArray[0].metadata.page_boxes.media.size.width === "number"){
//                    
//                    return pArray[0].metadata.page_boxes.media.size.width < pArray[0].metadata.page_boxes.media.size.height;
//            } else {
//                return true;
//            }
//        },
//        
//        /**
//         * @description calc the width of the book. It taks the larged width
//         * @param {array} pArray
//         * @returns {unresolved}
//         */
//        _calcBookWidth: function (pArray) {
//            var width = 0;
//            $.each(pArray, function (index, elem) {
//                if ($.isPlainObject(elem.metadata) &&
//                        $.isPlainObject(elem.metadata.page_boxes) &&
//                        $.isPlainObject(elem.metadata.page_boxes.media) &&
//                        $.isPlainObject(elem.metadata.page_boxes.media.size) &&
//                        typeof elem.metadata.page_boxes.media.size.height === "number" &&
//                        typeof elem.metadata.page_boxes.media.size.width === "number") {
//
//                    var widthElem = kTumbHeight * (elem.metadata.page_boxes.media.size.width / elem.metadata.page_boxes.media.size.height);
//                    if (width < widthElem) {
//                        width = widthElem;
//                        if (width === kTumbWidth) {
//                            // to prevent calculation unuseless and preventing heiger values than maximum
//                            return false; // break
//                        }
//                    }
//                }
//            });
//
//            return parseInt(width);
//        },
//        
//        /**
//         * @description calc the width of the book. It taks the larged width
//         * @param {array} pArray
//         * @returns {unresolved}
//         */
//        _calcBookHeight: function (pArray) {
//            var height = 0;
//            $.each(pArray, function (index, elem) {
//                if ($.isPlainObject(elem.metadata) &&
//                        $.isPlainObject(elem.metadata.page_boxes) &&
//                        $.isPlainObject(elem.metadata.page_boxes.media) &&
//                        $.isPlainObject(elem.metadata.page_boxes.media.size) &&
//                        typeof elem.metadata.page_boxes.media.size.height === "number" &&
//                        typeof elem.metadata.page_boxes.media.size.width === "number") {
//
//                    var heightElem = kTumbWidth * (elem.metadata.page_boxes.media.size.height / elem.metadata.page_boxes.media.size.width);
//                    if (height < heightElem) {
//                        height = heightElem;
//                        if (height === kTumbHeight) { 
//                            // to prevent calculation unuseless and preventing heiger values than maximum
//                            return false; // break
//                        }
//                    }
//                }
//            });
//            
//            return parseInt(height);
//        },
        
        /**
         * @brief sets the option
         */
        _setOption: function (pKey, pValue) {
            this._superApply(arguments);
            this._controlOptions();
            if (pKey === 'url') {
                this._draw();
            }
        }

    });

})(jQuery);


