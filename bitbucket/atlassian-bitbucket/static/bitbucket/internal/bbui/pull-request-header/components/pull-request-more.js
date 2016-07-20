define('bitbucket/internal/bbui/pull-request-header/components/pull-request-more', ['module', 'exports', 'react', 'classnames', 'jquery', 'lodash', 'bitbucket/internal/impl/web-fragments', '../../aui-react/component', '../../models/models'], function (module, exports, _react, _classnames, _jquery, _lodash, _webFragments, _component, _models) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _webFragments2 = babelHelpers.interopRequireDefault(_webFragments);

    var _component2 = babelHelpers.interopRequireDefault(_component);

    var propTypes = {
        onMoreAction: _react.PropTypes.func.isRequired,
        isWatching: _react.PropTypes.bool.isRequired,
        conditions: _react.PropTypes.objectOf(_react.PropTypes.bool).isRequired,
        pullRequest: _react.PropTypes.object.isRequired
    };

    var PullRequestMore = function (_Component) {
        babelHelpers.inherits(PullRequestMore, _Component);

        function PullRequestMore() {
            babelHelpers.classCallCheck(this, PullRequestMore);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(PullRequestMore).call(this));

            _this.dropdownIsVisible = false;

            var reasonableDelay = 50;
            _this.throttledTriggerHideOnScroll = _lodash2.default.throttle(function () {
                if (this.dropdownIsVisible) {
                    (0, _jquery2.default)('.pull-request-more-trigger').trigger("aui-button-invoke");
                }
            }.bind(_this), reasonableDelay);
            return _this;
        }

        babelHelpers.createClass(PullRequestMore, [{
            key: 'componentDidMount',
            value: function componentDidMount() {
                var _this2 = this;

                // hide the more menu when it's supposed to be closed
                // For whatever reason (probably a react / non-react conflict) the more menu doesn't hide itself properly
                // and instead hangs around too long. We force it to hide here.
                (0, _jquery2.default)("#pull-request-header-more").on({
                    "aui-dropdown2-show": function auiDropdown2Show() {
                        _this2.dropdownIsVisible = true;
                    },
                    "aui-dropdown2-hide": function auiDropdown2Hide(event) {
                        (0, _jquery2.default)(event.target).hide();
                        _this2.dropdownIsVisible = false;
                    }
                });

                (0, _jquery2.default)(document).on('scroll', this.throttledTriggerHideOnScroll);
            }
        }, {
            key: 'componentWillUnmount',
            value: function componentWillUnmount() {
                (0, _jquery2.default)("#pull-request-header-more").off("aui-dropdown2-hide");
                (0, _jquery2.default)(document).off('scroll', this.throttledTriggerHideOnScroll);
            }
        }, {
            key: 'render',
            value: function render() {
                var _this3 = this;

                var editMenuItem = void 0;
                var declineMenuItem = void 0;
                var pullRequestIsOpen = this.props.pullRequest.state === _models.PullRequestState.OPEN;
                var pullRequestIsMerged = this.props.pullRequest.state === _models.PullRequestState.MERGED;

                var addonActions = _webFragments2.default.getWebItems('bitbucket.pullrequest.action', { pullRequest: this.props.pullRequest });
                var deprecatedActions = _lodash2.default.flatten(_webFragments2.default.getWebSections('bitbucket.internal.pullrequest.toolbar.deprecated').map(function (section) {
                    return _webFragments2.default.getWebItems('bitbucket.internal.pullrequest.toolbar.deprecated/' + section.key);
                }));

                if (this.props.conditions.canEdit && !pullRequestIsMerged) {
                    // disallow editing merged pull requests.
                    editMenuItem = _react2.default.createElement(
                        'li',
                        null,
                        _react2.default.createElement(
                            'button',
                            { className: 'aui-button aui-button-link', role: 'menuitem', 'data-action': 'edit' },
                            AJS.I18n.getText('bitbucket.component.pull.request.edit')
                        )
                    );
                }
                if (this.props.conditions.canDecline && pullRequestIsOpen) {
                    declineMenuItem = _react2.default.createElement(
                        'li',
                        null,
                        _react2.default.createElement(
                            'button',
                            { className: 'aui-button aui-button-link', role: 'menuitem', 'data-action': 'decline' },
                            AJS.I18n.getText('bitbucket.component.pull.request.decline')
                        )
                    );
                }
                return _react2.default.createElement(
                    'div',
                    null,
                    _react2.default.createElement(
                        'button',
                        {
                            className: 'pull-request-more-trigger aui-button aui-button-subtle aui-dropdown2-trigger aui-dropdown2-trigger-arrowless',
                            'aria-haspopup': 'true',
                            'aria-owns': 'pull-request-header-more'
                        },
                        _react2.default.createElement(
                            'span',
                            { className: 'aui-icon aui-icon-small aui-iconfont-more' },
                            AJS.I18n.getText('bitbucket.component.pull.request.more')
                        )
                    ),
                    _react2.default.createElement(
                        _component2.default,
                        {
                            id: 'pull-request-header-more',
                            markup: '<div class="aui-style-default aui-dropdown2"></div>',
                            wrapperClass: 'aui-dropdown2-section'
                        },
                        _react2.default.createElement(
                            'ul',
                            { className: 'aui-list-truncate', onClick: function onClick(e) {
                                    return _this3.props.onMoreAction(e.target.dataset.action);
                                } },
                            editMenuItem,
                            declineMenuItem,
                            _react2.default.createElement(
                                'li',
                                null,
                                _react2.default.createElement(
                                    'button',
                                    { className: 'aui-button aui-button-link', role: 'menuitem', 'data-action': 'watch' },
                                    this.props.isWatching ? AJS.I18n.getText('bitbucket.component.pull.request.unwatch') : AJS.I18n.getText('bitbucket.component.pull.request.watch')
                                )
                            ),
                            addonActions.concat(deprecatedActions).map(function (webItem) {
                                return _react2.default.createElement(
                                    'li',
                                    { key: webItem.completeModuleKey || webItem.key },
                                    webItem.url ? _react2.default.createElement(
                                        'a',
                                        { href: webItem.url, className: webItem.cssClass, id: webItem.id, title: webItem.tooltip },
                                        webItem.text
                                    ) : _react2.default.createElement(
                                        'button',
                                        { className: (0, _classnames2.default)("aui-button aui-button-link", webItem.cssClass),
                                            role: 'menuitem', id: webItem.id, title: webItem.tooltip
                                        },
                                        webItem.text
                                    )
                                );
                            })
                        )
                    )
                );
            }
        }]);
        return PullRequestMore;
    }(_react.Component);

    PullRequestMore.propTypes = propTypes;

    exports.default = PullRequestMore;
    module.exports = exports['default'];
});