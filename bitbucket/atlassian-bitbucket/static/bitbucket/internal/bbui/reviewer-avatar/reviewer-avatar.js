define('bitbucket/internal/bbui/reviewer-avatar/reviewer-avatar', ['module', 'exports', 'react', 'lodash', '../aui-react/avatar', '../models/models'], function (module, exports, _react, _lodash, _avatar, _models) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _avatar2 = babelHelpers.interopRequireDefault(_avatar);

    var propTypes = {
        avatarSize: _react.PropTypes.string,
        reviewer: _react.PropTypes.shape({
            user: _react.PropTypes.object.isRequired,
            state: _react.PropTypes.oneOf(_lodash2.default.values(_models.ApprovalState)).isRequired
        }).isRequired,
        withName: _react.PropTypes.bool,
        tooltip: _react.PropTypes.bool,
        nameOnly: _react.PropTypes.bool
    };

    var visibleBadgeCssClass = {
        APPROVED: 'approved',
        NEEDS_WORK: 'needs-work'
    };

    var avatarBadges = [{
        className: visibleBadgeCssClass.APPROVED,
        text: AJS.I18n.getText('bitbucket.component.avatar.badge.approved')
    }, {
        className: visibleBadgeCssClass.NEEDS_WORK,
        text: AJS.I18n.getText('bitbucket.component.avatar.badge.needs.work')
    }];

    function reviewerTooltip(reviewer, nameOnly) {
        var name = reviewer.user.display_name || reviewer.user.name;
        var displayText = void 0;
        if (nameOnly || !reviewer.state || reviewer.state === _models.ApprovalState.UNAPPROVED) {
            displayText = name;
        } else if (reviewer.state === _models.ApprovalState.APPROVED) {
            displayText = AJS.I18n.getText('bitbucket.component.pull.request.reviewer.tooltip.approved', name);
        } else {
            displayText = AJS.I18n.getText('bitbucket.component.pull.request.reviewer.tooltip.needs.work', name);
        }
        return displayText;
    }

    var ReviewerAvatar = function (_Component) {
        babelHelpers.inherits(ReviewerAvatar, _Component);

        function ReviewerAvatar() {
            babelHelpers.classCallCheck(this, ReviewerAvatar);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(ReviewerAvatar).apply(this, arguments));
        }

        babelHelpers.createClass(ReviewerAvatar, [{
            key: 'shouldComponentUpdate',
            value: function shouldComponentUpdate(newProps) {
                return this.props.reviewer.user.name !== newProps.reviewer.user.name || this.props.reviewer.state !== newProps.reviewer.state || this.props.avatarSize !== newProps.avatarSize || Boolean(this.props.nameOnly) !== Boolean(newProps.nameOnly) || Boolean(this.props.tooltip) !== Boolean(newProps.tooltip) || Boolean(this.props.withName) !== Boolean(newProps.withName);
            }
        }, {
            key: 'render',
            value: function render() {
                var props = this.props;
                return _react2.default.createElement(_avatar2.default, {
                    person: props.reviewer.user,
                    size: props.avatarSize,
                    badges: avatarBadges,
                    tooltipText: reviewerTooltip(props.reviewer, props.nameOnly),
                    visibleBadge: props.reviewer.state ? visibleBadgeCssClass[props.reviewer.state] : '',
                    withName: props.withName,
                    tooltip: props.tooltip
                });
            }
        }]);
        return ReviewerAvatar;
    }(_react.Component);

    ReviewerAvatar.propTypes = propTypes;
    exports.default = ReviewerAvatar;
    module.exports = exports['default'];
});