define('bitbucket/internal/bbui/utils/promise-middleware', ['module', 'exports', 'lodash'], function (module, exports, _lodash) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = promiseMiddleware;


    /**
     * Redux middleware for handling asynchronous actions
     * @returns {Function} Promise middleware for Redux
     */
    function promiseMiddleware(_ref) {
        var dispatch = _ref.dispatch;

        return function (next) {
            return function (action) {
                var meta = action.meta;


                if (!meta || !meta.promise) {
                    return next(action);
                }

                // Generate a unique ID for the action to easily tie
                // subsequent success and error actions to their original
                // action
                var actionId = Number((0, _lodash.uniqueId)());

                // Attach status and ID to action object
                function makeAction(payload, isPending) {
                    var newAction = babelHelpers.extends({}, action, {
                        payload: payload,
                        meta: babelHelpers.extends({}, meta, {
                            actionId: actionId,
                            isPending: isPending
                        })
                    });
                    delete newAction.meta.promise;
                    return newAction;
                }

                // Dispatch actions immediately, on success, and on error
                dispatch(makeAction(action.payload, true));
                return meta.promise.then(function (result) {
                    return dispatch(makeAction(result, false));
                }, function (error) {
                    return dispatch(makeAction({ error: error }, false));
                });
            };
        };
    }
    module.exports = exports['default'];
});