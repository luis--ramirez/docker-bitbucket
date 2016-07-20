define('bitbucket/internal/bbui/pull-request-table/components/pull-request-row', ['module', 'exports', 'react', 'classnames'], function (module, exports, _react, _classnames) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var propTypes = {
        children: _react.PropTypes.node.isRequired,
        focused: _react.PropTypes.bool,
        prNeedsWork: _react.PropTypes.bool
    };

    var PullRequestRow = function PullRequestRow(props) {
        return _react2.default.createElement(
            'tr',
            { className: (0, _classnames2.default)('pull-request-row', { focused: props.focused, prNeedsWork: props.prNeedsWork }) },
            props.children
        );
    };

    PullRequestRow.propTypes = propTypes;

    exports.default = PullRequestRow;
    module.exports = exports['default'];
});