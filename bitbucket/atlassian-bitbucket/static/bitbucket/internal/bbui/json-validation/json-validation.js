define('bitbucket/internal/bbui/json-validation/json-validation', ['module', 'exports', 'lodash'], function (module, exports, _lodash) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = validator;

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    /**
     * Throw an error with the given message and indicate that it is related
     * to validating the passed property, if any.
     *
     * @param {string} errorMessage error message
     * @param {string?} property property the error relates to
     */
    function throwErrorForProp(errorMessage, property) {
        var propertyMessage = '';
        if (property) {
            propertyMessage = 'For property: "' + property + '". ';
        }
        throw new Error('' + propertyMessage + errorMessage);
    }

    /**
     * Maybe create a namepath prefix string if the passed property name is not falsy
     *
     * @param {string?} propName - The property name
     * @returns {string}
     */
    function maybePrefix(propName) {
        return propName ? propName + '.' : '';
    }

    /**
     * Return a function that validates that a given value is of a given type. Returns value if it is. Throws otherwise.
     *
     * `value` Any value to check.
     *
     * `type` When given:
     *
     * * a falsy value: this function will do no type check.
     * * a string: this function will throw if `typeof value !== type` (or value != null if type starts or ends with ?), and return value otherwise.
     * * Array: the value will be validated as an Array.
     * * an actual Array: this function will be recursively called for each element in value using
     *   type's first element as the type. E.g.,
     *         `ensureType([ Number ], [ 1, 2 ])` will recursively call `ensureType(Number, 1)` and `ensureType(Number, 2)`
     * * a function: will return that function to let you do custom validation on certain properties
     * * an object: it will validate the value is an object, and recursively validate each property in the descriptor against the same property in the value
     *
     * @example
     * const v =  validator({
     *   str: 'string',
     *   maybeObj: 'object?',
     *   custom: function(v) { if (v !== 'VALID') throw new Error('Invalid'); },
     *   anything: null,
     *   arr: Array,
     *   arr2: [],
     *   strArr: ['string'],
     *   nullableStrArr: ['string?']
     * });
     *
     * @param {Array|Object|function(*)|string|false|null|undefined} type - The type to validate
     * @param {string} descriptorProp - The property that is being validated
     * @returns {function(value)}
     */
    function validator(type, descriptorProp) {
        if (!type) {
            // false|null|undefined|0
            return _lodash2.default.identity;
        }

        if (typeof type === 'string' || type instanceof String) {
            var _ret = function () {
                type += '';
                var nullableIndex = type.indexOf('?');
                var nullable = false;
                if (nullableIndex !== -1) {
                    if (nullableIndex !== 0 && nullableIndex !== type.length - 1) {
                        throw new Error('Type unexpectedly contains a "?" in the middle: ' + type);
                    }
                    nullable = true;
                    type = type.split('?')[nullableIndex ? 0 : 1];
                }
                return {
                    v: function v(value, runtimeProp) {
                        if (value == null) {
                            if (nullable) {
                                return;
                            }
                            throwErrorForProp('Value was null, but expected non-nullable type ' + type, runtimeProp);
                        }
                        if ((typeof value === 'undefined' ? 'undefined' : babelHelpers.typeof(value)) !== type && !(typeof value === 'function' && type === 'object')) {
                            throwErrorForProp('The typeof ' + value + ' is ' + (typeof value === 'undefined' ? 'undefined' : babelHelpers.typeof(value)) + ' but expected it to be ' + type + ' ' + (nullable && 'or value to be null') + '.', runtimeProp);
                        }
                    }
                };
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : babelHelpers.typeof(_ret)) === "object") return _ret.v;
        }

        if (_lodash2.default.isArray(type) || type === Array) {
            var _ret2 = function () {
                var elementCheck = type !== Array && type[0] ? validator(type[0], descriptorProp) : _lodash2.default.identity;
                return {
                    v: function v(value, runtimeProp) {
                        if (!_lodash2.default.isArray(value)) {
                            throwErrorForProp('Array type expected, but null or non-Array value provided.', runtimeProp);
                        }
                        value.forEach(function (el, i) {
                            return elementCheck(el, '' + maybePrefix(runtimeProp) + i);
                        });
                    }
                };
            }();

            if ((typeof _ret2 === 'undefined' ? 'undefined' : babelHelpers.typeof(_ret2)) === "object") return _ret2.v;
        }

        if (type === Object || type && (typeof type === 'undefined' ? 'undefined' : babelHelpers.typeof(type)) === 'object') {
            var _ret3 = function () {
                var validations = type === Object ? [] : Object.keys(type).map(function (typeKey) {
                    return [typeKey, validator(type[typeKey], '' + maybePrefix(descriptorProp) + typeKey)];
                });

                return {
                    v: function v(value, runtimeProp) {
                        if ((!value || (typeof value === 'undefined' ? 'undefined' : babelHelpers.typeof(value)) !== 'object') && typeof value !== 'function') {
                            throwErrorForProp('Object expected, but null or non-Object value provided.', runtimeProp);
                        }
                        validations.forEach(function (validation) {
                            var _validation = babelHelpers.slicedToArray(validation, 2);

                            var typeKey = _validation[0];
                            var func = _validation[1];


                            func(value[typeKey], '' + maybePrefix(runtimeProp) + typeKey);
                        });
                    }
                };
            }();

            if ((typeof _ret3 === 'undefined' ? 'undefined' : babelHelpers.typeof(_ret3)) === "object") return _ret3.v;
        }

        if (typeof type === 'function') {
            // must come after Array and Object - those constructors are functions!
            return type;
        }

        throwErrorForProp('Invalid descriptor: Expected type ' + type + '. Should be falsy, String, Array, Object, or function.', descriptorProp);
    }

    /**
     * If you are expecting the value to be one of N known strings, use this helper.
     *
     * @param {string} name - The name of the property
     * @param {Object} enumeration - The enum to validate against
     * @returns {undefined}
     */
    validator.asEnum = function (name, enumeration) {
        return function validateEnum(val) {
            var hasValue = Object.keys(enumeration).some(function (key) {
                return enumeration[key] === val;
            });
            if (hasValue) {
                return;
            }
            throw new Error('Invalid ' + name + '. Expected one of ' + Object.keys(enumeration).join(', ') + ', but got ' + val);
        };
    };

    /**
     * You can do nullable primitives with 'string?', but for nullable objects, use this helper.
     * @param {Object} obj - The object to validate
     * @returns {undefined}
     */
    validator.nullable = function (obj) {
        var objValidator = validator(obj);
        return function (v) {
            if (v == null) {
                return;
            }
            objValidator(v);
        };
    };

    /**
     * If you want to defer the creation of the validation function until you actually request a validation, use this helper.
     * @param {function()} getModel - The function that will get the model to validate
     * @returns {function(Object)}
     */
    validator.recurse = function (getModel) {
        var validate = void 0;
        return function (value) {
            if (!validate) {
                validate = validator(getModel());
            }
            validate(value);
        };
    };

    /**
     * If there is only one valid value for a field, use this helper.
     * @param {Object} value - The value to validate
     * @returns {function(Object)}
     */
    validator.strictEqual = function (value) {
        return function (v) {
            if (v !== value) {
                throw new Error('Expected ' + value + ' but was ' + v);
            }
        };
    };
    module.exports = exports['default'];
});