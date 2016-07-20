define('bitbucket/internal/bbui/tipsy/tipsy', ['module', 'exports', 'jquery', 'react', 'react-dom'], function (module, exports, _jquery, _react, _reactDom) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var propTypes = {
        children: _react.PropTypes.node,
        title: _react.PropTypes.string,
        className: _react.PropTypes.string,
        delay: _react.PropTypes.number
    };

    var Tipsy = function (_Component) {
        babelHelpers.inherits(Tipsy, _Component);

        function Tipsy(props) {
            babelHelpers.classCallCheck(this, Tipsy);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Tipsy).call(this, props));

            _this.tipsyProps = {
                title: props.title,
                className: props.className,
                delay: props.delay
            };
            return _this;
        }

        babelHelpers.createClass(Tipsy, [{
            key: 'componentDidMount',
            value: function componentDidMount() {
                var node = (0, _reactDom.findDOMNode)(this);
                if (this.props.delay) {
                    setTimeout(function () {
                        (0, _jquery2.default)(node).tooltip();
                    }, this.props.delay);
                } else {
                    (0, _jquery2.default)(node).tooltip();
                }
            }
        }, {
            key: 'render',
            value: function render() {
                return _react2.default.createElement('span', this.tipsyProps, this.props.children);
            }
        }]);
        return Tipsy;
    }(_react.Component);

    exports.default = Tipsy;


    Tipsy.propTypes = propTypes;
    module.exports = exports['default'];
});