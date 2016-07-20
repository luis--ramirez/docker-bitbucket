'use strict';

define('bitbucket/internal/feature/repository/repository-table', ['aui', 'jquery', 'lodash', 'bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/internal/model/page-state', 'bitbucket/internal/widget/paged-table'], function (AJS, $, _, events, nav, pageState, PagedTable) {
    'use strict';

    function RepositoryTable(repositoryTableSelector, options) {
        var defaults = {
            target: repositoryTableSelector,
            ajaxDataType: 'json',
            tableMessageClass: 'repository-table-message',
            allFetchedMessageHtml: '<p class="no-more-results">' + AJS.I18n.getText('bitbucket.web.repository.allfetched') + '</p>',
            noneFoundMessageHtml: '<h3 class="no-results entity-empty">' + AJS.I18n.getText('bitbucket.web.repository.nonefetched') + '</h3>',
            statusCode: {
                '401': function _() {
                    //If the project is not accessible display no repos
                    return $.Deferred().resolve({ start: 0, size: 0, values: [], isLastPage: true }).promise();
                }
            },
            paginationContext: 'repository-table'
        };
        options = _.extend({}, defaults, options);
        PagedTable.call(this, options);

        if (options.projectKey) {
            // This is a dirty hack for the profile page
            this._project = { key: options.projectKey, 'public': false };
        } else {
            var currentProject = pageState.getProject();
            this._project = currentProject && currentProject.toJSON();
        }
        this._options = options;

        this.bindUIEvents();
    }

    _.extend(RepositoryTable.prototype, PagedTable.prototype);

    RepositoryTable.prototype.bindUIEvents = function () {
        // N.B. the create repo link is in the sidebar
        $('.create-repository-link').on('click', 'a', events.trigger.bind(null, 'bitbucket.internal.ui.repository-list.create.clicked'));
        $(this.options.target).on('click', 'a', function () {
            var $el = $(this);
            var projectId = pageState.getProject() ? pageState.getProject().id :
            // see if the repo table includes the project.
            $el.closest('td').find('.project-name a').attr('data-project-id');
            events.trigger('bitbucket.internal.ui.repository-list.item.clicked', null, {
                repositoryId: $el.attr('data-repository-id'),
                projectId: projectId
            });
        });
    };

    RepositoryTable.prototype.buildUrl = function (start, limit) {
        return nav.project(this._project.key).allRepos().withParams({
            start: start,
            limit: limit
        }).build();
    };

    RepositoryTable.prototype.handleNewRows = function (data, attachmentMethod) {
        // This is a dirty hack for the profile page
        var currentProject = this._project;
        var options = this._options;
        var rows = _.map(data.values, function (repo) {
            if (!repo.project) {
                if (currentProject) {
                    repo.project = currentProject;
                } else {
                    // If this occurs it is a programming error and we want to fail loudly
                    throw new Error("No project was provided for repo id=" + repo.id + " slug=" + repo.slug + " but we are in a global context");
                }
            }
            return bitbucket.internal.feature.repository.repositoryRow({
                repository: repo,
                showProject: options.showProject,
                showPublicStatus: options.showPublicStatus
            });
        });
        this.$table.show().children("tbody")[attachmentMethod !== 'html' ? attachmentMethod : 'append'](rows.join(''));
    };

    RepositoryTable.prototype.handleErrors = function (errors) {};

    return RepositoryTable;
});