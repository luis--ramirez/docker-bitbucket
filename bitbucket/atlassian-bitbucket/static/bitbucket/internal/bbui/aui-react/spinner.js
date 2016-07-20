define('bitbucket/internal/bbui/aui-react/spinner', ['module', 'exports', 'jquery', 'react', 'react-dom'], function (module, exports, _jquery, _react, _reactDom) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _reactDom2 = babelHelpers.interopRequireDefault(_reactDom);

    var Spinner = function (_Component) {
        babelHelpers.inherits(Spinner, _Component);

        function Spinner() {
            babelHelpers.classCallCheck(this, Spinner);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Spinner).apply(this, arguments));
        }

        babelHelpers.createClass(Spinner, [{
            key: 'componentDidMount',
            value: function componentDidMount() {
                this.spin();
            }
        }, {
            key: 'componentDidUpdate',
            value: function componentDidUpdate() {
                this.spinStop();
                this.spin();
            }
        }, {
            key: 'componentWillUnmount',
            value: function componentWillUnmount() {
                this.spinStop();
            }
        }, {
            key: 'spin',
            value: function spin() {
                (0, _jquery2.default)(_reactDom2.default.findDOMNode(this)).spin(this.props.size || 'small');
            }
        }, {
            key: 'spinStop',
            value: function spinStop() {
                (0, _jquery2.default)(_reactDom2.default.findDOMNode(this)).spinStop();
            }
        }, {
            key: 'render',
            value: function render() {
                return _react2.default.createElement('div', { className: 'bb-spinner' });
            }
        }], [{
            key: 'propTypes',
            get: function get() {
                return {
                    size: _react.PropTypes.oneOf(['small', 'large'])
                };
            }
        }]);
        return Spinner;
    }(_react.Component);

    exports.default = Spinner;
    module.exports = exports['default'];
});