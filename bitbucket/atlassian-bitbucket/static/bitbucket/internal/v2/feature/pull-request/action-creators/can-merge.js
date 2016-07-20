'use strict';

define('bitbucket/internal/v2/feature/pull-request/action-creators/can-merge', ['bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/util/server', 'bitbucket/internal/bbui/actions/pull-request', 'bitbucket/internal/model/page-state'], function (events, nav, server, Actions, pageState) {

    'use strict';

    return function (pullRequest) {
        pullRequest = pullRequest || pageState.getPullRequest();

        var request = server.rest({
            url: nav.rest().currentRepo().pullRequest(pullRequest.getId()).merge().build(),
            type: 'GET'
        });

        return {
            type: Actions.PR_CHECK_MERGEABILITY,
            payload: null,
            meta: {
                promise: request.then(function (data) {
                    events.trigger(data.canMerge ? 'bitbucket.internal.pull-request.can.merge' : 'bitbucket.internal.pull-request.cant.merge', null, pullRequest, data.conflicted, data.vetoes, data.properties);
                    return data;
                })
            }
        };
    };
});