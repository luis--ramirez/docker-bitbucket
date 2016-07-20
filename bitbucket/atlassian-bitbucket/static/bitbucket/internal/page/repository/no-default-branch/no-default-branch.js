'use strict';

define('bitbucket/internal/page/repository/noDefaultBranch', ['bitbucket/util/navbuilder', 'bitbucket/internal/util/events', 'exports'], function (nav, events, exports) {
    exports.onReady = function () {
        events.on('bitbucket.internal.feature.repository.revisionReferenceSelector.revisionRefChanged', function (revisionReference) {
            var uri = nav.parse(location.href);
            uri.addQueryParam("at", revisionReference.getId());
            location.href = uri.toString();
        });
    };
});