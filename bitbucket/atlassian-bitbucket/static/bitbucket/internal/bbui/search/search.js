define('bitbucket/internal/bbui/search/search', ['module', 'exports', 'jquery', 'lodash', 'bitbucket/internal/impl/urls', '../history/history', './internal/analytics', './internal/search'], function (module, exports, _jquery, _lodash, _urls, _history, _analytics, _search2) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _urls2 = babelHelpers.interopRequireDefault(_urls);

    var _history2 = babelHelpers.interopRequireDefault(_history);

    var _analytics2 = babelHelpers.interopRequireDefault(_analytics);

    var CONTEXT_RE = /(project:\S*)|(repo:\S*)/g;

    function pushNewPageState(query) {
        var url = _urls2.default.search(query);
        _history2.default.pushState({
            query: query
        }, null, url);
    }

    function clearProjectAndRepo(query) {
        query = query.replace(CONTEXT_RE, '');
        return query.trim();
    }

    var Search = function () {
        function Search(el, options) {
            var _this = this;

            babelHelpers.classCallCheck(this, Search);

            var $el = (0, _jquery2.default)(el);

            this.options = _lodash2.default.assign({}, Search.defaultOptions, options);

            $el.html(bitbucket.internal.component.search.emptyState({
                searchUrl: _urls2.default.search(),
                query: this.options.query
            }));

            _history2.default.initialState({
                query: this.options.query
            });
            _history2.default.on('popstate', function (e) {
                return _this._onPopState(e);
            });

            this.$searchForm = $el.find('.search-form');
            this.$searchResults = $el.find('.search-results');
            this.$query = this.$searchForm.find('input[name=q]');
            this.$searchForm.submit(function (evt) {
                return _this._onSearchSubmit(evt);
            });
            this.$searchQueryAfter = this.$searchForm.find('.search-query-after');
            if (this.options.query && this.options.query.trim() !== '') {
                this._search(this.options.query);
            }

            var $searchResults = $el.find('.search-results');
            $searchResults.on('click', '.code-search-everwhere-link', function () {
                var query = _this.$query.val();
                query = clearProjectAndRepo(query);
                _this._updateQuery(query);
                pushNewPageState(query);
                _analytics2.default.searchEverywhereClicked();
            });
        }

        babelHelpers.createClass(Search, [{
            key: '_onSearchSubmit',
            value: function _onSearchSubmit(evt) {
                var $query = (0, _jquery2.default)(evt.target).find('input.search-query');
                var query = $query.val().trim();

                this.$searchQueryAfter.empty();

                if (!query) {
                    return false;
                }

                this._search(query);
                pushNewPageState(query);

                return false;
            }
        }, {
            key: '_onPopState',
            value: function _onPopState(evt) {
                var state = evt.state;
                var query = state && state.query || '';
                this._updateQuery(query);
            }
        }, {
            key: '_updateQuery',
            value: function _updateQuery(query) {
                this.$query.val(query);
                this._search(query);
            }
        }, {
            key: '_search',
            value: function _search(query) {
                var _this2 = this;

                if (this._searchResults) {
                    this._searchResults.destroy();
                }

                return (0, _search2.createSearch)(this.$searchResults, query, this.options.limits).then(function (results) {
                    _this2._searchResults = results;

                    _this2.$searchQueryAfter.empty();
                    if (results.options.querySubstituted) {
                        _this2.$searchQueryAfter.html(bitbucket.internal.component.search.querySubstituted());
                    }

                    return results;
                });
            }
        }]);
        return Search;
    }();

    exports.default = Search;


    Search.defaultOptions = {
        limits: {
            primary: 10,
            secondary: 5
        }
    };
    module.exports = exports['default'];
});