/* global $ */
'use strict';

let activeClasses = {
    tab: 'tab--active',
    pane: 'pane--active'
};

let pageHasLoaded = false;

// toggle panes/tabs (if valid)
let showNewTabPane = ($tabClicked) => {

    let tabData;
    let $tabset;

    // get the matching pane element
    let paneId = $tabClicked.attr('href');
    let $paneToShow = $(paneId);

    // is this "tab" just a link to a panel (eg. not in a tabset)?
    let hasManualTabset = $tabClicked.data('tabset');

    // find the "tabset" - the containing list of tabs
    if (hasManualTabset) {
        // for these links we have to manually match it to a tabset elsewhere on the page
        // eg. so we can toggle the selected tab there
        $tabset = $($(`#${hasManualTabset}`));
        // we also need to find the equivalent tab in that tabset to make it active
        $tabClicked = $tabset.find(`a[href="${paneId}"]`);
    } else {
        // find the tabset of the clicked tab
        $tabset = $tabClicked.parents('.js-tabset').first();
    }

    // if we have a pane, let's show it
    if ($paneToShow.length > 0) {
        // we need the "paneset" - the container of available panes
        // (this allows multiple sets of tabs/panes)
        let $paneSet = $paneToShow.parents('.js-paneset').first();

        if ($paneSet.length > 0) {
            // toggle the active pane in this set
            let $oldActivePane = $paneSet.find(`> .${activeClasses.pane}`);
            $oldActivePane.removeClass(activeClasses.pane);
            $paneToShow.addClass(activeClasses.pane);

            // toggle the active tab in this set
            let $oldActiveTab = $tabset.find(`.${activeClasses.tab}`);
            $oldActiveTab.removeClass(activeClasses.tab);
            $tabClicked.addClass(activeClasses.tab);

            // pass this data back to the click handler
            tabData = {
                tabset: $tabset,
                paneToShow: $paneToShow,
                tabClicked: $tabClicked,
                paneId: paneId
            };
        }
    }

    // click handler needs to know if it should update URL hash etc
    return tabData;
};

let init = () => {

    // bind clicks on tabs
    $('.js-tab').on('click', function (e) {

        // show the tab pane and get the associated elements
        let tabData = showNewTabPane($(this));

        // if this was a valid tab
        if (tabData) {

            // stop browser scroll by default
            e.preventDefault();

            // if we're on mobile (eg. accordion) we should scroll the pane into view
            // we delay this because the visibility check returns false as the page loads
            // and the tabs are made visible by JavaScript
            let scrollTimeout = (pageHasLoaded) ? 0 : 300;
            window.setTimeout(() => {
                let tabSetIsVisible = tabData.tabset.is(":visible");
                if (!tabSetIsVisible) {
                    tabData.paneToShow[0].scrollIntoView();
                } else {
                    // is this a mock tab or a real one?
                    if ($(this)[0] !== tabData.tabClicked[0]) {
                        // mock tab, so make sure the tabset is in view
                        // or the lack of scroll change is jarring
                        tabData.tabClicked[0].scrollIntoView();
                    }
                }
                pageHasLoaded = true;
            }, scrollTimeout);

            // update the URL fragment
            if (tabData.paneId && tabData.paneId[0] === '#') {
                if (history.pushState) {
                    history.pushState(null, null, tabData.paneId);
                }
            }
        }

    });

    // restore previously-selected hash on pageload
    let hash = window.location.hash;
    let $firstLink = $(`a[href="${hash}"]`).first();
    if ($firstLink.length > 0) {
        showNewTabPane($firstLink);
        // hacky but works: scroll back to top of the page
        // as otherwise the selected pane will be scrolled to
        // and page intro will be missing
        window.setTimeout(() => {
            window.scrollTo(0, 0);
        }, 1);
    }

};

module.exports = {
    init: init
};