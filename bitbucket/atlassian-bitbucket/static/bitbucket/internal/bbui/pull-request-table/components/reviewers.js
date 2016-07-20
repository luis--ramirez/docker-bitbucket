define('bitbucket/internal/bbui/pull-request-table/components/reviewers', ['module', 'exports', 'react', 'lodash', '../../reviewer-avatar-list/reviewer-avatar-list'], function (module, exports, _react, _lodash, _reviewerAvatarList) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _reviewerAvatarList2 = babelHelpers.interopRequireDefault(_reviewerAvatarList);

    var MAX_OPEN = 3;

    function anyReviewersDifferent(oldReviewers, newReviewers) {
        return oldReviewers.length !== newReviewers.length || _lodash2.default.zip(oldReviewers, newReviewers).some(function (a, b) {
            return a.name !== b.name || a.state !== b.state;
        });
    }

    var Reviewers = function (_Component) {
        babelHelpers.inherits(Reviewers, _Component);

        function Reviewers() {
            babelHelpers.classCallCheck(this, Reviewers);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Reviewers).apply(this, arguments));
        }

        babelHelpers.createClass(Reviewers, [{
            key: 'shouldComponentUpdate',
            value: function shouldComponentUpdate(newProps) {
                return this.props.pullRequest.id !== newProps.pullRequest.id || anyReviewersDifferent(this.props.pullRequest.reviewers, newProps.pullRequest.reviewers) || this.props.pullRequest.state !== newProps.pullRequest.state;
            }
        }, {
            key: 'render',
            value: function render() {
                var pullRequest = this.props.pullRequest;

                return _react2.default.createElement(
                    'td',
                    { className: 'reviewers' },
                    _react2.default.createElement(_reviewerAvatarList2.default, {
                        avatarSize: 'small',
                        currentUserAsReviewer: this.props.currentUser,
                        currentUserAvatarSize: this.props.currentUserAvatarSize,
                        dialogReviewersAsTooltip: this.props.dialogReviewersAsTooltip,
                        maxOpen: MAX_OPEN,
                        menuId: 'reviewers-' + pullRequest.id,
                        permissionToReview: false,
                        pullRequestIsOpen: pullRequest.state === 'OPEN',
                        reviewers: pullRequest.reviewers
                    })
                );
            }
        }], [{
            key: 'propTypes',
            get: function get() {
                return {
                    currentUser: _react.PropTypes.object,
                    currentUserAvatarSize: _react.PropTypes.string,
                    dialogReviewersAsTooltip: _reviewerAvatarList2.default.propTypes.dialogReviewersAsTooltip,
                    pullRequest: _react.PropTypes.object.isRequired
                };
            }
        }]);
        return Reviewers;
    }(_react.Component);

    Reviewers.Header = function () {
        return _react2.default.createElement(
            'th',
            { className: 'reviewers', scope: 'col' },
            AJS.I18n.getText('bitbucket.pull.request.table.title.reviewers')
        );
    };

    exports.default = Reviewers;
    module.exports = exports['default'];
});