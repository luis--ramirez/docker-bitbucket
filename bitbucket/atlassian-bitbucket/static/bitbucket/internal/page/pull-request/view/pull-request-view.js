'use strict';

define('bitbucket/internal/page/pull-request/pull-request-view', ['aui', 'aui/flag', 'bitbucket/internal/layout/pull-request', 'bitbucket/internal/model/page-state', 'exports'], function (AJS, auiFlag, pullRequestLayout, pageState, exports) {

    exports.registerHandler = pullRequestLayout.registerHandler;

    exports.onReady = function (unwatched) {
        if (unwatched) {
            auiFlag({
                type: 'success',
                title: AJS.I18n.getText('bitbucket.web.pullrequest.unwatched.header', pageState.getPullRequest().getId()),
                close: 'auto',
                body: AJS.I18n.getText('bitbucket.web.pullrequest.unwatched.content')
            });
        }
    };
});