/**
 * Will send a command to the cgi script in order to login
 *  - username: the username
 *  - password: the password for that user
 *  - success(userid): a callback on success.  The userid is passed.
 *  - failure(): a callback on failure
 */
function LogIn (pUsername, pPassword, pSuccess, pFailure)
{
	login.doLogin(pUsername, pPassword, pSuccess, pFailure);
}

/**
 * The login dialog
 * Triggers following events
 *     'login', username, userid
 */
var login = {

	removeOtherCookies: function (pCookieToLive)
	{
		if ($.isArray(pCookieToLive) === false)
		{
			pCookieToLive = [];
		}

		var pairs = document.cookie.split(";");
		var cookies = {};

		for (var i = 0; i < pairs.length; i++)
		{
			var pair = pairs[i].split("=");
			var cookieKey = $.trim(pair[0]);

			if ((typeof cookieKey === typeof "") && (cookieKey.length > 0) && ($.inArray(cookieKey, pCookieToLive) === -1))
			{
				$.cookie(cookieKey, null); // remove it
			}
		}
	},

	doLogin: function (pUsername, pPassword, pSuccess, pFailure)
	{
		api_async.auth.login(pUsername, pPassword, function (pData)
		{
			if (pData.user_id === undefined)
			{
				failedLogin($.i18n._('nixps-cloudflow-login.error-login_failed'));
			}
			else
			{
				login.removeOtherCookies(['user_id', 'user_hash', 'expiration_date', 'scope']);
				// Store our login in a cookie
				$.cookie('user_id', pData.user_id, { expires: 2, path: '/' });
				$.cookie('user_hash', pData.user_hash, { expires: 2, path: '/' });
				$.cookie('expiration_date', pData.expiration_date, { expires: 2, path: '/' });
				$.cookie('scope', null, {path: '/'});
				pSuccess(pData.user_id);
			}
		},
		function (pError)
		{
			if (pError.error_code !== undefined)
			{
				pFailure($.i18n._('nixps-cloudflow-login.error-' + pError.error_code));
			}
			else if (pError.error != undefined)
			{
				pFailure(pError.error);
			}
		});
	},

	setupUI: function()
	{
		if (sOrigURL === "<!--ORIG-->")
		{
			sOrigURL = window.location.href;
		}

		if (sOrigUser === "<!--USERNAME-->")
		{
			sOrigUser = "";
		}

		if (sOrigUser !== "")
		{
			$('#login_dialog #username').val(sOrigUser);
		}

		$('div#google').hide();

		api_async.auth.generate_oauth2_url('google', function (pData)
		{
			if ((pData.result !== undefined) && (pData.result !== null))
			{
				$('a#google-button').attr('href', pData.result);
				$('div#google').show();
			}
		},
		function ()
		{
			/* ignore error */
		});

		$("#login_dialog").on('submit', function(pEvent)
		{
			pEvent.preventDefault();
		});

		// BIND LOGIN
		$('.login_action').click(login.login);
		$('.login_action').css("cursor", "pointer");

		if ($('#login_dialog #username').val() === '')
		{
			$("#login_dialog #username").focus();
		}
		else
		{
			$("#login_dialog #password").focus();
		}

		$(document).keypress(function (pEvent)
		{
			if (pEvent.keyCode == 13)
			{
				login.login();
			}
		});

		api_async.portal.version(login.setVersion);

		if (window.location.toString().indexOf('error=1') >= 0)
		{
			login.loginFailed($.i18n._('nixps-cloudflow-login.error-user_not_registered'));
		}
	},

    setup_ui: function() { // to handle old html pages caches
        login.setupUI();
    },

	/**
	 * Called on a login action in the dialog
	 */
	login: function ()
	{
		$('.login_action').prop('disabled', true);
		var username = $("#login_dialog #username").val();
		var password = $("#login_dialog #password").val();
		login.doLogin(username, password, login.loginSuccessful, login.loginFailed);
	},

	/**
	 * Sets the version in the title of the dialog
	 */
	setVersion: function (pData)
	{
		var version = pData.major + "." + pData.minor;

		if (pData.rev !== 0)
		{
			version += "." + pData.rev;
		}

		var loginText = $.i18n._('nixps-cloudflow-login.version', [version, pData.build]);
		$("#loginversion").text('(' + loginText + ')');
	},

	/**
	 * Callback on successful login
	 */
	loginSuccessful: function (pUserid)
	{
		api_defer.frame.os.get().then(function () {
			api_defer.auth.get_current_user().then(function (currentUser) {
				return api_defer.auth.create_session(currentUser.username);
			}).then(function (sessionKey) {
				var session = sessionKey.session;
				return api_defer.frame.os.set_cloudflow_session(session, {force: true});
			}).then(function () {
				document.location.assign(sOrigURL);
			}).fail(function () {
				document.location.assign(sOrigURL);
			});
		}).fail(function () {
			document.location.assign(sOrigURL);
		});
	},

	/**
	 * Callback on a failed login
	 */
	loginFailed: function (pReason)
	{
		$("#loginstatus").text(pReason);
		$('.login_action').prop('disabled', false);
	},

	/**
	 * Shows the login dialog
	 */
	show: function()
	{
		$("#login_dialog #username").focus();
	}

}
