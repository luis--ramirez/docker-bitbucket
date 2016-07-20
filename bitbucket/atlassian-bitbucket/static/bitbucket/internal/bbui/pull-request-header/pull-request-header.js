define('bitbucket/internal/bbui/pull-request-header/pull-request-header', ['module', 'exports', 'react', 'classnames', 'lodash', '../aui-react/avatar', '../branch-from-to/branch-from-to', '../models/models', '../reviewer-avatar-list/reviewer-avatar-list', '../reviewer-status/reviewer-status', './components/merge', './components/pull-request-more', './components/reopen-button'], function (module, exports, _react, _classnames, _lodash, _avatar, _branchFromTo, _models, _reviewerAvatarList, _reviewerStatus, _merge, _pullRequestMore, _reopenButton) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _avatar2 = babelHelpers.interopRequireDefault(_avatar);

    var _branchFromTo2 = babelHelpers.interopRequireDefault(_branchFromTo);

    var _reviewerAvatarList2 = babelHelpers.interopRequireDefault(_reviewerAvatarList);

    var _reviewerStatus2 = babelHelpers.interopRequireDefault(_reviewerStatus);

    var _merge2 = babelHelpers.interopRequireDefault(_merge);

    var _pullRequestMore2 = babelHelpers.interopRequireDefault(_pullRequestMore);

    var _reopenButton2 = babelHelpers.interopRequireDefault(_reopenButton);

    var propTypes = {
        conditions: _react.PropTypes.objectOf(_react.PropTypes.bool),
        mergeHelp: _react.PropTypes.object,
        currentUserAsReviewer: _react.PropTypes.object,
        currentUserIsWatching: _react.PropTypes.bool,
        currentUserStatus: _react.PropTypes.oneOf(_lodash2.default.values(_models.ApprovalState)),
        onMergeClick: _react.PropTypes.func.isRequired,
        onReOpenClick: _react.PropTypes.func.isRequired,
        onMergeHelpDialogClose: _react.PropTypes.func,
        onMoreAction: _react.PropTypes.func.isRequired,
        onSelfClick: _react.PropTypes.func.isRequired,
        onStatusClick: _react.PropTypes.func.isRequired,
        pullRequest: _react.PropTypes.object.isRequired,
        permissionToReview: _react.PropTypes.bool.isRequired,
        showMergeHelpDialog: _react.PropTypes.bool
    };

    var REVIEWERS_MAX_OPEN = 4;

    var PullRequestHeader = function (_Component) {
        babelHelpers.inherits(PullRequestHeader, _Component);

        function PullRequestHeader() {
            babelHelpers.classCallCheck(this, PullRequestHeader);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(PullRequestHeader).apply(this, arguments));
        }

        babelHelpers.createClass(PullRequestHeader, [{
            key: 'pullRequestStateReadable',
            value: function pullRequestStateReadable(state) {
                var _stateToReadable;

                var stateToReadable = (_stateToReadable = {}, babelHelpers.defineProperty(_stateToReadable, _models.PullRequestState.OPEN, AJS.I18n.getText('bitbucket.component.pull.request.list.state.open')), babelHelpers.defineProperty(_stateToReadable, _models.PullRequestState.DECLINED, AJS.I18n.getText('bitbucket.component.pull.request.list.state.declined')), babelHelpers.defineProperty(_stateToReadable, _models.PullRequestState.MERGED, AJS.I18n.getText('bitbucket.component.pull.request.list.state.merged')), _stateToReadable);
                return stateToReadable.hasOwnProperty(state) ? stateToReadable[state] : '';
            }
        }, {
            key: 'render',
            value: function render() {
                var pullRequest = this.props.pullRequest;

                var pullRequestIsOpen = pullRequest.state === _models.PullRequestState.OPEN;
                var reOpenButton = void 0;
                var reviewerStatus = void 0;

                if (pullRequest.state === _models.PullRequestState.DECLINED && this.props.conditions.canEdit) {
                    reOpenButton = _react2.default.createElement(_reopenButton2.default, {
                        onReOpenClick: this.props.onReOpenClick
                    });
                }

                if (pullRequestIsOpen) {
                    reviewerStatus = _react2.default.createElement(_reviewerStatus2.default, {
                        currentUserAsReviewer: this.props.currentUserAsReviewer,
                        onStatusClick: this.props.onStatusClick,
                        status: this.props.currentUserStatus
                    });
                }

                return _react2.default.createElement(
                    'div',
                    { className: 'pull-request-header' },
                    _react2.default.createElement(
                        'div',
                        { className: 'flexible' },
                        _react2.default.createElement(
                            'div',
                            { className: 'pull-request-metadata' },
                            _react2.default.createElement(_avatar2.default, {
                                className: 'author',
                                person: pullRequest.author,
                                withName: true,
                                withLink: true
                            }),
                            _react2.default.createElement(_branchFromTo2.default, {
                                fromRef: pullRequest.from_ref,
                                toRef: pullRequest.to_ref
                            }),
                            _react2.default.createElement('div', { className: 'divider' }),
                            _react2.default.createElement(
                                'div',
                                { className: (0, _classnames2.default)('status', 'aui-lozenge', {
                                        'aui-lozenge-complete': pullRequest.state === _models.PullRequestState.OPEN,
                                        'aui-lozenge-error': pullRequest.state === _models.PullRequestState.DECLINED,
                                        'aui-lozenge-success': pullRequest.state === _models.PullRequestState.MERGED
                                    }) },
                                this.pullRequestStateReadable(pullRequest.state)
                            )
                        ),
                        _react2.default.createElement(
                            'div',
                            { className: (0, _classnames2.default)('pull-request-actions', { pullRequestIsOpen: pullRequestIsOpen }) },
                            _react2.default.createElement(_reviewerAvatarList2.default, {
                                reviewers: pullRequest.reviewers,
                                menuId: 'overflow-reviewers',
                                triggerClass: 'overflow-reviewers-trigger',
                                maxOpen: REVIEWERS_MAX_OPEN,
                                avatarSize: 'small',
                                reverse: true,
                                onSelfClick: this.props.onSelfClick,
                                currentUserAsReviewer: this.props.currentUserAsReviewer,
                                isWatching: this.props.currentUserIsWatching,
                                permissionToReview: this.props.permissionToReview,
                                pullRequestIsOpen: pullRequestIsOpen
                            }),
                            reviewerStatus,
                            _react2.default.createElement(_merge2.default, {
                                conditions: this.props.conditions,
                                mergeHelp: this.props.mergeHelp,
                                onMergeClick: this.props.onMergeClick,
                                onMergeHelpDialogClose: this.props.onMergeHelpDialogClose,
                                pullRequest: pullRequest,
                                showMergeHelpDialog: this.props.showMergeHelpDialog
                            }),
                            reOpenButton,
                            _react2.default.createElement(_pullRequestMore2.default, {
                                onMoreAction: this.props.onMoreAction,
                                isWatching: this.props.currentUserIsWatching,
                                conditions: this.props.conditions,
                                pullRequest: pullRequest
                            })
                        )
                    ),
                    _react2.default.createElement(
                        'h2',
                        null,
                        pullRequest.title
                    )
                );
            }
        }]);
        return PullRequestHeader;
    }(_react.Component);

    PullRequestHeader.propTypes = propTypes;

    exports.default = PullRequestHeader;
    module.exports = exports['default'];
});