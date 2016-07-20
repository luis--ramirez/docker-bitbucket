'use strict';

define('bitbucket/internal/feature/user/user-table', ['aui', 'jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/widget/paged-table'], function (AJS, $, nav, PagedTable) {

    function UserTable(options) {
        PagedTable.call(this, $.extend({
            filterable: true,
            noneMatchingMessageHtml: AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.user.search.nomatch')),
            noneFoundMessageHtml: AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.user.search.nousers')),
            paginationContext: 'user-table'
        }, options));
    }

    $.extend(UserTable.prototype, PagedTable.prototype);

    UserTable.prototype.buildUrl = function (start, limit, filter) {
        var params = {
            start: start,
            limit: limit,
            avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'small' })
        };
        if (filter) {
            params.filter = filter;
        }
        return nav.admin().users().withParams(params).build();
    };

    UserTable.prototype.handleNewRows = function (userPage, attachmentMethod) {
        this.$table.find('tbody')[attachmentMethod](bitbucket.internal.feature.user.userRows({
            users: userPage.values
        }));
    };

    return UserTable;
});