'use strict';

define('bitbucket/internal/util/events', ['backbone', 'eve', 'lodash', 'bitbucket/util/events'], function (Backbone, eve, _, eventsApi) {

    'use strict';

    var eventsNonApi = {
        /**
         * Call this method to stop propagation of the currently firing event.
         */
        stop: function stop() {
            return eve.stop();
        },
        /**
         * Create an event mixin similar to Backbone.Events which also triggers events in the global event bus.
         *
         * Prototypes which are extended with a mixin
         *
         * @param {String} namespace the namespace to use when cascading local events to global events
         * @param {Object} [options] mixin options.
         * @param {boolean} [options.localOnly] whether the event should only be fired locally
         * @returns {Backbone.Events} an event mixin which can be used to extend any prototype
         */
        createEventMixin: function createEventMixin(namespace, options) {
            options = options || {};
            return _.extend({}, Backbone.Events, {
                /**
                 * @param {String} eventName
                 */
                trigger: function trigger(eventName /*, ...args */) {
                    // Trigger local events before global events
                    var result = Backbone.Events.trigger.apply(this, arguments);
                    if (!options.localOnly) {
                        eventsApi.trigger.apply(eventsApi, [namespace + '/' + eventName, this].concat(Array.prototype.slice.call(arguments, 1)));
                    }
                    return result;
                },
                /**
                 * Listen for the specified local events triggered by `that` and retrigger them from `this`.
                 * Uses `chainWith` internally so it returns a destroyable.
                 *
                 * @param {{on: Function, off: Function}} that
                 * @returns {{on: Function, destroy: Function}}
                 */
                retriggerFrom: function retriggerFrom(that /*, eventName1, eventName2...*/) {
                    var eventNames = Array.prototype.slice.call(arguments, 1);

                    function retrigger(eventable, eventName) {
                        return eventable.on(eventName, this.trigger.bind(this, eventName));
                    }

                    return eventNames.reduce(retrigger.bind(this), eventsApi.chainWith(that));
                }
            });
        },
        /**
         * Convenience method for the very common 'localOnly' use of createEventMixin
         * @returns {Backbone.Events}
         */
        createLocalEventMixin: function createLocalEventMixin() {
            return eventsNonApi.createEventMixin(null, { localOnly: true });
        },
        /**
         * Add local and global events to the supplied `thing`
         * @param {Object}  thing - the thing to extend
         * @param {Object}  [options] mixin options.
         * @param {boolean} [options.localOnly] whether the event should only be fired locally
         */
        addEventMixin: function addEventMixin(thing, namespace, options) {
            _.extend(thing, eventsNonApi.createEventMixin(namespace, options));
        },
        /**
         * Add local events to the supplied `thing`
         * @param {Object}  thing - the thing to extend
         */
        addLocalEventMixin: function addLocalEventMixin(thing) {
            _.extend(thing, eventsNonApi.createLocalEventMixin());
        }
    };

    return _.extend(eventsNonApi, eventsApi);
});