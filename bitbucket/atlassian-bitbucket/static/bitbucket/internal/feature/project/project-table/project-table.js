'use strict';

define('bitbucket/internal/feature/project/project-table', ['jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/widget/paged-table'], function ($, nav, PagedTable) {

    'use strict';

    function ProjectTable(options) {
        options = $.extend({}, ProjectTable.defaults, options);
        PagedTable.call(this, options);
    }

    ProjectTable.defaults = {
        paginationContext: 'project-table'
    };

    $.extend(ProjectTable.prototype, PagedTable.prototype);

    ProjectTable.prototype.buildUrl = function (start, limit) {
        return nav.allProjects().withParams({
            start: start,
            limit: limit,
            avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'large' })
        }).build();
    };

    ProjectTable.prototype.handleNewRows = function (projectPage, attachmentMethod) {
        this.$table.find('tbody')[attachmentMethod](bitbucket.internal.feature.project.projectRows({
            projects: projectPage.values
        }));
    };

    return ProjectTable;
});