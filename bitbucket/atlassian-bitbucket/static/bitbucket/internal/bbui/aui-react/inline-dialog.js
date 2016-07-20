define('bitbucket/internal/bbui/aui-react/inline-dialog', ['exports', 'classnames', 'react', './component'], function (exports, _classnames, _react, _component) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.InlineDialogTrigger = undefined;

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _component2 = babelHelpers.interopRequireDefault(_component);

    var triggerPropTypes = {
        children: _react.PropTypes.node,
        className: _react.PropTypes.string,
        dialogId: _react.PropTypes.string.isRequired,
        href: _react.PropTypes.string,
        title: _react.PropTypes.string
    };

    var triggerDefaultProps = {
        className: '',
        href: '',
        title: ''
    };

    var dialogPropTypes = {
        alignment: _react.PropTypes.string,
        children: _react.PropTypes.node,
        className: _react.PropTypes.string,
        id: _react.PropTypes.string.isRequired
    };

    var dialogDefaultProps = {
        alignment: 'right middle',
        className: ''
    };

    /**
     * Creates a click target to open an InlineDialog. This will be a <button> unless
     * the `href` prop is passed, which will use an <a> element.
     *
     * @param {string} dialogId - The id of the InlineDialog this trigger controls
     * @param {React.children} children - The HTML contents for this trigger
     * @param {string} [className] - Classes to be added to the trigger
     * @param {string} [href] - The link for this trigger
     */

    var InlineDialogTrigger = exports.InlineDialogTrigger = function (_Component) {
        babelHelpers.inherits(InlineDialogTrigger, _Component);

        function InlineDialogTrigger(props) {
            babelHelpers.classCallCheck(this, InlineDialogTrigger);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(InlineDialogTrigger).call(this, props));

            _this.elementType = 'button';

            _this.triggerProps = {
                'aria-controls': props.dialogId,
                'aria-haspopup': true,
                'className': (0, _classnames2.default)('aui-button', props.className),
                'data-aui-trigger': true,
                'role': 'button',
                'title': props.title
            };

            if (props.href) {
                _this.triggerProps = babelHelpers.extends({}, _this.triggerProps, {
                    className: props.className,
                    href: props.href,
                    tabIndex: '0'
                });
                _this.elementType = 'a';
            }
            return _this;
        }

        babelHelpers.createClass(InlineDialogTrigger, [{
            key: 'render',
            value: function render() {
                return _react2.default.createElement(this.elementType, this.triggerProps, this.props.children);
            }
        }]);
        return InlineDialogTrigger;
    }(_react.Component);

    InlineDialogTrigger.defaultProps = triggerDefaultProps;
    InlineDialogTrigger.propTypes = triggerPropTypes;

    /**
     * Creates an Inline Dialog.
     *
     * @param {Object} props - Component properties
     * @param {string} props.id - The id of the dialog element. This must match the trigger id
     * @param {React.children} props.children - The HTML contents for this dialog
     * @param {string} [props.className] - Classes to be added to the dialog
     * @param {string} [props.alignment] - The alignment of this dialog.
     * @returns {ReactElement}
     *     See https://docs.atlassian.com/aui/latest/docs/inline-dialog.html#api-reference-alignment
     */
    var InlineDialog = function InlineDialog(props) {
        return _react2.default.createElement(
            _component2.default,
            {
                id: props.id,
                markup: '<aui-inline-dialog\n                        id="' + props.id + '"\n                        class="' + props.className + '"\n                        alignment="' + props.alignment + '"\n                     ></aui-inline-dialog>',
                containerSelector: '#' + props.id + ' .aui-inline-dialog-contents'
            },
            props.children
        );
    };

    InlineDialog.defaultProps = dialogDefaultProps;
    InlineDialog.propTypes = dialogPropTypes;

    exports.default = InlineDialog;
});