'use strict';

define('bitbucket/internal/page/pull-request-list/view', ['jquery', 'lodash', 'react', 'bitbucket/internal/bbui/models/models', 'bitbucket/internal/bbui/pull-request-list/pull-request-list', 'bitbucket/internal/feature/pull-request/list/analytics', 'bitbucket/internal/impl/data-provider/participants', 'bitbucket/internal/impl/data-provider/pull-request-list', 'bitbucket/internal/impl/data-provider/ref', 'bitbucket/internal/util/events', 'bitbucket/internal/util/object', 'bitbucket/internal/util/shortcuts'], function ($, _, React, models, PullRequestList, listAnalytics, ParticipantsDataProvider, PullRequestListDataProvider, RefDataProvider, events, obj, shortcuts) {

    function PreloadingParticipantsDataProvider(options) {
        ParticipantsDataProvider.apply(this, arguments);
        this._preloadItems = options.preload || [];
        this._preloaded = this._initialPreloadedState = this._preloadItems.length === 0;
        this._equalityCheck = options.equals || function (a, b) {
            return a.id === b.id;
        };
    }
    obj.inherits(PreloadingParticipantsDataProvider, ParticipantsDataProvider);

    PreloadingParticipantsDataProvider.prototype.reset = function () {
        this._preloaded = this._initialPreloadedState;
        return ParticipantsDataProvider.prototype.reset.call(this);
    };

    PreloadingParticipantsDataProvider.prototype._fetchNext = function (lastResponseData) {
        if (!this._preloaded) {
            if (this.filter.term) {
                this._preloaded = true;
            } else {
                var promise = $.Deferred();
                promise.resolve(this._preloadItems);
                promise.abort = $.noop;
                return promise;
            }
        }

        return ParticipantsDataProvider.prototype._fetchNext.call(this, lastResponseData === this._preloadItems ? null : lastResponseData);
    };

    PreloadingParticipantsDataProvider.prototype._transform = function (data) {
        if (!this._preloaded) {
            this._preloaded = true;
            return this._preloadItems;
        }

        var equals = this._equalityCheck;
        var preloadItems = this._preloadItems;
        var out = ParticipantsDataProvider.prototype._transform.call(this, data);
        if (this.filter.term) {
            return out;
        }
        // if we're not filtering, exclude the preloaded items from the output
        return out.filter(function (item) {
            return !preloadItems.some(function (preloadItem) {
                return equals(preloadItem, item);
            });
        });
    };

    return React.createClass({
        displayName: 'PullRequestListView',
        getInitialState: function getInitialState() {
            return {
                page: 0,
                pullRequests: []
            };
        },
        componentWillMount: function componentWillMount(newProps) {
            var self = this;
            var currentUser = this.props.currentUser;
            var repository = this.props.repository;

            var authorProvider = new PreloadingParticipantsDataProvider({
                preload: currentUser ? [currentUser] : null,
                equals: function equals(a, b) {
                    return a.name === b.name;
                },
                repository: repository,
                filter: {
                    role: models.ParticipantRole.AUTHOR
                }
            });

            var branchProvider = new RefDataProvider({
                filter: {
                    repository: repository,
                    type: 'branch',
                    term: ''
                }
            });

            function getAsyncSelectProps(provider, filterName) {
                function extendFilter(props) {
                    var oldFilter = self.state.filter || {};
                    var newFilter = {};
                    newFilter[filterName] = _.extend(oldFilter[filterName] || {}, props);
                    return {
                        filter: _.extend(oldFilter, newFilter)
                    };
                }
                function getProviderState() {
                    return {
                        loading: provider.isFetching,
                        allFetched: provider.reachedEnd
                    };
                }
                function updateFilterFromProviderState() {
                    self.setState(extendFilter(getProviderState()));
                }
                return _.extend({
                    onMoreItemsRequested: function onMoreItemsRequested(callback) {
                        if (provider.isFetching) {
                            return;
                        }
                        provider.fetchNext().then(callback).then(updateFilterFromProviderState);
                        updateFilterFromProviderState();
                    },
                    onTermChanged: function onTermChanged(term) {
                        provider.setFilter('term', term || '');
                        updateFilterFromProviderState();
                    },
                    onResetRequested: function onResetRequested() {
                        provider.reset();
                        updateFilterFromProviderState();
                    }
                }, getProviderState());
            }

            var filter = _.extend({
                state: {
                    value: this.props.initialFilter.state
                },
                reviewer_self: {
                    value: this.props.initialFilter.reviewer_self || false
                }
            }, {
                author: _.extend({}, getAsyncSelectProps(authorProvider, 'author'), {
                    value: this.props.selectedAuthor && this.props.selectedAuthor.name
                }),
                target_ref: _.extend({}, getAsyncSelectProps(branchProvider, 'target_ref'), {
                    value: this.props.selectedTargetBranch && this.props.selectedTargetBranch.id
                })
            });

            var prProvider = new PullRequestListDataProvider({
                repository: repository.id,
                filter: {
                    state: filter.state.value || models.PullRequestState.OPEN,
                    author_id: filter.author.value || null,
                    target_ref_id: filter.target_ref.value || null,
                    reviewer_id: filter.reviewer_self.value && currentUser ? currentUser.name : null
                }
            });

            function onMorePrsRequested() {
                if (prProvider.isFetching) {
                    return;
                }
                self.setState({ loading: true });

                prProvider.fetchNext().then(function (prs) {
                    var page = self.state.page + 1;
                    self.setState({
                        pullRequests: self.state.pullRequests.concat(prs),
                        loading: prProvider.isFetching,
                        allFetched: prProvider.reachedEnd,
                        page: page
                    });
                    events.trigger('bitbucket.internal.pull.request.list.updated');
                    listAnalytics.onPaginate({
                        page: page
                    });
                });
            }

            this.setState({
                focusedIndex: 0,
                filter: filter,
                currentUser: currentUser,
                repository: repository,
                authorProvider: authorProvider,
                branchProvider: branchProvider,
                prProvider: prProvider,
                onMorePrsRequested: onMorePrsRequested,
                allFetched: prProvider.reachedEnd,
                loading: prProvider.isFetching
            });

            function moveFocus(inc) {
                return function () {
                    self.setState(function (s) {
                        return {
                            focusedIndex: Math.max(Math.min(s.focusedIndex + inc, s.pullRequests.length - 1), 0)
                        };
                    }, function () {
                        document.querySelector('.pull-request-row.focused a.pull-request-title').focus();
                    });
                };
            }
            function openItem() {
                document.querySelector('.pull-request-row.focused a.pull-request-title').click();
            }

            shortcuts.bind('requestMoveToNextHandler', moveFocus(1));
            shortcuts.bind('requestMoveToPreviousHandler', moveFocus(-1));
            shortcuts.bind('requestOpenItemHandler', openItem);
        },
        render: function render() {
            var self = this;
            return React.createElement(PullRequestList, {
                repository: this.state.repository,
                currentUser: this.state.currentUser,
                initialFilter: this.state.filter,
                allFetched: this.state.allFetched,
                focusedIndex: this.state.focusedIndex,
                gettingStarted: this.props.gettingStarted,
                loading: this.state.loading,
                onFilterChange: function onFilterChange(filterState) {
                    self.state.prProvider.setFilter('state', filterState.state);
                    self.state.prProvider.setFilter('author_id', filterState.author_id);
                    self.state.prProvider.setFilter('target_ref_id', filterState.target_ref_id);
                    self.state.prProvider.setFilter('reviewer_id', filterState.reviewer_self && self.state.currentUser ? self.state.currentUser.name : null);
                    self.state.prProvider.reset();

                    var newFilter = _.extend({}, self.state.filter, {
                        state: _.extend({}, self.state.filter.state, { value: filterState.state }),
                        author: _.extend({}, self.state.filter.author, { value: filterState.author_id }),
                        target_ref: _.extend({}, self.state.filter.target_ref, { value: filterState.target_ref_id }),
                        reviewer_self: _.extend({}, self.state.filter.reviewer_self, { value: filterState.reviewer_self })
                    });

                    self.setState({
                        pullRequests: [],
                        filter: newFilter
                    }, self.state.onMorePrsRequested);

                    self.props.onFilterChange(filterState);
                },
                onMorePrsRequested: this.state.onMorePrsRequested,
                pullRequests: this.state.pullRequests,
                selectedAuthor: this.props.selectedAuthor,
                selectedTargetBranch: this.props.selectedTargetBranch
            });
        }
    });
});