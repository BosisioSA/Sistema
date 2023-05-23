/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function init_share_pane(pLanguage) {
    // make parent 
    var shareContainer = $('<div>').addClass('shareContainer');
    $('body').append(shareContainer);
    
    // make tabs titles
    var tabHeader = $('<ul>').append($('<li>').append($('<a>').attr('href','#tabs-status-tab')._t("nixps-cloudflow-share-status-title")))
                             .append($('<li>').append($('<a>').attr('href','#tabs-site-tab')._t('nixps-cloudflow-share-sites-title')))
                             .append($('<li>').append($('<a>').attr('href','#tabs-syncspec-tab')._t('nixps-cloudflow-share-syncspec-title')));
    shareContainer.append(tabHeader);
    
    // status of the shares
    var statusTable = $('<div id="tabs-status-tab">').addClass('statusShare');
    shareContainer.append(statusTable);
    statusTable.Status({
        language: pLanguage
    });
    
    // sites 
    var syncSpecTable = $('<div id="tabs-syncspec-tab">').addClass('syncspecShare');
    shareContainer.append(syncSpecTable);
    syncSpecTable.Syncspecs({});
    
    // sites 
    var siteTable = $('<div id="tabs-site-tab">').addClass('siteShare');
    shareContainer.append(siteTable);
    siteTable.Sites({});
    
    shareContainer.tabs({}).tabs('select', 0);
}

