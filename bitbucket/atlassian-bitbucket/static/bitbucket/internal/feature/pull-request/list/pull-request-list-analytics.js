'use strict';

define('bitbucket/internal/feature/pull-request/list/analytics', ['jquery', 'lodash', 'bitbucket/util/state', 'bitbucket/internal/util/events', 'exports'], function ($, _, pageState, events, exports) {
    'use strict';

    var REPOSITORY_ID = pageState.getRepository().id;
    var CURRENT_USER_NAME = pageState.getCurrentUser().name;

    function initButtonAnalytics(createAction) {
        var $createAction = $(createAction);

        $createAction.on('click', function () {
            events.trigger('bitbucket.internal.ui.pullRequestList.createAction.clicked', null, {
                repositoryId: REPOSITORY_ID
            });
        });
    }

    var filterState;

    /**
     * triggered when the filter has changed.
     * Works out which of the properties has changed by comparing to a stored filter state and
     * triggers the appropriate analytics events.
     * @param {Object} filter - the new filter state
     */
    function onFilterChanged(filter) {
        if (!_.isObject(filterState)) {
            filterState = filter;
        }
        // State Filter changed
        if (filter.state && filterState.state !== filter.state) {
            events.trigger('bitbucket.internal.ui.pullRequestList.filteredBy.state', null, {
                repositoryId: REPOSITORY_ID,
                state: filter.state
            });
        }

        // Author Filter changed
        if (filter.author_id && filterState.author_id !== filter.author_id) {
            events.trigger('bitbucket.internal.ui.pullRequestList.filteredBy.author', null, {
                repositoryId: REPOSITORY_ID,
                authorIsSelf: filter.author_id === CURRENT_USER_NAME
            });
        }
        // Target branch Filter changed
        if (filter.target_ref_id && filterState.target_ref_id !== filter.target_ref_id) {
            events.trigger('bitbucket.internal.ui.pullRequestList.filteredBy.target', null, { repositoryId: REPOSITORY_ID });
        }
        // Reviewer is me Filter changed
        if (filter.reviewer_self && filterState.reviewer_self !== filter.reviewer_self) {
            events.trigger('bitbucket.internal.ui.pullRequestList.filteredBy.reviewer', null, { repositoryId: REPOSITORY_ID });
        }

        filterState = filter;
    }

    function initBuildStatusAnalytics() {
        var validBuildStatus = ['SUCCESSFUL', 'FAILED', 'INPROGRESS', 'NONE'];

        $(document).on('click', '#bitbucket-pull-request-table .build-status-pr-list-col-value .build-icon', function () {
            var $el = $(this);
            var status = $el.attr('data-build-status');
            if (validBuildStatus.indexOf(status) !== -1) {
                var prId = $el.closest('tr').attr('data-pull-request-id');
                events.trigger('bitbucket.internal.ui.pullRequestList.buildStatus.clicked', null, {
                    buildStatus: status,
                    pullRequestId: prId,
                    repositoryId: REPOSITORY_ID
                });
            }
        });
    }

    function initEmptyStateAnalytics() {
        // Create new PR clicked from getting started page
        $(document).on('click', '#empty-list-create-pr-button', function (e) {
            events.trigger('bitbucket.internal.ui.pullRequestList.empty.create.clicked', null, {
                repositoryId: REPOSITORY_ID,
                page: 'pull-request-intro'
            });
        });

        // Create new PR clicked from no open PRs page
        $(document).on('click', '.empty-banner-content a', function (e) {
            events.trigger('bitbucket.internal.ui.pullRequestList.empty.create.clicked', null, {
                repositoryId: REPOSITORY_ID,
                page: 'no-open-prs'
            });
        });

        // Learn more clicked from getting started page
        $(document).on('click', '#empty-list-help-button', function (e) {
            events.trigger('bitbucket.internal.ui.pullRequestList.empty.help.clicked', null, {
                repositoryId: REPOSITORY_ID,
                page: 'pull-request-intro'
            });
        });

        // View open PRs clicked from no open PRs page
        $(document).on('click', '#reset-filters', function (e) {
            events.trigger('bitbucket.internal.ui.pullRequestList.empty.viewOpen.clicked', null, {
                repositoryId: REPOSITORY_ID,
                page: 'no-filtered-prs'
            });
        });
    }

    function initPullRequestRowAnalytics() {
        var loadTime = Date.now();

        $(document).on('click', '#bitbucket-pull-request-table .pull-request-title', function (e) {
            var $row = $(this).closest('tr');
            var prId = $row.attr('data-pull-request-id');
            var prAuthor = $row.find('.title .user-avatar').attr('data-username');
            var isReviewer = $row.find('.reviewers .user-avatar[data-username="' + CURRENT_USER_NAME + '"]').length > 0;
            var buildStatus = $row.find('.build-status-pr-list-col-value .build-icon').attr('data-build-status');

            events.trigger('bitbucket.internal.ui.pullRequestList.row.clicked', null, {
                "authorIsSelf": prAuthor === CURRENT_USER_NAME,
                "buildStatus": buildStatus,
                "isReviewer": isReviewer,
                "pullRequestId": prId,
                "repositoryId": REPOSITORY_ID,
                "timeSincePageLoaded": Date.now() - loadTime
            });
        });
    }

    /**
     * Trigger a ui pagination event for the pull request list
     * @param {Object} e - event data
     * @param {number} e.page
     */
    function onPaginate(e) {
        events.trigger('bitbucket.internal.ui.nav.pagination', null, {
            context: 'pull-request-list',
            page: e.page
        });
    }

    /**
     * @param {Object} options
     * @param {Object} options.filterParams - the filter params
     */
    function init(options) {
        var $createAction = $('#list-create-pr-button');
        filterState = options.filterParams;
        initButtonAnalytics($createAction);
        initBuildStatusAnalytics();
        initEmptyStateAnalytics();
        initPullRequestRowAnalytics();

        // wrap the 'viewed' event because the analytics helper does not get loaded until DOMReady
        $(document).ready(function () {
            events.trigger('bitbucket.internal.ui.pullRequestList.viewed', null, {
                authorIsSelf: options.filterParams.author_id === CURRENT_USER_NAME,
                filteredByAuthor: options.filterParams.author_id != null,
                filteredByReviewer: options.filterParams.reviewer_self === "true",
                filteredByTarget: options.filterParams.target_ref_id != null,
                repositoryId: REPOSITORY_ID
            });
        });
    }

    exports.init = init;
    exports.onFilterChanged = onFilterChanged;
    exports.onPaginate = onPaginate;
});