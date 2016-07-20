define('bitbucket/internal/bbui/utils/merge-object-in-array', ['module', 'exports', 'lodash'], function (module, exports, _lodash) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = mergeObjectInArray;

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    /**
     * Uses a finder function to locate an object in an array, and then merges another object into that object, returning
     * a new copy of the array with the merged object
     *
     * @param {Array} array the array to search within
     * @param {Function} finder the function to use to find the target object in the array
     * @param {Object} objectToMerge the object to merge into the target object
     * @returns {Array} copy of the source array with new target object with new object merged in
     */
    function mergeObjectInArray(array, finder, objectToMerge) {
        var index = _lodash2.default.findIndex(array, finder);
        if (index === -1) {
            return array;
        }

        return [].concat(babelHelpers.toConsumableArray(array.slice(0, index)), [_lodash2.default.assign({}, array[index], objectToMerge)], babelHelpers.toConsumableArray(array.slice(index + 1)));
    }
    module.exports = exports['default'];
});