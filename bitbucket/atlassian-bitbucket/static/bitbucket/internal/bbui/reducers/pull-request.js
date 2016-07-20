define('bitbucket/internal/bbui/reducers/pull-request', ['module', 'exports', 'lodash', 'redux', '../actions/pull-request', '../models/models', './noop', './pull-request-can-merge', './pull-request-reviewers', './pull-request-watch'], function (module, exports, _lodash, _redux, _pullRequest, _models, _noop, _pullRequestCanMerge, _pullRequestReviewers, _pullRequestWatch) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    exports.default = function (state, action) {
        var newState = state;
        if (action.type === _pullRequest.PR_SET_PULL_REQUEST) {
            newState = _lodash2.default.assign(state, action.payload);
        }
        return combined(newState, action);
    };

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _noop2 = babelHelpers.interopRequireDefault(_noop);

    var _pullRequestCanMerge2 = babelHelpers.interopRequireDefault(_pullRequestCanMerge);

    var _pullRequestReviewers2 = babelHelpers.interopRequireDefault(_pullRequestReviewers);

    var _pullRequestWatch2 = babelHelpers.interopRequireDefault(_pullRequestWatch);

    // eslint-disable-line camelcase

    var reducers = {};

    // We add noopReducers for pull request properties so that redux does not complain about unknown keys.
    Object.keys(_models.pull_request).concat(['_stash']).forEach(function (key) {
        reducers[key] = _noop2.default;
    });

    var combined = (0, _redux.combineReducers)(babelHelpers.extends({}, reducers, {
        reviewers: _pullRequestReviewers2.default,
        mergeable: _pullRequestCanMerge2.default,
        isWatching: _pullRequestWatch2.default
    }));

    module.exports = exports['default'];
});