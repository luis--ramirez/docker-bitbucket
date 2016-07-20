define('bitbucket/internal/bbui/pull-request-list/pull-request-list', ['module', 'exports', 'jquery', 'lodash', 'react', 'react-dom', 'bitbucket/internal/impl/urls', '../aui-react/avatar', '../aui-react/icon', '../filter-bar/filter-bar', '../models/models', '../pull-request-list-table/pull-request-list-table', './dom-event'], function (module, exports, _jquery, _lodash, _react, _reactDom, _urls, _avatar, _icon, _filterBar, _models, _pullRequestListTable, _domEvent) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _reactDom2 = babelHelpers.interopRequireDefault(_reactDom);

    var _urls2 = babelHelpers.interopRequireDefault(_urls);

    var _avatar2 = babelHelpers.interopRequireDefault(_avatar);

    var _icon2 = babelHelpers.interopRequireDefault(_icon);

    var _filterBar2 = babelHelpers.interopRequireDefault(_filterBar);

    var _models2 = babelHelpers.interopRequireDefault(_models);

    var _pullRequestListTable2 = babelHelpers.interopRequireDefault(_pullRequestListTable);

    var _domEvent2 = babelHelpers.interopRequireDefault(_domEvent);

    function renderAuthorItem(selectionOrResult, author, $container) {
        var size = selectionOrResult === 'selection' ? 'xsmall' : 'small';
        _reactDom2.default.render(_react2.default.createElement(_avatar2.default, {
            person: author,
            size: size,
            withName: true,
            withEmail: selectionOrResult === 'result',
            className: "pull-request-list-filter filter-" + selectionOrResult
        }), $container[0]);
    }

    function renderBranchItem(selectionOrResult, branch, $container) {
        _reactDom2.default.render(_react2.default.createElement(
            'span',
            { className: "pull-request-list-filter filter-" + selectionOrResult },
            _react2.default.createElement(
                _icon2.default,
                { size: 'small', icon: 'devtools-branch' },
                AJS.I18n.getText('bitbucket.component.pull.request.list.branch')
            ),
            _react2.default.createElement(
                'span',
                { className: 'name', title: branch.display_id },
                branch.display_id
            )
        ), $container[0]);
    }

    var GettingStarted = function GettingStarted(props) {
        return _react2.default.createElement(
            'div',
            { className: 'pull-request-intro' },
            _react2.default.createElement('div', { className: 'intro-image' }),
            _react2.default.createElement(
                'div',
                { className: 'intro-text' },
                _react2.default.createElement(
                    'h3',
                    null,
                    AJS.I18n.getText('bitbucket.component.pull.request.list.intro.title')
                ),
                _react2.default.createElement(
                    'p',
                    null,
                    AJS.I18n.getText('bitbucket.component.pull.request.list.intro.description')
                )
            ),
            _react2.default.createElement(
                'div',
                { className: 'intro-buttons' },
                _react2.default.createElement(
                    'a',
                    { id: 'empty-list-create-pr-button', className: 'aui-button aui-button-primary', href: _urls2.default.createPullRequest(props.repository) },
                    AJS.I18n.getText('bitbucket.component.pull.request.list.intro.button.create')
                ),
                _react2.default.createElement(
                    'a',
                    { id: 'empty-list-help-button', className: 'aui-button aui-button-link help-button', target: '_blank', href: _urls2.default.help('help.pull.request') },
                    AJS.I18n.getText('bitbucket.component.pull.request.list.intro.button.help')
                )
            )
        );
    };
    GettingStarted.propTypes = {
        repository: _react.PropTypes.object
    };

    var NoResults = function NoResults(props) {
        function resetFilters(e) {
            if ((0, _jquery2.default)(e.target).closest('#reset-filters').length && (0, _domEvent2.default)(e)) {
                props.onResetFilters();
                e.preventDefault();
            }
        }
        return _react2.default.createElement(
            'div',
            { className: 'empty-banner-content' },
            _react2.default.createElement(
                'h3',
                null,
                props.filtered ? AJS.I18n.getText('bitbucket.component.pull.request.filtered.no.matches') : AJS.I18n.getText('bitbucket.component.pull.request.no.open')
            ),
            _react2.default.createElement('p', { dangerouslySetInnerHTML: {
                    __html: props.filtered ? AJS.I18n.getText('bitbucket.component.pull.request.filtered.no.matches.description', '<a id="reset-filters" href="' + _urls2.default.allPullRequests(props.repository) + '">', '</a>') : AJS.I18n.getText('bitbucket.component.pull.request.no.open.description', '<a href="' + _urls2.default.createPullRequest(props.repository) + '">', '</a>')
                }, onClick: resetFilters
            })
        );
    };
    NoResults.propTypes = {
        filtered: _react.PropTypes.bool.isRequired,
        repository: _react.PropTypes.object,
        onResetFilters: _react.PropTypes.func
    };

    var PullRequestList = function (_Component) {
        babelHelpers.inherits(PullRequestList, _Component);
        babelHelpers.createClass(PullRequestList, null, [{
            key: 'propTypes',
            get: function get() {
                var handledByUs = ['id', 'label'];
                return {
                    allFetched: _react.PropTypes.bool.isRequired,
                    currentUser: _react.PropTypes.any,
                    initialFilter: _react.PropTypes.shape({
                        state: _react.PropTypes.shape(_lodash2.default.omit(_filterBar2.default.Select.propTypes, handledByUs)).isRequired,
                        author: _react.PropTypes.shape(_lodash2.default.omit(_filterBar2.default.AsyncSelect.propTypes, handledByUs)).isRequired,
                        target_ref: _react.PropTypes.shape(_lodash2.default.omit(_filterBar2.default.AsyncSelect.propTypes, handledByUs)).isRequired,
                        reviewer_self: _react.PropTypes.shape(_lodash2.default.omit(_filterBar2.default.Toggle.propTypes, handledByUs)).isRequired
                    }),
                    focusedIndex: _react.PropTypes.number,
                    gettingStarted: _react.PropTypes.bool,
                    loading: _react.PropTypes.bool.isRequired,
                    onFilterChange: _react.PropTypes.func.isRequired,
                    onMorePrsRequested: _react.PropTypes.func.isRequired,
                    pullRequests: _react.PropTypes.array.isRequired,
                    repository: _react.PropTypes.any.isRequired,
                    selectedAuthor: _react.PropTypes.any,
                    selectedTargetBranch: _react.PropTypes.any
                };
            }
        }]);

        function PullRequestList() {
            var _Object$getPrototypeO;

            babelHelpers.classCallCheck(this, PullRequestList);

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var _this = babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(PullRequestList)).call.apply(_Object$getPrototypeO, [this].concat(args)));

            _this.onFilterChange = _this.onFilterChange.bind(_this);
            _this.resetFilters = _this.resetFilters.bind(_this);
            return _this;
        }

        babelHelpers.createClass(PullRequestList, [{
            key: 'componentWillMount',
            value: function componentWillMount() {
                if (!this.props.pullRequests.length && !this.props.allFetched) {
                    this.props.onMorePrsRequested();
                }

                this.setState({
                    isFiltered: !!this.props.initialFilter.state.value && this.props.initialFilter.state.value !== 'OPEN' || !!this.props.initialFilter.author.value || !!this.props.initialFilter.target_ref.value || !!this.props.initialFilter.reviewer_self.value
                });
            }
        }, {
            key: 'onFilterChange',
            value: function onFilterChange(newState) {
                var _this2 = this;

                var cleanState = {
                    state: newState['pr-state-filter'],
                    author_id: newState['pr-author-filter'] || null,
                    target_ref_id: newState['pr-target-branch-filter'] || null,
                    reviewer_self: newState['pr-reviewer-self-filter']
                };
                this.setState({
                    isFiltered: cleanState.state !== 'OPEN' || !!cleanState.author_id || !!cleanState.target_ref_id || !!cleanState.reviewer_self
                }, function () {
                    return _this2.props.onFilterChange(cleanState);
                });
            }
        }, {
            key: 'resetFilters',
            value: function resetFilters() {
                if (this._filterBar) {
                    this._filterBar.reset();
                }
            }
        }, {
            key: 'render',
            value: function render() {
                var _this3 = this;

                var noPrs = !this.props.loading && this.props.pullRequests.length === 0;
                var children = [];
                if (noPrs && this.props.gettingStarted) {
                    children.push(_react2.default.createElement(GettingStarted, { key: 'getting-started', repository: this.props.repository }));
                } else {
                    children.push(_react2.default.createElement(
                        _filterBar2.default,
                        { key: 'filter-bar', onChange: this.onFilterChange, ref: function ref(el) {
                                return _this3._filterBar = el;
                            } },
                        _react2.default.createElement(_filterBar2.default.Select, babelHelpers.extends({}, this.props.initialFilter.state, {
                            id: 'pr-state-filter',
                            label: AJS.I18n.getText('bitbucket.component.pull.request.list.state'),
                            menu: {
                                items: [{
                                    id: _models2.default.PullRequestState.OPEN,
                                    text: AJS.I18n.getText('bitbucket.component.pull.request.list.state.open')
                                }, {
                                    id: _models2.default.PullRequestState.MERGED,
                                    text: AJS.I18n.getText('bitbucket.component.pull.request.list.state.merged')
                                }, {
                                    id: _models2.default.PullRequestState.DECLINED,
                                    text: AJS.I18n.getText('bitbucket.component.pull.request.list.state.declined')
                                }]
                            }
                        })),
                        _react2.default.createElement(_filterBar2.default.AsyncSelect, babelHelpers.extends({}, this.props.initialFilter.author, {
                            id: 'pr-author-filter',
                            label: AJS.I18n.getText('bitbucket.component.pull.request.list.author'),
                            searchPlaceholder: AJS.I18n.getText('bitbucket.component.pull.request.list.search.author'),
                            menu: {
                                id: function id(user) {
                                    return user.name;
                                },
                                initSelection: function initSelection($el, callback) {
                                    var username = $el.val();
                                    if (_this3.props.initialFilter.author.value === username) {
                                        return callback(_this3.props.selectedAuthor);
                                    }
                                    throw new Error('Unexpected value \'' + username + '\' when initializing the author filter.');
                                },
                                formatSelection: renderAuthorItem.bind(null, 'selection'),
                                formatResult: renderAuthorItem.bind(null, 'result'),
                                formatNoMatches: function formatNoMatches() {
                                    return AJS.I18n.getText('bitbucket.component.pull.request.list.search.author.nomatches');
                                },
                                placeholder: AJS.I18n.getText('bitbucket.component.pull.request.list.author'),
                                dropdownCssClass: 'pr-author-dropdown'
                            }
                        })),
                        _react2.default.createElement(_filterBar2.default.AsyncSelect, babelHelpers.extends({}, this.props.initialFilter.target_ref, {
                            id: 'pr-target-branch-filter',
                            label: AJS.I18n.getText('bitbucket.component.pull.request.list.branch.target'),
                            searchPlaceholder: AJS.I18n.getText('bitbucket.component.pull.request.list.search.branch'),
                            menu: {
                                initSelection: function initSelection($el, callback) {
                                    var branch = $el.val();
                                    if (_this3.props.initialFilter.target_ref.value === branch) {
                                        return callback(_this3.props.selectedTargetBranch);
                                    }
                                    throw new Error('Unexpected value \'' + branch + '\' when initializing the target branch filter.');
                                },
                                formatSelection: renderBranchItem.bind(null, 'selection'),
                                formatResult: renderBranchItem.bind(null, 'result'),
                                formatNoMatches: function formatNoMatches() {
                                    return AJS.I18n.getText('bitbucket.component.pull.request.list.search.branch.nomatches');
                                },
                                placeholder: AJS.I18n.getText('bitbucket.component.pull.request.list.branch.target'),
                                dropdownCssClass: 'pr-target-branch-dropdown'
                            }
                        })),
                        this.props.currentUser && _react2.default.createElement(_filterBar2.default.Toggle, babelHelpers.extends({}, this.props.initialFilter.reviewer_self, {
                            id: 'pr-reviewer-self-filter',
                            label: AJS.I18n.getText('bitbucket.component.pull.request.list.reviewer.self')
                        }))
                    ));
                    children.push(noPrs ? _react2.default.createElement(NoResults, { key: 'no-results', filtered: this.state.isFiltered, repository: this.props.repository, onResetFilters: this.resetFilters }) : _react2.default.createElement(_pullRequestListTable2.default, {
                        key: 'table',
                        focusedIndex: this.props.focusedIndex,
                        pullRequests: this.props.pullRequests,
                        allFetched: this.props.allFetched,
                        onMoreItemsRequested: this.props.onMorePrsRequested,
                        loading: this.props.loading
                    }));
                }

                return _react2.default.createElement(
                    'div',
                    { className: 'pull-request-list' },
                    children
                );
            }
        }]);
        return PullRequestList;
    }(_react.Component);

    exports.default = PullRequestList;
    module.exports = exports['default'];
});