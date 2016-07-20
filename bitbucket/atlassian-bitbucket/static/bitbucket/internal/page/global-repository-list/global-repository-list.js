'use strict';

define('bitbucket/internal/page/global-repository-list', ['jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/repository/repository-table', 'exports'], function ($, nav, RepositoryTable, exports) {

    function GlobalRepositoryTable(repositoryTableSelector, options) {
        options = $.extend({
            showProject: true,
            bufferPixels: $('#footer').height()
        }, options);
        RepositoryTable.call(this, repositoryTableSelector, options);
    }

    $.extend(GlobalRepositoryTable.prototype, RepositoryTable.prototype);

    GlobalRepositoryTable.prototype.buildUrl = function (start, limit) {
        return nav.allRepos().visibility('public').withParams({
            avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'small' }),
            start: start,
            limit: limit
        }).build();
    };

    exports.onReady = function (repositoryTableSelector) {
        if ($(repositoryTableSelector).length) {
            new GlobalRepositoryTable(repositoryTableSelector).init();
        }
    };
});