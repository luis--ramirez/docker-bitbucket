define('bitbucket/internal/bbui/search-common/analytics', ['exports', 'lodash', '../search-common/search-entities'], function (exports, _lodash, _searchEntities) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.queryAttributes = queryAttributes;
    exports.entityAttributes = entityAttributes;

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _searchEntities2 = babelHelpers.interopRequireDefault(_searchEntities);

    function countModifier(query, modifier) {
        var match = query.match(new RegExp(modifier + ':\\S+', 'g'));
        return match && match.length || 0;
    }

    /**
     * Get a set of analytics attributes from a search query.
     *
     * @param {Object} query - The query to parse attributes from
     * @returns {Object}
     */
    function queryAttributes(query) {
        return {
            'query.length': query.length,
            'term.count': query.split(" ").length,
            'mod.project': countModifier(query, 'project'),
            'mod.repo': countModifier(query, 'repo'),
            'mod.lang': countModifier(query, 'lang'),
            'mod.ext': countModifier(query, 'ext')
        };
    }

    function entityAttributes(results) {
        var attributes = {};
        _lodash2.default.each(_searchEntities2.default, function (entity, entityKey) {
            if (results.hasOwnProperty(entity)) {
                attributes[entity + '.start'] = results[entity].start;
                attributes[entity + '.count'] = results[entity].count;
            }
        });
        return attributes;
    }
});