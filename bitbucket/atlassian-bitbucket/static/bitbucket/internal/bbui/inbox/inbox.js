define('bitbucket/internal/bbui/inbox/inbox', ['module', 'exports', 'react', 'jquery', 'lodash', '../aui-react/spinner', '../models/models', '../paged-table/paged-table', '../pull-request-table/components/author-avatar', '../pull-request-table/components/comments', '../pull-request-table/components/pull-request-row', '../pull-request-table/components/reviewers', '../pull-request-table/components/tasks', '../pull-request-table/components/web-section', '../utils/pull-request-unique-id', './components/summary'], function (module, exports, _react, _jquery, _lodash, _spinner, _models, _pagedTable, _authorAvatar, _comments, _pullRequestRow, _reviewers, _tasks, _webSection, _pullRequestUniqueId, _summary) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _spinner2 = babelHelpers.interopRequireDefault(_spinner);

    var _models2 = babelHelpers.interopRequireDefault(_models);

    var _pagedTable2 = babelHelpers.interopRequireDefault(_pagedTable);

    var _authorAvatar2 = babelHelpers.interopRequireDefault(_authorAvatar);

    var _comments2 = babelHelpers.interopRequireDefault(_comments);

    var _pullRequestRow2 = babelHelpers.interopRequireDefault(_pullRequestRow);

    var _reviewers2 = babelHelpers.interopRequireDefault(_reviewers);

    var _tasks2 = babelHelpers.interopRequireDefault(_tasks);

    var _pullRequestUniqueId2 = babelHelpers.interopRequireDefault(_pullRequestUniqueId);

    var _summary2 = babelHelpers.interopRequireDefault(_summary);

    var Inbox = function (_Component) {
        babelHelpers.inherits(Inbox, _Component);

        function Inbox() {
            babelHelpers.classCallCheck(this, Inbox);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Inbox).apply(this, arguments));
        }

        babelHelpers.createClass(Inbox, [{
            key: 'componentDidMount',
            value: function componentDidMount() {
                (0, _jquery2.default)(document).on('click', '.inbox-table-wrapper .tabs-menu a', this.changeTabs);

                this.props.created.onMoreItemsRequested();
                this.props.reviewing.onMoreItemsRequested();
            }
        }, {
            key: 'componentWillUnmount',
            value: function componentWillUnmount() {
                (0, _jquery2.default)(document).off('click', '.inbox-table-wrapper .tabs-menu a', this.changeTabs);
            }
        }, {
            key: 'changeTabs',
            value: function changeTabs(event) {
                AJS.tabs.change((0, _jquery2.default)(event.currentTarget), event);
                event.preventDefault();
            }
        }, {
            key: 'isPrReviewed',
            value: function isPrReviewed(reviewers, currentUser) {
                return _lodash2.default.some(reviewers, function (reviewer) {
                    return reviewer.user.name === currentUser.name && reviewer.state === _models2.default.ApprovalState.NEEDS_WORK;
                });
            }
        }, {
            key: 'render',
            value: function render() {
                var _this2 = this;

                var props = this.props;
                var emptyInbox = _react2.default.createElement(
                    'div',
                    { className: 'empty-inbox-message' },
                    _react2.default.createElement(
                        'span',
                        { className: 'aui-icon aui-icon-large aui-iconfont-workbox-empty' },
                        AJS.I18n.getText('bitbucket.component.inbox.empty.description')
                    ),
                    _react2.default.createElement(
                        'h3',
                        null,
                        AJS.I18n.getText('bitbucket.component.inbox.empty.title')
                    )
                );

                var reviewingContent = props.reviewing.pullRequests.length || props.reviewing.loading ? _react2.default.createElement(_pagedTable2.default, babelHelpers.extends({}, props.reviewing, {
                    className: 'pull-requests-table',
                    allFetchedMessage: AJS.I18n.getText('bitbucket.pull.request.all.fetched'),
                    items: props.reviewing.pullRequests,
                    onMoreItemsRequested: props.reviewing.onMoreItemsRequested,
                    scrollElement: '.inbox-table-wrapper',
                    row: function row(_ref) {
                        var item = _ref.item;
                        var focused = _ref.focused;

                        var pullRequest = item;
                        return _react2.default.createElement(
                            _pullRequestRow2.default,
                            {
                                key: (0, _pullRequestUniqueId2.default)(pullRequest),
                                focused: focused,
                                prNeedsWork: _this2.isPrReviewed(pullRequest.reviewers, props.currentUser)
                            },
                            _react2.default.createElement(_authorAvatar2.default, { author: pullRequest.author }),
                            _react2.default.createElement(_summary2.default, { pullRequest: pullRequest }),
                            _webSection.beforeSections.map(function (section) {
                                return _react2.default.createElement(_webSection.WebSectionCell, {
                                    key: section.key + '::before',
                                    where: 'before',
                                    webSection: section,
                                    pullRequest: pullRequest
                                });
                            }),
                            _react2.default.createElement(_reviewers2.default, {
                                currentUser: props.currentUser,
                                currentUserAvatarSize: 'medium',
                                dialogReviewersAsTooltip: true,
                                pullRequest: pullRequest
                            }),
                            _react2.default.createElement(_comments2.default, { pullRequest: pullRequest }),
                            _react2.default.createElement(_tasks2.default, { pullRequest: pullRequest })
                        );
                    }
                })) : emptyInbox;

                var createdContent = props.created.pullRequests.length || props.created.loading ? _react2.default.createElement(_pagedTable2.default, babelHelpers.extends({}, props.created, {
                    className: 'pull-requests-table',
                    allFetchedMessage: AJS.I18n.getText('bitbucket.pull.request.all.fetched'),
                    items: props.created.pullRequests,
                    onMoreItemsRequested: props.created.onMoreItemsRequested,
                    scrollElement: '.inbox-table-wrapper',
                    row: function row(_ref2) {
                        var item = _ref2.item;
                        var focused = _ref2.focused;

                        var pullRequest = item;
                        return _react2.default.createElement(
                            _pullRequestRow2.default,
                            { key: (0, _pullRequestUniqueId2.default)(pullRequest), focused: focused },
                            _react2.default.createElement(_summary2.default, { pullRequest: pullRequest }),
                            _webSection.beforeSections.map(function (section) {
                                return _react2.default.createElement(_webSection.WebSectionCell, {
                                    key: section.key + '::before',
                                    where: 'before',
                                    webSection: section,
                                    pullRequest: pullRequest
                                });
                            }),
                            _react2.default.createElement(_reviewers2.default, {
                                pullRequest: pullRequest,
                                dialogReviewersAsTooltip: true
                            }),
                            _react2.default.createElement(_comments2.default, { pullRequest: pullRequest }),
                            _react2.default.createElement(_tasks2.default, { pullRequest: pullRequest })
                        );
                    }
                })) : emptyInbox;

                var dialogContent = !props.reviewing.pullRequests.length && !props.created.pullRequests.length && (props.reviewing.loading || props.created.loading) ? _react2.default.createElement(
                    'div',
                    { className: 'inbox-spinner-padding' },
                    _react2.default.createElement(_spinner2.default, null)
                ) : _react2.default.createElement(
                    'div',
                    { id: 'inbox-wapper' },
                    _react2.default.createElement(
                        'h2',
                        null,
                        AJS.I18n.getText('bitbucket.component.inbox.title')
                    ),
                    _react2.default.createElement(
                        'div',
                        { className: 'inbox-table-wrapper aui-tabs horizontal-tabs' },
                        _react2.default.createElement(
                            'ul',
                            { className: 'tabs-menu' },
                            _react2.default.createElement(
                                'li',
                                { className: 'active-tab inbox-reviewer-tab menu-item' },
                                _react2.default.createElement(
                                    'a',
                                    { href: '#inbox-pull-request-reviewer' },
                                    AJS.I18n.getText('bitbucket.component.inbox.reviewing')
                                )
                            ),
                            _react2.default.createElement(
                                'li',
                                { className: 'inbox-created-tab menu-item' },
                                _react2.default.createElement(
                                    'a',
                                    { href: '#inbox-pull-request-created' },
                                    AJS.I18n.getText('bitbucket.component.inbox.created')
                                )
                            )
                        ),
                        _react2.default.createElement(
                            'div',
                            { id: 'inbox-pull-request-reviewer', className: 'tabs-pane active-pane' },
                            reviewingContent
                        ),
                        _react2.default.createElement(
                            'div',
                            { id: 'inbox-pull-request-created', className: 'tabs-pane' },
                            createdContent
                        )
                    )
                );

                return dialogContent;
            }
        }], [{
            key: 'propTypes',
            get: function get() {
                return {
                    created: _react.PropTypes.shape({
                        allFetched: _react.PropTypes.bool.isRequired,
                        loading: _react.PropTypes.bool.isRequired,
                        onMoreItemsRequested: _react.PropTypes.func.isRequired,
                        pullRequests: _react.PropTypes.array.isRequired
                    }).isRequired,
                    currentUser: _react.PropTypes.object.isRequired,
                    reviewing: _react.PropTypes.shape({
                        allFetched: _react.PropTypes.bool.isRequired,
                        loading: _react.PropTypes.bool.isRequired,
                        onMoreItemsRequested: _react.PropTypes.func.isRequired,
                        pullRequests: _react.PropTypes.array.isRequired
                    }).isRequired
                };
            }
        }]);
        return Inbox;
    }(_react.Component);

    exports.default = Inbox;
    module.exports = exports['default'];
});