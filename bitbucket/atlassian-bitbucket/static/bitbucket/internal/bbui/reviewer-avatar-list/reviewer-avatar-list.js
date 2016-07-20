define('bitbucket/internal/bbui/reviewer-avatar-list/reviewer-avatar-list', ['module', 'exports', 'react', 'classnames', 'lodash', '../aui-react/inline-dialog', '../models/models', '../reviewer-avatar/reviewer-avatar', '../self-reviewer/self-reviewer'], function (module, exports, _react, _classnames, _lodash, _inlineDialog, _models, _reviewerAvatar, _selfReviewer) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _inlineDialog2 = babelHelpers.interopRequireDefault(_inlineDialog);

    var _models2 = babelHelpers.interopRequireDefault(_models);

    var _reviewerAvatar2 = babelHelpers.interopRequireDefault(_reviewerAvatar);

    var _selfReviewer2 = babelHelpers.interopRequireDefault(_selfReviewer);

    var _statusMap;

    var propTypes = {
        avatarSize: _react.PropTypes.string,
        currentUserAsReviewer: _react.PropTypes.object,
        currentUserAvatarSize: _react.PropTypes.string,
        dialogReviewersAsTooltip: _react.PropTypes.bool,
        isWatching: _react.PropTypes.bool,
        maxOpen: _react.PropTypes.number,
        menuId: _react.PropTypes.string.isRequired,
        onSelfClick: _react.PropTypes.func,
        permissionToReview: _react.PropTypes.bool.isRequired,
        pullRequestIsOpen: _react.PropTypes.bool.isRequired,
        reverse: _react.PropTypes.bool,
        reviewers: _react.PropTypes.array.isRequired,
        triggerClass: _react.PropTypes.string
    };

    var approvalOrder = {
        APPROVED: 1,
        NEEDS_WORK: 2,
        UNAPPROVED: 3
    };

    var statusMap = (_statusMap = {}, babelHelpers.defineProperty(_statusMap, _models2.default.ApprovalState.APPROVED, AJS.I18n.getText('bitbucket.component.avatar.badge.approved')), babelHelpers.defineProperty(_statusMap, _models2.default.ApprovalState.NEEDS_WORK, AJS.I18n.getText('bitbucket.component.avatar.badge.needs.work')), _statusMap);

    function sortReviewers(reviewers) {
        return reviewers.slice().sort(function (a, b) {
            return approvalOrder[a.state] - approvalOrder[b.state] || a.user.display_name.localeCompare(b.user.display_name);
        });
    }

    /**
     * Displays a list of avatars
     *
     * @param {Object} props - Component properties
     * @param {Array} props.reviewers - The reviewers
     * @param {string} props.menuId - ID for the overflow dialog
     * @param {string?} props.triggerClass - Additional classes for the overflow dialog trigger
     * @param {number?} props.maxOpen - Maximum number of reviewers to show before overflow
     * @param {string?} props.avatarSize - Avatar size to show reviewers at
     * @param {boolean?} props.reverse - Order to show reviewers
     * @returns {ReactElement} - rendered component
     */
    var ReviewerAvatarList = function ReviewerAvatarList(props) {
        var sortedReviewers = sortReviewers(props.reviewers);
        var currentUserIndex = props.currentUserAsReviewer ? _lodash2.default.findIndex(sortedReviewers, function (user) {
            return user.user.name === (props.currentUserAsReviewer.name || props.currentUserAsReviewer.user.name);
        }) : -1;

        var showingSelfReviewer = props.permissionToReview && props.pullRequestIsOpen;
        var maxOpen = showingSelfReviewer ? props.maxOpen - 1 : props.maxOpen;
        if (currentUserIndex > -1) {
            // remove current user from ReviewerAvatarList,
            // instead shown in SelfReviewer component
            var currentUser = sortedReviewers.splice(currentUserIndex, 1)[0];

            // put the currentUser in front when
            // SelfReviewer component is hidden
            // or if we want to change the current user's avatar size
            if (!showingSelfReviewer || props.currentUserAvatarSize) {
                sortedReviewers.unshift(currentUser);
            }
        }

        var visibleReviewers = void 0;
        var dialogReviewers = void 0;
        if (sortedReviewers.length > maxOpen) {
            visibleReviewers = sortedReviewers.slice(0, maxOpen - 1);
            dialogReviewers = sortedReviewers.slice(maxOpen - 1);
        } else {
            visibleReviewers = sortedReviewers;
            dialogReviewers = [];
        }

        var visibleAvatars = visibleReviewers.map(function (reviewer) {
            return _react2.default.createElement(_reviewerAvatar2.default, {
                reviewer: reviewer,
                key: reviewer.user.name,
                avatarSize: props.currentUserAsReviewer && props.currentUserAvatarSize && reviewer.user.name === props.currentUserAsReviewer.name ? props.currentUserAvatarSize : 'small'
            });
        });
        var children = visibleAvatars.slice();

        if (showingSelfReviewer) {
            children.unshift(_react2.default.createElement(_selfReviewer2.default, {
                removeSelfModalId: 'remove-self-modal',
                currentUserAsReviewer: props.currentUserAsReviewer,
                isWatching: props.isWatching,
                key: 'self_reviewer',
                onSelfClick: props.onSelfClick
            }));
        }

        if (dialogReviewers.length) {
            if (props.dialogReviewersAsTooltip) {
                var tooltipString = '';
                dialogReviewers.map(function (reviewer, i, arr) {
                    tooltipString += reviewer.user.display_name;
                    if (reviewer.state !== _models2.default.ApprovalState.UNAPPROVED) {
                        tooltipString += ' (' + statusMap[reviewer.state] + ')';
                    }
                    if (i + 1 < arr.length) {
                        tooltipString += '<br>';
                    }
                });
                children.push(_react2.default.createElement(
                    'button',
                    {
                        className: 'overflow-reviewers-trigger overflow-reviewers-tooltip aui-button aui-button-subtle',
                        key: 'overflow-reviewers-tooltip',
                        title: tooltipString,
                        ref: function ref(el) {
                            return AJS.$(el).tooltip({
                                html: true
                            });
                        }
                    },
                    '+',
                    dialogReviewers.length
                ));
            } else {
                children.push(_react2.default.createElement(
                    _inlineDialog.InlineDialogTrigger,
                    {
                        key: 'trigger',
                        dialogId: props.menuId,
                        className: (0, _classnames2.default)('aui-button-subtle overflow-reviewers-trigger', props.triggerClass)
                    },
                    '+',
                    dialogReviewers.length
                ));
                children.push(_react2.default.createElement(
                    _inlineDialog2.default,
                    {
                        key: 'dialog',
                        id: props.menuId,
                        className: 'overflow-reviewers',
                        alignment: props.reverse ? 'left top' : 'bottom right'
                    },
                    _react2.default.createElement(
                        'div',
                        { className: 'avatar-dropdown' },
                        _react2.default.createElement(
                            'ul',
                            { className: 'aui-list-truncate' },
                            dialogReviewers.map(function (reviewer) {
                                return _react2.default.createElement(
                                    'li',
                                    { key: reviewer.user.name },
                                    _react2.default.createElement(_reviewerAvatar2.default, { reviewer: reviewer, tooltip: false, nameOnly: true, withName: true })
                                );
                            })
                        )
                    )
                ));
            }
        }

        return _react2.default.createElement(
            'div',
            { className: (0, _classnames2.default)('reviewer-avatar-list', { reviewing: props.currentUserAsReviewer, reversed: props.reverse }) },
            props.reverse ? children.reverse() : children
        );
    };

    ReviewerAvatarList.propTypes = propTypes;
    exports.default = ReviewerAvatarList;
    module.exports = exports['default'];
});