'use strict';

define('bitbucket/internal/layout/branch/branch-layout-analytics', ['jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/util/events', 'exports'], function ($, _, navBuilder, events, exports) {
    'use strict';

    var CONTEXT = 'selector';

    function branchActionsAnalytics(data) {
        if (data.context !== CONTEXT) {
            return;
        }
        var pages = ['commits', 'browse', 'branches'];

        function onPage(pageName) {
            return window.location.pathname.indexOf(navBuilder.currentRepo()[pageName]().build()) === 0;
        }

        var page = _.find(pages, onPage);

        events.trigger('bitbucket.internal.ui.branch-selector.actions.item.clicked', null, {
            webItemKey: data.webItemKey,
            source: page
        });
    }

    function initLayoutAnalytics($actionsMenu) {
        $actionsMenu.on('aui-dropdown2-show', function () {
            events.trigger('bitbucket.internal.ui.branch-selector.actions.opened');
        });

        $actionsMenu.on('click', 'a', function () {
            branchActionsAnalytics({ context: CONTEXT, webItemKey: $(this).attr('data-web-item-key') });
        });

        events.on('bitbucket.internal.feature.branch-copy.branchNameCopied', branchActionsAnalytics);
    }

    exports.initLayoutAnalytics = initLayoutAnalytics;
    exports.CONTEXT = CONTEXT;
});