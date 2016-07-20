'use strict';

/**
 * This module holds functions for improving the performance of JS code.
 * Currently it contains queueDOMRead and queueDOMWrite, which can be used to ensure all DOM reads are executed at
 * once, and all DOM writes are executed at once to avoid reflows that occur when reads and writes are interleaved.
 *
 * See also: http://www.stubbornella.org/content/2009/03/27/reflows-repaints-css-performance-making-your-javascript-slow/
 */
define('bitbucket/internal/util/performance', ['jquery'], function ($) {

    'use strict';

    /**
     * This creates a queue of function callbacks. When the first callback is added (using the queue function),
     * the whole queue is registered to be invoked as soon as the current JS event loop finishes executing
     * (with a setTimeout(...,0)). If any other callbacks get registered in the meantime, they'll all be executed right
     * after the first one. Then the queue will reset itself to empty and await the next callback to be added. The
     * queue takes in a callback (executedCallback) that will be called whenever the queue is executed and reset.
     *
     * You can also force immediate queue execution without waiting for the setTimeout (forceExecute). Below I use
     * this to avoid superfluous setTimeouts. If the Read queue executes, it will call the Write queue immediately
     * afterwards, which will call the Read queue in case anything was added during the Write callbacks, and so forth
     * until there are no more new callbacks being added to either queue.
     * @param {Function} executedCallback - a callback which will be called whenever the queue is executed.
     * @return {Object}
     */

    function getDelayedExecutionQueue(name, executedCallback) {
        var _queue = new $.Callbacks();
        var executing = false;
        var pendingExecution = null;

        function execute() {
            pendingExecution = null;
            executing = true;

            // execute all the pending callbacks
            _queue.fire();
            // reset the queue
            _queue = new $.Callbacks();

            executing = false;

            // call the callback since we just executed the queue.
            executedCallback();
        }

        return {
            // Helps with testing
            name: name,
            /**
             * If there are callbacks scheduled to be executed, remove the scheduled execution, execute them now
             * and reset the queue.
             */
            forceExecute: function forceExecute() {
                if (pendingExecution) {
                    clearTimeout(pendingExecution);
                    execute();
                }
            },
            /**
             * Add a callback to the queue. If there is no scheduled execution for the queue, schedule one.
             * @param fn {Function} the callback to add
             */
            queue: function queue(fn) {
                if (executing) {
                    // if we're currently executing, there is no harm executing this immediately.
                    fn();
                } else {
                    // otherwise, add it to the queue for executing later.
                    _queue.add(fn);

                    if (!pendingExecution) {
                        // if there isn't an execution scheduled yet, schedule one.
                        pendingExecution = setTimeout(execute, 0);
                    }
                }
            }
        };
    }

    // create a separate queue for DOM reads and DOM writes. Avoid the overhead of setTimeout by forcing immediate
    // execution of the partner queue when all your own callbacks have finished.
    var DOMReadQueue = getDelayedExecutionQueue('READ', function () {
        DOMWriteQueue.forceExecute();
    });
    var DOMWriteQueue = getDelayedExecutionQueue('WRITE', function () {
        DOMReadQueue.forceExecute();
    });

    /**
     * Returns a function that ensures that no more than `opt_queueMax` callbacks are pending at any time. This is useful
     * to ensure that multiple calls don't build up in the queue.
     *
     * @example
     *
     * $(window).on('scroll', enqueueCapped(requestAnimationFrame, somethingExpensive));
     *
     * @param {Function} queuingFn - A function that accepts functions to execute.
     * @param {Function} queuedFn - The function that should be enqueued.
     * @param {number} [opt_queueMax=1] - The maximum number of pending executions before further enqueue requests are ignored.
     * @returns {Function}
     */
    function enqueueCapped(queuingFn, queuedFn, opt_queueMax) {
        opt_queueMax = opt_queueMax || 1;
        var waiting = 0;
        return function enqueue() {
            if (waiting >= opt_queueMax) {
                return;
            }
            waiting++;

            queuingFn(function dequeue() {
                try {
                    return queuedFn.apply(this, arguments);
                } finally {
                    waiting--;
                }
            });
        };
    }

    /**
     * Return a function that will async map through items in the input array, returning a promise that will resolve
     * to the output array when it's complete.
     *
     * The batch size is adaptive, but you can set min and max values to constrain it.
     *
     * We return a Deferred rather than a Promise. You can reject or resolve the deferred yourself and no more batches will run.
     *
     * @param {Function} fn - iterator
     * @param {Object} [batchLimits]
     * @param {number} [batchLimits.initial=500]
     * @param {number} [batchLimits.min=10]
     * @param {number} [batchLimits.max=Infinity]
     * @param {Function} [runBatch] - if you want to run the batch in a wrapper function
     * @returns {Function}
     */
    function frameBatchedMap(fn, batchLimits, runBatch) {
        batchLimits = $.extend({
            initial: 500,
            min: 10,
            max: Infinity
        }, batchLimits);

        runBatch = runBatch || function (fn) {
            fn();
        };
        function clamp(n) {
            return Math.min(batchLimits.max, Math.max(batchLimits.min, n));
        }
        return function (arr) {
            var batchSize = batchLimits.initial;
            var deferred = $.Deferred();

            var i = 0;
            var out = [];

            function singleBatch() {
                for (var end = Math.min(i + batchSize, arr.length); i < end; i++) {
                    out[i] = fn(arr[i]);
                }
            }

            requestAnimationFrame(function loop() {
                if (deferred.state() !== 'pending') {
                    return;
                }

                var start = new Date().getTime();
                runBatch(singleBatch);
                var end = new Date().getTime();

                var timeSpent = end - start;
                // adjust so the next batch takes 15ms
                // Assumes each item takes the same amount of time
                // batchSize / timeSpent == newBatchSize / 15ms
                // newBatchSize = 15 * batchSize / timeSpent
                // We use ceil to get an integer out of it (that isn't 0)
                // We clamp this within the requested min/max limits
                batchSize = clamp(Math.ceil(batchSize * (15 / timeSpent)));

                if (i === arr.length) {
                    deferred.resolve(out);
                } else {
                    requestAnimationFrame(loop);
                }
            });

            return deferred;
        };
    }

    return {
        queueDOMRead: DOMReadQueue.queue.bind(DOMReadQueue),
        queueDOMWrite: DOMWriteQueue.queue.bind(DOMWriteQueue),
        enqueueCapped: enqueueCapped,
        frameBatchedMap: frameBatchedMap
    };
});