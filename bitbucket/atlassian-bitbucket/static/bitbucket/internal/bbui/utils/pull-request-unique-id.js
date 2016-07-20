define('bitbucket/internal/bbui/utils/pull-request-unique-id', ['module', 'exports'], function (module, exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = prUniqueId;
    function prUniqueId(pullRequest) {
        var repo = pullRequest.to_ref.repository;
        return [repo.project.key, repo.slug, pullRequest.id].join('::');
    }
    module.exports = exports['default'];
});