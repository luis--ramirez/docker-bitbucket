define('bitbucket/internal/bbui/pull-request-table/components/comments', ['module', 'exports', 'react', '../../aui-react/icon', './count-cell'], function (module, exports, _react, _icon, _countCell) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _icon2 = babelHelpers.interopRequireDefault(_icon);

    var _countCell2 = babelHelpers.interopRequireDefault(_countCell);

    var propTypes = {
        pullRequest: _react.PropTypes.object.isRequired
    };

    var Comments = function (_Component) {
        babelHelpers.inherits(Comments, _Component);

        function Comments() {
            babelHelpers.classCallCheck(this, Comments);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Comments).apply(this, arguments));
        }

        babelHelpers.createClass(Comments, [{
            key: 'shouldComponentUpdate',
            value: function shouldComponentUpdate(newProps) {
                return this.props.pullRequest.comment_count !== newProps.pullRequest.comment_count;
            }
        }, {
            key: 'render',
            value: function render() {
                var pullRequest = this.props.pullRequest;
                return _react2.default.createElement(_countCell2.default, {
                    count: pullRequest.comment_count,
                    tooltip: AJS.I18n.getText('bitbucket.web.comment.count', pullRequest.comment_count),
                    className: 'comments',
                    icon: _react2.default.createElement(
                        _icon2.default,
                        { size: 'small', icon: 'comment' },
                        AJS.I18n.getText('bitbucket.web.comment.count', pullRequest.comment_count)
                    )
                });
            }
        }]);
        return Comments;
    }(_react.Component);

    Comments.Header = _countCell2.default.Header;
    Comments.propTypes = propTypes;

    exports.default = Comments;
    module.exports = exports['default'];
});