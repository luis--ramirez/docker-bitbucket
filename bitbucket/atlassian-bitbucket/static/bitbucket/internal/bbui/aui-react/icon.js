define('bitbucket/internal/bbui/aui-react/icon', ['module', 'exports', 'classnames', 'react'], function (module, exports, _classnames, _react) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var propTypes = {
        icon: _react.PropTypes.string.isRequired,
        size: _react.PropTypes.oneOf(['small', 'large']),
        children: _react.PropTypes.node
    };

    var defaultProps = {
        size: 'small'
    };

    var Icon = function Icon(props) {
        var icon = props.icon;
        if (!/^aui-iconfont-/.test(icon)) {
            icon = 'aui-iconfont-' + icon;
        }

        return _react2.default.createElement(
            'span',
            { className: (0, _classnames2.default)('aui-icon', 'aui-icon-' + props.size, icon) },
            props.children
        );
    };
    Icon.propTypes = propTypes;
    Icon.defaultProps = defaultProps;

    exports.default = Icon;
    module.exports = exports['default'];
});