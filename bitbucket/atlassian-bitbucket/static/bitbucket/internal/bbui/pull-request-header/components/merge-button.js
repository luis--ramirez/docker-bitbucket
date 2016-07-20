define('bitbucket/internal/bbui/pull-request-header/components/merge-button', ['module', 'exports', 'react', 'classnames', 'jquery', 'react-dom', '../../aui-react/spinner'], function (module, exports, _react, _classnames, _jquery, _reactDom, _spinner) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _spinner2 = babelHelpers.interopRequireDefault(_spinner);

    var MergeButton = function (_Component) {
        babelHelpers.inherits(MergeButton, _Component);

        function MergeButton() {
            babelHelpers.classCallCheck(this, MergeButton);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(MergeButton).apply(this, arguments));
        }

        babelHelpers.createClass(MergeButton, [{
            key: 'componentDidMount',
            value: function componentDidMount() {
                var node = (0, _reactDom.findDOMNode)(this);
                (0, _jquery2.default)(node).tooltip({
                    gravity: 'ne',
                    live: true
                });
            }
        }, {
            key: 'componentWillUpdate',
            value: function componentWillUpdate(nextProps) {
                var node = (0, _reactDom.findDOMNode)(this);
                if (nextProps.mergeable.isChecking) {
                    // the spinner will be shown, measure the button and set its width.
                    // use getBoundingClientRect to get the full width of the
                    // button (including borders)
                    var rect = node.getBoundingClientRect();
                    node.style.width = rect.right - rect.left + 'px';
                } else {
                    node.style.width = '';
                }

                // need to remove the original-title because tipsy will continue to show
                // if it is not removed.
                if (!node.getAttribute('title')) {
                    node.setAttribute('title', node.getAttribute('original-title') || '');
                    node.removeAttribute('original-title');
                }
            }
        }, {
            key: 'componentDidUpdate',
            value: function componentDidUpdate() {
                var node = (0, _reactDom.findDOMNode)(this);
                var enabled = this.props.tooltipVisibility ? 'enable' : 'disable';
                (0, _jquery2.default)(node).tooltip(enabled);
            }
        }, {
            key: 'onClick',
            value: function onClick() {
                if (this.props.mergeable.canMerge) {
                    this.props.onMergeClick();
                } else {
                    this.props.onMergeWarningClick();
                }
            }
        }, {
            key: 'mergeIssueReason',
            value: function mergeIssueReason() {
                var title = '';

                if (!this.props.mergeable.canMerge) {
                    var _props = this.props;
                    var conflicted = _props.conflicted;
                    var _props$vetoes = _props.vetoes;
                    var vetoes = _props$vetoes === undefined ? [] : _props$vetoes;


                    if (conflicted && (!vetoes || vetoes.length === 0)) {
                        title = AJS.I18n.getText('bitbucket.component.pull.request.merge.conflict.tooltip');
                    } else if (vetoes && vetoes.length === 1 && !conflicted) {
                        title = vetoes[0].detailedMessage;
                    } else {
                        title = AJS.I18n.getText('bitbucket.component.pull.request.merge.issue.tooltip');
                    }
                }
                return title;
            }
        }, {
            key: 'render',
            value: function render() {
                var _this2 = this;

                var mergeable = this.props.mergeable;

                var enabled = !mergeable.isChecking && mergeable.canMerge;
                var className = (0, _classnames2.default)('aui-button', 'merge-button');
                return _react2.default.createElement(
                    'button',
                    babelHelpers.extends({
                        onClick: function onClick() {
                            return _this2.onClick();
                        },
                        className: className,
                        'aria-disabled': !enabled,
                        title: this.mergeIssueReason(mergeable.canMerge)
                    }, this.props.extraButtonProps),
                    mergeable.isChecking ? _react2.default.createElement(_spinner2.default, null) : AJS.I18n.getText('bitbucket.component.pull.request.toolbar.merge')
                );
            }
        }], [{
            key: 'propTypes',
            get: function get() {
                return {
                    conflicted: _react.PropTypes.bool,
                    mergeable: _react.PropTypes.shape({
                        isChecking: _react.PropTypes.bool,
                        canMerge: _react.PropTypes.bool
                    }),
                    onMergeClick: _react.PropTypes.func.isRequired,
                    onMergeWarningClick: _react.PropTypes.func.isRequired,
                    extraButtonProps: _react.PropTypes.object,
                    vetoes: _react.PropTypes.arrayOf(_react.PropTypes.shape({
                        detailedMessage: _react.PropTypes.string.isRequired
                    })),
                    tooltipVisibility: _react.PropTypes.bool
                };
            }
        }, {
            key: 'defaultProps',
            get: function get() {
                return {
                    conflicted: false,
                    mergeable: {
                        isChecking: false,
                        canMerge: true
                    },
                    extraButtonProps: {}
                };
            }
        }]);
        return MergeButton;
    }(_react.Component);

    exports.default = MergeButton;
    module.exports = exports['default'];
});