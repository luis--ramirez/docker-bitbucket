define('bitbucket/internal/bbui/utils/replace-state-with-rollback', ['module', 'exports'], function (module, exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = replaceStateWithRollback;
    /**
     * Optimistically returns new state while allowing for rollbacks and commits - this is designed for use with
     * non-object based state, where the mutation functions should apply the correct mutation to the state
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
    var rollbackStates = {};

    function replaceStateWithRollback(state, action, _ref) {
        var forward = _ref.forward;
        var back = _ref.back;
        var commit = _ref.commit;

        if (!action.hasOwnProperty('meta')) {
            return state;
        }

        if (action.meta.isPending) {
            // save old state during optimistic update
            rollbackStates[action.meta.actionId] = state;
            return forward();
        }

        if (action.payload && action.payload.error) {
            var oldState = rollbackStates[action.meta.actionId];
            // delete ref to old state if there IS an error
            delete rollbackStates[action.meta.actionId];
            return back ? back(oldState) : oldState;
        }

        // delete ref to old state if there's NO error
        delete rollbackStates[action.meta.actionId];

        if (commit) {
            return commit();
        }

        return state;
    }
    module.exports = exports['default'];
});