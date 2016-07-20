'use strict';

define('bitbucket/internal/page/project-list', ['jquery', 'bitbucket/util/events', 'bitbucket/internal/feature/project/project-table', 'bitbucket/internal/util/notifications', 'exports'], function ($, events, ProjectTable, notifications, exports) {
    'use strict';

    exports.onReady = function (projectTableId) {
        events.trigger('bitbucket.internal.browser-metrics.project-list.start');
        notifications.showFlashes();

        var table = new ProjectTable({
            target: '#' + projectTableId
        });
        table.init().done(function () {
            events.trigger('bitbucket.internal.browser-metrics.project-list.end');
        });

        $(".aui-page-panel-sidebar .welcome-mat").on('click', 'a', function () {
            events.trigger('bitbucket.internal.ui.project-list.welcome-mat.item.clicked', null, {
                webItemId: $(this).attr('data-web-item-key')
            });
        });

        $("#projects-table").on('click', 'a', function () {
            events.trigger('bitbucket.internal.ui.project-list.item.clicked', null, {
                projectId: $(this).attr('data-project-id')
            });
        });

        $('.create-project-link').on('click', events.trigger.bind(null, 'bitbucket.internal.ui.project-list.create.clicked'));
    };
});