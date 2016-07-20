define('bitbucket/internal/bbui/reducers/pull-request-reviewers', ['module', 'exports', 'lodash', '../actions/pull-request', '../models/models', '../utils/create-reducer', '../utils/merge-object-in-array', '../utils/replace-state-with-rollback'], function (module, exports, _lodash, _pullRequest, _models, _createReducer2, _mergeObjectInArray, _replaceStateWithRollback) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _createReducer3 = babelHelpers.interopRequireDefault(_createReducer2);

    var _mergeObjectInArray2 = babelHelpers.interopRequireDefault(_mergeObjectInArray);

    var _replaceStateWithRollback2 = babelHelpers.interopRequireDefault(_replaceStateWithRollback);

    var _createReducer;

    exports.default = (0, _createReducer3.default)([], (_createReducer = {}, babelHelpers.defineProperty(_createReducer, _pullRequest.PR_CHANGE_REVIEWER_STATE, function (reviewers, action) {
        var reviewerFinder = function reviewerFinder(reviewer) {
            return action.payload.user && reviewer.user.name === action.payload.user.name;
        };

        return (0, _replaceStateWithRollback2.default)(reviewers, action, {
            forward: function forward() {
                return (0, _mergeObjectInArray2.default)(reviewers, reviewerFinder, { state: action.payload.newState });
            }
        });
    }), babelHelpers.defineProperty(_createReducer, _pullRequest.PR_CHANGE_SELF_REVIEWER, function (reviewers, action) {
        return (0, _replaceStateWithRollback2.default)(reviewers, action, {
            forward: function forward() {
                switch (action.payload.selfAction) {
                    case _models.SelfAction.ADD_SELF:
                        return reviewers.concat([{
                            role: _models.ParticipantRole.REVIEWER,
                            state: _models.ApprovalState.UNAPPROVED,
                            user: action.payload.user
                        }]);
                    case _models.SelfAction.REMOVE_SELF:
                        var reviewersClone = _lodash2.default.extend([], reviewers);
                        return _lodash2.default.remove(reviewersClone, function (reviewer) {
                            return reviewer.user.name !== action.payload.user.name;
                        });
                    default:
                        console.warn('Unknown reviewer action');
                }
            }
        });
    }), _createReducer));
    module.exports = exports['default'];
});