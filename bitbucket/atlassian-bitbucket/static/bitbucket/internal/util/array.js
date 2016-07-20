'use strict';

define('bitbucket/internal/util/array', ['lodash', 'bitbucket/internal/util/function', 'exports'], function (_, fn, exports) {
    'use strict';

    /**
     * Find an index for the first item in the array where a given predicate returns truthy, or -1 if no item returns truthy
     * @param {function(*, number, Array):boolean} fn - predicate
     * @returns {function(Array):number} index where the predicate first returned truthy
     */

    function findIndex(fn) {
        return function (array) {
            for (var i = 0; i < array.length; i++) {
                if (fn(array[i], i, array)) {
                    return i;
                }
            }
            return -1;
        };
    }

    /**
     * Slice an array starting at (inclusive) the point where a predicate first returns truthy
     * @param {function(*, number, Array):boolean} fn - predicate
     * @returns {function(Array) : Array}
     */
    function skipUntil(fn) {
        return function (array) {
            var i = findIndex(fn)(array);
            return i === -1 ? [] : array.slice(i);
        };
    }

    /**
     * Slice an array until (exclusive) the point where a predicate first returns truthy
     * @param {function(*, number, Array):boolean} fn - predicate
     * @returns {function(Array) : Array}
     */
    function takeUntil(fn) {
        return function (array) {
            var i = findIndex(fn)(array);
            return i === -1 ? array : array.slice(0, i);
        };
    }

    exports.findIndex = findIndex;
    exports.skipUntil = skipUntil;
    /**
     * Slice an array starting at (inclusive) the point where a predicate first returns falsy
     * @function
     * @param {function(*, number, Array):boolean} fn - predicate
     * @returns {function(Array) : Array}
     */
    exports.skipWhile = _.compose(skipUntil, fn.not);
    exports.takeUntil = takeUntil;

    /**
     * Slice an array until (exclusive) the point where a predicate first returns falsy
     * @param {function(*, number, Array):boolean} fn - predicate
     * @returns {function(Array) : Array}
     */
    exports.takeWhile = _.compose(takeUntil, fn.not);
});