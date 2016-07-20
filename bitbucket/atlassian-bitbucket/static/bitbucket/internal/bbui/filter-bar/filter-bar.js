define('bitbucket/internal/bbui/filter-bar/filter-bar', ['module', 'exports', 'jquery', 'lodash', 'react', './components/async-select', './components/filter', './components/select', './components/toggle'], function (module, exports, _jquery, _lodash, _react, _asyncSelect, _filter, _select, _toggle) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _asyncSelect2 = babelHelpers.interopRequireDefault(_asyncSelect);

    var _filter2 = babelHelpers.interopRequireDefault(_filter);

    var _select2 = babelHelpers.interopRequireDefault(_select);

    var _toggle2 = babelHelpers.interopRequireDefault(_toggle);

    /**
     * Calls React.cloneElement, but for any props that already contains callbacks, combines the callbacks and ensures both the old version
     * and new version are called.
     *
     * If you've got a better name, and I'm sure you do, please rename this.
     *
     * @param {ReactElement} el - el to clone
     * @param {Object} newProps - properties to override
     * @returns {ReactElement}
     */
    function cloneSequencedOverwrite(el, newProps) {
        var combinedProps = _lodash2.default.clone(newProps, function (newVal, prop) {
            var elVal = el[prop];
            if (!_lodash2.default.isFunction(elVal) || !_lodash2.default.isFunction(newVal)) {
                return newVal;
            }
            return function () {
                elVal.apply(el, arguments);
                newVal.apply(el, arguments);
            };
        });
        return _react2.default.cloneElement(el, combinedProps);
    }

    var FilterBar = function (_Component) {
        babelHelpers.inherits(FilterBar, _Component);
        babelHelpers.createClass(FilterBar, null, [{
            key: 'propTypes',
            get: function get() {
                return {
                    children: _react.PropTypes.any,
                    onChange: _react.PropTypes.func,
                    id: _react.PropTypes.string
                };
            }
        }]);

        function FilterBar() {
            var _Object$getPrototypeO;

            babelHelpers.classCallCheck(this, FilterBar);

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var _this = babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(FilterBar)).call.apply(_Object$getPrototypeO, [this].concat(args)));

            _this.filterRefs = [];
            return _this;
        }

        babelHelpers.createClass(FilterBar, [{
            key: 'getState',
            value: function getState() {
                var state = {};
                this.filterRefs.forEach(function (filter) {
                    if (!filter) {
                        return;
                    }
                    state[filter.props.id] = filter.domValue();
                });
                return state;
            }
        }, {
            key: 'reset',
            value: function reset() {
                var _this2 = this;

                var oldState = this.getState();
                var resetPromises = this.filterRefs.map(function (filter) {
                    if (!filter) {
                        return _jquery2.default.Deferred().resolve();
                    }
                    return filter.reset();
                });
                _jquery2.default.when.apply(_jquery2.default, babelHelpers.toConsumableArray(resetPromises)).then(function () {
                    var newState = _this2.getState();
                    if (Object.keys(newState).some(function (prop) {
                        return newState[prop] !== oldState[prop];
                    })) {
                        _this2.props.onChange(newState);
                    }
                });
            }
        }, {
            key: 'render',
            value: function render() {
                var _this3 = this;

                var onChange = void 0;
                if (this.props.onChange) {
                    onChange = function onChange() {
                        _this3.props.onChange(_this3.getState());
                    };
                }

                return _react2.default.createElement(
                    'div',
                    { className: 'filter-bar', id: this.props.id },
                    _react2.default.createElement(
                        'h6',
                        { className: 'filter-label' },
                        AJS.I18n.getText('bitbucket.component.filter.bar.label')
                    ),
                    _react2.default.createElement(
                        'ul',
                        null,
                        _react2.default.Children.map(this.props.children, function (c, i) {
                            if (!c || !(c.type.prototype instanceof _filter2.default)) {
                                return c;
                            }
                            return cloneSequencedOverwrite(c, {
                                onChange: onChange || undefined,
                                ref: function ref(r) {
                                    return _this3.filterRefs[i] = r;
                                }
                            });
                        })
                    )
                );
            }
        }]);
        return FilterBar;
    }(_react.Component);

    exports.default = FilterBar;


    FilterBar.AsyncSelect = _asyncSelect2.default;
    FilterBar.Select = _select2.default;
    FilterBar.Toggle = _toggle2.default;
    module.exports = exports['default'];
});