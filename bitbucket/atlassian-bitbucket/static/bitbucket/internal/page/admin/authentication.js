'use strict';

define('bitbucket/internal/page/admin/authentication', ['jquery', 'exports'], function ($, exports) {

    exports.onReady = function (publicSignUpButtonSelector, captchaOnSignButtonUpSelector) {
        var $captchaButton = $(captchaOnSignButtonUpSelector);
        var $signupButton = $(publicSignUpButtonSelector);

        var setCaptchaFromPublicSignup = function setCaptchaFromPublicSignup() {
            if ($signupButton.prop('checked')) {
                $captchaButton.prop('disabled', false);
            } else {
                $captchaButton.prop('disabled', true);
                $captchaButton.prop('checked', false);
            }
        };

        $signupButton.click(function () {
            setCaptchaFromPublicSignup();
        });

        setCaptchaFromPublicSignup();
    };
});