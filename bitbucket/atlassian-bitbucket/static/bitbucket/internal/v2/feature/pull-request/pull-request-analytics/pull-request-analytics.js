'use strict';

define('bitbucket/internal/v2/feature/pull-request/analytics', ['jquery', 'bitbucket/util/events', 'bitbucket/util/state', 'bitbucket/internal/util/analytics', 'exports'], function ($, events, pageState, analytics, exports) {

    'use strict';

    /**
     * Get the role of the current user in the pull request
     *
     * @returns {string}
     */

    function getUserRole() {
        var userRole;
        if (isPRAuthor()) {
            userRole = 'author';
        } else if (isPRReviewer()) {
            userRole = 'reviewer';
        } else if (isPRParticipant()) {
            userRole = 'participant';
        } else {
            userRole = 'other';
        }
        return userRole;
    }

    /**
     * @param {string} eventName
     */
    function handleEventFireAnalytics(eventName) {
        events.on(eventName, function (data) {
            var analyticsName = eventName.substring("bitbucket.internal.feature.".length);
            if (eventName.match(/comment.actions.reply|comment.actions.view/)) {
                analyticsName = eventName.substring("bitbucket.internal.feature.pullRequest.".length);
            }
            var baseAttributes = {
                'pullRequest.id': pageState.getPullRequest().id,
                'repository.id': pageState.getRepository().id,
                'userRole': getUserRole()
            };
            var analyticsData = $.extend({}, baseAttributes, data);
            analytics.add(analyticsName, analyticsData, true);
        });
    }

    function init() {
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.comment.actions.reply');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.comment.actions.view');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.commit.open');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.commitDiff.view');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.diff.fileChange');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.overview.comment.delete.clicked');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.overview.comment.edit.clicked');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.overview.comment.like.clicked');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.overview.comment.open');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.overview.comment.reply.clicked');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.overview.comment.task.clicked');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.overview.commit.open');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.tab.commits');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.tab.diff');
        handleEventFireAnalytics('bitbucket.internal.feature.pullRequest.tab.overview');
    }

    /**
     * Is the current user the PR owner
     *
     * @returns {boolean}
     */
    function isPRAuthor() {
        return pageState.getCurrentUser().id === pageState.getPullRequest().author.user.id;
    }

    /**
     * Is the current user a PR reviewer
     *
     * @returns {boolean}
     */
    function isPRReviewer() {
        var reviewers = pageState.getPullRequest().reviewers;
        return reviewers.length && reviewers.some(function (reviewer) {
            return reviewer.user.id === pageState.getCurrentUser().id;
        });
    }

    /**
     * Is the current user a PR participant
     *
     * @returns {boolean}
     */
    function isPRParticipant() {
        var participants = pageState.getPullRequest().participants;
        return participants.length && participants.some(function (participant) {
            return participant.user.id === pageState.getCurrentUser().id;
        });
    }

    exports.init = init;
});