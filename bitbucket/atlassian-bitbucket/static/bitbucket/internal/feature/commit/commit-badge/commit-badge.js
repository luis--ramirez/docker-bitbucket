'use strict';

define('bitbucket/internal/feature/commit/commit-badge', ['jquery', 'exports'], function ($, exports) {
    exports.create = function (commit, repository) {
        return $(bitbucket.internal.feature.commit.commitBadge.oneline({
            commit: commit,
            repository: repository,
            withAvatar: true
        }));
    };
});