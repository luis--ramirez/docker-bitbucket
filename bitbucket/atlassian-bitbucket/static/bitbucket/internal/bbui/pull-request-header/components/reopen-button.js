define('bitbucket/internal/bbui/pull-request-header/components/reopen-button', ['module', 'exports', 'react', 'react-dom', '../../aui-react/spinner'], function (module, exports, _react, _reactDom, _spinner) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _spinner2 = babelHelpers.interopRequireDefault(_spinner);

    var defaultProps = {
        enabled: true
    };

    var propTypes = {
        onReOpenClick: _react.PropTypes.func.isRequired,
        enabled: _react.PropTypes.bool
    };

    var ReOpenButton = function (_Component) {
        babelHelpers.inherits(ReOpenButton, _Component);

        function ReOpenButton(props) {
            babelHelpers.classCallCheck(this, ReOpenButton);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(ReOpenButton).call(this, props));

            _this.state = {
                enabled: props.enabled
            };
            return _this;
        }

        babelHelpers.createClass(ReOpenButton, [{
            key: 'componentWillUpdate',
            value: function componentWillUpdate(nextProps, nextState) {
                if (!nextState.enabled) {
                    // the spinner will be shown, measure the button and set its width.
                    var node = (0, _reactDom.findDOMNode)(this);
                    // use getBoundingClientRect to get the full width of the
                    // button (including borders)
                    var rect = node.getBoundingClientRect();
                    node.style.width = rect.right - rect.left + 'px';
                }
            }
        }, {
            key: 'onClick',
            value: function onClick() {
                var _this2 = this;

                this.props.onReOpenClick().fail(function () {
                    _this2.setState({ enabled: true });
                });

                this.setState({ enabled: false });
            }
        }, {
            key: 'render',
            value: function render() {
                var _this3 = this;

                var title = AJS.I18n.getText('bitbucket.component.pull.request.toolbar.reopen.tooltip');
                var content = AJS.I18n.getText('bitbucket.component.pull.request.toolbar.reopen');

                if (!this.state.enabled) {
                    content = _react2.default.createElement(_spinner2.default, null);
                }
                return _react2.default.createElement(
                    'button',
                    {
                        onClick: function onClick() {
                            return _this3.onClick();
                        },
                        className: 'aui-button aui-button-primary reopen-button',
                        'aria-disabled': !this.state.enabled,
                        title: title
                    },
                    content
                );
            }
        }]);
        return ReOpenButton;
    }(_react.Component);

    ReOpenButton.propTypes = propTypes;
    ReOpenButton.defaultProps = defaultProps;

    exports.default = ReOpenButton;
    module.exports = exports['default'];
});