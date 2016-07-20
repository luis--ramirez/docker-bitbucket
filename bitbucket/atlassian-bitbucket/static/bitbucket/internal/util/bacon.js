'use strict';

define('bitbucket/internal/util/bacon', ['bacon', 'jquery', 'lodash', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/util/performance', 'exports'], function (Bacon, $, _, events, fn, performance, exports) {

    'use strict';

    /**
     * Listens for Stash events and return them as a Bacon stream.
     *
     * @param name of the event
     * @returns {Bacon<*>}
     */

    exports.events = function on(name) {
        return Bacon.fromBinder(function (sink) {
            return events.chain().on(name, sink).destroy;
        });
    };

    /**
     * Split a stream into arrays based on a function callback.
     * Note that this doesn't group all elements in the stream, just <i>adjacent</i> ones.
     *
     * https://github.com/baconjs/bacon.js/issues/144
     *
     * @param stream {Bacon}
     * @param f {function} callback function that returns the value from the stream to be split on
     * @returns {Bacon}
     */
    exports.split = function split(stream, f) {
        return Bacon.fromBinder(function (sink) {
            var values = [];
            var lastValue;
            var callbacks = [];
            callbacks.push(stream.onValue(function (value) {
                var newValue = f(value);
                if (lastValue && newValue !== lastValue) {
                    sink(values);
                    values = [];
                }
                lastValue = newValue;
                values.push(value);
            }));
            // Flush any remaining values at the end of the stream so we don't miss anything
            callbacks.push(stream.onEnd(function () {
                if (values.length > 0) {
                    sink(values);
                }
                sink(new Bacon.End());
            }));
            return _.partial(fn.applyAll, callbacks);
        });
    };

    /**
     * Converts a bacon stream to an array (usually for testing).
     *
     * @param stream {Bacon}
     * @returns {Array} of the all values in the stream
     */
    exports.toArray = function toArray(stream) {
        var values = [];
        stream.onValue(function (value) {
            values.push(value);
        });
        return values;
    };

    /**
     * Returns a Bacon property that describes the window scroll position, with each element shaped like {{ left:number, top:number }}
     *
     * @type function
     * @returns {Bacon.Property}
     */
    exports.getWindowScrollProperty = _.once(function () {
        var $window = $(window);
        function getWindowScroll() {
            return {
                left: $window.scrollLeft(),
                top: $window.scrollTop()
            };
        }
        var windowScroll = Bacon.fromBinder(function (sink) {
            var enqueue = performance.enqueueCapped(requestAnimationFrame, sink);
            // ensure there is a trailing scroll event by debouncing an enqueue call
            // by more than one animation frame
            var debouncedEnqueue = _.debounce(enqueue, 20);
            $window.on('scroll', enqueue).on('scroll', debouncedEnqueue);
            return function () {
                $window.off('scroll', enqueue).off('scroll', debouncedEnqueue);
            };
        }).map(getWindowScroll).skipDuplicates(function (a, b) {
            return a.left === b.left && a.top === b.top;
        }).toProperty(getWindowScroll());

        // This is a hack to ensure that the window scroll property continues to update when when things are not
        // listening to it. This ensure that the page wont jump around when you switch between things that are
        // controlled by the browsers native scrolling and fake scrolling.
        windowScroll.onValue($.noop);
        return windowScroll;
    });

    /**
     * Returns a Bacon property that describes the window size, with each element shaped like {{ width:number, height:number }}
     *
     * @type function
     * @returns {Bacon.Property}
     */
    exports.getWindowSizeProperty = _.once(function () {
        var $window = $(window);
        var windowSizeProperty = Bacon.fromBinder(function (sink) {
            var boundEvents = events.chain().on('window.resize', function (w, h) {
                sink(new Bacon.Next({
                    width: w,
                    height: h
                }));
            });
            return function () {
                boundEvents.destroy();
            };
        }).toProperty({
            width: $window.width(),
            height: $window.height()
        });

        // This is a hack to ensure that the window size property continues to update when when things are not
        // listening to it. This ensure that the page wont jump around when you switch between things that are
        // controlled by the browsers native scrolling and fake scrolling.
        windowSizeProperty.onValue($.noop);
        return windowSizeProperty;
    });

    /**
     * Given a Bacon stream, take all the elements that occur between the first occurrence of two elements.
     *
     * If start and end are the same element, we return 0 or 1 element, depending in whether start/end is found in the stream
     * and depending on whether `inclusive` is set for either one.
     *
     * @param {Bacon.EventStream} stream - the stream to filter
     * @param {Object} options - describes the limits
     * @param {*} options.start - the starting element
     * @param {*} options.end - the ending element
     * @param {boolean} [options.startInclusive=false] - whether the start element should be included in the resulting stream
     * @param {boolean} [options.endInclusive=false] - whether the end element should be included in the resulting stream
     * @param {Function} [options.equals] - a function to use for equality comparison. Default is ===
     * @returns {Bacon.EventStream}
     */
    exports.takeBetween = function takeBetween(stream, options) {
        var start = options.start;
        var end = options.end;
        var startInclusive = options.startInclusive;
        var endInclusive = options.endInclusive;
        var equals = options.equals || function (a, b) {
            return a === b;
        };

        if (equals(start, end)) {
            if (startInclusive || endInclusive) {
                return stream.skipWhile(function (item) {
                    return !equals(item, start);
                }).take(1);
            }
            return Bacon.never();
        }

        var foundStart;
        var foundEnd;
        return stream.skipWhile(function (item) {
            if (foundEnd || foundStart) {
                return false;
            }

            if (equals(item, start)) {
                foundStart = true;
                return !startInclusive;
            }
            if (equals(item, end)) {
                foundEnd = true;
                return !endInclusive;
            }

            return true;
        }).takeWhile(function (item) {
            if (equals(item, start)) {
                foundStart = true;
                return startInclusive;
            }
            if (equals(item, end)) {
                foundEnd = true;
                return endInclusive;
            }
            return !(foundEnd && foundStart);
        });
    };
});