define('bitbucket/internal/bbui/quick-search/quick-search', ['module', 'exports', 'aui', 'jquery', 'lodash', 'bitbucket/internal/impl/request', 'bitbucket/internal/impl/search-urls', 'bitbucket/internal/impl/urls', '../search-common/search-entities', '../search-common/search-request', './internal/analytics', '../avatars/avatars', '../bb-panel/bb-panel'], function (module, exports, _aui, _jquery, _lodash, _request, _searchUrls, _urls, _searchEntities, _searchRequest, _analytics) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _aui2 = babelHelpers.interopRequireDefault(_aui);

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _request2 = babelHelpers.interopRequireDefault(_request);

    var _searchUrls2 = babelHelpers.interopRequireDefault(_searchUrls);

    var _urls2 = babelHelpers.interopRequireDefault(_urls);

    var _searchEntities2 = babelHelpers.interopRequireDefault(_searchEntities);

    var _analytics2 = babelHelpers.interopRequireDefault(_analytics);

    var ACCESSIBILITY_TIMEOUT = 50;

    // for the soy

    var MIN_TERMS_DISPLAY = 3;
    var QUICKSEARCH_DEBOUNCE_TIMEOUT = 200;
    var QUICKSEARCH_ITEMS = 9;

    var isDirectionalKeyEvent = function isDirectionalKeyEvent(e) {
        return e.keyCode === _aui2.default.keyCode.LEFT || e.keyCode === _aui2.default.keyCode.UP || e.keyCode === _aui2.default.keyCode.RIGHT || e.keyCode === _aui2.default.keyCode.DOWN;
    };

    var QuickSearch = function () {
        function QuickSearch(el, options) {
            var _this = this;

            babelHelpers.classCallCheck(this, QuickSearch);

            this.options = babelHelpers.extends({}, QuickSearch.defaultOptions, options);
            this.useContext = !!(this.options.project || this.options.repository);
            this.focusClass = this.options.focusClass || 'focus';
            this.navigableClass = this.options.navigableClass || 'navigable';
            this._doRepoSearch = _lodash2.default.debounce(function (terms) {
                if (terms.length >= MIN_TERMS_DISPLAY) {
                    _this.doRepoSearch(terms);
                }
            }, QUICKSEARCH_DEBOUNCE_TIMEOUT);

            var $searchBox = (0, _jquery2.default)(bitbucket.internal.component.quickSearch.searchBox({
                searchUrl: _urls2.default.search()
            }));
            (0, _jquery2.default)(el).replaceWith($searchBox);
            this.$input = $searchBox.find('#quick-search');

            var $panel = (0, _jquery2.default)(bitbucket.internal.component.quickSearch.searchPanel());
            $panel.appendTo((0, _jquery2.default)('body'));
            this.panel = $panel[0];

            this.$quickSearchBox = $searchBox.closest('.aui-quicksearch');
            this.$spinner = $searchBox.find('.spinner');
            this.$searchMainPanel = $panel.find('.quick-search-main');
            this.$searchErrorPanel = $panel.find('.quick-search-error');

            this.$searchResults = $panel.find('.quick-search-results');

            this.$searchResults.on('mouseover', '.' + this.navigableClass, function (e) {
                var $result = (0, _jquery2.default)(e.target).closest('.result');
                _this._focusResult($result);
            });
            this.$searchResults.on('mouseleave', '.' + this.navigableClass, function () {
                _this._blurResults();
            });
            this.$searchResults.on('click', 'a', function (e) {
                var $a = (0, _jquery2.default)(e.currentTarget);
                if ($a.hasClass('repository-link')) {
                    _analytics2.default.resultClicked({
                        project: _this.options.project,
                        repository: _this.options.repository,
                        clickedProjectId: $a.attr('data-project-id'),
                        clickedRepoId: $a.attr('data-repo-id')
                    });
                } else if ($a.hasClass('code-link')) {
                    // let this just hit the link that's now set
                }
            });

            this.$input.on('focus', function (e) {
                return _this._onFocus(e);
            });
            this.$input.on('keyup', function (e) {
                return _this._onKeyUp(e);
            });
            this.$input.on('keydown', function (e) {
                return _this._onKeyDown(e);
            });
            $searchBox.on('submit', function (e) {
                return e.preventDefault();
            });
        }

        /*
         * This component does its own focus management via blur,focus,keydown rather than using `data-aui-trigger`.
         * We do this because there are cases where we don't want the dialog to open when the field is focused.
         * For example in a global context there is nothing to show the dialog should be hidden.
         *
         * When the search suggested operators are added we should be able to go back to `data-aui-trigger` on the input
         * because we will always have something to show in the dialog.
         */

        babelHelpers.createClass(QuickSearch, [{
            key: 'doCodeSearch',
            value: function doCodeSearch(terms) {
                this._updateSearchTerms(terms);
                window.location = this.$searchResults.find('.code-link').attr('href');
            }
        }, {
            key: 'doRepoSearch',
            value: function doRepoSearch(terms) {
                var _this2 = this;

                var startTime = Date.now();
                this._spinnerStart();
                this.$searchResults.removeClass('search-complete').addClass('search-inprogress');

                if (this.currentSearchRequest) {
                    this.currentSearchRequest.abort();
                }

                this.currentSearchRequest = _request2.default.rest({
                    type: 'POST',
                    url: _searchUrls2.default.searchRestUrl(),
                    data: (0, _searchRequest.searchFor)(terms, [_searchEntities2.default.REPOSITORIES], {
                        primary: QUICKSEARCH_ITEMS
                    }),
                    statusCode: {
                        '*': false
                    }
                });

                this.currentSearchRequest.done(function (data) {
                    _this2.currentSearchTerms = terms;
                    _this2.$searchErrorPanel.hide();
                    _this2.$searchMainPanel.show();
                    _analytics2.default.resultsLoaded({
                        project: _this2.options.project,
                        repository: _this2.options.repository,
                        time: Date.now() - startTime,
                        query: terms
                    });
                    var searchResultHtml = bitbucket.internal.component.quickSearch.repositoryResults({
                        repos: data.repositories.values.map(_this2._transformRepository),
                        totalRepoCount: data.repositories.count
                    });
                    _this2.$searchResults.find('.repository-heading').remove();
                    _this2.$searchResults.find('.repository').remove();
                    _this2.$searchResults.append(searchResultHtml);
                    _this2.$searchResults.addClass('search-complete');
                }).fail(function (xhr, textStatus) {
                    if (textStatus !== 'abort') {
                        _this2.$searchMainPanel.hide();
                        _this2.$searchErrorPanel.show();
                    }
                }).always(function () {
                    _this2.currentSearchRequest = null;
                    _this2.$searchResults.removeClass('search-inprogress');
                    _this2._spinnerStop();
                });
            }
        }, {
            key: 'focus',
            value: function focus() {
                this.$input.focus();
            }
        }, {
            key: '_transformRepository',
            value: function _transformRepository(repository) {
                if (_lodash2.default.has(repository, 'avatarUrl')) {
                    repository.avatar_url = repository.avatarUrl;
                }

                if (_lodash2.default.has(repository, 'project.avatarUrl')) {
                    repository.project.avatar_url = repository.project.avatarUrl;
                }

                return repository;
            }
        }, {
            key: '_setInputAttribute',
            value: function _setInputAttribute(attr, value) {
                this.$input.get(0).setAttribute(attr, value);
            }
        }, {
            key: '_getQuery',
            value: function _getQuery() {
                return this.$input.val().trim();
            }
        }, {
            key: '_getContext',
            value: function _getContext() {
                var context = "";
                if (this.options.repository) {
                    context = "project:" + this.options.project.key + " repo:" + this.options.repository.slug;
                } else if (this.options.project) {
                    context = "project:" + this.options.project.key;
                }
                return context;
            }
        }, {
            key: '_blurResults',
            value: function _blurResults() {
                var _this3 = this;

                this.$searchResults.find('.' + this.navigableClass + '.' + this.focusClass).removeClass(this.focusClass);
                setTimeout(function () {
                    return _this3._setInputAttribute('aria-activedescendant', null);
                }, ACCESSIBILITY_TIMEOUT);
            }
        }, {
            key: '_focusResult',
            value: function _focusResult($result) {
                var _this4 = this;

                this._blurResults();
                $result.addClass(this.focusClass);
                setTimeout(function () {
                    return _this4._setInputAttribute('aria-activedescendant', $result.find('[role="option"]').attr('id'));
                }, ACCESSIBILITY_TIMEOUT);
            }
        }, {
            key: '_handleUpAndDownKeys',
            value: function _handleUpAndDownKeys(event) {
                event.preventDefault();
                var current = this.$searchResults.find('.' + this.navigableClass + '.' + this.focusClass);
                var $next = void 0;

                if (current.length === 0) {
                    if (event.keyCode === _aui2.default.keyCode.DOWN) {
                        $next = this.$searchResults.find('.' + this.navigableClass + ':first');
                    } else if (event.keyCode === _aui2.default.keyCode.UP) {
                        $next = this.$searchResults.find('.' + this.navigableClass + ':last');
                    }
                } else if (event.keyCode === _aui2.default.keyCode.DOWN) {
                    $next = current.nextAll('.' + this.navigableClass).first();
                } else if (event.keyCode === _aui2.default.keyCode.UP) {
                    $next = current.prevAll('.' + this.navigableClass).first();
                }

                if ($next.length !== 0) {
                    this._focusResult($next);
                }
            }
        }, {
            key: '_onFocus',
            value: function _onFocus() {
                var currentTerms = this._getQuery();
                this._updatePanel(currentTerms.length >= MIN_TERMS_DISPLAY);
                _analytics2.default.focused({
                    project: this.options.project,
                    repository: this.options.repository
                });
            }
        }, {
            key: '_onKeyDown',
            value: function _onKeyDown(e) {
                if (e.keyCode === _aui2.default.keyCode.DOWN || e.keyCode === _aui2.default.keyCode.UP) {
                    e.preventDefault();
                    this._handleUpAndDownKeys(e);
                }
            }
        }, {
            key: '_onKeyUp',
            value: function _onKeyUp(e) {
                var newTerms = this._getQuery();
                this._updatePanel(e.keyCode !== _aui2.default.keyCode.ESCAPE && newTerms.length >= MIN_TERMS_DISPLAY);

                if (e.keyCode === _aui2.default.keyCode.ENTER) {
                    var $focused = this.$searchResults.find('.repository.' + this.focusClass);
                    if ($focused.length > 0) {
                        $focused.find('a')[0].click();
                    } else if (newTerms.length >= 1) {
                        this.doCodeSearch(newTerms);
                    }
                    e.preventDefault();
                } else if (isDirectionalKeyEvent(e) || e.keyCode === _aui2.default.keyCode.ESCAPE) {
                    // don't do anything on keyup as these are handled on keydown
                } else {
                        this._updateSearchTerms(newTerms);

                        // always abort the current search request before calling the debounced search to avoid
                        // issues where an inflight result would finish after the UI had been prepared for a
                        // different result
                        if (this.currentSearchRequest) {
                            this.currentSearchRequest.abort();
                            this.currentSearchRequest = null;
                        }
                        this._doRepoSearch(newTerms);
                    }
            }
        }, {
            key: '_spinnerStart',
            value: function _spinnerStart() {
                this.$quickSearchBox.addClass('loading');
                this.$spinner.spin();
                this._setInputAttribute('aria-busy', true);
            }
        }, {
            key: '_spinnerStop',
            value: function _spinnerStop() {
                this.$spinner.spinStop();
                this.$quickSearchBox.removeClass('loading');
                this._setInputAttribute('aria-busy', false);
            }
        }, {
            key: '_updateSearchTerms',
            value: function _updateSearchTerms(terms) {
                var query = this.useContext ? this._getContext() + ' ' + terms : terms;

                (0, _jquery2.default)("#code-result").toggleClass('hidden', terms.length < MIN_TERMS_DISPLAY).attr('title', _aui2.default.I18n.getText('bitbucket.component.quick-search.terms', terms)).attr('href', _urls2.default.search(query)).find('.terms').text(terms);
            }
        }, {
            key: '_updatePanel',
            value: function _updatePanel(open) {
                if (open) {
                    var query = this._getQuery();
                    if (this.currentSearchTerms !== query) {
                        this.$searchResults.empty().html(bitbucket.internal.component.quickSearch.codeResult());
                        this._updateSearchTerms(query);
                    }

                    if (this.$searchResults.find('.' + this.focusClass).length === 0) {
                        this._focusResult(this.$searchResults.find('.' + this.navigableClass).first());
                    }
                } else {
                    this._blurResults();
                }

                this.panel.open = open;
                this._setInputAttribute('aria-expanded', open);
            }
        }]);
        return QuickSearch;
    }();

    exports.default = QuickSearch;


    QuickSearch.defaultOptions = {
        project: null,
        repository: null
    };
    module.exports = exports['default'];
});