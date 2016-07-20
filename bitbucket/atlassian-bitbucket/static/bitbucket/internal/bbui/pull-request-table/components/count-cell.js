define('bitbucket/internal/bbui/pull-request-table/components/count-cell', ['module', 'exports', 'react', 'classnames'], function (module, exports, _react, _classnames) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var UNCAPPED_MAX = 99;

    function cappedInt(n) {
        return n > UNCAPPED_MAX ? UNCAPPED_MAX + '+' : n + '';
    }

    var propTypes = {
        count: _react.PropTypes.number.isRequired,
        icon: _react.PropTypes.node.isRequired,
        tooltip: _react.PropTypes.string.isRequired,
        className: _react.PropTypes.string
    };

    var CountCell = function CountCell(props) {
        return _react2.default.createElement(
            'td',
            { className: (0, _classnames2.default)('count-column-value', props.className) },
            props.count > 0 && _react2.default.createElement(
                'span',
                { title: props.tooltip },
                props.icon,
                _react2.default.createElement(
                    'span',
                    null,
                    ' '
                ),
                _react2.default.createElement(
                    'span',
                    { className: 'count' },
                    cappedInt(props.count)
                )
            )
        );
    };

    CountCell.Header = function () {
        return _react2.default.createElement('th', { className: 'count-column' });
    };

    CountCell.propTypes = propTypes;

    exports.default = CountCell;
    module.exports = exports['default'];
});