define('bitbucket/internal/bbui/reducers/pull-request-watch', ['module', 'exports', '../actions/pull-request', '../utils/create-reducer', '../utils/replace-state-with-rollback'], function (module, exports, _pullRequest, _createReducer2, _replaceStateWithRollback) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _createReducer3 = babelHelpers.interopRequireDefault(_createReducer2);

    var _replaceStateWithRollback2 = babelHelpers.interopRequireDefault(_replaceStateWithRollback);

    var _createReducer;

    exports.default = (0, _createReducer3.default)(false, (_createReducer = {}, babelHelpers.defineProperty(_createReducer, _pullRequest.PR_WATCH, function (state, action) {
        return (0, _replaceStateWithRollback2.default)(state, action, {
            forward: function forward() {
                return action.payload;
            }
        });
    }), babelHelpers.defineProperty(_createReducer, _pullRequest.PR_SET_IS_WATCHING, function (state, action) {
        return action.payload;
    }), _createReducer));
    module.exports = exports['default'];
});