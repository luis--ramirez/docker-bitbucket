define('bitbucket/internal/bbui/search/internal/search', ['exports', 'jquery', 'lodash', 'bitbucket/internal/impl/request', 'bitbucket/internal/impl/search-urls', '../../search-common/search-entities', '../../search-common/search-request', '../../search-common/transformer', './analytics', './search-data-provider', './search-results-table'], function (exports, _jquery, _lodash, _request, _searchUrls, _searchEntities, _searchRequest, _transformer, _analytics, _searchDataProvider, _searchResultsTable) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.search = search;
    exports.createSearch = createSearch;

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _request2 = babelHelpers.interopRequireDefault(_request);

    var _searchUrls2 = babelHelpers.interopRequireDefault(_searchUrls);

    var _searchEntities2 = babelHelpers.interopRequireDefault(_searchEntities);

    var _analytics2 = babelHelpers.interopRequireDefault(_analytics);

    var _searchDataProvider2 = babelHelpers.interopRequireDefault(_searchDataProvider);

    var _searchResultsTable2 = babelHelpers.interopRequireDefault(_searchResultsTable);

    var STATUS_OK = 200;
    var STATUS_SERVER_ERROR = 500;

    // List of all entity types currently supported for rendering by search as a _primary_ result (repo search is secondary)
    var SUPPORTED_ENTITIES = [_searchEntities2.default.CODE];

    function secondarySearch($el, query, limits) {
        // repo search will use the "primary" limit but return a "secondary" result. Cover our bases by just using the
        // secondary limit for both values
        search((0, _searchRequest.searchFor)(query, [_searchEntities2.default.REPOSITORIES], {
            primary: limits.secondary,
            secondary: limits.secondary
        })).then(function (results) {
            var repositories = results[_searchEntities2.default.REPOSITORIES].values.map(_transformer.transformRepositoryResult);
            if (repositories.length > 0) {
                $el.append(bitbucket.internal.component.search.secondaryResults({
                    resultContent: bitbucket.internal.component.search.repositoryResults({
                        repositories: repositories
                    })
                }));

                requestAnimationFrame(function () {
                    $el.find('.primary-results-container').addClass('with-secondary-results');
                    $el.find('.secondary-results-container.loaded').removeClass('loaded');
                });

                $el.on('click', '.repository-link', function (e) {
                    return _analytics2.default.repositoryResultClicked((0, _jquery2.default)(e.target).closest('li').index());
                });
            }
        }).fail(function (xhr, textError, errorThrown, data) {
            return console.warn('Repository search failed:', _lodash2.default.get(data, 'errors.0.message', '??'));
        });
    }

    /**
     * Given a SearchRequest object, perform a search.
     * @param {Object} searchRequest - The parameters for this search.
     * @returns {Promise} request promise
     */
    function search(searchRequest) {
        var start = Date.now();

        var ajaxPromise = _request2.default.rest({
            type: 'POST',
            url: _searchUrls2.default.searchRestUrl(),
            data: searchRequest,
            statusCode: {
                400: false, // 400 is returned for QueryInvalidException,
                500: false }
        });

        // 500 is also handled gracefully by the search UI
        ajaxPromise.then(function (data) {
            var time = Date.now() - start;
            var repository = data.scope.repository;
            var project = repository ? repository.project : data.scope.project;
            _analytics2.default.resultsLoaded({
                repository: repository,
                project: project,
                time: time,
                query: searchRequest.query,
                results: data
            });
        });

        return ajaxPromise;
    }

    /**
     * Sets up and creates the search result UI within an element, with an initial query.
     * @param {jQuery|HTMLElement} el Element to render results in
     * @param {string} query - The initial query string
     * @param {Object} limits - The search paging limits
     * @param {Number} limits.primary - Primary search page size (eg. main results)
     * @param {Number} limits.secondary - Secondary search page size (eg. sidebar results)
     * @returns {Promise} Promise that resolves when the initial search completes
     */
    function createSearch(el, query, limits) {
        var searchResultsTable = void 0;
        var loadedResults = 0;

        // setup search data provider for query
        var $el = (0, _jquery2.default)(el);
        $el.empty(); // also unbinds event handlers

        // show the 'searching' spinner while we do the initial search
        $el.html(bitbucket.internal.component.search.searching());
        var $searching = $el.find('.code-search-searching');
        $searching.find('.spin-container').spin();

        function handleServerError() {
            var $results = $el.find('.primary-results');
            var errorHtml = bitbucket.internal.component.search.serverError();
            if (searchResultsTable) {
                searchResultsTable.suspend();
            }

            if ($results.length) {
                $results.append(errorHtml);
            } else {
                $el.html(errorHtml);
            }
        }

        var handleSearchResult = function handleSearchResult(searchResult) {
            // setup SearchResultsTable for primary results
            var primaryResultType = _lodash2.default.findKey(searchResult, { category: 'primary' });
            var primaryResult = searchResult[primaryResultType];
            var dataProvider = new _searchDataProvider2.default({
                query: query,
                search: search,
                type: primaryResultType,
                limits: limits
            }, searchResult);

            dataProvider.on('data-request-failed', function (error) {
                handleServerError(error);
            });

            var repository = searchResult.scope.repository;
            if (repository && _lodash2.default.has(repository, 'avatarUrl')) {
                repository.avatar_url = repository.avatarUrl;
            }
            var project = repository ? repository.project : searchResult.scope.project;
            if (project && _lodash2.default.has(project, 'avatarUrl')) {
                project.avatar_url = project.avatarUrl;
            }
            var scope = {
                repository: repository,
                project: project
            };
            loadedResults = primaryResult.values.length;

            // TODO handle this better
            $el.html(bitbucket.internal.component.search.codeResults({
                totalMatches: primaryResult.count,
                totalResults: primaryResult.count,
                loadedResults: loadedResults,
                scope: scope
            }));

            $el.on('click', '.learnmore', function () {
                return _analytics2.default.learnMoreClicked();
            });

            searchResultsTable = new _searchResultsTable2.default($el.find('.primary-results'), {
                dataProvider: dataProvider,
                scope: scope,
                querySubstituted: _lodash2.default.get(searchResult, 'query.substituted', false)
            });
            searchResultsTable.init();

            var $progress = $el.find('.result-load-progress');
            dataProvider.on('data-loaded', function (data) {
                loadedResults += data.length;
                if (loadedResults >= primaryResult.count) {
                    $progress.hide();
                } else {
                    $progress.html(bitbucket.internal.component.search.resultLoadProgress({
                        loaded: loadedResults,
                        total: primaryResult.count
                    }));
                }
            });

            return searchResultsTable;
        };

        // perform initial search
        return search((0, _searchRequest.searchFor)(query, SUPPORTED_ENTITIES, limits)).then(function (result) {
            if (result.scope.type === 'GLOBAL') {
                secondarySearch($el, query, limits);
            }
            return result;
        }).then(handleSearchResult).fail(function (xhr, textError, errorThrown, data) {
            if (xhr.status === STATUS_OK) {
                // this _should_ only happen if the user's authentication has changed in BbS. In this case they'll get the
                // "your login changed" dialog which allows them to reload the page, but that still fails the promise. We
                // want to actually display the query result anyway, since the user will be notified it could be out of date.
                return handleSearchResult(data);
            } else if (xhr.status < STATUS_SERVER_ERROR) {
                $el.html(bitbucket.internal.component.search.badQuery({
                    query: query,
                    reason: (typeof data === 'undefined' ? 'undefined' : babelHelpers.typeof(data)) === 'object' ? _lodash2.default.get(data, 'errors.0.message') : textError
                }));
            } else {
                handleServerError(xhr.responseJSON);
            }
        }).always(function () {
            $searching.remove();
        });
    }
});