define('bitbucket/internal/bbui/pull-request-table/components/author-avatar', ['module', 'exports', 'react', '../../aui-react/avatar'], function (module, exports, _react, _avatar) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _avatar2 = babelHelpers.interopRequireDefault(_avatar);

    var AuthorAvatar = function (_Component) {
        babelHelpers.inherits(AuthorAvatar, _Component);

        function AuthorAvatar() {
            babelHelpers.classCallCheck(this, AuthorAvatar);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(AuthorAvatar).apply(this, arguments));
        }

        babelHelpers.createClass(AuthorAvatar, [{
            key: 'shouldComponentUpdate',
            value: function shouldComponentUpdate(newProps) {
                return this.props.author !== newProps.author;
            }
        }, {
            key: 'render',
            value: function render() {
                return _react2.default.createElement(
                    'td',
                    { className: 'author-avatar' },
                    _react2.default.createElement(_avatar2.default, { person: this.props.author, size: 'medium' })
                );
            }
        }], [{
            key: 'propTypes',
            get: function get() {
                return {
                    author: _react.PropTypes.object.isRequired
                };
            }
        }]);
        return AuthorAvatar;
    }(_react.Component);

    exports.default = AuthorAvatar;
    module.exports = exports['default'];
});