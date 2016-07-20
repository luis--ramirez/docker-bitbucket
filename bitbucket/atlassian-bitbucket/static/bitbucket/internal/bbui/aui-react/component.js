define('bitbucket/internal/bbui/aui-react/component', ['module', 'exports', 'react', 'classnames', 'lodash', 'react-dom'], function (module, exports, _react, _classnames, _lodash, _reactDom) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _reactDom2 = babelHelpers.interopRequireDefault(_reactDom);

    var propTypes = {
        children: _react.PropTypes.node.isRequired,
        containerSelector: _react.PropTypes.string, // eg. we need to render into the '.aui-inline-dialog-contents' of an aui-inline-dialog
        id: _react.PropTypes.string,
        markup: _react.PropTypes.string.isRequired,
        wrapperClass: _react.PropTypes.string };

    var AUIComponent = function (_Component) {
        babelHelpers.inherits(AUIComponent, _Component);

        function AUIComponent() {
            babelHelpers.classCallCheck(this, AUIComponent);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(AUIComponent).apply(this, arguments));
        }

        babelHelpers.createClass(AUIComponent, [{
            key: 'componentDidMount',
            value: function componentDidMount() {
                var _this2 = this;

                var node = _reactDom2.default.findDOMNode(this);
                node.innerHTML = this.props.markup;
                node.firstChild.id = this.props.id;
                _lodash2.default.defer(function () {
                    return _this2.updateContent();
                });
            }
        }, {
            key: 'componentDidUpdate',
            value: function componentDidUpdate() {
                this.updateContent();
            }
        }, {
            key: 'componentWillUnmount',
            value: function componentWillUnmount() {
                _reactDom2.default.unmountComponentAtNode(this.getContainer());
                // if there is an ID also try to remove the component with that ID.
                // This should take care of any container elements that AUI has moved.
                if (this.props.id) {
                    var el = document.querySelector('#' + this.props.id);
                    if (el) {
                        el.parentNode.removeChild(el); // update when we drop IE11 support
                    }
                }
            }
        }, {
            key: 'getContainer',
            value: function getContainer() {
                if (this._container) {
                    return this._container;
                }
                var containerSelector = this.props.containerSelector || '#' + this.props.id;
                this._container = document.querySelector(containerSelector);
                return this._container;
            }
        }, {
            key: 'updateContent',
            value: function updateContent() {
                var content = _react2.default.createElement(
                    'div',
                    { className: (0, _classnames2.default)(this.props.wrapperClass) },
                    this.props.children
                );
                if (this.getContainer()) {
                    _reactDom2.default.render(content, this.getContainer());
                }
            }
        }, {
            key: 'render',
            value: function render() {
                return _react2.default.createElement('div', null);
            }
        }]);
        return AUIComponent;
    }(_react.Component);

    AUIComponent.propTypes = propTypes;

    exports.default = AUIComponent;
    module.exports = exports['default'];
});