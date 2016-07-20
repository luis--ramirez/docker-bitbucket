'use strict';

define('bitbucket/internal/util/math', ['lodash', 'exports'],
/**
 * Math utils
 *
 * @exports bitbucket/internal/util/math
 */
function (_, exports) {

    'use strict';

    /**
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */

    function multiply(a, b) {
        return a * b;
    }

    /**
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */
    function add(a, b) {
        return a + b;
    }

    /**
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */
    function lessThan(a, b) {
        return a < b;
    }

    /**
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */
    function greaterThan(a, b) {
        return a > b;
    }

    /**
     * @param {number} a
     * @returns {boolean}
     */
    function isPositive(a) {
        return a > 0;
    }

    /**
     * @param {number} a
     * @returns {boolean}
     */
    function isNegative(a) {
        return a < 0;
    }

    /**
     * Normalise a number to no higher than the `cutoff`
     * @param {number} cutoff
     *
     * @example
     * [-2, -1, 0, 1, 2].map(math.lowPass(0)) // => [-2, -1, 0, 0, 0]
     *
     * @returns {Function}
     */
    function lowPass(cutoff) {
        return function (a) {
            return Math.min(cutoff, a);
        };
    }

    /**
     * Normalise a number to no lower than the `cutoff`
     * @param {number} cutoff
     *
     * @example
     * [-2, -1, 0, 1, 2].map(math.highPass(0)) // => [0, 0, 0, 1, 2]
     *
     * @returns {Function}
     */
    function highPass(cutoff) {
        return function (a) {
            return Math.max(cutoff, a);
        };
    }

    /**
     * Normalise a number to no lower than the `min` and no higher than `max`
     * @param {number} min
     * @param {number} max
     *
     * @example
     * [-2, -1, 0, 1, 2].map(math.clamp(-1, 1)) //=> [-1, -1, 0, 1, 1]
     *
     * @returns {Function}
     */
    function clamp(min, max) {
        return _.compose(highPass(min), lowPass(max));
    }

    /**
     * Create a Point object that can be used to indicate coordinates/position
     * @param {number} x
     * @param {number} y
     * @returns {Point}
     * @constructor
     */
    function Point(x, y) {
        if (!(this instanceof Point)) {
            return new Point(x, y);
        }

        this.x = x;
        this.y = y;
    }

    /**
     * Create a Size object that can be used to indicate a 2D measurement of a thing
     * @param {number} width
     * @param {number} height
     * @returns {Size}
     * @constructor
     */
    function Size(width, height) {
        if (!(this instanceof Size)) {
            return new Size(width, height);
        }

        this.width = width;
        this.height = height;
    }

    exports.add = add;
    exports.clamp = clamp;
    exports.greaterThan = greaterThan;
    exports.highPass = highPass;
    exports.isNegative = isNegative;
    exports.isPositive = isPositive;
    exports.lowPass = lowPass;
    exports.lessThan = lessThan;
    exports.multiply = multiply;
    exports.Point = Point;
    exports.Size = Size;
});