'use strict';

define('bitbucket/internal/feature/comments/comment-async-web-panel', ['jquery', 'bitbucket/util/events', 'bitbucket/internal/util/promise', 'exports'], function ($, eventsApi, promiseUtil, exports) {

    // @TODO: This is a stopgap measure until STASHDEV-4078 is fixed

    'use strict';

    var commentSearchScope = [document.documentElement];

    // reset the comment containers array when a new context requested (this happens when switching
    // tabs and files in the PR) to avoid comment containers from piling up.
    eventsApi.on('bitbucket.internal.page.pull-request.view.contextRequested', function () {
        commentSearchScope = [document.documentElement];
    });

    eventsApi.on('bitbucket.internal.feature.comments.commentContainerAdded', function ($container) {
        commentSearchScope.push($container[0]);
    });

    var webPanelId = 0;

    /**
     *
     * @param {Function} callback
     * @returns {string}
     */
    function getWebPanelEl(callback) {
        // TODO: make this not comment specific?
        // TODO: move this to Skate once we can skate comments in a diff
        // TODO: error handling when the promise rejects
        webPanelId++;

        var selector = "#async-web-panel-" + webPanelId;

        promiseUtil.waitFor({
            predicate: function predicate() {
                var $el = $(selector, commentSearchScope);
                return $el.length ? $el : false;
            },
            name: 'Async web panel ' + webPanelId,
            interval: 50
        }).then(callback);

        return bitbucket.internal.feature.commentAsyncWebPanelPlaceholder({
            webPanelId: webPanelId
        });
    }

    exports.getWebPanelEl = getWebPanelEl;
});