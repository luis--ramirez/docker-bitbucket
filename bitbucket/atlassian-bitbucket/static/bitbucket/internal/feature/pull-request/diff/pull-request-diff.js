'use strict';

define('bitbucket/internal/feature/pull-request/pull-request-diff', ['aui', 'chaperone', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/commit/tree-and-diff-view', 'bitbucket/internal/feature/file-content/commit-selector', 'bitbucket/internal/feature/pull-request/pull-request-history', 'bitbucket/internal/layout/page-scrolling-manager', 'bitbucket/internal/model/commit-range', 'bitbucket/internal/model/file-content-modes', 'bitbucket/internal/model/path-and-line', 'bitbucket/internal/model/revision', 'bitbucket/internal/util/events', 'bitbucket/internal/util/history', 'exports'], function (AJS, Chaperone, $, _, nav, treeAndDiffView, CommitSelector, pullRequestHistory, pageScrollingManager, CommitRange, FileContentModes, PathAndLine, Revision, events, history, exports) {

    'use strict';

    var COMMITSELECTOR_CSS_SELECTOR = '.file-tree-container .commit-selector-button';

    var commitCommentRESTUrlBuilder = function commitCommentRESTUrlBuilder(commit, pullRequest) {
        return function () {
            return nav.rest().currentRepo().commit(commit.id).comments().withParams({ pullRequestId: pullRequest.getId() });
        };
    };

    var commitDiffRESTUrlBuilder = function commitDiffRESTUrlBuilder(pullRequest) {
        return function (fileChange) {
            return nav.rest().currentRepo().commit(fileChange.commitRange).diff(fileChange).withParams({ pullRequestId: pullRequest.getId() });
        };
    };

    var commitSelectorItemUrl = function commitSelectorItemUrl(pullRequest) {
        return function (commit) {
            return nav.currentRepo().pullRequest(pullRequest).commit(commit.id).build();
        };
    };

    var pullRequestCommentRESTUrlBuilder = function pullRequestCommentRESTUrlBuilder(pullRequest) {
        return function () {
            return nav.rest().currentRepo().pullRequest(pullRequest.getId()).comments();
        };
    };

    var pullRequestDiffRESTUrlBuilder = function pullRequestDiffRESTUrlBuilder(pullRequest) {
        return function (fileChange) {
            return nav.rest().currentRepo().pullRequest(pullRequest.getId()).diff(fileChange);
        };
    };

    var pullRequestDiffUrl = function pullRequestDiffUrl(pullRequest) {
        return nav.currentRepo().pullRequest(pullRequest.getId()).diff().build();
    };

    var getTreeAndDiffViewOptions = function getTreeAndDiffViewOptions(commit, pullRequest, maxChanges, relevantContextLines) {
        var commentUrlBuilder = void 0;
        var diffUrlBuilder = void 0;
        var toolbarWebFragmentLocationPrimary = void 0;
        var toolbarWebFragmentLocationSecondary = void 0;

        if (commit) {
            commentUrlBuilder = commitCommentRESTUrlBuilder(commit, pullRequest);
            diffUrlBuilder = commitDiffRESTUrlBuilder(pullRequest);
            toolbarWebFragmentLocationPrimary = 'bitbucket.pull-request.commit.diff.toolbar.primary';
            toolbarWebFragmentLocationSecondary = 'bitbucket.pull-request.commit.diff.toolbar.secondary';
        } else {
            commentUrlBuilder = pullRequestCommentRESTUrlBuilder(pullRequest);
            diffUrlBuilder = pullRequestDiffRESTUrlBuilder(pullRequest);
            toolbarWebFragmentLocationPrimary = 'bitbucket.pull-request.diff.toolbar.primary';
            toolbarWebFragmentLocationSecondary = 'bitbucket.pull-request.diff.toolbar.secondary';
        }

        return {
            changesUrlBuilder: function changesUrlBuilder(start, limit, commitRange) {
                return nav.rest().currentRepo().changes(commit ? new CommitRange({ // strip the PR from it if it's a commit
                    untilRevision: commitRange.getUntilRevision(),
                    sinceRevision: commitRange.getSinceRevision()
                }) : commitRange).withParams({ start: start, limit: limit, pullRequestId: pullRequest.getId() });
            },
            commentMode: treeAndDiffView.commentMode.CREATE_NEW,
            commentUrlBuilder: commentUrlBuilder,
            diffUrlBuilder: diffUrlBuilder,
            linkToCommit: Boolean(commit),
            maxChanges: maxChanges,
            relevantContextLines: relevantContextLines,
            toolbarWebFragmentLocationPrimary: toolbarWebFragmentLocationPrimary,
            toolbarWebFragmentLocationSecondary: toolbarWebFragmentLocationSecondary
        };
    };

    /**
     * Initialise feature discovery for Commit Level Review
     */
    var initCommitLevelReviewFeatureDiscovery = _.once(function () {
        Chaperone.registerFeature('commit-level-review', [{
            id: 'commit-level-review',
            alignment: 'right top',
            selector: COMMITSELECTOR_CSS_SELECTOR,
            content: bitbucket.internal.feature.pullRequest.commitLevelReviewFeatureDiscoveryContent(),
            width: 300,
            close: {
                text: AJS.I18n.getText("bitbucket.web.got.it")
            },
            moreInfo: {
                href: bitbucket_help_url('bitbucket.help.pull.request'),
                text: AJS.I18n.getText('bitbucket.web.pullrequest.learn.more'),
                extraAttributes: {
                    target: "_blank"
                }
            },
            once: true
        }]);
        events.on("bitbucket.internal.layout.pull-request.urlRequested", Chaperone.checkFeatureVisibility);
    });

    var _destroyables = [];
    exports.init = function (commit, pullRequest, maxChanges, relevantContextLines, seenCommitReview) {
        var _this = this;

        if (!seenCommitReview) {
            initCommitLevelReviewFeatureDiscovery();
        }

        var initForCommit = function initForCommit(commit) {
            var commitRange = void 0;
            if (commit) {
                commitRange = new CommitRange({
                    pullRequest: pullRequest,
                    untilRevision: new Revision(commit),
                    sinceRevision: commit.parents ? new Revision(commit.parents[0]) : undefined
                });

                // Analytics event: stash.client.pullRequest.commitDiff.view
                events.trigger('bitbucket.internal.feature.pullRequest.commitDiff.view');
            } else {
                commitRange = new CommitRange({ pullRequest: pullRequest });
            }

            treeAndDiffView.reset();
            treeAndDiffView.init(commitRange, getTreeAndDiffViewOptions(commit, pullRequest, maxChanges, relevantContextLines));
            _this.commitSelector.init({
                updateButton: true,
                selectedCommit: commit,
                preloadItems: [{
                    selected: !commit,
                    content: bitbucket.internal.feature.fileContent.commitSelectorAllChanges({
                        href: pullRequestDiffUrl(pullRequest),
                        message: AJS.I18n.getText('bitbucket.web.diff.all.changes.displayed')
                    })
                }],
                itemTemplate: bitbucket.internal.feature.fileContent.commitSelectorItemMessage,
                itemUrl: commitSelectorItemUrl(pullRequest),
                lastPageMessage: AJS.I18n.getText('bitbucket.web.pullrequest.diff.no.more.commits'),
                mode: FileContentModes.DIFF,
                path: new PathAndLine(decodeURI(window.location.hash.substring(1))),
                pullRequest: pullRequest
            });
        };

        _destroyables.push(events.chain().on('bitbucket.internal.keyboard.shortcuts.pullrequest.addCommentHandler', function (keys) {
            (this.execute ? this : AJS.whenIType(keys)).execute(function () {
                $('.add-file-comment-trigger:first').click();
            });
        }).on('bitbucket.internal.feature.commitselector.commitSelected', function (commit, pullRequest) {
            var url = commit ? commitSelectorItemUrl(pullRequest)(commit) : pullRequestDiffUrl(pullRequest);
            history.pushState({ commit: commit }, null, url);
        }).on('bitbucket.internal.history.changestate', function (e) {
            if (e.state) {
                initForCommit(e.state.commit);
            }
        }));

        this.commitSelector = new CommitSelector({
            buttonEl: COMMITSELECTOR_CSS_SELECTOR,
            id: 'commit-selector'
        });

        _destroyables.push(this.commitSelector);

        pullRequestHistory.init();
        _destroyables.push({ destroy: function destroy() {
                return pullRequestHistory.reset();
            } });
        _destroyables.push({ destroy: function destroy() {
                return treeAndDiffView.reset();
            } });
        _destroyables.push({ destroy: pageScrollingManager.acceptScrollForwardingRequests() });

        history.initialState({ commit: commit });

        initForCommit(commit);
    };

    exports.reset = function () {
        var done = $.when.apply($, babelHelpers.toConsumableArray(_.invoke(_destroyables, 'destroy')));
        _destroyables = [];
        return done;
    };

    $(document).on('click', '.file-tree a', function (e) {
        var data = {
            'index': this.id.match(/\d+/),
            'keyboard': !(e.originalEvent instanceof MouseEvent)
        };
        // Analytics event: stash.client.pullRequest.diff.fileChange
        events.trigger('bitbucket.internal.feature.pullRequest.diff.fileChange', null, data);
    });
});