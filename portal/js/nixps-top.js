/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true, newcap: true*/
/*globals $, _, jsPlumb, console, api, api_async, window, license, sContext, sPermissions */

(function() {

    /**
     * @brief returns the build number
     */
    function getBuild() {
        return $.Deferred(function(defer) {
            api_async.portal.version(function(result) {
                defer.resolve(result.build);
            }, defer.reject);
        });
    }


    /**
     * @brief gets all off the prerelease settings
     */
    function getPrereleasePreferences() {
        return $.Deferred(function(pDefer) {
            api_async.preferences.get_for_current_user("com.nixps.general.prerelease", "", function(preferences) {
                pDefer.resolve(preferences);
            }, pDefer.reject);
        });
    }

    function getUserPreferences() {
        return $.Deferred(function(pDefer) {
            api_async.preferences.get_for_current_user("", "", function (pResults) {
                pDefer.resolve(pResults.preferences);
            }, pDefer.reject);
        });
    }

    function getUserLanguage(pLanguage) {
        if (typeof pLanguage === "string" && pLanguage.length > 0) {
            return pLanguage;
        }
        return getUserPreferences().then(function(pUserPref){
            return pUserPref.language;
        });
    }

    /**
     * Returns the mars settings
     */
    function getMARSPreferences () {
        return api_defer.preferences.get_for_current_user('com.nixps.mars', '');
    }


    /**
     * @brief returns the server configuration if the user is admin
     */
    function getServerConfig() {
        if ($.inArray('ADMIN', sPermissions) >= 0) {
            var lCommand = { "method" : "request.config", "name" : "servers" };
            return $.post("/portal.cgi", JSON.stringify(lCommand));
        }

        // Don't get the server config is the user is not the admin
        return $.when(null);
    }


    /**
     * @brief the top panel in cloudflow, may be a navigation bar or a welcome message with the build number
     */
    window.top_pane = {

        m_construct_notify: true,

        //
        // General Methods
        //
        setup_ui: function(pEnableCloudflowBar, pLanguage, pUser, pLicense) {
            if (sContext !== undefined && sContext === 'portal') {
                if (window.top_pane.m_construct_notify) {
                    $('body').append(
                            "<div id='notify-area' style='display:none; pointer-events:none; top:32px; right:0; bottom:0; margin:10px 10px 10px 10px; z-index:9999'>"+
                            "<div id='default'>"+
                            "<h1>#{title}</h1>"+
                            "<p>#{text}</p>"+
                            "</div>"+
                            "<div id='closeable'>"+
                            "<a class='ui-notify-cross ui-notify-close' href='#' style='pointer-events:auto'>x</a>"+
                            "<h1>#{title}</h1>"+
                            "<p>#{text}</p>"+
                            "</div>"+
                            "<div id='closeable-error' style='background-color:#700'>"+
                            "<a class='ui-notify-cross ui-notify-close' href='#' style='pointer-events:auto'>x</a>"+
                            "<h1>#{title}</h1>"+
                            "<p>#{text}</p>"+
                            "</div>"+
                            "</div>");

                    $('#notify-area').notify();
                }
                var licenseDef;
                if (pLicense !== undefined && $.isFunction(pLicense.isDataLink)) {
                    licenseDef = pLicense;
                } else {
                    licenseDef = nixps.cloudflow.License.get();
                }
                var userDef;
                if (pUser !== undefined) {
                    userDef = pUser;
                } else {
                    userDef = nixps.cloudflow.User.get();
                }
                $.when(licenseDef, userDef, getBuild(), getPrereleasePreferences(), getServerConfig(), getMARSPreferences(), getUserLanguage(pLanguage)).then(function(license, user, build, prerelease, serverConfig, marsPreferences, pLanguage) {
                    var buttons = [];
                    if (license.isDataLink() === false && license.check('max_cpu')) {
                        buttons.push({
                            // home
                            icon: '/portal/icons/non-active/main-icon-home.svg',
                            link: '/portal.cgi?home=1',
                            tooltip: 'nixps-cloudflow-top_navigation.home',
                            text: 'nixps-cloudflow-top_navigation.home'
                        });
                    }

                    if (license.check('portal')) {
                        buttons.push({
                            // assets
                            icon: '/portal/icons/non-active/main-icon-assets.svg',
                            link: '/portal.cgi?asset=X',
                            tooltip: 'nixps-cloudflow-assets.title',
                            text: 'nixps-cloudflow-assets.title'
                        });

                        buttons.push({
                            // users config
                            icon: '/portal/icons/non-active/main-icon-users.svg',
                            link: '/portal.cgi?manageusers=1',
                            tooltip: 'nixps-cloudflow-top_navigation.users',
                            text: 'nixps-cloudflow-top_navigation.users'
                        });

						buttons.push({
							// chains config
							icon: '/portal/icons/non-active/main-icon-chains.svg',
							link: '/portal.cgi?chains=1',
							tooltip: 'nixps-cloudflow-top_navigation.approval',
							text: 'nixps-cloudflow-top_navigation.approval'
						});
                    }

                    if (license.check('quantum') && user.hasPermission('MANAGE_QUANTUM')) {
                        buttons.push({
                            // workflow builder
                            icon: '/portal/icons/non-active/main-icon-flows.svg',
                            link: '/portal.cgi?quantum',
                            tooltip: 'nixps-cloudflow-top_navigation.flows',
                            text: 'nixps-cloudflow-top_navigation.flows'
                        });
                    }

                    if (license.isDataLink() === false && license.check('max_cpu')) {
                        buttons.push({
                            // kiosk
                            icon: '/portal/icons/non-active/main-icon-kiosk.svg',
                            link: '/portal.cgi?hub&topbar=true',
                            tooltip: 'nixps-cloudflow-top_navigation.kiosk',
                            text: 'nixps-cloudflow-top_navigation.kiosk',
                            badgeNumber: function() {
                                return $.Deferred(function(pDefer){
                                    api_async.workable.count(['hold_in_kiosk', 'equal to', true, 'and', "roles.handler", "equal to", user.getUserName()], {}, function(pResults) { pDefer.resolve(pResults.count);}, pDefer.reject);
                                });
                            }
                        });
                    }

                    if (prerelease.preferences["task_list_stuff"] === true) {
                        buttons.push({
                            // task list stuff
                            icon: '/portal/icons/non-active/main-icon-tasks.svg',
                            link: '/portal.cgi?tasks=1',
                            tooltip: 'nixps-cloudflow-top_navigation.tasks',
                            text: 'nixps-cloudflow-top_navigation.tasks'
                        });
                    }

                    if (false && license.check('lms')) {
                        // Hide access to PrintPlanner (before removing it definitely from Cloudflow)
                        buttons.push({
                            // printplanner
                            icon: '/portal/icons/non-active/main-icon-printplanner1.svg',
                            link: '/portal.cgi?lms=mainPage',
                            tooltip: 'nixps-cloudflow-top_navigation.printplanner',
                            text: 'nixps-cloudflow-top_navigation.printplanner'
                        }).css('display', 'none');
                    }

                    if (license.check('patchplanner') && user.hasPermission('USE_PATCHPLANNER') === true) {
                        buttons.push({
                            // patchplanner
                            icon: '/portal/icons/non-active/main-icon-patchplanner3.svg',
                            link: '/portal.cgi?patchplanner=1',
                            tooltip: 'nixps-cloudflow-top_navigation.patchplanner',
                            text: 'nixps-cloudflow-top_navigation.patchplanner'
                        });
                    }

                    if (license.check('quantumrip')) {
                        buttons.push({
                            // rip
                            icon: '/portal/icons/non-active/main-icon-standalone_rip1.svg',
                            link: '/standalone_rip.html?version=' + build + '&topbar=true',
                            tooltip: 'nixps-cloudflow-top_navigation.standalone_rip',
                            text: 'nixps-cloudflow-top_navigation.standalone_rip'
                        });
                    }

                    if (license.check('share') && user.hasPermission('MANAGE_SHARE')) {
                        buttons.push({
                            // share
                            icon: '/portal/icons/non-active/main-icon-share1.svg',
                            link: '/portal.cgi?share=1',
                            tooltip: 'nixps-cloudflow-top_navigation.share',
                            text: 'nixps-cloudflow-top_navigation.share'
                        });
                    }

                    if (license.check('datalink') === true && user.hasPermission('ADMIN')) {
                        buttons.push({
                            icon: '/portal/icons/non-active/main-icon-datalink3.svg',
                            link: '/portal.cgi/sqlink/',
                            tooltip: 'nixps-cloudflow-top_navigation.datalink',
                            text: 'nixps-cloudflow-top_navigation.datalink'
                        });
                    }

                    if (license.check('project') === true) {
                        buttons.push({
                            icon: '/portal/icons/non-active/main-icon-projects2.svg',
                            link: '/portal.cgi?job',
                            tooltip: 'nixps-cloudflow-top_navigation.jobs',
                            text: 'nixps-cloudflow-top_navigation.jobs'
                        });
                    }

                    var showMarsUI = false;
                    if ($.isPlainObject(marsPreferences) && $.isPlainObject(marsPreferences.preferences)) {
                        showMarsUI = marsPreferences.preferences.showUI;
                    };
                    if (user.hasPermission('ADMIN') && (license.check('mars') === true || showMarsUI)) {
                        buttons.push({
                            icon: '/portal/icons/non-active/main-icon-mars.svg',
                            link: '/apps/index.html',
                            tooltip: 'nixps-cloudflow-top_navigation.mars',
                            text: 'nixps-cloudflow-top_navigation.mars'
                        });
                    }

                    if (user.hasPermission('ADMIN')) {
                        buttons.push({
                            // settings
                            icon: '/portal/icons/non-active/main-icon-settings.svg',
                            link: '/portal.cgi?config=1',
                            tooltip: 'nixps-cloudflow-top_navigation.settings',
                            text: 'nixps-cloudflow-top_navigation.settings'
                        });
                    }

                    // Create the Top Objects
                    $('<div>')
                        .attr('id', 'portal-bar')
                        .addClass('top-pane')
                        .prependTo($('body'))
                        .TopNavigation({
                            buttons: buttons,
                            showUser: (pEnableCloudflowBar !== true),
                            showLogout: (pEnableCloudflowBar !== true),
                            showScopeSelector: (pEnableCloudflowBar !== true) && (license.check('max_cpu') !== false)
                        });

                    // Create and add if asked the CloudflowBar
                    if (pEnableCloudflowBar === true) {
                        $('<div>').addClass('cloudflowBar').prependTo($('body'))
                            .CloudflowBar({
                                language: pLanguage,
                                showUserMenu: license.isDataLink() === false,
                                showScopeSelector: license.isDataLink() === false && user.hasAllScopes() && (license.check('max_cpu') !== false),
                                username: user.getFullName(),
                                user: user
                            });

                    }

                }, function() {
                    console.error(arguments);
                });
            }
            else {
    			$('body').append($('<div>')
                    .attr('id', 'portal-bar')
                    .addClass('top-pane')
                    .append($('<div>')
                        .addClass('top-title')
                        .text($.i18n._('nixps-cloudflow-top.welcome'))
                        .append($('<span>')
                            .css({
                                display: 'inline-block',
                                marginLeft: 5
                            }).attr('id', 'loginversion'))));
            }
        },


        //
        // Specific Methods
        //
        set_title: function(main_title) {
    		window.document.title = main_title;
        },


        /**
         * @brief for backwards compatiblity
         */
        set_active: function() {}

    };

}());

///////////////////////////////////////////////////////////////////////////////////////
// INITIALIZATION WRAPPER
///////////////////////////////////////////////////////////////////////////////////////

function init_top_pane(p_create_notify_area, pEnableCloudflowBar, pLanguage, pUser, pLicense) {
    if (p_create_notify_area !== undefined) {
        window.top_pane.m_construct_notify = p_create_notify_area;
    }

    window.top_pane.setup_ui(pEnableCloudflowBar, pLanguage, pUser, pLicense);
}

function update_expiry_warning(pLicense) {
	if ($.inArray('ADMIN', sPermissions) < 0) {
		return;
	}

    var licenseDef;
    if (pLicense !== undefined && $.isFunction(pLicense.isExpired)) {
        licenseDef = pLicense;
    } else {
        licenseDef = nixps.cloudflow.License.get();
    }
    $.when(licenseDef).then(function(license) {
        if (license.isExpired('maintenance')) {
            $('.global-msgs').empty()
                .append('<img src="portal/images/logs_error.png">')
                .append($.i18n._('nixps-cloudflow-top.message_maintenance'));
            $('.global-msgs').show();
        }
        else if (license.willExpire('maintenance', 30)) {
            $('.global-msgs').empty()
                 .append('<img src="portal/images/logging_warning.svg">')
                 .append($.i18n._('nixps-cloudflow-top.message_expire', [api.utils.format_date(license.getInfo('maintenance').end * 1000, '%B %d, %Y', (new Date()).getTimezoneOffset()).result]));
            $('.global-msgs').show();
        }
    });

}
