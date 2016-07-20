define('bitbucket/internal/bbui/self-reviewer/self-reviewer', ['module', 'exports', 'react', 'aui', 'classnames', '../aui-react/inline-dialog', '../models/models', '../reviewer-avatar/reviewer-avatar', '../tipsy/tipsy'], function (module, exports, _react, _aui, _classnames, _inlineDialog, _models, _reviewerAvatar, _tipsy) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _aui2 = babelHelpers.interopRequireDefault(_aui);

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var _inlineDialog2 = babelHelpers.interopRequireDefault(_inlineDialog);

    var _reviewerAvatar2 = babelHelpers.interopRequireDefault(_reviewerAvatar);

    var _tipsy2 = babelHelpers.interopRequireDefault(_tipsy);

    var propTypes = {
        currentUserAsReviewer: _react.PropTypes.object,
        isWatching: _react.PropTypes.bool,
        onSelfClick: _react.PropTypes.func.isRequired,
        removeSelfModalId: _react.PropTypes.string.isRequired
    };

    var SelfReviewer = function (_Component) {
        babelHelpers.inherits(SelfReviewer, _Component);

        function SelfReviewer() {
            babelHelpers.classCallCheck(this, SelfReviewer);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(SelfReviewer).call(this));

            // hover state is managed by js because chrome
            // does not fire mouse events on elements that
            // have a parent that is animating
            _this.state = { hovered: false };
            return _this;
        }

        babelHelpers.createClass(SelfReviewer, [{
            key: 'mouseEnter',
            value: function mouseEnter(e) {
                this.setState({ hovered: true });
            }
        }, {
            key: 'mouseLeave',
            value: function mouseLeave(e) {
                this.setState({ hovered: false });
            }
        }, {
            key: 'createUnwatchMarkup',
            value: function createUnwatchMarkup() {
                return { __html: _aui2.default.I18n.getText('bitbucket.component.self.reviewer.unwatch.html') };
            }
        }, {
            key: 'render',
            value: function render() {
                var _this2 = this;

                var initTipsyDelay = 500; // delay 'remove yourself' tipsy so it doesn't appear during animation
                var currentUserAsReviewer = this.props.currentUserAsReviewer;
                var unWatchCheckbox = _react2.default.createElement(
                    'p',
                    null,
                    _react2.default.createElement(
                        'label',
                        null,
                        _react2.default.createElement('input', {
                            className: 'checkbox',
                            type: 'checkbox',
                            ref: function ref(el) {
                                _this2._unwatchCheckbox = el;
                            }
                        }),
                        _react2.default.createElement('span', { dangerouslySetInnerHTML: this.createUnwatchMarkup() })
                    )
                );

                if (!currentUserAsReviewer) {
                    return _react2.default.createElement(
                        'div',
                        { className: 'self-avatar' },
                        _react2.default.createElement(
                            _tipsy2.default,
                            {
                                key: 'add-self',
                                ref: function ref(el) {
                                    _this2._add_self = el;
                                },
                                title: _aui2.default.I18n.getText('bitbucket.component.self.reviewer.add'),
                                className: 'add-self'
                            },
                            _react2.default.createElement(
                                'button',
                                {
                                    onClick: function onClick() {
                                        _this2.setState({ hovered: false });
                                        _this2.props.onSelfClick(_models.SelfAction.ADD_SELF);
                                    },
                                    className: 'aui-button'
                                },
                                '+'
                            )
                        )
                    );
                }

                return _react2.default.createElement(
                    'div',
                    {
                        className: (0, _classnames2.default)('self-avatar', { jsHover: this.state.hovered, reviewing: this.props.currentUserAsReviewer }),
                        onMouseEnter: function onMouseEnter() {
                            return _this2.mouseEnter();
                        },
                        onMouseLeave: function onMouseLeave() {
                            return _this2.mouseLeave();
                        }
                    },
                    _react2.default.createElement(
                        _tipsy2.default,
                        {
                            key: 'remove-self',
                            title: _aui2.default.I18n.getText('bitbucket.component.self.reviewer.remove'),
                            className: 'remove-self',
                            delay: initTipsyDelay
                        },
                        _react2.default.createElement(
                            _inlineDialog.InlineDialogTrigger,
                            {
                                dialogId: this.props.removeSelfModalId,
                                className: 'aui-button'
                            },
                            '–'
                        )
                    ),
                    _react2.default.createElement(
                        _inlineDialog2.default,
                        {
                            key: 'remove_self_dialog',
                            id: this.props.removeSelfModalId,
                            className: 'remove-self-dialog',
                            alignment: 'bottom right'
                        },
                        _react2.default.createElement(
                            'h5',
                            null,
                            _aui2.default.I18n.getText('bitbucket.component.self.reviewer.remove.confirm.header')
                        ),
                        _react2.default.createElement(
                            'p',
                            null,
                            _aui2.default.I18n.getText('bitbucket.component.self.reviewer.remove.confirm')
                        ),
                        this.props.isWatching ? unWatchCheckbox : null,
                        _react2.default.createElement(
                            'p',
                            null,
                            _react2.default.createElement(
                                'button',
                                {
                                    className: 'aui-button',
                                    onClick: function onClick(e) {
                                        return _this2.props.onSelfClick(_models.SelfAction.REMOVE_SELF, _this2._unwatchCheckbox ? _this2._unwatchCheckbox.checked : null);
                                    }
                                },
                                _aui2.default.I18n.getText('bitbucket.component.self.reviewer.remove.confirm.button')
                            )
                        )
                    ),
                    _react2.default.createElement(_reviewerAvatar2.default, { reviewer: currentUserAsReviewer, tooltip: false }),
                    ';'
                );
            }
        }]);
        return SelfReviewer;
    }(_react.Component);

    SelfReviewer.propTypes = propTypes;

    exports.default = SelfReviewer;
    module.exports = exports['default'];
});