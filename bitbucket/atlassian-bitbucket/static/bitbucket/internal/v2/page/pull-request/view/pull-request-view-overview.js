'use strict';

define('bitbucket/internal/v2/page/pull-request/view/pull-request-view-overview', ['jquery', 'lib/jsuri', 'bitbucket/internal/feature/comments/comment-tips', 'bitbucket/internal/feature/discussion/participants-list', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/events', 'bitbucket/internal/util/scroll', 'bitbucket/internal/util/syntax-highlight', 'bitbucket/internal/v2/feature/pull-request/pull-request-activity'], function ($, Uri, commentTips, ParticipantsList, pageState, events, scrollUtil, syntaxHighlight, PullRequestActivity) {
    var currentEl;
    var activity;
    var participantsList;
    var mergeIsConflicted = false;
    var participants;

    var ActivityType = {
        COMMENT: 'comment',
        ACTIVITY: 'activity'
    };

    function showConflictedMergeBanner(el) {
        var mergeConflictBanner = $(bitbucket.internal.feature.pullRequest.mergeConflictBanner({
            extraClasses: 'transparent'
        })).prependTo(el).find('.manual-merge').click(function (e) {
            e.preventDefault();
            events.trigger('bitbucket.internal.pull-request.show.cant.merge.help');
        }).end();

        setTimeout(function () {
            mergeConflictBanner.removeClass('transparent');
        }, 0); //Let the message get rendered before starting the fade in.
    }

    //noinspection JSUnusedLocalSymbols
    events.on('bitbucket.internal.pull-request.cant.merge', function (pullRequest, conflicted, vetoes) {
        // Show the banner if we haven't already shown it and there are conflicts - not if merge check vetoes are the only thing stopping a merge
        if (!mergeIsConflicted && conflicted && currentEl) {
            // This event will only fire once during a load of the pull request.
            // Save the result in mergeIsConflicted so we can re-display the conflicted banner
            // when the user clicks back to the overview tab from other tabs.
            mergeIsConflicted = true;
            showConflictedMergeBanner(currentEl);
        }
    });

    /**
     * Start up and initialise the PullRequest Activity stream.
     *
     * If there is an activity it gets reset and a freshly rendered list replaces the existing one
     * before creating a new {PullRequestActivity}
     *
     * @param {PullRequest} pullRequest
     * @param {string} fromType
     * @param {string} fromId
     */
    function initPullRequestActivity(pullRequest, fromType, fromId) {
        if (activity instanceof PullRequestActivity) {
            // If there is activity present already, reset and destroy it.
            activity.reset();
            activity = null;

            // Empty the PR Activity list
            var $newList = $(bitbucket.internal.feature.pullRequest.activity({
                id: 'pull-request-activity',
                currentUser: pageState.getCurrentUser() && pageState.getCurrentUser().toJSON(),
                commentTips: commentTips.tips
                // N.B. to only replace the list we need to find it within the content returned by the template.
            })).find('.pull-request-activity');

            getPullRequestActivity$El().replaceWith($newList);
        }

        // Create the new activity stream
        activity = new PullRequestActivity(getPullRequestActivity$El(), pullRequest, fromType, fromId, {
            scrollableElement: window
        });

        activity.init();
    }

    /**
     * Get the PullRequest Activity list by searching for it within the Pull Request overview HTMLElement.
     *
     * @returns {jQuery}
     */
    function getPullRequestActivity$El() {
        return $(currentEl).find('.pull-request-activity');
    }

    /**
     * Find and scroll to a comment or activity item if it can be found.
     *
     * @param {string} type - the type of item to find
     * @param {number|string} id - the id of the activity or comment
     * @returns {boolean} - whether the item was scrolled to (true) or could not be found (false)
     */
    function findAndScrollToActivity(type, id) {
        var $el = $(currentEl);
        var selector = type === ActivityType.COMMENT ? '.comment[data-id="' + id + '"]' : '.activity-item[data-activityid="' + id + '"]';
        var $item = $el.find(selector);

        if (!$item.length) {
            return false;
        }

        // unhighlight any focused items and highlight the new one
        $el.find('.comment.focused, .activity-item.focused').removeClass('focused');
        $item.addClass('focused');
        scrollUtil.scrollTo($item);

        return true;
    }

    /**
     * If a URL change occurs with a new activity/comment id and an activity type then go to the activity item.
     */
    function watchUrlChanges() {
        var activityParams = getActivityParams();

        if (activityParams.id && activityParams.type) {
            if (!findAndScrollToActivity(activityParams.type, activityParams.id)) {
                // If the item can not be found, reload the activity stream with the page that has the relevant item.
                initPullRequestActivity(pageState.getPullRequest(), activityParams.type, activityParams.id);
            }
        }
    }

    /**
     * Get the activity related URL params
     *
     * @returns {{type: string, id: number|string}} - the ID refers to the activity or comment id.
     */
    function getActivityParams() {
        var uri = new Uri(window.location);
        return {
            type: uri.getQueryParamValue('commentId') ? 'comment' : 'activity',
            id: uri.getQueryParamValue('commentId') || uri.getQueryParamValue('activityId')
        };
    }

    return {
        load: function load(el) {
            currentEl = el;

            var pullRequest = pageState.getPullRequest();

            el.innerHTML = bitbucket.internal.page.pullRequest.viewOverview({
                pullRequest: pullRequest.toJSON(),
                author: pullRequest.getAuthor().getUser().toJSON(),
                createdDate: pullRequest.getCreatedDate(),
                description: pullRequest.getDescription(),
                descriptionAsHtml: pullRequest.getDescriptionAsHtml(),
                currentUser: pageState.getCurrentUser() && pageState.getCurrentUser().toJSON(),
                commentTips: commentTips.tips
            });

            syntaxHighlight.container($(el));

            if (mergeIsConflicted) {
                showConflictedMergeBanner(el);
            }

            participants = pullRequest.getParticipants();
            participantsList = new ParticipantsList(participants, $('#participants-dropdown ul'), $('.participants.plugin-item'));

            var activityParams = getActivityParams();

            initPullRequestActivity(pullRequest, activityParams.type, activityParams.id);

            events.on('bitbucket.internal.history.changestate', watchUrlChanges);
        },
        // This is _only_ exposed for the live-update plugin and should _not_ be used for anything else
        _internalActivity: function _internalActivity() {
            return activity;
        },
        unload: function unload(el) {
            activity.reset();
            activity = null;
            $(el).empty();
            currentEl = null;
            participantsList.destroy();
            participantsList = null;
            events.off('bitbucket.internal.history.changestate', watchUrlChanges);
        },
        keyboardShortcutContexts: ['pull-request-overview']
    };
});