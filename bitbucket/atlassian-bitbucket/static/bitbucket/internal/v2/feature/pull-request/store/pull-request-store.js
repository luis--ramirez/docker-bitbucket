'use strict';

define('bitbucket/internal/v2/feature/pull-request/store/pull-request-store', ['bitbucket/internal/bbui/reducers/current-user', 'bitbucket/internal/bbui/reducers/pull-request', 'bitbucket/internal/util/redux'], function (currentUserReducer, pullRequestReducer, reduxUtil) {

    'use strict';

    return function (defaultState) {
        return reduxUtil.createStore({
            pullRequest: pullRequestReducer,
            currentUser: currentUserReducer
        }, defaultState);
    };
});