'use strict';

define('bitbucket/internal/widget/aui/form', ['jquery', 'exports'], function ($, exports) {

    'use strict';

    function preventDefault(e) {
        e.preventDefault();
    }

    function setSubmissionPrevented($form, shouldPrevent) {
        $form.data('preventSubmission', shouldPrevent);
        $form.find(':submit').toggleClass('disabled', shouldPrevent).prop('disabled', shouldPrevent);
        $form.find('a, button, input[type="button"]')[shouldPrevent ? 'on' : 'off']('click', preventDefault).toggleClass('disabled', shouldPrevent);
    }

    exports.preventSubmission = function ($form) {
        setSubmissionPrevented($form, true);
    };

    exports.allowSubmission = function ($form) {
        setSubmissionPrevented($form, false);
    };

    exports.isSubmissionPrevented = function ($form) {
        return $form.data('preventSubmission');
    };

    function addUnloadHandlerOnce(func) {

        var $window = $(window);

        // Safari and FF disable caching when using the unload handler, but both support pagehide, so use that instead
        var event = Object.prototype.hasOwnProperty.call(window, 'onpagehide') ? 'pagehide' : 'unload';

        var handler = function handler() {
            $window.off(event, handler);
            return func.apply(this, arguments);
        };

        $window.on(event, handler);
    }

    exports.onReady = function () {

        // This will prevent double-submit on all forms that are submitted natively (e.g., no AJAXy stuff).
        $(document).on('submit', '.prevent-double-submit', function (e) {
            var $form = $(e.target);

            if (exports.isSubmissionPrevented($form)) {
                e.preventDefault();
            } else {

                // We need to ensure we are the last ones to handle this.
                // otherwise some other JS can come later and do a preventDefault, but we'll think
                // the submit went through and prevent the next submit.
                // We also need to ensure that we don't affect the current submit when we disable buttons and such.
                // To those ends, we use a setTimeout here.
                setTimeout(function () {
                    if (!e.isDefaultPrevented()) {
                        setSubmissionPrevented($form, true);

                        addUnloadHandlerOnce(function () {
                            // Firefox and Safari cache page state.  So we have to reenable the buttons before leaving
                            // the page, otherwise the form won't work after you hit the back button to return.
                            setSubmissionPrevented($form, false);
                        });
                    }
                }, 0);
            }
        });
    };
});