define('bitbucket/internal/bbui/filter-bar/components/select', ['module', 'exports', 'react', 'jquery', 'lodash', 'react-dom', './filter'], function (module, exports, _react, _jquery, _lodash, _reactDom, _filter) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _reactDom2 = babelHelpers.interopRequireDefault(_reactDom);

    var _filter2 = babelHelpers.interopRequireDefault(_filter);

    var Select = function (_Filter) {
        babelHelpers.inherits(Select, _Filter);

        function Select() {
            babelHelpers.classCallCheck(this, Select);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Select).apply(this, arguments));
        }

        babelHelpers.createClass(Select, [{
            key: 'componentDidMount',
            value: function componentDidMount() {
                var _this2 = this;

                var defaults = {
                    minimumResultsForSearch: -1 };
                // don't show the search box.
                var overrides = {};
                var $filter = this.get$Input();
                $filter.auiSelect2(_lodash2.default.extend(defaults, this.props.menu, overrides));
                $filter.on('change', function () {
                    return _this2.props.onChange();
                });
            }
        }, {
            key: 'shouldComponentUpdate',
            value: function shouldComponentUpdate() {
                return false;
            }
        }, {
            key: 'get$Input',
            value: function get$Input() {
                return (0, _jquery2.default)(_reactDom2.default.findDOMNode(this)).children('select');
            }
        }, {
            key: 'render',
            value: function render() {
                return _react2.default.createElement(
                    'li',
                    null,
                    _react2.default.createElement(
                        'label',
                        { htmlFor: this.props.id, className: 'assistive' },
                        this.props.label
                    ),
                    _react2.default.createElement(
                        'select',
                        { id: this.props.id, value: this.props.value, readOnly: true },
                        this.props.menu.items.map(function (item) {
                            return _react2.default.createElement(
                                'option',
                                { key: item.id, value: item.id, disabled: item.disabled },
                                item.text
                            );
                        })
                    )
                );
            }
        }, {
            key: 'value',
            value: function value() {
                return this.props.value;
            }
        }, {
            key: 'domValue',
            value: function domValue() {
                return this.get$Input().val();
            }
        }, {
            key: 'reset',
            value: function reset() {
                var $filter = this.get$Input();
                $filter.select2('val', this.props.menu.items[0].id);
                return _jquery2.default.Deferred().resolve();
            }
        }], [{
            key: 'propTypes',
            get: function get() {
                return {
                    id: _react.PropTypes.string.isRequired,
                    label: _react.PropTypes.string.isRequired,
                    menu: _react.PropTypes.any,
                    onChange: _react.PropTypes.func,
                    value: _react.PropTypes.string
                };
            }
        }]);
        return Select;
    }(_filter2.default);

    exports.default = Select;
    module.exports = exports['default'];
});