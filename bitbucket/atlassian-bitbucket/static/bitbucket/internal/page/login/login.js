'use strict';

define('bitbucket/internal/page/login', ['jquery', 'bitbucket/internal/widget/captcha', 'bitbucket/internal/widget/setup-tracking', 'exports'], function ($, captcha, tracking, exports) {
    'use strict';

    exports.onReady = function () {
        tracking.trackLoginPage();

        if (location.hash) {
            var $next = $(':input[name=next]');
            var nextUrl = $next.val();
            if (nextUrl && !/#/.test(nextUrl)) {
                $next.val(nextUrl + location.hash);
            }
        }

        captcha.initialise('#captcha-image', '#captcha-reload');
    };
});