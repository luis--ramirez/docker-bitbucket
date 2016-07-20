'use strict';

define('bitbucket/internal/page/branches/branches-page-analytics', ['jquery', 'bitbucket/internal/util/events', 'exports'], function ($, events, exports) {

    'use strict';

    var CONTEXT = 'list';

    function branchActionsAnalytics(data) {
        if (data.context === CONTEXT) {
            events.trigger('bitbucket.internal.ui.branch-list.actions.item.clicked', null, {
                webItemKey: data.webItemKey
            });
        }
    }

    function bindAnalyticsEvents() {
        $(document).on('click', '.branch-list-action-dropdown a', function (e) {
            branchActionsAnalytics({ context: CONTEXT, webItemKey: $(e.target).attr('data-web-item-key') });
        }).on('aui-dropdown2-show', '.branch-list-action-dropdown', function (e) {
            events.trigger('bitbucket.internal.ui.branch-list.actions.opened');
        });

        events.on('bitbucket.internal.feature.branch-copy.branchNameCopied', branchActionsAnalytics);
    }

    exports.bindAnalyticsEvents = bindAnalyticsEvents;
    exports.CONTEXT = CONTEXT;
});