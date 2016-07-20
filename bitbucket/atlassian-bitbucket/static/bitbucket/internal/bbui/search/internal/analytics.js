define('bitbucket/internal/bbui/search/internal/analytics', ['module', 'exports', 'jquery', 'bitbucket/internal/impl/analytics', '../../search-common/analytics'], function (module, exports, _jquery, _analytics, _analytics3) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _analytics2 = babelHelpers.interopRequireDefault(_analytics);

    function addProjectRepo(project, repository) {
        var attributes = {};
        if (repository) {
            attributes['repository.id'] = repository.id;
        }
        if (project) {
            attributes['project.id'] = project.id;
        }
        return attributes;
    }

    exports.default = {

        /**
         * @param {Object} options - search options
         * @param {Object?} options.repository - The optional repository scope for this search
         * @param {Object?} options.project - The optional project scope for this search
         * @param {string} options.query - The search query
         * @param {number} options.time - The time the search took
         * @param {object} options.results - The search results
         */

        resultsLoaded: function resultsLoaded(options) {
            var attributes = babelHelpers.extends({
                time: options.time
            }, addProjectRepo(options.project, options.repository), (0, _analytics3.queryAttributes)(options.query), (0, _analytics3.entityAttributes)(options.results));

            _analytics2.default.trigger('bitbucket.ui.search.results.load', attributes);
        },
        bindTableAnalytics: function bindTableAnalytics($searchResults, repository, project) {
            var onFileClick = function onFileClick(e) {
                var attributes = babelHelpers.extends({
                    'result.index': (0, _jquery2.default)(e.target).closest('li').index(),
                    'result.type': 'code'
                }, addProjectRepo(project, repository));
                _analytics2.default.trigger('bitbucket.ui.search.result.clicked', attributes);
            };
            $searchResults.on('click', '.code-search-filename', onFileClick);
            return function () {
                $searchResults.off('click', '.code-search-filename', onFileClick);
            };
        },
        searchEverywhereClicked: function searchEverywhereClicked() {
            _analytics2.default.trigger('bitbucket.ui.search.results.everywhere', {});
        },
        learnMoreClicked: function learnMoreClicked() {
            _analytics2.default.trigger('bitbucket.ui.search.results.learnmore', {});
        },
        repositoryResultClicked: function repositoryResultClicked(index) {
            var attributes = {
                'result.index': index,
                'result.type': 'repositories'
            };
            _analytics2.default.trigger('bitbucket.ui.search.result.clicked', attributes);
        }
    };
    module.exports = exports['default'];
});