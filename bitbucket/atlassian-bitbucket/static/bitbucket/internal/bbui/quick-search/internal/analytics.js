define('bitbucket/internal/bbui/quick-search/internal/analytics', ['module', 'exports', 'bitbucket/internal/impl/analytics', 'bitbucket/internal/impl/search-analytics-utils', '../../search-common/analytics'], function (module, exports, _analytics, _searchAnalyticsUtils, _analytics3) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _analytics2 = babelHelpers.interopRequireDefault(_analytics);

    var _searchAnalyticsUtils2 = babelHelpers.interopRequireDefault(_searchAnalyticsUtils);

    function commonAttributes(project, repository) {
        var attributes = {
            context: _searchAnalyticsUtils2.default.getPageContext()
        };
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
         * @param {Object} options - Options for this event
         * @param {Object?} options.repository - Optional repository
         * @param {Object?} options.project - Optional project
         */

        focused: function focused(options) {
            var attributes = commonAttributes(options.project, options.repository);
            _analytics2.default.trigger('bitbucket.ui.quick-search.focused', attributes);
        },


        /**
         * @param {Object} options - Options for this event
         * @param {Object?} options.repository - Optional repository
         * @param {Object?} options.project - Optional project
         * @param {string} options.query - The search query
         * @param {number} options.time - The search timing
         */
        resultsLoaded: function resultsLoaded(options) {
            var attributes = babelHelpers.extends({
                time: options.time
            }, (0, _analytics3.queryAttributes)(options.query), commonAttributes(options.project, options.repository));

            _analytics2.default.trigger('bitbucket.ui.quick-search.results.loaded', attributes);
        },


        /**
         * @param {Object} options - the options for this event
         * @param {Object?} options.repository - optional repository
         * @param {Object?} options.project - optional project
         * @param {number} options.clickedProjectId - Project ID of the clicked result
         * @param {number} options.clickedRepoId - Repo ID of the clicked result
         */
        resultClicked: function resultClicked(options) {
            var attributes = babelHelpers.extends({
                'clicked.project.id': options.clickedProjectId,
                'clicked.repository.id': options.clickedRepoId
            }, commonAttributes(options.project, options.repository));

            _analytics2.default.trigger('bitbucket.ui.quick-search.result.clicked', attributes);
        }
    };
    module.exports = exports['default'];
});