'use strict';

define('bitbucket/internal/v2/feature/pull-request/action-creators/change-self-reviewer', ['bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/util/server', 'bitbucket/internal/bbui/actions/pull-request', 'bitbucket/internal/bbui/models/models', 'bitbucket/internal/model-transformer', 'bitbucket/internal/util/analytics'], function (events, nav, server, Actions, models, transformer, analytics) {

    'use strict';

    return function (pullRequest, user, addOrRemoveSelf, currentUserStatus) {
        var added = addOrRemoveSelf === 'ADD_SELF';
        var stashPullRequest = pullRequest._stash;
        var stashRepo = stashPullRequest.toRef.repository;
        var stashProject = stashRepo.project;
        var stashUser = user._stash;

        var request = server.rest({
            type: added ? 'POST' : 'DELETE',
            url: nav.rest().project(stashProject).repo(stashRepo).pullRequest(stashPullRequest).participants(added ? null : stashUser).build(),
            data: added ? { user: user, role: 'reviewer' } : null
        }).done(function () {
            events.trigger(added ? 'bitbucket.internal.feature.pullRequest.self.added' : 'bitbucket.internal.feature.pullRequest.self.removed', null, {
                action: addOrRemoveSelf,
                user: stashUser,
                pullRequest: stashPullRequest
            });

            var analyticsEventName = 'pullRequest.' + (addOrRemoveSelf === models.SelfAction.ADD_SELF ? 'addSelf' : 'removeSelf');
            var analyticsData = {
                'userStatus': currentUserStatus || models.ApprovalState.UNAPPROVED,
                'pullRequest.fromRef.repository.id': pullRequest.from_ref.repository.id,
                'pullRequest.id': pullRequest.id,
                'pullRequest.toRef.repository.id': pullRequest.to_ref.repository.id
            };
            analytics.add(analyticsEventName, analyticsData, true);
        });

        return {
            type: Actions.PR_CHANGE_SELF_REVIEWER,
            payload: {
                pullRequest: pullRequest,
                user: user,
                selfAction: addOrRemoveSelf
            },
            meta: {
                promise: request.then(function (result) {
                    return {
                        pullRequest: pullRequest,
                        user: result ? transformer.user(result.user) : null,
                        selfAction: addOrRemoveSelf
                    };
                })
            }
        };
    };
});