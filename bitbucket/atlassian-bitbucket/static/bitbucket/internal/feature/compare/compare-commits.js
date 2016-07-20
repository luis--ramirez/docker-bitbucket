'use strict';

define('bitbucket/internal/feature/compare/compare-commits', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/commits/commits-table', 'bitbucket/internal/util/bacon'], function (AJS, $, _, nav, CommitsTable, bacon) {

    'use strict';

    /**
     * Get a builder to build the URL used to fetch the list of commits.
     *
     * @param {SourceTargetSelector} sourceTargetSelector the UI component used to pick the source branch and repository
     * @returns {bitbucket/util/navbuilder.Builder} a builder to build the URL used to fetch the list of commits
     * @private
     */

    function getCommitsUrlBuilder(sourceTargetSelector) {
        var sourceRepo = sourceTargetSelector.getSourceRepository();
        return nav.project(sourceRepo.getProject()).repo(sourceRepo).commits().withParams({
            until: sourceTargetSelector.getSourceBranch().getLatestCommit(),
            since: sourceTargetSelector.getTargetBranch().getLatestCommit(),
            secondaryRepositoryId: sourceTargetSelector.getTargetRepository().getId()
        });
    }

    return function onReady(commitsTableWebSections) {
        var keyboardRegisterEvent = bacon.events('bitbucket.internal.widget.keyboard-shortcuts.register-contexts');
        return function renderCompareCommits(sourceTargetSelector, $el) {
            var $table = $(bitbucket.internal.feature.compare.commits({
                repository: sourceTargetSelector.getSourceRepository().toJSON(),
                commitsTableWebSections: commitsTableWebSections
            }));

            $el.append($table);

            var commitsTable = new CommitsTable(_.partial(getCommitsUrlBuilder, sourceTargetSelector), {
                target: $table,
                webSections: commitsTableWebSections,
                allFetchedMessageHtml: AJS.I18n.getText('bitbucket.web.repository.compare.allcommitsfetched'),
                noneFoundMessageHtml: AJS.I18n.getText('bitbucket.web.repository.compare.nocommitsfetched')
            });

            commitsTable.init({ suspended: true }).done(function () {
                commitsTable.resume();
            });

            var keyboardDestroy = keyboardRegisterEvent.onValue(function (keyboardShortcuts) {
                keyboardShortcuts.enableContext('commits');
            });
            commitsTable.bindKeyboardShortcuts();

            return function () {
                keyboardDestroy();
                commitsTable.destroy();
            };
        };
    };
});