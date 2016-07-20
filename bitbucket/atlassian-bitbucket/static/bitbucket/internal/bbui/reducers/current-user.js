define('bitbucket/internal/bbui/reducers/current-user', ['module', 'exports', '../actions/actions', '../utils/create-reducer'], function (module, exports, _actions, _createReducer2) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _createReducer3 = babelHelpers.interopRequireDefault(_createReducer2);

    exports.default = (0, _createReducer3.default)({}, babelHelpers.defineProperty({}, _actions.SET_CURRENT_USER, function (state, action) {
        return action.payload;
    }));
    module.exports = exports['default'];
});