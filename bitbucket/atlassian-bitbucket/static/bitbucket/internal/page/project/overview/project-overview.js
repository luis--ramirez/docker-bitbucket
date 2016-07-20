'use strict';

define('bitbucket/internal/page/project/overview', ['jquery', 'bitbucket/internal/feature/repository/repository-table', 'bitbucket/internal/util/notifications', 'exports'], function ($, RepositoryTable, notifications, exports) {

    exports.onReady = function (repositoryTableSelector) {
        // Attach flash notifications. Can be result of deleted repositories
        notifications.showFlashes();

        if ($(repositoryTableSelector).length) {
            new RepositoryTable(repositoryTableSelector, {
                showPublicStatus: true,
                bufferPixels: $('#footer').height(), // Trigger next page buffering for the footer STASH-4024
                pageSize: 100
            }).init();
        }
    };
});