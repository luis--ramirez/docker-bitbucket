'use strict';

define('bitbucket/internal/v2/feature/pull-request/action-creators/change-reviewer-status', ['lodash', 'bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/util/server', 'bitbucket/internal/bbui/actions/pull-request', 'bitbucket/internal/bbui/models/models', 'bitbucket/internal/model-transformer'], function (_, events, nav, server, Actions, models, transformer) {

    'use strict';

    // Can be removed when activity items are handled by BBUI

    function legacyEvents(options) {
        function fireEvent(eventName, approved) {
            events.trigger(eventName, null, _.merge(options, { approved: approved }));
        }

        if (options.newStatus !== models.ApprovalState.APPROVED && options.oldStatus !== models.ApprovalState.APPROVED) {
            // no change to approval - just fire needs work event
            options.request.then(function () {
                var added = options.newStatus === models.ApprovalState.NEEDS_WORK;
                fireEvent('bitbucket.internal.widget.needs-work.' + (added ? 'added' : 'removed'), added);
            });
            return;
        }

        var approving = options.newStatus === models.ApprovalState.APPROVED;
        var eventMap = approving ? { ing: 'bitbucket.internal.widget.approve-button.adding',
            ed: 'bitbucket.internal.widget.approve-button.added',
            failed: 'bitbucket.internal.widget.approve-button.add.failed' } : { ing: 'bitbucket.internal.widget.approve-button.removing',
            ed: 'bitbucket.internal.widget.approve-button.removed',
            failed: 'bitbucket.internal.widget.approve-button.remove.failed' };

        fireEvent(eventMap.ing, approving);
        options.request.then(function () {
            fireEvent(eventMap.ed, approving);
        }, function () {
            fireEvent(eventMap.failed, !approving);
        });
    }

    return function (options) {
        var stashPullRequest = options.pullRequest._stash;
        var stashRepo = stashPullRequest.toRef.repository;
        var stashProject = stashRepo.project;
        var stashUser = options.user._stash;

        var request = server.rest({
            type: 'PUT',
            url: nav.rest().project(stashProject).repo(stashRepo).pullRequest(stashPullRequest).participants(stashUser).withParams({
                avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' })
            }).build(),
            data: { status: options.newStatus }
        });

        options = _.merge(options, { request: request,
            prId: Number(stashPullRequest.id),
            user: stashUser });
        legacyEvents(options);

        return {
            type: Actions.PR_CHANGE_REVIEWER_STATE,
            payload: {
                pullRequest: options.pullRequest,
                user: options.user,
                newState: options.newStatus
            },
            meta: {
                promise: request.then(function (result) {
                    events.trigger('bitbucket.internal.feature.pullRequest.reviewerStatus.changed', null, {
                        pullRequest: stashPullRequest,
                        user: result.user,
                        newState: result.status,
                        oldState: options.oldStatus
                    });
                    return {
                        pullRequest: options.pullRequest,
                        user: transformer.user(result.user),
                        newState: result.status
                    };
                })
            }
        };
    };
});