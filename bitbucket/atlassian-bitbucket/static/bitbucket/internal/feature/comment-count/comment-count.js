'use strict';

define('bitbucket/internal/feature/comment-count', ['exports'], function (exports) {
    'use strict';

    function pullRequestRowItem(context) {
        var pullRequest = context.pullRequest;

        if (pullRequest.properties && pullRequest.properties.commentCount) {
            return bitbucket.internal.feature.commentCount({ count: pullRequest.properties.commentCount });
        }

        return '';
    }

    exports.pullRequestRowItem = pullRequestRowItem;
});