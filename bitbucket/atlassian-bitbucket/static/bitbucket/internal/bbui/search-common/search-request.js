define('bitbucket/internal/bbui/search-common/search-request', ['exports', 'lodash'], function (exports, _lodash) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.searchFor = searchFor;
    exports.nextSearchFor = nextSearchFor;

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    function searchFor(query, requestedEntities, limits) {
        var entities = {};
        _lodash2.default.each(requestedEntities, function (key) {
            entities[key] = {};
        });

        return {
            query: query,
            entities: entities,
            limits: limits
        };
    }

    function nextSearchFor(query, type, limits, previousResult) {
        var entities = babelHelpers.defineProperty({}, type, {
            start: previousResult[type].nextStart,
            limit: limits.primary
        });

        return {
            query: query,
            entities: entities
        };
    }
});