'use strict';

define('bitbucket/internal/page/setup/mirror', ['aui', 'jquery', 'exports'], function (AJS, $, exports) {

    'use strict';

    var $submit = $("#submit");
    var $mirrorForm = $("#mirror");

    function showSpinner(msg) {
        var $initText = $("<div class='next-text'></div>").text(msg);
        $initText.insertAfter($submit);

        var $spinner = $("<div class='next-spinner'></div>");
        $spinner.insertAfter($submit);
        $spinner.spin("small");
    }

    exports.onReady = function () {
        $mirrorForm.submit(function () {
            showSpinner(AJS.I18n.getText('bitbucket.web.setup.mirror.status'));
        });

        //Focus the first error or the first input element.
        var $focus = $mirrorForm.find("input[type=text][data-aui-notification-error]");
        if (!$focus.length) {
            $focus = $mirrorForm.find("input[type=text]");
        }
        $focus.first().focus();
    };
});