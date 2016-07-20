'use strict';

define('bitbucket/internal/page/pull-request/view/pull-request-view-commits', ['jquery', 'bitbucket/internal/feature/pull-request/pull-request-commits', 'bitbucket/internal/model/page-state'], function ($, pullRequestCommitsFeature, pageState) {
    return {
        load: function load(el) {
            return pullRequestCommitsFeature.init({
                el: el,
                commitsTableWebSections: pageState.getPullRequestViewInternal().commitsTableWebSections,
                pullRequest: pageState.getPullRequest(),
                repository: pageState.getRepository()
            });
        },
        unload: function unload(el) {
            pullRequestCommitsFeature.reset();
            $(el).empty();
        },
        keyboardShortcutContexts: ['commits']
    };
});