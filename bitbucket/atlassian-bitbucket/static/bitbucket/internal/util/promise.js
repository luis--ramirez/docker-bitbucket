'use strict';

define('bitbucket/internal/util/promise', ['jquery', 'lodash', 'exports'], function ($, _, exports) {

    'use strict';

    var state = {
        PENDING: 'pending',
        REJECTED: 'rejected',
        RESOLVED: 'resolved'
    };

    function maybeAbort(abortable) {
        abortable && abortable.abort && abortable.abort();
    }

    function reduce() /*...promises*/{
        var promises = Array.prototype.slice.call(arguments);
        var promise = $.when.apply($, promises);
        promise.abort = function () {
            _.forEach(promises, maybeAbort);
        };
        return promise;
    }

    function noAbort() {
        console.log("Promise does not have an abort function");
    }

    /**
     * Return an abortable promise that combines multiple sub promises.
     * When abort is called ont he output promise, all the input promises are aborted (if they support abort).
     *
     * @returns {{then: Function, abort: Function, thenAbortable: Function}}
     */
    function whenAbortable() /*...promises*/{
        var combinedPromise = $.when.apply($, arguments);
        combinedPromise.abort = _.invoke.bind(_, arguments, 'abort');
        return thenAbortable(combinedPromise);
    }

    /**
     * Add `abort` to a promise chain that _tries_ to abort (advisory only). If either the initial promise or the promise returned from the `then` callbacks
     * has an `abort` method, it will be called. If not, abort will do it's best: the callbacks won't be called if `abort()`
     * was called while the initial promise is executing, and the result will parrot back the result of the initial promise.
     *
     * @param {Promise} promise
     * @param {Function} [successCallback]
     * @param {Function} [failureCallback]
     * @returns {{ then: Function, abort: Function, thenAbortable: Function }}
     */
    function thenAbortable(promise, successCallback, failureCallback) {
        var aborted;
        var abortable = promise;
        var onAbort = $.Callbacks();

        var out = {};

        function doAbort() {
            if (out.state() === 'pending') {
                // don't call abort if we're already resolved/rejected
                if (!aborted) {
                    // don't call abort more than once
                    maybeAbort(abortable);
                }
                aborted = true;
            }
            // always fire the onAbort event
            // This lets us abort a thenAbortable chain from the root:

            // var deferred = $.Deferred().resolve();
            // var root = thenAbortable(deferred);
            // var tertiary = root.thenAbortable(something).thenAbortable(other);
            // root.state() === 'resolved'
            // tertiary.state() === 'pending'
            // root.abort(); // should still try to abort tertiary, even though root is resolved.
            onAbort.fire();
        }

        function abortableCallback(resolveOrReject, callback) {
            return function () {
                if (aborted) {
                    return new $.Deferred()[resolveOrReject + 'With'](this, arguments);
                }
                abortable = callback.apply(this, arguments);
                return abortable;
            };
        }

        var outPromise = promise.then(successCallback ? abortableCallback('resolve', successCallback) : null, failureCallback ? abortableCallback('reject', failureCallback) : null);

        out.abort = doAbort;
        out.thenAbortable = function (successCallback, failureCallback) {
            var newAbortable = thenAbortable(out, successCallback, failureCallback);
            onAbort.add(newAbortable.abort);
            return newAbortable;
        };
        return outPromise.promise(out);
    }

    /**
     * Returns a function that will return a delayed promise that is `abort`able and `reset`able. This allows you to
     * implement things like debounced promise resolution.
     *
     * Calling abort during the delay will avoid having the internal promise created at all.
     * Calling reset will reset the delay to `interval` and wait longer before creating the internal promise.
     *
     * @param {Function} promiseFactory - a function that will return a promise when called.
     * @param {number} interval - how long to delay the promise
     * @returns {Function}
     */
    function delay(promiseFactory, interval) {
        return function () {
            var defer = $.Deferred();
            var self = this;
            var args = Array.prototype.slice.call(arguments);
            var _abort;
            var createTimeout = function createTimeout() {
                return setTimeout(function () {
                    var originalPromise = promiseFactory.apply(self, args);
                    // Don't use .then() because it returns a new promise without xhr's abort function
                    originalPromise.done(defer.resolve).fail(defer.reject);
                    _abort = originalPromise.abort ? _.bind(originalPromise.abort, originalPromise) : noAbort;
                }, interval);
            };
            var timeout = createTimeout();

            _abort = function abort() {
                clearTimeout(timeout);
                defer.reject(defer, 'abort', 'abort');
            };

            return defer.promise({
                abort: function abort() {
                    _abort();
                },
                /**
                 * Resets the timeout so that the promise will be delayed by another `interval`. Also resets the
                 * arguments the promiseFactory will be called with, by the arguments passed to this function.
                 * Calling this does nothing if the timeout has already expired, or if the promise has been aborted.
                 * By calling this repeatedly you can simulate a promise that is "debounced" by `interval`.
                 */
                reset: function reset() {
                    if (defer.state() === 'pending') {
                        clearTimeout(timeout);
                        args = Array.prototype.slice.call(arguments);
                        timeout = createTimeout();
                    }
                }
            });
        };
    }

    /**
     * Works like $.when, but waits for all promises to finish, regardless of any resolutions or rejects.
     * The resulting promise will use the `this` param of the first rejected promise, or the first promise if none are rejected.
     *
     * @param {...Promise} promises - promises to be combined into a single promise
     * @returns {Promise}
     */
    function settle() /*...promises*/{
        return $.when.apply($, _.map(arguments, _alwaysResolve)).then(_extractOriginalPromises, _extractOriginalPromises);
    }

    /**
     * @private
     */
    function _alwaysResolve(promise) {
        return promise.then(_saveCallParams(false), _saveCallParams(true));
    }

    /**
     * Paired with _extractOriginalPromises. Returns a promise that represents the result of the original promise
     *
     * @param {boolean} isRejected
     * @returns {Function}
     * @private
     */
    function _saveCallParams(isRejected) {
        return function () {
            return $.Deferred().resolve({
                rejectedSelf: isRejected && this,
                self: this,
                args: Array.prototype.slice.call(arguments)
            });
        };
    }

    /**
     * Paired with _saveCallParams. Extracts the promise results from a list of promises.
     * Uses the `this` from the first rejected promise, or the first promise if no promise is rejected.
     * Returns a Promise that represents all results.
     *
     * @returns {Promise}
     * @private
     */
    function _extractOriginalPromises() /*...promises*/{
        var rejectedSelf = _.chain(arguments).pluck('rejectedSelf').find(_.identity).value();
        var resolution = (rejectedSelf ? 'reject' : 'resolve') + 'With';
        var self = rejectedSelf || arguments[0].self;
        var args = _.pluck(arguments, 'args');
        return $.Deferred()[resolution](self, args);
    }

    /**
     * Display a spinner while the promise is pending.
     *
     * @param {string|HTMLElement|jQuery} selector - where to place the spinner
     * @param {Promise} promise - spin while this is pending
     * @param {string} size - size of the spinner
     * @param {object} opts - extra options to pass to spin()
     * @param {boolean} keep - true if the element should not be removed when the promise completes
     * @returns {Promise}
     */
    function spinner(selector, promise, size, opts, keep) {
        var $spinner = $(selector).spin(size || 'small', opts || {});
        return promise.always(function () {
            keep ? $spinner.spinStop() : $spinner.remove();
        });
    }

    /**
     * Display a spinner whenever there are promises pending.
     * Allows for adding promises to the collection at any point via the returned `add` method.
     * @param {string|HTMLElement|jQuery} selector - where to place the spinner
     * @param {Promise} promise - optional first promise to add
     * @param {string} size - size of the spinner
     * @returns {{add: add}}
     */
    function rollingSpinner(selector, promise, size) {
        size = size || 'small';
        var accumulativePromise;
        var $spinner = $(selector);

        /**
         * Add promises to the collection
         */
        function add() /*promises*/{
            var promises = Array.prototype.slice.call(arguments);

            if (!promises.length) {
                return;
            }

            $spinner.spin(size).addClass('spinning');
            //Create a new accumulative promise by combining the old one with the new promises
            accumulativePromise = settle.apply(null, _.compact(promises.concat(accumulativePromise)));
            accumulativePromise.always(function () {
                if (accumulativePromise.state() !== state.PENDING) {
                    // There's been no further promises added
                    $spinner.spinStop().removeClass('spinning');
                }
            });
        }

        promise && add(promise);

        return {
            add: add
        };
    }

    /**
     * Creates deferred to wait for predicate to accomplish
     *
     * @param {object}   opts - extra options, incl. `interval`, `timeout` and `name`
     * @param {function} opts.predicate - Function which return truthy if wait should be ended
     * @param {number}   [opts.timeout=10000]
     * @param {number}   [opts.interval=100]
     * @param {string}   [opts.name]
     *
     * @return {Promise}
     */
    function waitFor(opts) {
        var deferred = $.Deferred();
        var defaultOpts = {
            timeout: 10000, // 10s default timeout
            interval: 100, // 100ms poll interval default
            name: '',
            predicate: $.noop
        };

        opts = $.extend(defaultOpts, opts);
        var end = new Date().getTime() + opts.timeout;
        var intervalId = setInterval(function () {
            var predicateResult = opts.predicate();
            if (predicateResult) {
                clearInterval(intervalId);
                deferred.resolve(predicateResult);
            } else if (new Date().getTime() > end) {
                clearInterval(intervalId);
                deferred.reject("Predicate '" + opts.name + "' was false after " + opts.timeout + "ms");
            }
        }, opts.interval);

        return deferred.promise();
    }

    exports.state = state;
    exports.delay = delay;
    exports.reduce = reduce;
    exports.settle = settle;
    exports.spinner = spinner;
    exports.rollingSpinner = rollingSpinner;
    exports.thenAbortable = thenAbortable;
    exports.whenAbortable = whenAbortable;
    exports.waitFor = waitFor;
});