'use strict';

define('bitbucket/internal/page/pull-request/view/pull-request-view-diff', ['jquery', 'bitbucket/util/state', 'bitbucket/internal/feature/pull-request/pull-request-diff', 'bitbucket/internal/model/page-state'], function ($, state, pullRequestDiffFeature, pageState) {
    //Persist the commit without exposing it in other tabs
    var currentCommit;

    return {
        load: function load(el) {
            var commit = state.getCommit() || currentCommit;
            pageState.setCommit(commit);

            el.innerHTML = bitbucket.internal.feature.pullRequest.diff({
                'commit': commit,
                'repository': state.getRepository()
            });
            pullRequestDiffFeature.init(commit, pageState.getPullRequest(), pageState.getPullRequestViewInternal().maxChanges, pageState.getPullRequestViewInternal().relevantContextLines, pageState.getPullRequestViewInternal().seenCommitReview);
        },
        unload: function unload(el) {
            currentCommit = state.getCommit();
            pageState.setCommit(null);
            return pullRequestDiffFeature.reset().done(function () {
                //Don't empty the el until the promise is done to avoid blowing away any data needed for cleanup
                $(el).empty();
            });
        },
        keyboardShortcutContexts: ['diff-tree', 'diff-view']
    };
});