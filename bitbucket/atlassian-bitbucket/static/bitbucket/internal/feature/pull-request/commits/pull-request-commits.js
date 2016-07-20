'use strict';

define('bitbucket/internal/feature/pull-request/pull-request-commits', ['aui', 'jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/commits/commits-table', 'bitbucket/internal/util/events', 'bitbucket/internal/util/history', 'exports'], function (AJS, $, nav, CommitsTable, events, history, exports) {
    var pullRequestId;
    var commitsTable;

    function getCommitsUrlBuilder() {
        var builder = nav.currentRepo().pullRequest(pullRequestId).commits();

        return builder;
    }

    exports.init = function (options) {

        pullRequestId = options.pullRequest.getId();

        var $table = $(bitbucket.internal.feature.pullRequest.commits({
            repository: options.repository.toJSON(),
            commitsTableWebSections: options.commitsTableWebSections
        }));

        // HACK: We keep the table out of the DOM until it's fully initialized (for UX reasons).
        // HACK: To avoid multiple pages being loaded because of this, we suspend the commits table, and
        // HACK: resume once the table is in the DOM.
        // HACK: $fakeParent is required because paged-table adds a spinner as a sibling.
        var $fakeParent = $('<div />').append($table);

        commitsTable = new CommitsTable(getCommitsUrlBuilder, {
            target: $table,
            webSections: options.commitsTableWebSections,
            allCommitsFetchedMessage: AJS.I18n.getText('bitbucket.web.pullrequest.allcommitsfetched')
        });

        // HACK: see note on $fakeParent above.
        $(options.el).append(commitsTable.$spinner);

        // HACK: see note on $fakeParent above.
        var promise = commitsTable.init({ suspended: true }).done(function () {
            $(options.el).prepend($fakeParent.children());
            commitsTable.resume();
        });

        commitsTable.bindKeyboardShortcuts();

        $(document).on('click', '.commits-table a.commitid', function (e) {
            // Analytics event: stash.client.pullRequest.commit.open
            events.trigger('bitbucket.internal.feature.pullRequest.commit.open');
            var commitJSON = $(e.target).closest('tr').attr('data-commit-json');
            if (commitJSON) {
                // we have enough information to pushState
                history.pushState({
                    commit: JSON.parse(commitJSON)
                }, null, e.target.href);
                e.preventDefault();
            }
            // else let it naturally page pop
        });

        return promise;
    };

    exports.reset = function () {
        commitsTable.destroy();
        commitsTable = null;
    };
});