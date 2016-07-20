define('bitbucket/internal/bbui/pull-request-header/components/merge', ['module', 'exports', 'react', 'jquery', 'lodash', '../../aui-react/inline-dialog', '../../models/models', './merge-button', './merge-help-dialog'], function (module, exports, _react, _jquery, _lodash, _inlineDialog, _models, _mergeButton, _mergeHelpDialog) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _inlineDialog2 = babelHelpers.interopRequireDefault(_inlineDialog);

    var _mergeButton2 = babelHelpers.interopRequireDefault(_mergeButton);

    var _mergeHelpDialog2 = babelHelpers.interopRequireDefault(_mergeHelpDialog);

    var REASONABLE_DELAY = 50;
    var MERGE_WARNING_DIALOG_ID = 'merge-warning-inline-dialog';

    var Merge = function (_Component) {
        babelHelpers.inherits(Merge, _Component);
        babelHelpers.createClass(Merge, null, [{
            key: 'propTypes',
            get: function get() {
                return {
                    conditions: _react.PropTypes.object.isRequired,
                    mergeHelp: _react.PropTypes.object,
                    onMergeClick: _react.PropTypes.func.isRequired,
                    onMergeHelpDialogClose: _react.PropTypes.func,
                    pullRequest: _react.PropTypes.object.isRequired,
                    showMergeHelpDialog: _react.PropTypes.bool
                };
            }
        }]);

        function Merge() {
            var _Object$getPrototypeO;

            babelHelpers.classCallCheck(this, Merge);

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var _this = babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(Merge)).call.apply(_Object$getPrototypeO, [this].concat(args)));

            _this.state = {};
            return _this;
        }

        babelHelpers.createClass(Merge, [{
            key: 'componentDidMount',
            value: function componentDidMount() {
                var _this2 = this;

                this.mergeWarningDialog = document.getElementById(MERGE_WARNING_DIALOG_ID);

                this.throttledWarningDialogHide = _lodash2.default.throttle(function () {
                    if (_this2.mergeWarningDialog) {
                        _this2.mergeWarningDialog.open = false;
                    }
                }, REASONABLE_DELAY);
                (0, _jquery2.default)(window).on('scroll resize', this.throttledWarningDialogHide);

                // the warning dialog can also be shown/hidden outside of its trigger so update state
                // by using the events triggered on the dialog.
                this.onToggleMergeWarningDialog = function (e) {
                    _this2.setState({ mergeWarningDialogOpen: e.type === 'aui-show' ? true : false });
                };
                (0, _jquery2.default)(this.mergeWarningDialog).on('aui-show aui-hide', this.onToggleMergeWarningDialog);
            }
        }, {
            key: 'componentWillReceiveProps',
            value: function componentWillReceiveProps(nextProps) {
                this.setState({ mergeHelpDialogShowing: nextProps.showMergeHelpDialog });
            }
        }, {
            key: 'componentWillUnmount',
            value: function componentWillUnmount() {
                (0, _jquery2.default)(window).off('scroll resize', this.throttledWarningDialogHide);
                (0, _jquery2.default)(this.mergeWarningDialog).off('aui-show aui-hide', this.onToggleMergeWarningDialog);
            }
        }, {
            key: 'onHideMergeHelpDialog',
            value: function onHideMergeHelpDialog() {
                this.extendedMergeHelpContent = '';
                this.setState({ mergeHelpDialogShowing: false });
                if (this.props.onMergeHelpDialogClose) {
                    this.props.onMergeHelpDialogClose();
                }
            }
        }, {
            key: 'onMergeWarningClick',
            value: function onMergeWarningClick() {
                this.toggleMergeWarningDialog();
            }
        }, {
            key: 'toggleMergeWarningDialog',
            value: function toggleMergeWarningDialog(open) {
                if (open == null) {
                    open = !this.mergeWarningDialog.open;
                }
                this.mergeWarningDialog.open = open;
            }
        }, {
            key: 'showExtendedMergeHelp',
            value: function showExtendedMergeHelp() {
                this.setState({ mergeHelpDialogShowing: true });
            }
        }, {
            key: 'render',
            value: function render() {
                var _this3 = this;

                var pullRequest = this.props.pullRequest;

                if (pullRequest.state === _models.PullRequestState.OPEN && pullRequest.mergeable && this.props.conditions.canMerge) {

                    var vetoes = pullRequest.mergeable.vetoes && [].concat(pullRequest.mergeable.vetoes);
                    if (pullRequest.mergeable.conflicted) {
                        // add the conflicted veto as the first item
                        vetoes.unshift({
                            detailedMessage: AJS.I18n.getText('bitbucket.component.pull.request.merge.conflict.detail'),
                            isConflictVeto: true
                        });
                    }

                    var mergeWarningDialogProps = {
                        "aria-controls": MERGE_WARNING_DIALOG_ID,
                        "aria-haspopup": true
                    };

                    var mergeHelpDialog = void 0;
                    if (this.state.mergeHelpDialogShowing) {
                        var stability = this.props.mergeHelp && this.props.mergeHelp.stability;
                        var isAutoMergeConflict = this.props.mergeHelp && this.props.mergeHelp.isAutoMergeConflict;
                        mergeHelpDialog = _react2.default.createElement(_mergeHelpDialog2.default, {
                            id: 'extended-merge-help-dialog',
                            onHide: function onHide() {
                                return _this3.onHideMergeHelpDialog();
                            },
                            pullRequest: pullRequest,
                            stability: stability,
                            isAutoMergeConflict: isAutoMergeConflict
                        });
                    }

                    var mergeWarningInlineDialog = _react2.default.createElement(
                        _inlineDialog2.default,
                        {
                            key: 'merge-warning-dialog',
                            id: MERGE_WARNING_DIALOG_ID,
                            alignment: 'bottom'
                        },
                        _react2.default.createElement(
                            'div',
                            { className: 'merge-warning-content' },
                            _react2.default.createElement(
                                'h6',
                                null,
                                AJS.I18n.getText('bitbucket.component.pull.request.merge.warnings.title')
                            ),
                            _react2.default.createElement(
                                'p',
                                null,
                                AJS.I18n.getText('bitbucket.component.pull.request.merge.warnings.info', vetoes && vetoes.length)
                            ),
                            _react2.default.createElement(
                                'ul',
                                { className: 'aui-list-truncate' },
                                vetoes && vetoes.map(function (veto, i) {
                                    var moreInfoButton = veto.isConflictVeto === undefined ? null : _react2.default.createElement(
                                        'button',
                                        {
                                            className: 'aui-button aui-button-link more-info',
                                            onClick: function onClick() {
                                                return _this3.showExtendedMergeHelp();
                                            }
                                        },
                                        AJS.I18n.getText('bitbucket.component.pull.request.merge.warnings.more.button')
                                    );
                                    return _react2.default.createElement(
                                        'li',
                                        { key: 'merge-issue-' + i },
                                        _react2.default.createElement(
                                            'span',
                                            { className: 'message' },
                                            _react2.default.createElement('span', { className: 'aui-icon aui-icon-small aui-iconfont-warning' }),
                                            veto.detailedMessage
                                        ),
                                        moreInfoButton
                                    );
                                })
                            )
                        )
                    );

                    return _react2.default.createElement(
                        'div',
                        null,
                        _react2.default.createElement(_mergeButton2.default, {
                            onMergeClick: this.props.onMergeClick,
                            onMergeWarningClick: function onMergeWarningClick() {
                                return _this3.onMergeWarningClick();
                            },
                            mergeable: pullRequest.mergeable,
                            conflicted: pullRequest.mergeable.conflicted,
                            vetoes: pullRequest.mergeable.vetoes,
                            extraButtonProps: mergeWarningDialogProps,
                            tooltipVisibility: !this.state.mergeWarningDialogOpen
                        }),
                        mergeWarningInlineDialog,
                        mergeHelpDialog
                    );
                }

                return null;
            }
        }]);
        return Merge;
    }(_react.Component);

    exports.default = Merge;
    module.exports = exports['default'];
});