'use strict';

define('bitbucket/internal/page/upgrade-onboarding', ['aui', 'lib/jsuri', 'lodash', 'exports'], function (AJS, Uri, _, exports) {

    'use strict';

    var EVENT_PREFIX = 'stash.page.upgradeonboarding.';

    exports.onReady = function () {
        var wasRedirected = _.endsWith(Uri(document.referrer).path(), "/login");

        AJS.trigger('analyticsEvent', {
            name: EVENT_PREFIX + 'visited',
            data: {
                origin: wasRedirected ? 'login redirect' : 'direct link'
            }
        });
    };
});