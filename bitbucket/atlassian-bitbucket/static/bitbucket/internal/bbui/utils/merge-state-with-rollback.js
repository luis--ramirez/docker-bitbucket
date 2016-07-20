define('bitbucket/internal/bbui/utils/merge-state-with-rollback', ['module', 'exports'], function (module, exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = mergeStateWithRollback;
    /**
     * Optimistically merges new state with existing state while
     * allowing for rollbacks and commits
     *
     * @param {Object} state The current state of the store
     * @param {Object} action The action that was triggered
     * @param {Object} options The action lifecycle mutation functions
     * @param {Function} options.forward Function which returns state
     * object to be merged with current state immediately after
     * action is triggered
     * @param {Function} options.back Function which returns state
     * object to be merged with current state in the case of an error
     * from server
     * @param {Function} [options.commit] Function which returns state
     * object to be merged with current state upon success response
     * from server
     *
     * @returns {Object} New state object
     */
    function mergeStateWithRollback(state, action, _ref) {
        var forward = _ref.forward;
        var back = _ref.back;
        var commit = _ref.commit;

        if (!action.hasOwnProperty('meta')) {
            return state;
        } else if (!action.meta.isPending && action.payload && action.payload.error) {
            return babelHelpers.extends({}, state, back());
        } else if (action.meta.isPending) {
            return babelHelpers.extends({}, state, forward());
        }

        if (commit) {
            return babelHelpers.extends({}, state, commit());
        }

        return state;
    }
    module.exports = exports['default'];
});