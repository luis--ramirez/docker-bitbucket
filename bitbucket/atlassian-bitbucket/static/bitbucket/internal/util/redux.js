'use strict';

define('bitbucket/internal/util/redux', ['redux', 'bitbucket/internal/bbui/utils/promise-middleware', 'bitbucket/internal/bbui/utils/thunk-middleware', 'exports'], function (Redux, promiseMiddleware, thunkMiddleware, exports) {
    'use strict';

    var loggerMiddleware = function loggerMiddleware(store) {
        return function (next) {
            return function (action) {
                console.group(action.type);
                console.log('dispatching', action);
                var result = next(action);
                console.log('next state', JSON.parse(JSON.stringify(store.getState())));
                console.groupEnd(action.type);
                return result;
            };
        };
    };

    var middleware = [thunkMiddleware, promiseMiddleware];
    // if url params has dev=true
    if (/[?&]dev=true($|&)/.test(window.location.search)) {
        middleware.push(loggerMiddleware);
    }

    /**
     * Redux.applyMiddleware will return a middleware enhanced store function
     */
    var createStoreWithMiddleware = Redux.applyMiddleware.apply(null, middleware);

    /**
     * Create a Redux Store with middleware applied by default.
     *
     * @param {Object} reducers - an object of reducers to combine and pass along to the store middleware
     * @param {*} defaultState - the default state/data of the store.
     * @returns {Redux.Store}
     */
    function createStore(reducers, defaultState) {
        reducers = Redux.combineReducers(reducers);
        var store = createStoreWithMiddleware(Redux.createStore);
        return store(reducers, defaultState);
    }

    exports.createStore = createStore;
});