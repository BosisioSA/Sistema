/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 *
 *   created by guillaume on Oct 7, 2016 3:35:52 PM
 */
/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, $, QuantumNode, QuantumWhitepaper, _ */

(function ($) {

	require("../../approval/js/nixps-approval-ApprovalView.js");
	require("../../cloudflow/ApprovalView/js/nixps-cloudflow-ApprovalView.js");
	//require("../../kiosk/js/nixps-kiosk-NewWorkable.js"); // is provided by framework.js
	require("../../cloudflow/Log/js/nixps-cloudflow-Log.js");
	require("../../cloudflow/Tags/js/nixps-cloudflow-Tags.js");
	var Value = require("../../cloudflow/Units/js/Value.js");
	var Unit = require("../../cloudflow/Units/js/Unit.js");
	var UnitPreferences = require("../../cloudflow/Units/js/UnitPreferences.js");

    function pad(value) {
        return value < 10 ? '0' + value : value;
    }
    function createOffset(date) {
        var sign = (date.getTimezoneOffset() > 0) ? "-" : "+";
        var offset = Math.abs(date.getTimezoneOffset());
        var hours = pad(Math.floor(offset / 60));
        var minutes = pad(offset % 60);
        return sign + hours + ":" + minutes;
    }

	/**
	 * @namespace nixps-asset.MetadataView
	 * @description View all the info of an asset
	 */
	$.widget("nixps-asset.MetadataView", $.Widget, {

		options: {
			/**
             * @name nixps-asset.MetadataView#language
             * @description The language of the user
             * @type {String}
             * @default "en"
             */
			language: "en",
			
			/**
			 * @name nixps-asset.MetadataView#url
			 * @description The url of the asset, where we want to see information on.
			 * @type {String}
			 * @default ""
			 */
			url: "",

			/**
			 * @name nixps-asset.MetadataView#sub
			 * @description The sub of the asset we are viewing
			 * @type {String}
			 * @default ""
			 */
			sub: "",

			/**
			 * @name nixps-asset.MetadataView#user
			 * @description The current working user
			 * @type {User}
			 * @default null
			 */
			user: null,

			/**
			 * @name nixps-asset.MetadataView#fileData
			 * @description A object containing all the information about the asset/file
			 * @type {object}
			 * @default {}
			 */
			fileData: {},

			/**
			 * @name nixps-asset.MetadataView#encode_url_in_infopanel
			 * @description must we encode the urls in the infopanels or not
			 * @type {boolean}
			 * @default true
			 */
			encode_url_in_infopanel: true
		},

		/**
		 * @description create the component
		 * @name nixps-asset.MetadataView#_create
		 * @function
		 * @private
		 * @returns {undefined}
		 */
		_create: function () {
			this._controlOptions();
			this.element.addClass(this.widgetFullName);

			this.m_json_blob = undefined;
			this.m_pagenumber = -1;
			this.m_unitPreferences;
			this.m_lengthUnit;
			this.m_mmUnit = new Unit({"unit": "mm"});
			this.m_resolutionUnit;
			this.m_ppmmUnit = new Unit({"unit": "dpmm"});
			this.m_rulingUnit;
			this.m_lpmmUnit = new Unit({"unit": "lpmm"});
			this.timerID; // the id of the update timer
			this.syncTimerID;
			this.user = this.options.user;

			this._draw();

			this._on(this.element, {
			   "click #tabs-pages .thumb_box" : this._pageThumbClickHandler,
			   "click #tabs-workflow .hub-submit-done": this._workflowSubmitDoneClickHandler,
               "createworkablesubmitted .generalSubmit": this._workflowSubmittedHandler,
			   "keypress #tabs-approval .approver_selector": this._approvalKeyPressHandler,
			   "click #tabs-approval .invite_user .remove": this._approvalInviteUserRemoveClickHandler,
			   "click #tabs-approval .invite_users": this._inviteUsersClickHandler
			});
		},

		_pageThumbClickHandler: function(pEvent, pData) {
			this._trigger('open', null,  $(pEvent.target).closest('.thumb_box').data('itemData'));
		},

		_workflowSubmitDoneClickHandler: function(pEvent, pData) {
			var tab = $(pEvent.target).closest('#tabs-workflow');
			tab.find('.hub-submit-done').hide();
			tab.find('.hub-submit').show();
		},

        _workflowSubmittedHandler :function(pEvent, pData){
            $(pEvent.target).closest('.hub-submit').hide(); // hide yourself
			$(pEvent.target).closest('#tabs-workflow').find('.hub-submit-done').show(); // show done panel, brother of submit component
        },

		_approvalKeyPressHandler: function(pEvent, pData) {
			if(pEvent.which === 13) {
				pEvent.preventDefault();
				$(this).parents('.invite_userlist').find('.userlabel').html("<img src='portal/images/empty.png' width='1px' height='25px'>");
				$(this).parents('.invite_userlist').prepend($("<div class='invite_user' user='" + $(this).val() + "'><label class='infolabel userlabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-approval_tab-invite-users') + "</label><img class='remove' src='/portal/images/close.gif'/>" + $(this).val() + "</div>"));
				$(this).val('');
			}
		},

		_approvalInviteUserRemoveClickHandler: function(pEvent, pData) {
			$(this).parents('.invite_user').remove();
		},

		_inviteUsersClickHandler: function(pEvent, pData) {
			this.element.find('#tabs-approval .invite_users').hide();
			this.element.find('#tabs-approval .invite_users_wait').show();
			var users = [];
			this.element.find('#tabs-approval').find('.invite_user').each(function(index, element) {
				var username = element.getAttribute('user');
				if (username) {
					users.push(username);
				}
			});
			var expday = parseInt($('#tabs-approval .exp_d').val());
			if (isNaN(expday)) {
				expday = 0;
			}
			var exphours = parseInt($('#tabs-approval .exp_h').val());
			if (isNaN(exphours)) {
				exphours = 0;
			}
			var exptime = ((expday * 24) + exphours) * 3600000;
			if (exptime <= 0) {
				exptime = 24 * 3600000;
			}
			var expdate = ((new Date()).getTime() + exptime) / 1000;
			if (this.element.find('#tabs-approval').find(".approver_selector").val() !== '') {
				users.push(this.element.find('#tabs-approval').find(".approver_selector").val());
			}
			var msg = this.element.find('#tabs-approval .invite-msg').val();

			var that = this;
			$.post('/portal.cgi',JSON.stringify({ "method" : "request.config", "name" : "servers" })).done(function(pBlob){
				var webserver = null;
				if (!$.isEmptyObject(pBlob) && !$.isEmptyObject(pBlob.preferences) &&
						typeof pBlob.preferences.web_server === "string" && pBlob.preferences.web_server.length > 0) {
					webserver = pBlob.preferences.web_server;
					// remove last '/' if present
					if (webserver.charAt(webserver.length - 1) === '/' || webserver.charAt(webserver.length - 1) === '\\') {
						webserver = webserver.slice(0, -1);
					}
				} else {
					// fall back in case of not finding server setting
					webserver = window.location.href.split('/')[0] + "//" + window.location.href.split('/')[2];
				}
				api_async.proofscope.invite(that.options.url, users, msg, webserver, "111", expdate, function (data) {
					$('#tabs-approval .invite_users').show();
					$('#tabs-approval .invite_users_wait').hide();
				}, function (data) {
					var feedback = "";
					if (data.error_code !== "unknown") {
						feedback = data.error;
					}
					if (data.messages !== undefined) {
						for (var countMessages = 0; countMessages < data.messages.length; ++countMessages) {
							if (feedback.length != 0) {
								feedback = feedback + " / ";
							}
							feedback = feedback + data.messages[countMessages].description;
						}
					}
					if (feedback.length == 0) {
						feedback = data.error;
					}
					api.message("Invite", feedback, 'closeable-error', true);
					$('#tabs-approval .invite_users').show();
					$('#tabs-approval .invite_users_wait').hide();
				});
			});
		},


		/**
		 * @description redraw the component
		 * @function
		 * @name nixps-asset.MetadataView#redraw
		 */
		redraw: function () {
			this._draw();
		},

		/**
		 * @description Get the unit prefrences from backend
		 * @function
		 * @private
		 * @name nixps-asset.MetadataView#_createUnitPreferencesVariabels
		 * @returns Deferred
		 */
		_createUnitPreferencesVariabels: function(){
			if (this.m_unitPreferences !== undefined) {
				return this.m_unitPreferences;
			} else {
				var that = this;
				return UnitPreferences.get().then(function(pUnitPreferences){
					that.m_unitPreferences = pUnitPreferences;
					that.m_lengthUnit = that.m_unitPreferences.getDefinition("length");
					that.m_resolutionUnit = that.m_unitPreferences.getDefinition("resolution");
					that.m_rulingUnit = that.m_unitPreferences.getDefinition("ruling");
				});
			}
		},

		/**
		 * @description draws the dialog according to the current state
		 * @function
		 * @private
		 * @name nixps-asset.MetadataView#_draw
		 * @return {undefined}
		 */
		_draw: function () {
			var that = this;

			this.element.empty()
						.show()
						.append("<div id='metadata-tabs'><ul id='metadata-navs'></div>");

			// Create Panes
			this._infotabCreate();
			this._imagestab_create();
			this._pagestab_create();
			this._pageboxestab_create();
			this._productiontab_create();
			this._layerstab_create();
			this._referencestab_create();
			this._xmptabCreate();
			this._tagstabCreate();
			this._approvaltabCreate();
			this._usedintab_create();
			this._workflowtabCreate();
			this._synctabCreate();

			if (this.user.hasPermission("ADMIN")) {
				this._loggingtab_create();
			}

			this.element.find('#metadata-tabs').tabs();
			this.selectTab(0);
			// Fill in the current information
			if (typeof this.options.sub.length > 2 && this.options.sub.substring(0, 2) === "p_") {
				this.m_pagenumber = parseInt(this.options.sub.substring(2), 10);
			}

			var dataDef;
			if (this.options.fileData !== undefined) {
				this.m_json_blob = this.options.fileData;
				dataDef = this.m_json_blob;
			} else {
				// Request new Metadata
				dataDef = $.Deferred(function(pDefer){
					api_async.request.metadata(this.options.url, this.options.sub, function(p_api_data) {
						that.m_json_blob = p_api_data;
						pDefer.resolve(that.m_json_blob);
					}, pDefer.reject);
				});
			}

			$.when(dataDef, this._createUnitPreferencesVariabels()).then(function(pFileData){
				that.refresh();
			}, function(pError){
				console.error(pError);
				console.warn('could not refresh the infopanel');
			});
		},

		/**
		 * @name nixps-asset.MetadataView#selectTab
		 * @description Select a tab.
		 * @function
		 * @param {number|string} pTabIndex A tab index or a selector string
		 * @returns {undefined}
		 */
		selectTab: function(pTabIndex) {
			this.element.find('#metadata-tabs').tabs('select', pTabIndex);
		},

		/**
		 * @name nixps-asset.MetadataView#refresh
		 * @description Refresh all panes, included those who are self refreshing
		 * @function
		 * @returns {undefined}
		 */
		refresh: function() {
			this._refreshUndependentPanes();
			this._refreshDependentPanes();
		},

		/**
		 * @description Refresh the panes that are self refreshing
		 * @function
		 * @private
		 * @returns {undefined}
		 */
		_refreshDependentPanes: function() {
			this.synctab_refresh();
			this._loggingtab_refresh();
		},

		/**
		 * @description Refresh the panes that can not refresh themself
		 * @function
		 * @private
		 * @returns {undefined}
		 */
		_refreshUndependentPanes: function() {
			this._infotabRefresh();
			this._imagestab_refresh();
			this._pagestab_refresh();
			this._pageboxestab_refresh();
			this._productiontab_refresh();
			this._layerstab_refresh();
			this._referencestab_refresh();
			this._xmptabRefresh();
			this._tagstabRefresh();
			this._approvaltabRefresh();
			this._usedintab_refresh();
			this._workflowtabRefresh();
			this._triggerTimer();
		},

		_triggerTimer: function() {
			clearTimeout(this.timerID);
			if ($('#metadata-tabs').is(':visible') === true && $.isPlainObject(this.m_json_blob) && (this.m_json_blob.need_metadata !== undefined || this.m_json_blob.need_preview !== undefined)) {
				var that = this;
				this.timerID = setTimeout(function() {
					api_async.request.metadata(that.options.url, that.options.sub, function(p_api_data) {
						that.m_json_blob = p_api_data;
						// todo add refresh for thumb nails above
						that._refreshUndependentPanes();
					}, function(pError) {
						console.warn('could not refresh the infopanel');
					});
				}, 10000);
			}
		},


		_getScalingAndCompensation: function(pObject) {
			var result = {};
			if (pObject.scaling !== undefined) {
				result['horizontalScaling'] = pObject.scaling.horizontal;
				result['verticalScaling'] = pObject.scaling.vertical;
				result['scalingApplied'] = pObject.scaling.applied;
			}
			if (pObject.output_color_space !== undefined && pObject.output_color_space.colorants !== undefined) {
				var colorant = pObject.output_color_space.colorants[0];
				if (colorant.compensation !== undefined) {
					if (colorant.compensation.plate !== undefined && colorant.compensation.plate.applied === true) {
						result['horizontalCompensation'] = colorant.compensation.plate.horizontal;
						result['verticalCompensation'] = colorant.compensation.plate.vertical;
					}
					if (colorant.compensation.carrier !== undefined && colorant.compensation.carrier.applied === true) {
						if (result['horizontalCompensation'] !== undefined) {
							result['horizontalCompensation'] *= colorant.compensation.carrier.horizontal;
							result['verticalCompensation'] *= colorant.compensation.carrier.vertical;
						} else {
							result['horizontalCompensation'] = colorant.compensation.carrier.horizontal;
							result['verticalCompensation'] = colorant.compensation.carrier.vertical;
						}
					}
				}
			}

			return result;
		},

		_tagstabCreate: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-tags-tab'><a href='#tabs-tags'>" + $.i18n._('nixps-cloudflow-assets.metadata-tag_tab_title') + "</a></li>");
			this.element.find('#metadata-tabs').append("<div id='tabs-tags'><h1>" + $.i18n._('nixps-cloudflow-assets.metadata-tag_tab_title') + ":</h1><div>");
		},

		_tagstabRefresh: function() {
			this.element.find('#tabs-tags-tab').show();

			this.element.find('#metadata-tabs #tabs-tags .tagsContainer').remove();
			if(typeof this.m_json_blob.cloudflow.file === "string" && this.m_json_blob.cloudflow.file.length > 0) {
				var tagsContainer = $('<div>').addClass('tagsContainer');
				this.element.find('#metadata-tabs #tabs-tags').append(tagsContainer);
				this.element.find('#metadata-tabs #tabs-tags .tagsContainer').Tags({
					assetUrl: this.m_json_blob.cloudflow.file,
					showEmptyText: true
				});
			}
		},

		_loggingtab_create: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-logging-tab'><a href='#tabs-log'>" + $.i18n._('nixps-cloudflow-assets.metadata-log_tab-title') + "</a></li>");
			var logging = $('<div>').addClass('loggingComp').Log({});
			this.element.find('#metadata-tabs').append(logging);
		},

		_loggingtab_refresh: function() {
			this.element.find('#tabs-logging-tab').show();
			var that = this;
			this.element.find('#metadata-tabs .loggingComp').Log({
				filter_url: that.m_json_blob.url,
				build_filter: function(l_this) {
						var l_json = {'url': that.m_json_blob.url, 'sub' : that.options.sub};
						// Add filter for log_level
						if (l_this.m_log_level == "INFO")
							l_json["severity"] = {"$ne": "DEBUG"};
						else if (l_this.m_log_level == "WARNING")
							l_json["severity"] = {"$in": ["WARNING", "ERROR"]};
						else if (l_this.m_log_level == "ERROR")
							l_json["severity"] = "ERROR";
						return l_json;
					}
			}).Log('load_logs');
		},

		_infotabCreate: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-info-tab'><a href='#tabs-info'><span id='dummy-tab-label'></span></a></li>");
			this.element.find('#dummy-tab-label').text($.i18n._('nixps-cloudflow-assets.metadata-loading') + '...');
			this.element.find('#metadata-tabs').append("<div id='tabs-info'></div>");
		},

		_infotabRefresh: function() {
			this.element.find('#tabs-info-tab').show();
			this.element.find("#dummy-tab-label").empty();
			this.element.find("#dummy-tab-label")._t('nixps-cloudflow-assets.metadata-info_tab-title');
			this.element.find('#tabs-info').empty();
			// get the media box. used in several places
			var mediaBox = null;
			var scalingAndDistortion = undefined;

			if (this.m_json_blob.metadata !== undefined && this.m_json_blob.metadata.page_boxes !== undefined && this.m_json_blob.metadata.page_boxes.media !== undefined)
			{
				mediaBox = this.m_json_blob.metadata.page_boxes.media;
				scalingAndDistortion = this._getScalingAndCompensation(this.m_json_blob.metadata);
			}
			else if (this.m_json_blob.metadata !== undefined && this.m_json_blob.metadata.pages !== undefined && this.m_json_blob.metadata.pages[0].page_boxes !== undefined && this.m_json_blob.metadata.pages[0].page_boxes.media !== undefined)
			{
				mediaBox = this.m_json_blob.metadata.pages[0].page_boxes.media;
				scalingAndDistortion = this._getScalingAndCompensation(this.m_json_blob.metadata.pages[0]);
			}

			if (mediaBox != undefined) {
				documentWidth = mediaBox.size_mm.width;
				documentHeight = mediaBox.size_mm.height;
				if (scalingAndDistortion.horizontalScaling !== undefined) {
					if (scalingAndDistortion.scalingApplied === false) {
						 documentWidth *= scalingAndDistortion.horizontalScaling;
						 documentHeight *= scalingAndDistortion.verticalScaling;
					}
				}
			}

			// add some generic info
			$('#tabs-info').append("<h1>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-title') + "</h1>");
			var ref = this.m_json_blob.url;
			if (this.m_json_blob.cloudflow.file !== undefined) {
				ref = this.m_json_blob.cloudflow.file;
			}
			if (this.options.encode_url_in_infopanel === false) {
				ref = decodeURIComponent(ref);
			}

			$('#tabs-info').append("<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-server_url') + "</label><span class='infovalue'>" + ref + "</span><br/>");
			if (this.m_json_blob.sub !== undefined && this.m_json_blob.sub != "") {
				if (this.m_pagenumber !== -1) {
					var range = "";
					if (this.m_json_blob.total_pagecount !== undefined)
						range = $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-server_url-page_with_count', [this.m_pagenumber + 1, this.m_json_blob.total_pagecount]);
					else
						range = $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-server_url-page_without_count', [this.m_pagenumber + 1]);

					$('#tabs-info').append("<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-server_url-page_prompt') + "</label><span class='infovalue'>" + range + "</span><br/>");
				} else {
					$('#tabs-info').append("<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-server_url-sub_prompt') + "</label><span class='infovalue'>" + this.m_json_blob.sub + "</span><br/>");
				}
			}
			var mimeType = this.m_json_blob.filetype;
			if (this.m_json_blob.mime_types !== undefined && this.m_json_blob.mime_types.length > 1) {
				mimeType += " (";
				var addComma = false;
				var mimeTypeIndex;
				for (mimeTypeIndex in this.m_json_blob.mime_types) {
					if (this.m_json_blob.mime_types[mimeTypeIndex] !== this.m_json_blob.filetype) {
						if (addComma === true) {
							mimeType += ", ";
						}
						mimeType += this.m_json_blob.mime_types[mimeTypeIndex];
						addComma = true;
					}
				}
				mimeType += ")";
			}
			$('#tabs-info').append("<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-mimetype') + "</label><span class='infovalue'>" + mimeType + "</span><br/>");
			var pagecount = 0;
			var physicalPageCount = 0;
			if (this.m_json_blob.metadata !== undefined && this.m_json_blob.metadata.number_of_logical_pages !== undefined) {
				pagecount = this.m_json_blob.metadata.number_of_logical_pages;
			}
			if (this.m_json_blob.metadata !== undefined && this.m_json_blob.metadata.number_of_pages !== undefined) {
				if ((this.m_json_blob.metadata.output_color_space !== undefined && this.m_json_blob.metadata.output_color_space.is_separated !== undefined && this.m_json_blob.metadata.output_color_space.is_separated === true)
					|| this.m_json_blob.metadata.number_of_logical_pages !== this.m_json_blob.metadata.number_of_pages) {
					physicalPageCount = this.m_json_blob.metadata.number_of_pages;
				}
			}
			if (pagecount != 0) {
				var value = pagecount;
				if (physicalPageCount !== 0) {
					var value = $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-page_count_logical_and_physical', [pagecount, physicalPageCount]);
				}
				$('#tabs-info').append("<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-page_count') + "</label><span class='infovalue'>" + value + "</span><br/>");
			} if (this.m_json_blob.file_size !== undefined)
				$('#tabs-info').append("<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-file_size') + "</label><span class='infovalue'>" + nixps_utils.humanize_filesize(this.m_json_blob.file_size) +"</span><br/>");
			if (this.m_json_blob.file_time !== undefined) {
				if (this.m_json_blob.file_time.creation_local !== undefined) {
					// the date should be converted to a human-readable LOCAL time, probably based on the the utc time, or the epoch time (which is also UTC based!)
					$('#tabs-info').append("<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-creation_time') + "</label><span class='infovalue'>" + (new Date(this.m_json_blob.file_time.creation_utc)).toLocaleString() +"</span><br/>");
				}
				if (this.m_json_blob.modtime !== undefined) {
					// the date should be converted to a human-readable LOCAL time, probably based on the the utc time, or the epoch time (which is also UTC based!)
                    var modtime = (new Date(this.m_json_blob.modtime * 1000));
					$('#tabs-info').append("<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-modification_time') + "</label><span class='infovalue'>" + modtime.toLocaleString() + " " + createOffset(modtime) +  "</span><br/>");
				}
			}
			if (this.m_json_blob.metadata !== undefined && this.m_json_blob.metadata.job !== undefined) {
				var jobInfo = "";
				if (this.m_json_blob.metadata.job.job_id !== undefined) {
					jobInfo = $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-job-job-id') + ": " + this.m_json_blob.metadata.job.job_id;
				}
				if (this.m_json_blob.metadata.job.job_part_id !== undefined) {
					if (jobInfo !== "") {
						jobInfo += ", ";
					}
					jobInfo += $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-job-job-part-id') + ": " + this.m_json_blob.metadata.job.job_part_id;
				}
				if (this.m_json_blob.metadata.job.order_id !== undefined) {
					if (jobInfo !== "") {
						jobInfo += ", ";
					}
					jobInfo += $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-job-order-id') + ": " + this.m_json_blob.metadata.job.order_id;
				}
				if (this.m_json_blob.metadata.job.sub_order_id !== undefined) {
					if (jobInfo !== "") {
						jobInfo += ", ";
					}
					jobInfo += $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-job-sub-order-id') + ": " + this.m_json_blob.metadata.job.sub_order_id;
				}
				$('#tabs-info').append("<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-job') + "</label><span class='infovalue'>" + jobInfo + "</span><br/>");
			}
			if (this.m_json_blob.metadata !== undefined && this.m_json_blob.metadata.barcodes !== undefined) {
				var barcodes = "";
				var barcodeIndex;
				for (barcodeIndex in this.m_json_blob.metadata.barcodes)
				{
					if (barcodes !== "") {
						barcodes += ", ";
					}
					barcodes += this.m_json_blob.metadata.barcodes[barcodeIndex].type + ": " + this.m_json_blob.metadata.barcodes[barcodeIndex].code;
				}
				$('#tabs-info').append("<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-generic-barcode') + "</label><span class='infovalue'>" + barcodes + "</span><br/>");
			}

			// add size info
			if (mediaBox !== null)
			{
				$('#tabs-info').append("<h1>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-size-title') + "</h1>");
			}

			var pixel_data = null;
			if (this.m_json_blob.metadata !== undefined && this.m_json_blob.metadata.pixel_data !== undefined && this.m_json_blob.metadata.pixel_data.size !== undefined)
			{
				pixel_data = this.m_json_blob.metadata.pixel_data;
			}
			else if (this.m_json_blob.metadata !== undefined && this.m_json_blob.metadata.pages !== undefined && this.m_json_blob.metadata.pages[0].pixel_data !== undefined && this.m_json_blob.metadata.pages[0].pixel_data.size !== undefined)
			{
				pixel_data = this.m_json_blob.metadata.pages[0].pixel_data;
			}
			if (pixel_data === null)
			{
				if (mediaBox !== null)
				{
					// size info for non-pixel data
					$('#tabs-info').append("<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-size-width') + "</label><span class='infovalue'>" + new Value(documentWidth, this.m_mmUnit).convert(this.m_lengthUnit).toString() +"</span><br/>");
					$('#tabs-info').append("<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-size-height') + "</label><span class='infovalue'>" + new Value(documentHeight, this.m_mmUnit).convert(this.m_lengthUnit).toString() +"</span><br/>");
				}
			}
			else if (mediaBox !== null)
			{
				$('#tabs-info').append
				(
					"<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-size-width') + "</label><span class='infovalue'>" +
					new Value(documentWidth, this.m_mmUnit).convert(this.m_lengthUnit).toString() +
					" - " + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-size-n_pixels', [pixel_data.size.width]) +
					" - " + new Value(pixel_data.resolution_ppmm.x, this.m_ppmmUnit).convert(this.m_resolutionUnit).toString() +
					"</span><br/>"
				);
				$('#tabs-info').append
				(
					"<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-size-height') + "</label><span class='infovalue'>" +
					new Value(documentHeight, this.m_mmUnit).convert(this.m_lengthUnit).toString() +
					" - " + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-size-n_pixels', [pixel_data.size.height]) +
					" - " + new Value(pixel_data.resolution_ppmm.y, this.m_ppmmUnit).convert(this.m_resolutionUnit).toString() +
					"</span><br/>"
				);
			}

			// basic separation info
			if ((this.m_json_blob.metadata !== undefined) && (this.m_json_blob.metadata.output_color_space !== undefined) && (this.m_json_blob.metadata.output_color_space.colorants !== undefined))
			{
				$('#tabs-info').append("<h1>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-colorants-title') + "</h1>");
				var colorants = this.m_json_blob.metadata.output_color_space.colorants;

				var colorantIndex;
				for (colorantIndex in colorants)
				{
					this.separationstab_add_row(colorants[colorantIndex]);
				}
			}

			// color profiles
			if ((this.m_json_blob.metadata !== undefined) && (this.m_json_blob.metadata.color_profile !== undefined)) {
				var panel = $('#tabs-info');
				panel.append("<h1>" + $.i18n._('nixps-cloudflow-assets.metadata-info_tab-colorProfile-title') + "</h1>");
				var profile = this.m_json_blob.metadata.color_profile;
				if (typeof profile.type === "string" && profile.type.length > 0) {
					panel.append($('<label>').addClass('infolabel')._t('nixps-cloudflow-assets.metadata-info_tab-colorProfile-type'))
						 .append($('<span>').addClass("infovalue").text(profile.type)).append('<br />');
				}
				if (typeof profile.description === "string" && profile.description.length > 0) {
					panel.append($('<label>').addClass('infolabel')._t('nixps-cloudflow-assets.metadata-info_tab-colorProfile-description'))
						 .append($('<span>').addClass("infovalue").text(profile.description)).append('<br />');
				}
				if (profile.input_cs !== undefined && $.isArray(profile.input_cs.colorants)) {
					panel.append($('<label>').addClass('infolabel')._t('nixps-cloudflow-assets.metadata-info_tab-colorProfile-input'));
					var inputValue = "";
					for (var i = 0; i < profile.input_cs.colorants.length; i++) {
						if (profile.input_cs.colorants[i] !== undefined && typeof profile.input_cs.colorants[i].name === "string") {
							inputValue += profile.input_cs.colorants[i].name + ", ";
						}
					}
					if (inputValue.length >= 2) {
						inputValue = inputValue.slice(0, -2); // remove last ", "
					}
					panel.append($('<span>').addClass("infovalue").text(inputValue)).append('<br />');
				}
				if (profile.output_cs !== undefined && $.isArray(profile.output_cs.colorants)) {
					panel.append($('<label>').addClass('infolabel')._t('nixps-cloudflow-assets.metadata-info_tab-colorProfile-output'));
					var outputValue = "";
					for (var i = 0; i < profile.output_cs.colorants.length; i++) {
						if (profile.output_cs.colorants[i] !== undefined && typeof profile.output_cs.colorants[i].name === "string") {
							outputValue += profile.output_cs.colorants[i].name + ", ";
						}
					}
					if (outputValue.length >= 2) {
						outputValue = outputValue.slice(0, -2); // remove last ", "
					}
					panel.append($('<span>').addClass("infovalue").text(outputValue)).append('<br />');
				}
			}
		},

		_synctabCreate: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-sync-tab'><a href='#tabs-sync'>" + $.i18n._('nixps-cloudflow-assets.metadata-sync_tab-title') + "</a></li>");
			this.element.find('#metadata-tabs').append("<div id='tabs-sync'></div>");
		},

		synctab_refresh: function() {
			this.element.find('#tabs-sync-tab').show();
			this.element.find('#tabs-sync').empty();

			if ((this.m_json_blob.sync_status === undefined) || $.isEmptyObject(this.m_json_blob.sync_status))
			{
				var lPar = $('<p>');
				lPar._t('nixps-cloudflow-assets.metadata-sync_tab-status-never_synced');
				this.element.find('#tabs-sync').append(lPar);
			}
			else
			{
				var lTable = $('<table id="table-sync" class="retestrak">');
				var lHeaderRow = $('<tr class="top">');
				var lHeader = $('<th class="box">');
				lHeader._t('nixps-cloudflow-assets.metadata-sync_tab-site');
				lHeaderRow.append(lHeader);
				var lHeader = $('<th class="box">');
				lHeader._t('nixps-cloudflow-assets.metadata-sync_tab-url');
				lHeaderRow.append(lHeader);
				var lHeader = $('<th class="box">');
				lHeader._t('nixps-cloudflow-assets.metadata-sync_tab-status');
				lHeaderRow.append(lHeader);
				lTable.append(lHeaderRow);
				var lSites = Object.keys(this.m_json_blob.sync_status).sort();
				for (var lSiteIndex = 0; lSiteIndex < lSites.length; ++lSiteIndex)
				{
					var lSite = lSites[lSiteIndex];
					var lInfo = this.m_json_blob.sync_status[lSite];
					var lRow = $('<tr>');
					var lCol = $('<td class="heading">');
					lCol.text(lSite);
					if (lInfo.original === true)
						lCol.html('&rarr;&nbsp;' + lCol.html());
					else
						lCol.html('&larr;&nbsp;' + lCol.html());
					lRow.append(lCol);
					lCol = $('<td>');
					lCol.text(lInfo.url);
					lRow.append(lCol);
					lCol = $('<td>');

					if (lInfo.progress === undefined)
						lCol._t('nixps-cloudflow-assets.metadata-sync_tab-status-ok');
					else
						lCol._t('nixps-cloudflow-assets.metadata-sync_tab-status-sending', [(lInfo.progress * 100).toFixed(0)]);

					lRow.append(lCol);
					lTable.append(lRow);
				}
				$('#tabs-sync').append(lTable);
			}

			var that = this;
			clearTimeout(this.syncTimerID);
			if (this.element.find('#metadata-tabs').is(':visible') === true) {
				this.syncTimerID = setTimeout(function () {
					api_async.asset.get_by_url(that.options.url, function (p_data) {
						that.m_json_blob = p_data;
						that.synctab_refresh();
					}, function () {});
				}, 10000);
			}
		},

		separationstab_add_row: function(pColorant) {
			var colorantName = pColorant.name;
			// RGB
			var lRGB = "#808080";
			if (pColorant.previews !== undefined)
			{
				if (pColorant.previews.cmyk !== undefined)
				{
					lRGB = nixps_utils.cmyk_array_to_web_rgb(pColorant.previews.cmyk);
				}
				else if (pColorant.previews.rgb !== undefined)
				{
					lRGB = nixps_utils.rgb_array_to_web_rgb(pColorant.previews.rgb);
				}
			}

			$('#tabs-info').append("<label class='infolabel'><span style='background-color:" + lRGB + "; width:25px; height: 10px'>&nbsp;&nbsp;&nbsp;&nbsp;</span></label> " + colorantName + "<br/>");
		},

		_layerstab_create: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-layers-tab'><a href='#tabs-layers'>" + $.i18n._('nixps-cloudflow-assets.metadata-layers_tab-title') + "</a></li>");
			this.element.find('#metadata-tabs').append("<div id='tabs-layers'><table id='layers-table' class='retestrak'></table></div>");
		},

		_layerstab_refresh: function() {
			if ((this.m_json_blob.metadata !== undefined) && (this.m_json_blob.metadata.layers !== undefined)) {
				var layers = this.m_json_blob.metadata.layers;

				this.element.find('#tabs-layers-tab').show();
				this.element.find('#layers-table').empty();
				this.element.find('#layers-table').append(
					"<tr class='top'>" +
						"<th style='width:25px'>&nbsp;</th>" +
						"<th class='header' style='width:100px'>&nbsp;</th>" +
						"<th style='min-width:200px'>" + $.i18n._('nixps-cloudflow-assets.metadata-layers_tab-column_processing_steps') + "</th>" +
						"<th style='min-width:200px'>" + $.i18n._('nixps-cloudflow-assets.metadata-layers_tab-column_type') + "</th>" +
						"<th style='min-width:200px'>" + $.i18n._('nixps-cloudflow-assets.metadata-layers_tab-column_printing') + "</th>" +
					"</tr>");

				var layerIndex;
				for (layerIndex in layers)
				{
					this._layerstab_add_row(layers[layerIndex]);
				}
			}
		},

		_layerstab_add_row: function(pLayer) {
			var layerName = pLayer.name;
			// HalfTone
			var lAngle = "<i>" + $.i18n._('nixps-cloudflow-assets.not_applicable') + "</i>";
			var lRuling = "<i>" + $.i18n._('nixps-cloudflow-assets.not_applicable') + "</i>";

			// Processing Steps
			var processingSteps = ''
			if (pLayer.processing_steps !== undefined) {
				if (pLayer.processing_steps.group !== undefined) {
					processingSteps = pLayer.processing_steps.group;
					if (pLayer.processing_steps.type !== '') {
						processingSteps += '/' + pLayer.processing_steps.type;
					}
				}
			}

			// Layertype
			var lType = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-layers_tab-type_standard') + "</i>";
			if (pLayer.type !== undefined)
			{
				if (pLayer.type == "standard")
					lType = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-layers_tab-type_standard') + "</i>";
				else if (pLayer.type == "technical")
					lType = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-layers_tab-type_technical') + "</i>";
				else if (pLayer.type == "trapping")
					lType = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-layers_tab-type_trapping') + "</i>";
				else if (pLayer.type == "language")
					lType = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-layers_tab-type_language') + "</i>";
				else
					lType = "<i>" + pLayer.type + "</i>";
			}

			var lColor = "rgb(133,249,80)";
			var lPrinting = $.i18n._('nixps-cloudflow-assets.metadata-layers_tab-value_printing');
			if (pLayer.is_printing !== undefined)
			{
				if (pLayer.is_printing != true)
				{
					lPrinting = "";
					lColor = "rgb(128,128,128)";
				}
			}

			this.element.find('#layers-table').append(
				"<tr>" +
					"<td style='background-color: " + lColor + "'></td>" +
					"<td class='heading'><strong>" + layerName + "</strong></td>" +
					"<td class='heading'><strong>" + processingSteps + "</strong></td>" +
					"<td>" + lType + "</td>" +
					"<td>"+lPrinting+"</td>" +
					"</tr>");
		},

		_referencestab_create: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-refs-tab'><a href='#tabs-refs'>"  +$.i18n._('nixps-cloudflow-assets.metadata-references_tab-title') + "</a></li>");

			this.element.find('#metadata-tabs').append(
				"<div id='tabs-refs'>" +
				"<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-references_tab-referenced_files') + "</label><br/>" +
				"<table id='refs-table' class='retestrak'></table>" +
				"<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-references_tab-original_files') + "</label><br/>" +
				"<table id='originals-table' class='retestrak'></table>" +
				"</div>"
			);
		},

		_referencestab_refresh: function() {
			if (this.m_json_blob.metadata !== undefined && (this.m_json_blob.metadata.references !== undefined || this.m_json_blob.metadata.originals !== undefined)) {
				this.element.find('#tabs-refs-tab').show();
				this.element.find('#refs-table').empty();

				this.element.find('#refs-table').append("<tr class='top'><th style='min-width:200px'>" + $.i18n._('nixps-cloudflow-assets.metadata-references_column_name') + "</th>"
										+ "<th style='min-width:30px'>" + $.i18n._('nixps-cloudflow-assets.metadata-references_column_page_nr')
										+ "<th style='min-width:200px'>" + $.i18n._('nixps-cloudflow-assets.metadata-references_column_reference')
										+ "</th><th style='min-width:70px'>" + $.i18n._('nixps-cloudflow-assets.metadata-references_column_quality') + "</th></tr>");

				this.element.find('#originals-table').empty();
				this.element.find('#originals-table').append("<tr class='top'><th style='min-width:200px'>" + $.i18n._('nixps-cloudflow-assets.metadata-references_column_name') + "</th>"
										+ "<th style='min-width:30px'>" + $.i18n._('nixps-cloudflow-assets.metadata-references_column_page_nr')
										+ "<th style='min-width:200px'>" + $.i18n._('nixps-cloudflow-assets.metadata-references_column_reference')
										+ "</th><th style='min-width:70px'>" + $.i18n._('nixps-cloudflow-assets.metadata-references_column_quality') + "</th></tr>");

				var references = this.m_json_blob.metadata.references;
				var referenceIndex;
				for (referenceIndex in references) {
					this._referencestab_add_row(references[referenceIndex], '#refs-table');
				}

				var originals = this.m_json_blob.metadata.originals;
				var originalIndex;
				for (originalIndex in originals) {
					this._referencestab_add_row(originals[originalIndex], '#originals-table');
				}
			}
		},

		_referencestab_add_row: function(pReference, pTableID) {
			var original = pReference.original;
			var fileName = "";
			if (pReference.file_name !== undefined && pReference.file_name !== "") {
				fileName = pReference.file_name;
			} else {
				var lastSlash = pReference.resolved_url.lastIndexOf('/');
				fileName = pReference.resolved_url.substring(lastSlash + 1);
			}
			var pageNr = "";
			if (pReference.page_nr !== undefined) {
				pageNr = pReference.page_nr;
			}

			var nameContents = "";
			if (pReference.resolved_url.substring(0, 10) === "cloudflow:") {
				// this is a short cut, but we have to start somewhere
				var asset = pReference.resolved_url.substring(12);
				nameContents = "<a href='portal.cgi?asset=" + encodeURIComponent(asset) + "'>"+ fileName + "</a>";
			} else {
				nameContents = fileName;
			}

			var quality = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-references_quality_not_resolved') + "</i>";
			if (pReference.quality !== undefined) {
				if (pReference.quality === "not_resolved")
					quality = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-references_quality_not_resolved') + "</i>";
				else if (pReference.quality === "full_resolve")
					quality = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-references_quality_full_resolve') + "</i>";
				else if (pReference.quality === "partial_resolve")
					quality = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-references_quality_partial_resolve') + "</i>";
				else if (pReference.quality === "best_effort")
					quality = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-references_quality_best_effort') + "</i>";
				else
					quality = "<i>" + pColorant.quality + "</i>";
			}

			$(pTableID).append("<tr><td>" + nameContents + "</td><td>" + pageNr + "</td><td>" + original + "</td><td>" + quality + "</td></tr>");
		},

		_productiontab_create: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-production-tab'><a href='#tabs-production'>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-title') + "</a></li>");
			this.element.find('#metadata-tabs').append(
				"<div id='tabs-production'>" +
				"<label class='infolabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-colorant_order') + "</label><span class='infovalue' id='production-colorant-order'/><br/>" +
				"<table id='production-table' class='retestrak'></table>" +
				"<table id='production-barcodes-table' class='retestrak'></table>" +
				"</div>"
			);
		},

		_productiontab_refresh: function() {
			if (this.m_json_blob.metadata === undefined) {
				return;
			}

			if ((this.m_json_blob.metadata.output_color_space === undefined || this.m_json_blob.metadata.output_color_space.colorants === undefined) && this.m_json_blob.metadata.barcodes === undefined) {
				return;
			}

			$('#tabs-production-tab').show();
			if (this.m_json_blob.metadata.output_color_space !== undefined && this.m_json_blob.metadata.output_color_space.colorants !== undefined) {
				$('#production-colorant-order').empty();
				if (this.m_json_blob.metadata.output_color_space.colorants_are_ordered) {
					$('#production-colorant-order').append($.i18n._('nixps-cloudflow-assets.metadata-production_tab-colorant_order-as_displayed'));
				} else {
					$('#production-colorant-order').append($.i18n._('nixps-cloudflow-assets.metadata-production_tab-colorant_order-unknown'));
				}

				var colorants = this.m_json_blob.metadata.output_color_space.colorants;

				$('#production-table').empty();

				$('#production-table').append("<tr class='top'><th style='width:25px'></th>"
					+ "<th class='heading' style='min-width:200px'>&nbsp;</th><th style='min-width:60px'>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-column_type') + "</th>"
					+ "<th style='min-width:60px'>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-column_processing_steps') + "</th>"
					+ "<th style='min-width:60px'>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-column_process') + "</th>"
					+ "<th style='min-width:70px'>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-column_halftone') + "</th>"
					+ "<th style='min-width:60px'>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-column_coverage') + "</th>"
					+ "<th style='min-width:70px'>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-column_compensation') + "</th></tr>");

				var colorantIndex;
				for (colorantIndex in colorants) {
					this._productiontab_add_row(colorants[colorantIndex], this.m_json_blob.metadata.scaling);
				}
			}

			if (this.m_json_blob.metadata.barcodes !== undefined) {
				var barcodes = this.m_json_blob.metadata.barcodes;

				$('#production-barcodes-table').empty();

				$('#production-barcodes-table').append("<tr class='top'>"
					+ "<th style='min-width:60px'>" + $.i18n._('nixps-cloudflow-assets.metadata-production_barcodes_tab-column_type') + "</th>"
					+ "<th style='min-width:60px'>" + $.i18n._('nixps-cloudflow-assets.metadata-production_barcodes_tab-column_code') + "</th>"
					+ "<th style='min-width:70px'>" + $.i18n._('nixps-cloudflow-assets.metadata-production_barcodes_tab-column_compensation') + "</th>"
					+ "</tr>");

				var barcodeIndex;
				for (barcodeIndex in barcodes) {
					this._productiontab_barcode_add_row(barcodes[barcodeIndex]);
				}
			}
		},

		_productiontab_add_row: function(pColorant, pScaling) {
			var colorantName = pColorant.name;
			// RGB
			var lRGB = "#808080";
			if (pColorant.previews !== undefined)
			{
				if (pColorant.previews.cmyk !== undefined)
				{
					lRGB = nixps_utils.cmyk_array_to_web_rgb(pColorant.previews.cmyk);
				}
				else if (pColorant.previews.rgb !== undefined)
				{
					lRGB = nixps_utils.rgb_array_to_web_rgb(pColorant.previews.rgb);
				}
			}

			// type
			var colorantType = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-type_standard') + "</i>";
			if (pColorant.type != undefined)
			{
				if (pColorant.type == "standard")
					colorantType = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-type_standard') + "</i>";
				else if (pColorant.type == "technical")
					colorantType = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-type_technical') + "</i>";
				else if (pColorant.type == "varnish")
					colorantType = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-type_varnish') + "</i>";
				else if (pColorant.type == "opaque")
					colorantType = "<i>" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-type_opaque') + "</i>";
				else
					colorantType = "<i>" + pColorant.type + "</i>";
			}

			// HalfTone
			var halfToneHeader = "";
			var halfTone = "";
			var halfToneFooter = "";

			if (pColorant.halftones !== undefined) {
				for (i in pColorant.halftones) {
					if (i > 0) {
						halfTone += "<br/>";
					}
					halfTone += new Value(pColorant.halftones[i].ruling_lpmm, this.m_lpmmUnit).convert(this.m_rulingUnit).toString() +
								" / " + pColorant.halftones[i].angle + "&deg;";
					if (pColorant.halftones[i].parameters !== "") {
						halfTone += " / " + /*pColorant.halftones[i].type + ": " +*/ pColorant.halftones[i].parameters;
						// The type refers to the way it was stored, not the context in which it was generated or should be used. E.g. Esko dotshape means it is retrieved from egScreen XMP, which is also used for non-Esko dotshape names
						// So we won't show this anymore
					}
					if (pColorant.halftones[i].requested !== undefined) {
						halfTone += " (" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-requested_halftone') + " ";
						halfTone += new Value(pColorant.halftones[i].requested.ruling_lpmm, this.m_lpmmUnit).convert(this.m_rulingUnit).toString() +
								" / " + pColorant.halftones[i].requested.angle + "&deg;";
						if (pColorant.halftones[i].requested.parameters !== "") {
							halfTone += " / " /* + pColorant.halftones[i].requested.type + ": " */ + pColorant.halftones[i].requested.parameters;
						}
						halfTone += ")";
					}
				}
			}
			var surfaceScaling = 1;
			if (pScaling !== undefined && pScaling.horizontal !== undefined) {
				if (pScaling.applied === false) {
					surfaceScaling *= pScaling.horizontal * pScaling.vertical;
				}
			}
			var compensations = "";
			if (pColorant.compensation !== undefined) {
				if (pColorant.compensation.plate !== undefined) {
					compensations = compensations + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-plate_h_v', [pColorant.compensation.plate.horizontal, pColorant.compensation.plate.vertical]);
					if (pColorant.compensation.plate.applied !== undefined && pColorant.compensation.plate.applied === true) {
						compensations += " (" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-compentation-applied') + ")";
						surfaceScaling /= (pColorant.compensation.plate.horizontal * pColorant.compensation.plate.vertical);
					}
				}
				if (pColorant.compensation.carrier !== undefined) {
					if (compensations !== "") {
						compensations = compensations + "<br/>"
					}
					compensations = compensations + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-carrier_h_v', [pColorant.compensation.carrier.horizontal, pColorant.compensation.carrier.vertical]);
					if (pColorant.compensation.carrier.applied !== undefined && pColorant.compensation.carrier.applied === true) {
						compensations += " (" + $.i18n._('nixps-cloudflow-assets.metadata-production_tab-compentation-applied') + ")";
						surfaceScaling /= (pColorant.compensation.carrier.horizontal * pColorant.compensation.carrier.vertical);
					}
				}
			}

			var process = "";
			if (pColorant.process !== undefined) {
				process = pColorant.process;
			}

			var processingSteps = ''
			if (pColorant.processing_steps !== undefined) {
				if (pColorant.processing_steps.group !== undefined) {
					processingSteps = pColorant.processing_steps.group;
					if (pColorant.processing_steps.type !== '') {
						processingSteps += '/' + pColorant.processing_steps.type;
					}
				}
			}

			var coverage = "";
			var surfaceUnit = this.m_unitPreferences.getDefinition('length').getDerivedUnit(2);
			var surfaceStorage = new Unit({
				unit: 'mm2'
			});
			if (pColorant.area_coverage_mm !== undefined) {
				if (pColorant.area_coverage_mm.media !== undefined) {
					var value = new Value(pColorant.area_coverage_mm.media * surfaceScaling, surfaceStorage);
					coverage = coverage + value.convert(surfaceUnit).toString() + " (" + $.i18n._('nixps-cloudflow-assets.mediabox') + ")";
				}
				if (pColorant.area_coverage_mm.crop !== undefined) {
					if (coverage !== "") {
						coverage += "<br/>";
					}
					var value = new Value(pColorant.area_coverage_mm.crop * surfaceScaling, surfaceStorage);
					coverage = coverage + value.convert(surfaceUnit).toString() +" (" + $.i18n._('nixps-cloudflow-assets.cropbox') + ")";
				}
				if (pColorant.area_coverage_mm.bleed !== undefined) {
					if (coverage !== "") {
						coverage += "<br/>";
					}
					var value = new Value(pColorant.area_coverage_mm.bleed * surfaceScaling, surfaceStorage);
					coverage = coverage + value.convert(surfaceUnit).toString() + " (" + $.i18n._('nixps-cloudflow-assets.bleedbox') + ")";
				}
				if (pColorant.area_coverage_mm.trim !== undefined) {
					if (coverage !== "") {
						coverage += "<br/>";
					}
					var value = new Value(pColorant.area_coverage_mm.trim * surfaceScaling, surfaceStorage);
					coverage = coverage + value.convert(surfaceUnit).toString() + " (" + $.i18n._('nixps-cloudflow-assets.trimbox') + ")";
				}
				if (pColorant.area_coverage_mm.art !== undefined) {
					if (coverage !== "") {
						coverage += "<br/>";
					}
					var value = new Value(pColorant.area_coverage_mm.art * surfaceScaling, surfaceStorage);
					coverage = coverage + value.convert(surfaceUnit).toString() + " (" + $.i18n._('nixps-cloudflow-assets.artbox') + ")";
				}
			}
			if (coverage === "") {
				coverage = "--";
			}

			$('#production-table').append(
				"<tr><td style='background-color:" + lRGB + "'></td>" +
				"<td class='heading'>" + colorantName + "</td>" +
				"<td>" + colorantType + "</td>" +
				"<td>" + processingSteps + "</td>" +
				"<td>" + process + "</td>" +
				"<td>" + halfTone + "</td>" +
				"<td>" + coverage + "</td>" +
				"<td>" + compensations + "</td>" +
				"</tr>"
			);
		},

		_productiontab_barcode_add_row: function(pBarcode) {
			var barcodeType = pBarcode.type;
			var barcodeCode = pBarcode.code;
			var barcodeCompensation = "";
			if (pBarcode.parameters !== undefined) {
				for (var parametersIndex in pBarcode.parameters) {
					var parameters = pBarcode.parameters[parametersIndex];
					var compensation = "";
					if (parameters.bar_width_reduction_mm !== undefined) {
						compensation += $.i18n._('nixps-cloudflow-assets.metadata-production_barcodes_tab-bar_width_reduction') + " " + new Value(parameters.bar_width_reduction_mm, this.m_mmUnit).convert(this.m_lengthUnit).toString();
					}
					if (parameters.device_compensation_mm !== undefined) {
						if (compensation !== "") {
							compensation += ", ";
						}
						compensation += $.i18n._('nixps-cloudflow-assets.metadata-production_barcodes_tab-device_compensation') + " " + new Value(parameters.device_compensation_mm, this.m_mmUnit).convert(this.m_lengthUnit).toString();
					}
					if (parameters.resolution_ppmm !== undefined) {
						if (compensation !== "") {
							compensation += ", ";
						}
						compensation += $.i18n._('nixps-cloudflow-assets.metadata-production_barcodes_tab-resolution') + " " + new Value(parameters.resolution_ppmm, this.m_ppmmUnit).convert(this.m_resolutionUnit).toString();
					}
					if (compensation !== "") {
						if (barcodeCompensation !== "") {
							barcodeCompensation += "<br/>";
						}
						barcodeCompensation += compensation;
					}
				}
			}

			$('#production-barcodes-table').append(
				"<tr>" +
				"<td>" + barcodeType + "</td>" +
				"<td>" + barcodeCode + "</td>" +
				"<td>" + barcodeCompensation + "</td>" +
				"</tr>"
			);
		},

		_pagestab_create: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-pages-tab'><a href='#tabs-pages'>" + $.i18n._('nixps-cloudflow-assets.metadata-pages_tab-title') + "</a></li>");
			this.element.find('#metadata-tabs').append("<div id='tabs-pages'><div id='metadata-pages'/></div>");
		},

		_pagestab_refresh: function() {
			if (this.m_json_blob.skipped_sub_assets !== undefined && this.m_json_blob.skipped_sub_assets.pages !== undefined) {
				// user did not want to see pages...
				return;
			}

			if (this.m_json_blob.metadata !== undefined && this.m_json_blob.metadata.pages !== undefined && this.m_json_blob.metadata.pages.length > 1) {
				this.element.find('#tabs-pages-tab').show();
				this.element.find('#metadata-pages').empty().append("<h1>" + $.i18n._('nixps-cloudflow-assets.metadata-pages_tab-title') + "</h1>");
				nixps_thumb.init(150, true, false);
				for (var page in this.m_json_blob.metadata.pages) {
					var pageNr = parseInt(page, 10);
					var sub = "p_" + pageNr;
					var pageJSON = this.m_json_blob.metadata.pages[page];
					var targetURL = "portal.cgi?asset=" + encodeURIComponent(this.options.url)+"&sub=" + sub;
					var previewURL = "";
					if (this.m_json_blob.sub_thumbs !== undefined && this.m_json_blob.sub_thumbs[sub] !== undefined)
					{
						previewURL = this.m_json_blob.sub_thumbs[sub];
					}
					var pageWidth = 0;
					var pageHeight = 0;
					if (pageJSON.page_boxes !== undefined && pageJSON.page_boxes.media !== undefined && pageJSON.page_boxes.media.size !== undefined) {
						if (pageJSON.page_boxes.media.size.width !== undefined) {
							pageWidth = pageJSON.page_boxes.media.size.width;
						}
						if (pageJSON.page_boxes.media.size.height !== undefined) {
							pageHeight = pageJSON.page_boxes.media.size.height;
						}
					}
					this.element.find('#metadata-pages').append(
							nixps_thumb.generate_fn(targetURL, $.noop, previewURL, $.i18n._('nixps-cloudflow-assets.metadata-pages_tab-page_n', [pageNr + 1]), pageWidth, pageHeight)
							.data('itemData', {url: this.options.url, sub: sub})
							);
				}
			}
		},

		_imagestab_create: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-images-tab'><a href='#tabs-images'>" + $.i18n._('nixps-cloudflow-assets.metadata-images_tab-title') + "</a></li>");
			this.element.find('#metadata-tabs').append("<div id='tabs-images'><div id='metadata-embedded-images'/></div>");
		},


		_imagestab_refresh: function() {
			if (this.m_json_blob.skipped_sub_assets !== undefined && this.m_json_blob.skipped_sub_assets.embedded_data !== undefined) {
				// user did not want to see embedded images...
				return;
			}

			if (this.m_json_blob.metadata !== undefined && this.m_json_blob.metadata.embedded_data !== undefined && this.m_json_blob.metadata.embedded_data.length > 0) {
				$('#tabs-images-tab').show();
				$('#metadata-embedded-images').empty();
				$('#metadata-embedded-images').append("<h1>" + $.i18n._('nixps-cloudflow-assets.metadata-images_tab-title_2') + "</h1>");
				nixps_thumb.init(150, true, false);
				for (var l_img in this.m_json_blob.metadata.embedded_data)
				{
					var imageJSON = this.m_json_blob.metadata.embedded_data[l_img];
					if (imageJSON.identifier !== undefined)
					{
						var targetURL = "portal.cgi?asset="+encodeURIComponent(this.options.url)+"&sub="+imageJSON.identifier;
						if (imageJSON.reference !== undefined && imageJSON.reference.resolved_url.substring(0, 10) === "cloudflow:")
						{
							// this is a short cut, but we have to start somewhere
							targetURL = "portal.cgi?asset=" + encodeURIComponent(pReference.resolved_url.substring(12));
						}
						var dataName = "";
						if (imageJSON.reference !== undefined && imageJSON.reference.file_name !== undefined && imageJSON.reference.file_name !== "")
						{
							dataName = imageJSON.reference.file_name;
						}

						var previewURL = "";
						if (this.m_json_blob.sub_thumbs !== undefined && this.m_json_blob.sub_thumbs[imageJSON.identifier] !== undefined)
						{
							previewURL = this.m_json_blob.sub_thumbs[imageJSON.identifier];
						}


						if (imageJSON.data.pixel_data !== undefined)
						{
							if (dataName === "")
							{
								dataName = $.i18n._('nixps-cloudflow-assets.metadata-images_tab-image_wxh', [imageJSON.data.pixel_data.size.width, imageJSON.data.pixel_data.size.height]);
							}
							$('#metadata-embedded-images').append(nixps_thumb.generate(targetURL, previewURL, dataName, imageJSON.data.pixel_data.size.width, imageJSON.data.pixel_data.size.height));
						}
						else if (imageJSON.data.page_boxes !== undefined && imageJSON.data.page_boxes.media !== undefined && imageJSON.data.page_boxes.media.size !== undefined)
						{
							if (dataName === "")
							{
								dataName = $.i18n._('nixps-cloudflow-assets.metadata-images_tab-form');
							}
							$('#metadata-embedded-images').append(nixps_thumb.generate(targetURL, previewURL, dataName, imageJSON.data.page_boxes.media.size.width, imageJSON.data.page_boxes.media.size.height));
						}
					}
				}
			}
		},

		_usedintab_create: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-used-tab'><a href='#tabs-used'>" + $.i18n._('nixps-cloudflow-assets.metadata-used_in_tab-title') + "</a></li>");
			this.element.find('#metadata-tabs').append("<div id='tabs-used'><div id='metadata-used-images'/></div>");
		},

		_usedintab_refresh: function() {
			if (this.m_json_blob.used_in !== undefined) {
				this.element.find('#tabs-used-tab').show();
				this.element.find('#metadata-used-images').empty();
				this.element.find('#metadata-used-images').append("<h1>" + $.i18n._('nixps-cloudflow-assets.metadata-used_in_tab-title') + "</h1>");
				nixps_thumb.init(150, true, false);
				for (var l_img in this.m_json_blob.used_in) {
					var imageJSON = this.m_json_blob.used_in[l_img];
					var targetURL = "portal.cgi?asset="+encodeURIComponent(this.options.url);
					this.element.find('#metadata-used-images').append(nixps_thumb.generate(targetURL, imageJSON.thumb, nixps_utils.get_filename(imageJSON.url)));
				}
			}
		},

		_pageboxestab_create: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-boxes-tab'><a href='#tabs-pageboxes'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-title') + "</a></li>");
			this.element.find('#metadata-tabs').append("<div id='tabs-pageboxes'><span id='box-info'></span></div>");
			this.element.find('#tabs-pageboxes').append("<table id='box-table' class='retestrak'></table>")
												.append("<table id='page-box-table' class='retestrak'></table>");
		},


		_pageboxestab_refresh: function() {
			if ((this.m_json_blob.metadata !== undefined) && (this.m_json_blob.metadata.page_boxes !== undefined))
			{
				this.element.find('#tabs-boxes-tab').show();
				if (this.m_json_blob.metadata.number_of_pages === undefined || this.m_json_blob.metadata.number_of_pages === 1 || this.m_json_blob.metadata.pages === undefined) {
					this.element.find('#box-table').empty();
					this.element.find('#box-table').append("<tr id='box-headers' class='top'></tr>");
					$('#box-headers').append("<th style='width:25px'>&nbsp;</th>");
					$('#box-headers').append("<th class='heading'>&nbsp;</th>");
					$('#box-headers').append("<th style='width:25px'></th>");
					$('#box-headers').append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_width') + "</th>");
					$('#box-headers').append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_height') + "</th>");
					$('#box-headers').append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_left') + "</th>");
					$('#box-headers').append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_top') + "</th>");
					$('#box-headers').append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_right') + "</th>");
					$('#box-headers').append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_bottom') + "</th>");
					$('#box-headers').append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_scaling') + "</th>");
					var boxes = this.m_json_blob.metadata.page_boxes;
					var scalingAndDistortion = this._getScalingAndCompensation(this.m_json_blob.metadata);
					if (boxes.media !== undefined) {
						this.pageboxestab_add_pagebox(1, null, $.i18n._('nixps-cloudflow-assets.mediabox'), "rgb(110,215,251)", boxes.media, scalingAndDistortion);
					}
					if (boxes.crop !== undefined) {
						this.pageboxestab_add_pagebox(2, null, $.i18n._('nixps-cloudflow-assets.cropbox'), "rgb(133,249,80)", boxes.crop, scalingAndDistortion);
					}
					if (boxes.bleed !== undefined) {
						this.pageboxestab_add_pagebox(3, null, $.i18n._('nixps-cloudflow-assets.bleedbox'), "rgb(255,30,24)", boxes.bleed, scalingAndDistortion);
					}
					if (boxes.trim !== undefined) {
						this.pageboxestab_add_pagebox(4, null, $.i18n._('nixps-cloudflow-assets.trimbox'), "rgb(255,250,83)", boxes.trim, scalingAndDistortion);
					}
					if (boxes.art !== undefined) {
						this.pageboxestab_add_pagebox(5, null, $.i18n._('nixps-cloudflow-assets.artbox'), "rgb(255,135,248)", boxes.art, scalingAndDistortion);
					}
				} else {
					this.element.find('#page-box-table').empty();
					this.element.find('#page-box-table').append("<tr id='page-box-headers' class='top'></tr>");
					this.element.find('#page-box-headers')
								.append("<th style='width:25px'>&nbsp;</th>")
								.append("<th class='heading'>&nbsp;</th>")
								.append("<th style='width:25px'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_page') + "</th>")
								.append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_width') + "</th>")
								.append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_height') + "</th>")
								.append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_left') + "</th>")
								.append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_top') + "</th>")
								.append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_right') + "</th>")
								.append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_bottom') + "</th>")
								.append("<th class='box'>" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-column_scaling') + "</th>");


					for (var countPages = 0; countPages < this.m_json_blob.metadata.pages.length; ++countPages) {
						var page = this.m_json_blob.metadata.pages[countPages];
						if (page.page_boxes !== undefined) {
							var boxes = page.page_boxes;
							var scalingAndDistortion = this._getScalingAndCompensation(page);
							if (boxes.media !== undefined) {
								this.pageboxestab_add_pagebox(1, countPages + 1, $.i18n._('nixps-cloudflow-assets.mediabox'), "rgb(110,215,251)", boxes.media, scalingAndDistortion);
							}
							if (boxes.crop !== undefined) {
								this.pageboxestab_add_pagebox(2, countPages + 1, $.i18n._('nixps-cloudflow-assets.cropbox'), "rgb(133,249,80)", boxes.crop, scalingAndDistortion);
							}
							if (boxes.bleed !== undefined) {
								this.pageboxestab_add_pagebox(3, countPages + 1, $.i18n._('nixps-cloudflow-assets.bleedbox'), "rgb(255,30,24)", boxes.bleed, scalingAndDistortion);
							}
							if (boxes.trim !== undefined) {
								this.pageboxestab_add_pagebox(4, countPages + 1, $.i18n._('nixps-cloudflow-assets.trimbox'), "rgb(255,250,83)", boxes.trim, scalingAndDistortion);
							}
							if (boxes.art !== undefined) {
								this.pageboxestab_add_pagebox(5, countPages + 1, $.i18n._('nixps-cloudflow-assets.artbox'), "rgb(255,135,248)", boxes.art, scalingAndDistortion);
							}
						}
					}
				}
			}
		},

		pageboxestab_add_pagebox: function(id, page, name, color, pBox, pScalingAndDistortion) {
			if (page !== null) {
				id += page * 10;
			}

			// Create the table row
			var pagebox_row = "<tr val='"+id+"'>";
			pagebox_row += "<td style='background-color: " + color + "'></td>";
			pagebox_row += "<td class='heading'><strong>" + name + "</strong></td>";
			if (page !== null) {
				pagebox_row += "<td>" + page + "</td>";
			} else {
				pagebox_row += "<td></td>";
			}
			pagebox_row += "<td>";
			var horizontalScaling = 1.0;
			if (pScalingAndDistortion.horizontalScaling !== undefined && pScalingAndDistortion.scalingApplied === false) {
				horizontalScaling = pScalingAndDistortion.horizontalScaling;
			}
			var width = pBox.size_mm.width * horizontalScaling;
			pagebox_row += new Value(width, this.m_mmUnit).convert(this.m_lengthUnit).toString();
			if (pScalingAndDistortion.horizontalCompensation !== undefined) {
				pagebox_row += " (" + new Value(width / pScalingAndDistortion.horizontalCompensation, this.m_mmUnit).convert(this.m_lengthUnit).toString() + ")";
			}
			pagebox_row += "</td>";
			pagebox_row += "<td>";
			var verticalScaling = 1.0;
			if (pScalingAndDistortion.verticalScaling !== undefined && pScalingAndDistortion.scalingApplied === false) {
				verticalScaling = pScalingAndDistortion.verticalScaling;
			}
			var height = pBox.size_mm.height * verticalScaling;
			pagebox_row += new Value(height, this.m_mmUnit).convert(this.m_lengthUnit).toString();
			if (pScalingAndDistortion.verticalCompensation !== undefined) {
				pagebox_row += " (" + new Value(height / pScalingAndDistortion.verticalCompensation, this.m_mmUnit).convert(this.m_lengthUnit).toString() + ")";
			}
			pagebox_row += "</td>";
			pagebox_row += "<td>" + new Value(pBox.origin_mm.x * horizontalScaling, this.m_mmUnit).convert(this.m_lengthUnit).toString() + "</td>";
			pagebox_row += "<td>" + new Value((pBox.origin_mm.y + pBox.size_mm.height) * verticalScaling, this.m_mmUnit).convert(this.m_lengthUnit).toString() + "</td>";
			pagebox_row += "<td>" + new Value((pBox.origin_mm.x + pBox.size_mm.width) * horizontalScaling, this.m_mmUnit).convert(this.m_lengthUnit).toString() + "</td>";
			pagebox_row += "<td>" + new Value(pBox.origin_mm.y * verticalScaling, this.m_mmUnit).convert(this.m_lengthUnit).toString() + "</td>";
			if (pScalingAndDistortion.horizontalScaling === undefined) {
				pagebox_row += "<td></td>";
			} else {
				pagebox_row += "<td>";
				pagebox_row += + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-scaling_h_v', [pScalingAndDistortion.horizontalScaling, pScalingAndDistortion.verticalScaling]);
				if (pScalingAndDistortion.scalingApplied !== false) {
					pagebox_row += " (" + $.i18n._('nixps-cloudflow-assets.metadata-pageboxes_tab-scaling-applied') + ")";
				}
				pagebox_row += "</td>";
			}
			pagebox_row += "</tr>";
			if (page === null) {
				$('#box-table').append(pagebox_row);
			} else {
				$('#page-box-table').append(pagebox_row);
			}
		},

		_xmptabCreate: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-xmp-tab' style='display:none'><a href='#tabs-xmp'>" + $.i18n._('nixps-cloudflow-assets.metadata-xmp_tab-title') + "</a></li>");
			this.element.find('#metadata-tabs').append("<div id='tabs-xmp'></div>");
			this.element.find('#tabs-xmp').append("<span id='xmp-info'></span>");
		},

		_xmptabRefresh: function() {
			if ((this.m_json_blob.metadata !== undefined) && (this.m_json_blob.metadata.xmp !== undefined) && (this.m_json_blob.metadata.xmp.properties !== undefined)) {
				this.element.find('#tabs-xmp-tab').show();
				this.element.find("#xmp-info").empty();
				this.element.find("#xmp-info").append("<ul id='sitemap'>" + this._xmptab_tohtml(this.m_json_blob.metadata.xmp.properties) + "</ul>");
				sitemapstyler();
			}
		},

		_xmptab_tohtml:function(p_xmp) {
			var l_string = "";
			for (var l_idx in p_xmp) {
				l_string += "<li>";
				if (typeof p_xmp[l_idx] === typeof "") {
					l_string += l_idx + ": <b>" + p_xmp[l_idx] + "</b>";
				}  else {
					l_string += l_idx;
					l_string += "<ul>";
					for (var l_idx_2 in p_xmp[l_idx]) {
						l_string += "<li>" + l_idx + "[" + l_idx_2 + "]";
						if (typeof p_xmp[l_idx][l_idx_2] === typeof "")
							l_string += ": <b>" + p_xmp[l_idx][l_idx_2] + "</b>";
						else
							l_string += "<ul>" + this._xmptab_tohtml(p_xmp[l_idx][l_idx_2]) + "</ul>";
						l_string += "</li>";
					}
					l_string += "</ul>";
				}
				l_string += "</li>";
			};
			return l_string;
		},

		_approvaltabCreate: function() {
			this.element.find('#metadata-navs').append("<li id='tabs-approval-tab' style='display:none'><a href='#tabs-approval'></a></li>");
			this.element.find('#tabs-approval-tab a')._t('nixps-cloudflow-assets.metadata-approval_tab-title');
			this.element.find('#metadata-tabs').append("<div id='tabs-approval'></div>");
		},

		_approvaltabRefresh: function() {
			api_async.request.metadata(this.options.url, this.options.sub, $.proxy(function(p_metadata) {
				// If an approval is running, fallback to the approval viewer
				// Only create when proofscope viewing is enabled on the asset
				if (this.options.sub === undefined || this.options.sub === "") {
					this.element.find('#tabs-approval-tab').show();
					this.element.find('#tabs-approval').empty();

					var approval_url = this.m_json_blob.cloudflow.file;
					var chain_json = api.approval.get_overview_by_reference(approval_url, true, true);
					var $approval_view = $("<div class='approval_view'/>");
					this.element.find('#tabs-approval').append($approval_view);
					$approval_view.ApprovalView({ json : undefined, enableChainManipulation: this.user.hasPermission('MANAGE_CHAINS'), userName: this.user.getUserName()});
					if (typeof(chain_json) == 'object' && chain_json != null && Array.isArray(chain_json.approvals) && chain_json.approvals.length > 0)
					{
						var notes_json = api.notes.get_overview_by_reference(approval_url, false, "BaseHTML");
						var options = { json: chain_json };
						if($.isArray(notes_json.collaboration_session) === true && notes_json.collaboration_session.length > 0) {
							options["notes"] = notes_json;
						}
						$approval_view.ApprovalView("option", options);
					}
					var submitDiv = $('#tabs-approval').append(
						"<h1>" + $.i18n._('nixps-cloudflow-assets.metadata-approval_tab-launch') + "</h1>"+
						"<div class='hub-submit'></div>"
					);

					var that = this;
                    $('.hub-submit', submitDiv).NewWorkable({
                        language: this.options.language,
                        panels: ['submitOptions', 'projectForm'],
                        inputFiles : [this.m_json_blob.cloudflow.file],
                        selectWhitepapersOptions: {
                            'categories': ["Approval"]
                        },
                        context: "assetviewApproval"
                    }).addClass("approvalSubmit bootstrap")
                    .on("createworkablesubmitted", function(pEvent, pData){
                        setTimeout((function(pApprovalView, pApprovalURL) {
                            return function() {
                                that.approvaltab_newApprovalStarted(pApprovalView, pApprovalURL);
                            };
                        })($approval_view, approval_url), 1000);
                        $(pEvent.target).closest('.hub-submit').empty().append("<span class='approval-submitted'>" + $.i18n._('nixps-cloudflow-assets.approval_submitted') + "</span>");
                    });

					if (p_metadata.proofscope !== undefined && p_metadata.proofscope.uuid !== undefined) {
						this.element.find('#tabs-approval').append
						(
							"<h1>" + $.i18n._('nixps-cloudflow-assets.metadata-approval_tab-invite') + "</h1>" +
							"<div class='invite_userlist'>" +
								"<div class='invite_user addbutton'>" +
									"<label class='infolabel userlabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-approval_tab-invite-users') + "</label>" +
									"<input class='approver_selector'/>" +
								"</div>" +
							"</div>" +
							"<div>" +
								"<label class='infolabel' style='vertical-align:top'>" + $.i18n._('nixps-cloudflow-assets.metadata-approval_tab-invite-message') + "</label>" +
								"<textarea class='invite-msg' rows='10' cols='80' style='height:auto' style='vertical-align:top'>" +
									$.i18n._('nixps-cloudflow-assets.metadata-approval_tab-invite-message-line1') + "\n\n" +
									$.i18n._('nixps-cloudflow-assets.metadata-approval_tab-invite-message-line2', [this.options.url.split('/').splice(-1, 1)]) +
								"</textarea>" +
							"</div>" +
							"<div>" +
								"<label class='infolabel' style='vertical-align:top'>" + $.i18n._('nixps-cloudflow-assets.metadata-approval_tab-invite-valid') + "</label>" +
								"<input class='exp_d' style='width: 4ex' value='1'> " + $.i18n._('nixps-cloudflow-assets.metadata-approval_tab-invite-valid-days') +
								 ", <input class='exp_h' style='width: 4ex'> " + $.i18n._('nixps-cloudflow-assets.metadata-approval_tab-invite-valid-hours') + "" +
							"</div>" +
							"<div>" +
								"<label class='infolabel'><img src='portal/images/empty.png' width='1px' height='25px'></label>" +
								"<a class='green-button invite_users'>" + $.i18n._('nixps-cloudflow-assets.metadata-approval_tab-invite-button')  + "</a><img class='invite_users_wait' src='portal/images/loading10.gif'>" +
							"</div>"
						);

						this.element.find('#tabs-approval').find(".approver_selector").autocomplete({
							source: function(request, response) {
								response(api.users.query_user({ term: request.term }));
							},
							minLength: 1,
							focus: function( event, ui ) {
								$(this).val(ui.item.username);
								return false;
							},
							select: function( event, ui ) {
								var userjson = ui.item;
								var username = '';
								if (userjson.username !== undefined) {
								   username = userjson.username;
								} else if (userjson.email !== undefined) {
									username = userjson.email;
								}
								$(this).parents('.invite_userlist').find('.userlabel').html("<img src='portal/images/empty.png' width='1px' height='25px'>");
								$(this).parents('.invite_userlist').prepend($("<div class='invite_user' user='" + userjson.email + "'><label class='infolabel userlabel'>" + $.i18n._('nixps-cloudflow-assets.metadata-approval_tab-invite-users') + "</label><img class='remove' src='/portal/images/close.gif'/>" + username + " (" + userjson.email + ")</div>"));
								$(this).val('');
								return false;
							}
						})
						.data("autocomplete")._renderItem = function( ul, item ) {
							var fullname = '&lt;no fullname&gt;';
							if (('fullname' in item) && (item['fullname'].length > 0)) {
								fullname = item['fullname'];
							}
							var username = '';
							if (('username' in item) && (item['username'].length > 0)) {
								username = item['username'];
							}
							else if (('email' in item) && (item['email'].length > 0)) {
								username = item['item'];
							}

							return $( "<li>" )
								.data( "item.autocomplete", item)
								.append( "<a class='useritem'><span class='username'>" + item.username + "</span><span class='fullname'>" + fullname + "</span></a>" )
								.appendTo( ul );
						};
						this.element.find('#tabs-approval .invite_users_wait').hide();
					}
				};
			}, this));
		},

		approvaltab_newApprovalStarted: function(pApprovalView, pApprovalURL) {
			var that = this;
			api_async.approval.get_overview_by_reference(pApprovalURL, true, true, function(chain_json){
				var previousCount = pApprovalView.ApprovalView("option", "count");
				var newCount = previousCount;
				if (typeof chain_json === 'object' && chain_json !== null && $.isArray(chain_json.approvals)) {
					newCount = chain_json.approvals.length;
				}
				if (newCount > previousCount) {
					pApprovalView.ApprovalView("option", "json", chain_json);
                    that._trigger("approvalfired", null, {state: "pending"});
				} else {
					setTimeout((function(_pApprovalView, _pApprovalURL) {
						return function() {
							that.approvaltab_newApprovalStarted(_pApprovalView, _pApprovalURL);
						};
					})(pApprovalView, pApprovalURL), 1000);
				}
			});
		},

		_workflowtabCreate: function(){
			this.element.find('#metadata-navs').append("<li id='tabs-workflow-tab'><a href='#tabs-workflow'><span id='dummy-tab-label'>" + $.i18n._('nixps-cloudflow-assets.metadata-workflow_tab-title') + "</span></a></li>");
			this.element.find('#metadata-tabs').append("<div id='tabs-workflow'><h1>" + $.i18n._('nixps-cloudflow-assets.metadata-workflow_tab-submit') + "</h1>" +
				"<div class='hub-submit'></div><div class='hub-submit-done'>" + $.i18n._('nixps-cloudflow-assets.metadata-workflow_tab-submit_done') +
				" <button>" + $.i18n._('nixps-cloudflow-assets.metadata-workflow_tab-submit_done-ok') + "</button></div></div>");

			this.element.find('.hub-submit-done').hide();
		},

		_workflowtabRefresh: function() {
			if (this.m_json_blob.sub === ""){
                this.element.find('.hub-submit').NewWorkable({
                        language: this.options.language,
                        panels: ['submitOptions', 'projectForm'],
						inputFiles : [this.m_json_blob.cloudflow.file],
                        canChangeInputFiles: false,
                        context: "assetviewSubmitting"
					}
				).addClass('bootstrap generalSubmit');
				this.element.find('#tabs-workflow-tab').show();
			}
		},

		_setOptions: function (options) {
			var that = this;

			$.each(options, function (key, value) {
				that._setOption(key, value);
			});

			// we will redraw and start timers, to prevent errors, kill current loops
			clearTimeout(this.timerID);
			clearTimeout(this.syncTimerID);
			this._draw();
		},

		/**
		 * @description sets the option
		 * @function
		 * @private
		 * @name nixps-asset.MetadataView#_setOption
		 */
		_setOption: function (pKey, pValue) {
			this._superApply(arguments);
			this._controlOptions();
		},


		/**
		 * @description control the input options and throw a error if needed
		 * @name nixps-asset.MetadataView#_controlOptions
		 * @function
		 * @private
		 * @returns {undefined}
		 */
		_controlOptions: function () {
			if(typeof this.options.url !== "string") {
				throw new Error('input option url must be a string');
			}
			if(typeof this.options.sub !== "string") {
				throw new Error('input option sub must be a string');
			}
		},

		_destroy: function() {
			clearTimeout(this.timerID);
			clearTimeout(this.syncTimerID);
		}

	});

})(jQuery);




