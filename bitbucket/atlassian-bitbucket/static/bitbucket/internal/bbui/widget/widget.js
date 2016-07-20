define('bitbucket/internal/bbui/widget/widget', ['module', 'exports', 'lodash'], function (module, exports, _lodash) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var BitbucketWidget = function () {

        /**
         * @param {Object} [options] - Options for this widget
         */

        function BitbucketWidget(options) {
            babelHelpers.classCallCheck(this, BitbucketWidget);


            _lodash2.default.bindAll(this, getProtoChainMethods(this, BitbucketWidget));

            if (options) {
                // When the widget is initialised and there are defaults, extend options over the defaults
                // to set the options for this instance.
                this.options = _lodash2.default.extend({}, this.constructor.defaults, options);
            }
        }

        /**
         * @returns {Object}
         */


        babelHelpers.createClass(BitbucketWidget, [{
            key: '_getListeners',
            value: function _getListeners(eventName) {
                if (!this._listeners) {
                    this._listeners = {};
                }
                if (!this._listeners[eventName]) {
                    this._listeners[eventName] = [];
                }
                return this._listeners[eventName];
            }
        }, {
            key: 'on',
            value: function on(eventName, handler) {
                var listeners = this._getListeners(eventName);
                if (!_lodash2.default.contains(listeners, handler)) {
                    listeners.push(handler);
                }
                return this;
            }
        }, {
            key: 'off',
            value: function off(eventName, handler) {
                var listeners = this._getListeners(eventName);
                var i = listeners.length;
                while (i--) {
                    // if it's the callback, or the boundOff for the callback
                    if (listeners[i] === handler || listeners[i]._handler === handler) {
                        listeners.splice(i, 1);
                    }
                }
                return this;
            }
        }, {
            key: 'once',
            value: function once(eventName, handler) {
                var boundOff = this.off.bind(this, eventName, handler);
                boundOff._handler = handler;
                this.on(eventName, handler);
                this.on(eventName, boundOff);
                return this;
            }
        }, {
            key: 'trigger',
            value: function trigger(eventName) {
                var _this = this;

                for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                }

                // We slice the listeners array and iterate over the copy because the list of listeners
                // may be updated while we're looping over it. i.e. when a 'once' is triggered.
                var listeners = this._getListeners(eventName).slice();
                listeners.forEach(function (fn) {
                    try {
                        fn.apply(_this, args);
                    } catch (e) {
                        _lodash2.default.defer(function () {
                            throw e;
                        });
                    }
                });
                return this;
            }
        }, {
            key: '_addDestroyable',
            value: function _addDestroyable(destroyable) {
                if (!this._destroyables) {
                    this._destroyables = [];
                }
                if (_lodash2.default.isFunction(destroyable)) {
                    destroyable = {
                        destroy: destroyable
                    };
                }
                if (!_lodash2.default.isFunction(destroyable.destroy)) {
                    throw new Error("Argument is not destroyable");
                }
                this._destroyables.push(destroyable);
                return this;
            }
        }, {
            key: 'destroy',
            value: function destroy() {
                if (this._destroyables) {
                    _lodash2.default.invoke(this._destroyables, 'destroy');
                    this._destroyables = null;
                }
                this.trigger('destroy');
                if (this._listeners) {
                    this._listeners = null;
                }
            }
        }, {
            key: 'options',
            get: function get() {
                return this._options;
            },
            set: function set(options) {
                this._options = options;
            }
        }]);
        return BitbucketWidget;
    }();

    /**
     * Throw an error if the prototype of this object is enumerated over.
     * This prevents inheriting from it in the wrong way, for example using [lodash|jQuery].extend()
     */
    Object.defineProperty(BitbucketWidget.prototype, '__nonEnumerable', {
        enumerable: true,
        get: function get() {
            throw new Error("BitbucketWidget is not enumerable. Inherit using Object.create().");
        }
    });

    /**
     * Get the prototype chain methods for a given object and stop traversing when
     * a given 'until' object's prototype is reached.
     * We skip the constructor
     * @param {Object} obj - The object to start traversing at
     * @param {Object} until - The object's prototype to stop traversing at.
     * @returns {Array<string>}
     */
    var forbiddenProps = ['constructor', '__nonEnumerable'];
    function getProtoChainMethods(obj, until) {
        var keys = Object.getOwnPropertyNames(obj).filter(function (item) {
            var isForbiddenProp = forbiddenProps.indexOf(item) !== -1;
            // check for isForbiddenProp first because we don't want check if forbidden props are functions
            if (isForbiddenProp) {
                return false;
            }
            // we use the descriptor to avoid any getters being called. If a property has a getter that returns a
            // function, we won't bind it.
            var descriptor = Object.getOwnPropertyDescriptor(obj, item);
            return _lodash2.default.isFunction(descriptor.value);
        });
        var proto = Object.getPrototypeOf(obj);
        if (proto.isPrototypeOf(until)) {
            return keys;
        }
        return _lodash2.default.uniq(keys.concat(getProtoChainMethods(proto, until)));
    }

    exports.default = BitbucketWidget;
    module.exports = exports['default'];
});