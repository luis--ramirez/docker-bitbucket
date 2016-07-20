'use strict';

define('bitbucket/internal/feature/user/group-table', ['aui', 'jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/util/function', 'bitbucket/internal/widget/paged-table'], function (AJS, $, nav, fn, PagedTable) {

    /**
     * Table holding the available groups.
     *
     * @param options config options
     * @see {@link PagedTable}'s constructor
     * @constructor
     */
    function GroupTable(options) {
        PagedTable.call(this, $.extend({}, GroupTable.defaults, options));
    }

    $.extend(GroupTable.prototype, PagedTable.prototype);

    GroupTable.defaults = {
        filterable: true,
        noneMatchingMessageHtml: AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.grouptable.nomatch')),
        noneFoundMessageHtml: AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.grouptable.nogroups')),
        idForEntity: fn.dot('name'),
        paginationContext: 'group-table'
    };

    GroupTable.prototype.buildUrl = function (start, limit, filter) {
        var params = {
            start: start,
            limit: limit
        };
        if (filter) {
            params.filter = filter;
        }
        return nav.admin().groups().withParams(params).build();
    };

    GroupTable.prototype.handleNewRows = function (groupPage, attachmentMethod) {
        this.$table.find('tbody')[attachmentMethod](bitbucket.internal.feature.user.groupRows({
            groups: groupPage.values
        }));
    };

    return GroupTable;
});