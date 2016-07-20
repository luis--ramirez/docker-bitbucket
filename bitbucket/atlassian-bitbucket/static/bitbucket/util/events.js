'use strict';

/**
 * Provides methods for handling events fired by Stash, and for triggering your own events.
 *
 * **This module is available synchronously.**
 *
 * **Web Resource:** com.atlassian.bitbucket.server.bitbucket-web-api:events
 *
 * @namespace bitbucket/util/events
 */
define('bitbucket/util/events', ['eve'],
/**
 * @exports bitbucket/util/events
 */
function (eve) {

    'use strict';

    /**
     * A utility object allowing you to attach handlers to multiple events and detach them all at once.
     *
     * NOTE: The constructor is not exposed. Use {@linkcode bitbucket/util/events.chain} or {@linkcode bitbucket/util/events.chainWith}
     * to obtain an instance.
     *
     * @class EventChain
     * @memberof bitbucket/util/events
     */

    /**
     * An interface for objects that accept event handlers. Used with {@linkcode bitbucket/util/events.chainWith}.
     *
     * @typedef {Object} EventProducer
     * @memberof bitbucket/util/events
     * @property {bitbucket/util/events.EventProducerOn} on - Accept an event listener who will be called when an event occurs.
     * @property {bitbucket/util/events.EventProducerOff} off - Detach an event listener who will no longer be called when an event occurs.
     */

    /**
     * @callback EventProducerOn
     * @memberof bitbucket/util/events
     * @param {string} eventName - The type of event to attach the listener to.
     * @param {function} eventListener - The listener to attach.
     */

    /**
     * @callback EventProducerOff
     * @memberof bitbucket/util/events
     * @param {string} eventName - The type of event to detach the listener from.
     * @param {function} eventListener - The listener to detach.
     */

    var events = {
        /**
         * Trigger a global event.
         *
         * @memberOf bitbucket/util/events
         *
         * @param {string} eventName - The name of the event to fire. This should be a '.'-delimited namespace.
         * @param {Object} context - The context to fire the event with. Handlers will be called with the context as `this`.
         * Any further params will be used as arguments to the handlers.
         */
        trigger: function trigger(eventName, context /*, ...args*/) {
            return eve.apply(this, arguments);
        },
        /**
         * Call a function every time an event is fired.
         *
         * @memberOf bitbucket/util/events
         *
         * @param {string} eventName - The name of the event to handle. This should be a '.'-delimited namespace.
         *                           You can replace any component of the namespace with a '*' for wildcard matching.
         * @param {function} fn - The handler function to call when the event is fired.
         */
        on: function on(eventName, fn) {
            return eve.on(eventName, fn);
        },
        /**
         * Stop calling a function when an event is fired. The function is assumed to have previously been passed to
         * `.on` or `.once`
         *
         * @memberOf bitbucket/util/events
         *
         * @param {string} eventName - The name of the event to stop handling. This should be a '.'-delimited namespace.
         *                           You can replace any component of the namespace with a '*' for wildcard matching.
         * @param {function} fn - The handler function to stop calling when the event is fired.
         */
        off: function off(eventName, fn) {
            return eve.off(eventName, fn);
        },
        /**
         * Call a function the first time an event is fired.
         *
         * @memberOf bitbucket/util/events
         *
         * @param {string} eventName - The name of the event to handle once. This should be a '.'-delimited namespace.
         *                           You can replace any component of the namespace with a '*' for wildcard matching.
         * @param {function} fn - The handler function to call the first time the event is fired.
         */
        once: function once(eventName, fn) {
            return eve.once(eventName, fn);
        },
        /**
         * Return all handlers that would be triggered when an event is fired.
         *
         * @memberOf bitbucket/util/events
         *
         * @param {string} eventName - The name of the event to return handlers for.
         * @return {Array.<function>} - An array of handler functions.
         */
        listeners: function listeners(eventName) {
            return eve.listeners(eventName);
        },
        /**
         * Determine the current event name or whether the current event name includes a specific sub-name.
         *
         * @memberOf bitbucket/util/events
         *
         * @param {string=} subname - The sub-name to search for in the current event name (optional).
         * @return {string|boolean} Either returns the name of the currently firing event, or if a sub-name is passed in
         *                          it instead returns whether this event includes that sub-name.
         */
        name: function name(subname) {
            return eve.nt(subname);
        },
        /**
         * Creates an event object that tracks all listeners and provides a convenience function {@linkcode bitbucket/util/events.EventChain#destroy}
         * that will stop listening to all events in the chain, rather than manually having to call {@linkcode bitbucket/util/events.off}
         * again.
         *
         * @memberOf bitbucket/util/events
         *
         * @example
         *     var chain = events.chain().on('a', callback).on('b', callback);
         *     ...
         *     chain.destroy();
         *
         * @returns {bitbucket/util/events.EventChain}
         */
        chain: function chain() {
            return this.chainWith(this);
        },
        /**
         * Works exactly like {@linkcode bitbucket/util/events.chain}, but allows you to specify your own
         * event producer to attach and detach listeners on. The event producer must conform to the
         * {@linkcode bitbucket/util/events.EventProducer} interface.
         *
         * @memberOf bitbucket/util/events
         *
         * @example
         *     var chain = events.chainWith($('.something')).on('a', callback).on('b', callback);
         *     ...
         *     chain.destroy();
         *
         * @param {bitbucket/util/events.EventProducer} that - An object on which to attach/detach event listeners.
         * @returns {bitbucket/util/events.EventChain}
         */
        chainWith: function chainWith(that) {
            var listeners = [];
            var eventChain =
            /**
             * @lends bitbucket/util/events.EventChain.prototype
             */
            {
                /**
                 * @param {string} eventName - The type of event to attach the listener to.
                 * @param {function} eventListener - The listener to attach.
                 * @returns {bitbucket/util/events.EventChain}
                 */
                on: function on(eventName, eventListener) {
                    var args = arguments;
                    that.on.apply(that, args);
                    listeners.push(function () {
                        that.off.apply(that, args);
                    });
                    return this;
                },
                /**
                 * Handle the first time an event is fired.
                 *
                 * @param {string} eventName - The type of event to attach the listener to.
                 * @param {function} eventListener - The listener to attach.
                 * @returns {bitbucket/util/events.EventChain}
                 */
                once: function once(eventName, eventListener) {
                    var listener = function listener() {
                        that.off(eventName, listener);
                        return eventListener.apply(this, arguments);
                    };
                    that.on(eventName, listener);
                    listeners.push(function () {
                        that.off(eventName, listener);
                    });
                    return this;
                },
                /**
                 * Destroy the event chain and detach all listeners. The chain should not be used after calling this method.
                 */
                destroy: function destroy() {
                    // I would use map except that I want to avoid dependencies
                    for (var i = 0; i < listeners.length; i++) {
                        listeners[i]();
                    }
                    // Just in case someone wants to keep using it
                    listeners = [];
                }
            };

            return eventChain;
        }
    };

    return events;
});