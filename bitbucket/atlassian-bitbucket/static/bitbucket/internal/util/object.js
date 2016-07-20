'use strict';

define('bitbucket/internal/util/object', ['lodash', 'exports'], function (_, exports) {
    function identity(a) {
        return a;
    }

    var has = Object.prototype.hasOwnProperty;

    /**
     * Cast a thing to a string.
     *
     * @param {*} thing
     * @returns {string}
     */
    function stringVal(thing) {
        if ((typeof thing === 'undefined' ? 'undefined' : babelHelpers.typeof(thing)) === 'object') {
            return JSON.stringify(thing);
        } else {
            return String(thing);
        }
    }

    /**
     * Given an array of objects, return a new array of objects that has duplicates removed
     * based on the given properties that define the uniqueness of an object.
     *
     * If also comparing non-primitives then Objects will converted using `JSON.stringify()`,
     * everything will be cast using String().
     *
     * @param {Array<object>} array
     * @param {Array<string>} props
     * @param {boolean}       [alsoCompareNonPrimitives]
     */
    exports.uniqueFromArray = function (array, props, alsoCompareNonPrimitives) {
        var i;
        var s;
        var propsLen = props.length;
        var val = alsoCompareNonPrimitives ? stringVal : identity;

        return _.uniq(array, function (item) {
            for (i = 0, s = ''; i < propsLen; i++) {
                s += val(item[props[i]]);
            }
            return s;
        });
    };

    /**
     * Calls Object.freeze in browsers that support freezing
     *
     * @function
     */
    exports.freeze = Object.freeze || identity;

    /**
     * Recursively calls Object.freeze in browsers that support freezing
     *
     * @function
     * @param {*} o - the object to recursively freeze
     * @param {boolean} [refreezeFrozen=false] - When true, will recurse through the properties of any objects that are
     *                                           already frozen. When false, will stop at the frozen object. The former
     *                                           may hit a stack overflow if there are circular references, and the latter
     *                                           may leave sub-objects unfrozen.
     */
    exports.deepFreeze = !Object.freeze ? identity : function deepFreeze(o, refreezeFrozen) {
        if (o !== null && (typeof o === 'undefined' ? 'undefined' : babelHelpers.typeof(o)) === 'object') {
            var isFrozen = Object.isFrozen(o);
            if (!isFrozen) {
                Object.freeze(o);
            }
            if (!isFrozen || refreezeFrozen) {
                for (var k in o) {
                    if (has.call(o, k)) {
                        deepFreeze(o[k]);
                    }
                }
            }
        }
        return o;
    };

    /**
     * Inherit the prototype methods from a constructor in to another object. The prototype of constructor
     * will be set to a new object created from superConstructor.
     *
     * @param {Object} constructor - One Object with a prototype
     * @param {Object} superConstructor - Another Object with a prototype
     *
     * @example
     *     function AnotherThing() {}
     *     Anotherthing.prototype.foo = 'foo';
     *
     *     function Thing() {}
     *     obj.inherits(Thing, AnotherThing);
     *
     *     //Thing.prototype.foo === 'foo';
     */
    exports.inherits = function (constructor, superConstructor) {
        constructor.prototype = Object.create(superConstructor.prototype);
        Object.defineProperty(constructor.prototype, 'constructor', {
            value: constructor,
            configurable: true,
            writable: true,
            enumerable: false
        });
    };
});