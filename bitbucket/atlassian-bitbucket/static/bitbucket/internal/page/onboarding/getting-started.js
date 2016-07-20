'use strict';

define('bitbucket/internal/page/getting-started', ['aui', 'jquery', 'exports'], function (AJS, $, exports) {

    'use strict';

    exports.onReady = function (wasRedirected) {
        AJS.trigger('analyticsEvent', {
            name: 'stash.page.gettingstarted.visited',
            data: {
                origin: wasRedirected ? 'login redirect' : 'direct link'
            }
        });

        $('#getting-started-header-cta-link, #getting-started-footer-cta-button').on('click', function (e) {
            if (e.target.tagName === 'BUTTON' || e.target.getAttribute('href') === '#') {
                e.preventDefault();
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location = AJS.contextPath() || '/'; // empty string is treated differently by browsers.
                }
            }
        });

        $('#getting-started-header-cta-link').on('click', function () {
            AJS.trigger('analyticsEvent', {
                name: 'stash.page.gettingstarted.gitonwithit.clicked',
                data: {
                    pageLocation: 'top'
                }
            });
        });

        $('#getting-started-footer-cta-button').on('click', function () {
            AJS.trigger('analyticsEvent', {
                name: 'stash.page.gettingstarted.gitonwithit.clicked',
                data: {
                    pageLocation: 'bottom'
                }
            });
        });

        $('#getting-started-footer-gitmicrosite-link').on('click', function () {
            AJS.trigger('analyticsEvent', {
                name: 'stash.page.gettingstarted.gitmicrosite.clicked'
            });
        });

        $('#getting-started-footer-sourcetree-link').on('click', function () {
            AJS.trigger('analyticsEvent', {
                name: 'stash.page.gettingstarted.sourcetree.clicked'
            });
        });
    };
});