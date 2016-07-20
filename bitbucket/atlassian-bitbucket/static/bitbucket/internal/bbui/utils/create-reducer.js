define("bitbucket/internal/bbui/utils/create-reducer", ["module", "exports"], function (module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = createReducer;
    /**
     * Helper function for creating Redux reducers which allows us
     * to avoid using big switch-case statements and instead add
     * action listeners using object keys.
     *
     * @param {Object} initialState initial state for this reducer
     * @param {Object} handlers object where key is the action, and value is the reducer function for that action
     * @returns {Object} updated state
     */
    function createReducer(initialState, handlers) {
        return function () {
            var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
            var action = arguments[1];

            if (handlers[action.type]) {
                return handlers[action.type](state, action);
            }
            return state;
        };
    }
    module.exports = exports["default"];
});