/*********************************************************************/
/* ![ GLOBAL FUNCTIONS ]											 */
/*********************************************************************/
window.addEventListener('popstate', function(event) 
{
    // if we go back in time ... try to fix a safari problem
    if (event && event.state) {
        // if we detect some error, fix it and reload!
        // is the asset keyword url injected in the url?
        // cut it off and reload the good one.
        var index = window.location.href.indexOf('asset%3Dcloudflow%253A%252F%252F');
        if (index > 0) {
            var url = window.location.href.slice(index);
            window.location = window.location.protocol + "//" + window.location.host + "?" + decodeURIComponent(url);
        }
    }
	if (event.state !== undefined && event.state !== null && event.state.url !== undefined) {
        var currentUrl = $('body').AssetView('option', 'url');
        var currentSub = $('body').AssetView('option', 'sub');
        if (event.state.url === currentUrl && event.state.sub === currentSub) {
            // the state is the same as the actual url and sub
            // so this is safari coming back, do nothing ...
        } else {
            // (Safari) when coming back from compare gives wrong state.url,
            // so if find wrong url, repaire it.
            if (typeof event.state.url === "string" && event.state.url.search("[?]asset=") > 0) {
                var urlIndex = event.state.url.search("[?]asset=") + 7; /* shift 7 chars to go from '?' to '=' */
                event.state.url = decodeURIComponent(event.state.url.slice(urlIndex));
            }
            $('body').AssetView('update', event.state.url, event.state.sub, event.state.site, true);
        }
	}
});

function init_asset_view(pLanguage, pLicense, pSites) {
    window.nixpsLanguage = pLanguage;
    window.nixpsLicense = pLicense;
    window.nixpsSites = pSites;
	$('body').append('<div id="dropdaddy"><div id="dropzone" class="fade well">' + $.i18n._('nixps-cloudflow-assets.drop_msg', ['<font color="#fa2">' + $.i18n._('nixps-cloudflow-assets.drop_msg_done') + '</font>']) + '</div></div>');
    $('body').Dialog();
    Mousetrap.bind(["command+f", "ctrl+f"], function(pEvent) {
        // only do action if AssetView component is ready
        if($('body').hasClass('nixps-asset-AssetView')) {
            $('body').AssetView('shortCutKeyCommand', pEvent, "cmdF");
        }
    });
    Mousetrap.bind(["command+x", "ctrl+x"], function(pEvent) {
        // only do action if AssetView component is ready
        if($('body').hasClass('nixps-asset-AssetView')) {
            $('body').AssetView('shortCutKeyCommand', pEvent, "cmdX");
        }
    });
    Mousetrap.bind(["command+c", "ctrl+c"], function(pEvent) {
        // only do action if AssetView component is ready
        if($('body').hasClass('nixps-asset-AssetView')) {
            $('body').AssetView('shortCutKeyCommand', pEvent, "cmdC");
        }
    });
    Mousetrap.bind(["command+v", "ctrl+v"], function(pEvent) {
        // only do action if AssetView component is ready
        if($('body').hasClass('nixps-asset-AssetView')) {
            $('body').AssetView('shortCutKeyCommand', pEvent, "cmdV");
        }
    });
    $(document).on("keypress", function(pEvent) {
        // only do action if AssetView component is ready
        if (pEvent.which === 32 && $(pEvent.target).is("input, textarea") === false && $('body').hasClass('nixps-asset-AssetView')) {
            $('body').AssetView('shortCutKeyCommand', pEvent, "space");
        }
    });
}

function show_asset_view(p_url, p_sub, pOpenMode, pSearchString) {
    if (window.nixpsLicense === undefined) {
        throw new Error('could not retrieve licenses');
    }
    if (window.nixpsLicense.check('portal') === true) {
        // make startUpOptions
        var urlParameters = $.url().param();
        var startUpOptions = {
                openMode: pOpenMode
            };
        if (typeof pSearchString === "string" && pSearchString.length > 0) {
            startUpOptions.searchString = decodeURI(pSearchString);
        }
        if (typeof urlParameters.view === "string") {
            startUpOptions.view =  urlParameters.view;     
        }
        if ($.isArray(urlParameters.orderBy)) {
            startUpOptions.sortingColumn= urlParameters.orderBy;
        } else {
            // how must we handle the orderBy url parameters ??
        }
        var site = "";
        if (typeof urlParameters.site === "string" && urlParameters.site.length > 0) {
            site = urlParameters.site;
        }
        $('body').AssetView({
            language: window.nixpsLanguage,
            url: p_url,
            sub: p_sub,
            site: site,
            currentSite: window.nixpsLicense.getCurrentSiteName(),
            licenseObject: window.nixpsLicense.toJSON(),
            sitesObject: window.nixpsSites.toJSON(),
            startUpOptions: startUpOptions,
            update: function(pEvent, pData) {
                var titlePrefix = pData.shortSiteName || "";
                if (typeof pData.file_name === "string" && pData.file_name.length > 0) {
                    document.title = $.trim(titlePrefix + " " + pData.file_name);
                } else {
                    document.title = $.trim(titlePrefix + " " + 'Asset');
                }
            }
        }).show();
    } else if (window.nixpsLicense.check('max_cpu') === true) {
        window.location = '/';
    } else {
        api.not_licensed();
    }
    update_expiry_warning(window.nixpsLicense);
}
