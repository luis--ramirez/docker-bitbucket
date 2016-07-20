define('bitbucket/internal/bbui/reducers/pull-request-can-merge', ['module', 'exports', 'lodash', '../actions/pull-request', '../pull-request-header/actions', '../utils/create-reducer', '../utils/merge-state-with-rollback'], function (module, exports, _lodash, _pullRequest, _actions, _createReducer2, _mergeStateWithRollback) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _createReducer3 = babelHelpers.interopRequireDefault(_createReducer2);

    var _mergeStateWithRollback2 = babelHelpers.interopRequireDefault(_mergeStateWithRollback);

    var _createReducer;

    var defaultState = {
        canMerge: false,
        conflicted: null,
        vetoes: null,
        properties: null,
        isChecking: false,
        showDialog: false
    };

    exports.default = (0, _createReducer3.default)(defaultState, (_createReducer = {}, babelHelpers.defineProperty(_createReducer, _pullRequest.PR_CHECK_MERGEABILITY, function (state, action) {
        return (0, _mergeStateWithRollback2.default)(state, action, {
            forward: function forward() {
                return {
                    isChecking: true
                };
            },
            commit: function commit() {
                return babelHelpers.extends({}, action.payload, {
                    isChecking: false
                });
            }
        });
    }), babelHelpers.defineProperty(_createReducer, _actions.PR_SHOW_MERGE_ERRORS, function (state, action) {
        return _lodash2.default.assign({}, state, {
            showDialog: true
        });
    }), babelHelpers.defineProperty(_createReducer, _actions.PR_HIDE_MERGE_ERRORS, function (state, action) {
        return _lodash2.default.assign({}, state, {
            showDialog: false
        });
    }), _createReducer));
    module.exports = exports['default'];
});