(function($){ 
/**
 * @description The login dialog
 * @namespace nixps-cloudflow.Login
 * Triggers following events
 *     <dl>
 *          <dt>success</dt><dd>(data: userid) The user has loggedin successfully</dd>
 *          <dt>failed</dt><dd>(data: message) The user has failed during login</dd>
 *     </dl>
 *     @version: 0.8.0
 */
$.widget("nixps-cloudflow.Login", $.Widget, {
    version: "0.8.0",
    
    options: {
        /**
         * @name nixps-cloudflow.Login#successRedirection
         * @description The url to go when the user has logged in successfully. Put false to no redirect, put null to use the default redirection
         * @type {String}
         * @default null
         */
        successRedirection: null
    },
    
    _create: function() {
        if ($('body').find("." + this.widgetFullName).length > 0) {
            throw new Error("Login: multiple login components on one page is not allowed");
        }
        this.element.addClass(this.widgetFullName);
        
        var form = $('<form>').attr("id", "login_dialog");
        this.element.append(form);
        var tabel = $('<table>').attr("id", 'login_table').addClass('manage-table tsw-table');
        form.append(tabel);
        var titleRow = $('<tr>').append($('<td>').addClass("header").attr("colspan", "2"));
        var usernameRow = $('<tr>').append($('<td>').addClass("nobot left-gradient").attr("colspan", "2").css("white-space", "nowrap"));
        var passwordRow = $('<tr>').append($('<td>').addClass("left-gradient").attr("colspan", "2").css("white-space", "nowrap"));
        tabel.append(titleRow)
             .append(usernameRow)
             .append(passwordRow);
        titleRow.append($('<td>').append($('<span>').addClass('translate')._t("nixps-cloudflow-login.title")));
        titleRow.append($('<td>').addClass("header").append($('<span>').attr("id", "loginstatus").css("color", "red")));
        
        usernameRow.append($('<td>').append($('<span>').addClass('translate')._t("nixps-cloudflow-login.username")));
        usernameRow.append($('<td>').addClass("nobot middle").append("<img src='portal/images/empty.png' height='28px'/>"));
        usernameRow.append($('<td>').addClass("nobot right-gradient").append("<input style='width: 225px;' id='username' name=username' />"));
        
        passwordRow.append($('<td>').append($('<span>').addClass('translate')._t("nixps-cloudflow-login.password")));
        passwordRow.append($('<td>').addClass("middle").append("<img src='portal/images/empty.png' height='28px'/>"));
        passwordRow.append($('<td>').addClass("right-gradient").append("<input style='width: 225px' id='password' type='password' name='password' />"));
        
        form.append("<br/><center><input type='submit' value='Login' class='login_action colored-button' style='cursor: pointer;'></center>");    
        var google = $("<div>").attr("id", "google").hide();
        google.append($('<div>').addClass('translate')._t('nixps-cloudflow-login.google_account_1'));
        google.append($('<a>').attr("id", "google-button").attr("href", "#")
                .append($('<span>').addClass("translate")._t("nixps-cloudflow-login.google_account_2")));
        google.append($("<span>").addClass('translate')._t('nixps-cloudflow-login.google_account_3'));        
        form.append(google);
        
        if (sOrigURL === "<!--ORIG-->") {
			sOrigURL = window.location.href;
		}
		
		if (sOrigUser === "<!--USERNAME-->") {
			sOrigUser = "";
            this.element.find('#username').focus();
		} else if (sOrigUser !== "") {
			this.element.find('#username').val(sOrigUser);
			this.element.find('#password').focus();
		}

        this._initGoogleAuthentication();
		
		if (window.location.toString().indexOf('error=1') >= 0) {
			this._loginFailed($.i18n._('nixps-cloudflow-login.error-user_not_registered'));
		}
        
        this._on(this.element, {
            "submit #login_dialog": this._submitHandler,
            "click .login_action": this._loginClickHandler
        });
        
        this._on(document, {
            "keypress": this._documentKeyPress
        });
    },
    
    /**
     * @description Function runs when the form want to be submitted
     * @function
     * @private
     */
    _submitHandler: function(pEvent, pData) {
        pEvent.preventDefault();
    },
    
    /**
     * @description function runs when useer click on the login button
     * @function
     * @private
     */
    _loginClickHandler: function(pEvent, pData) {
        this._login();
    },
    
    /**
     * @description fucntion runs when user clicked on a key
     * @function
     * @private
     */
    _documentKeyPress: function(pEvent, pData) {
        if (pEvent.keyCode === $.ui.keyCode.ENTER) {
            this._login();
		}
    },
    
    /**
	 * @description Called on a login action in the dialog
     * @function
     * @private
	 */
	_login: function () {
        // disable login button to prevent reclicking when system is being processing login reguest
		this.element.find('.login_action').prop('disabled', true);
        // retrieve information and send to server
		var username = this.element.find("#username").val();
		var password = this.element.find("#password").val();
        var that = this;
		return this._loginRequest(username, password).done(function(pUserID){
            that._loginSuccessful(pUserID);
        }).fail(function(pErrorMessage){
            that._loginFailed(pErrorMessage);
        });
	},
    
    /**
     * @description The main and important work of the login
     * @function
     * @private
     * @param {type} pUsername
     * @param {type} pPassword
     * @return {Deferred} with userid
     */
	_loginRequest: function (pUsername, pPassword) {
        var that = this;
        return $.Deferred(function(pDefer) {
            api_async.auth.login(pUsername, pPassword, function (pData) {
                if (pData.user_id === undefined) {
                    pDefer.reject($.i18n._('nixps-cloudflow-login.error-login_failed'));
                } else {
                    that._removeOtherCookies(['user_id', 'user_hash', 'expiration_date', 'scope']);
                    // Store our login in a cookie
                    $.cookie('user_id', pData.user_id, { expires: 2, path: '/' });
                    $.cookie('user_hash', pData.user_hash, { expires: 2, path: '/' });
                    $.cookie('expiration_date', pData.expiration_date, { expires: 2, path: '/' });
                    $.cookie('scope', null, {path: '/'});
                    pDefer.resolve(pData.user_id);
                }
            }, function (pError) {
                if (pError.error_code !== undefined) {
                    pDefer.reject($.i18n._('nixps-cloudflow-login.error-' + pError.error_code));
                } else if (pError.error !== undefined) {
                    pDefer.reject(pError.error);
                }
            });
        });
	},

    /**
     * @description Remove cookies
     * @function
     * @private
     * @param {Array} pCookieToLive The cookies you dant want to remove
     * @return {undefined}
     */
	_removeOtherCookies: function (pCookieToLive) {
		if ($.isArray(pCookieToLive) === false) {
			pCookieToLive = [];
		}

		var pairs = document.cookie.split(";");

		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i].split("=");
			var cookieKey = $.trim(pair[0]);

			if (typeof cookieKey === "string" && (cookieKey.length > 0) && ($.inArray(cookieKey, pCookieToLive) === -1)) {
				$.cookie(cookieKey, null); // remove it
			}
		}
	},
    
    /**
     * @decsription init the google authentication or hide it
     * @function
     * @private
     * @return {undefined}
     */
    _initGoogleAuthentication: function() {
        var that = this;
        api_async.auth.generate_oauth2_url('google', function (pData) {
			if ((pData.result !== undefined) && (pData.result !== null)) {
				that.element.find('a#google-button').attr('href', pData.result);
				that.element.find('div#google').show();
			}
		}, function () { /* ignore error */ });
    },
    
	/**
	 * @description Sets the version in the title of the dialog
     * @function
     * @private
	 */
	_setVersion: function () {
        var that = this;
        return $.Deferred(function(pDefer){
            api_async.portal.version(function(pData) {
                var version = pData.major + "." + pData.minor;

                if (pData.rev !== 0) {
                    version += "." + pData.rev;
                }

                var loginText = $.i18n._('nixps-cloudflow-login.version', [version, pData.build]);
                that.element.find("#loginversion").text('(' + loginText + ')'); 
            }, pDefer.reject); 
        });
	},
	
	/**
	 * @description on successful login
     * @function
     * @private
	 */
	_loginSuccessful: function (pUserid) {
        if (this._trigger("success", null, {userid: pUserid}) !== false) {
            if (this.options.successRedirection === null && typeof sOrigURL === "string") {
                document.location.assign(sOrigURL); // old and current behavior to maintain
            } else if (typeof this.options.successRedirection === "string" && this.options.successRedirection.length > 0){
                document.location.assign(this.options.successRedirection);
            }
        }
	},
	
	/**
	 * @description on a failed login
     * @function
     * @private
	 */
	_loginFailed: function (pReason) {
		this.element.find("#loginstatus").text(pReason);
		this.element.find('.login_action').prop('disabled', false);
        this._trigger("failed", null, {message: pReason});
	}

});

}(jQuery));