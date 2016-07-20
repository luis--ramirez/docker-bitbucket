'use strict';

define('bitbucket/internal/widget/captcha', ['jquery', 'bitbucket/util/navbuilder', 'exports'], function ($, nav, exports) {

    'use strict';

    exports.initialise = function (captchaImageSelector, refreshAnchorSelector) {
        var $captchaImage = $(captchaImageSelector);

        $(refreshAnchorSelector).click(function (e) {
            $captchaImage.attr('src', nav.captcha().build());
            return false;
        });
    };
});