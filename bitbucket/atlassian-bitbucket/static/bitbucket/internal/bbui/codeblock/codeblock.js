define('bitbucket/internal/bbui/codeblock/codeblock', ['module', 'exports', 'classnames', 'react'], function (module, exports, _classnames, _react) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var _react2 = babelHelpers.interopRequireDefault(_react);

    /**
     * Render a code block
     * @param {Object} props - The component properties
     * @param {boolean?} props.instructionBlock - is this code block an instruction block?
     * @param {string?} props.extraClasses - any extra CSS classes
     * @param {string?} props.code - a string to be used as the code block
     * @param {ReactElement|HTMLElement|string?} props.children - the content of the code block.
     *        This can be a string or a set of <line>s. If a set of <line>s is provided the will be
     *        rendered line by line and whitespace in them will remain intact.
     * @returns {ReactElement}
     * @constructor
     */
    var Codeblock = function Codeblock(props) {
        return _react2.default.createElement(
            'div',
            {
                className: (0, _classnames2.default)('code-block', {
                    'instruction-block': props.instructionBlock
                }, props.extraClasses)
            },
            _react2.default.createElement(
                'pre',
                null,
                _react2.default.createElement(
                    'code',
                    null,
                    props.code || renderChildrenLines(props.children)
                )
            )
        );
    };

    Codeblock.propTypes = {
        instructionBlock: _react.PropTypes.bool,
        extraClasses: _react.PropTypes.string,
        children: _react.PropTypes.node,
        code: _react.PropTypes.string
    };

    function renderChildrenLines(children) {
        return _react2.default.Children.map(children, function (child) {
            // if there is a <line> element, return its children with a newline
            return child.type && child.type.toLowerCase() === 'line' && [child.props.children, '\n'] || child;
        });
    }
    exports.default = Codeblock;
    module.exports = exports['default'];
});