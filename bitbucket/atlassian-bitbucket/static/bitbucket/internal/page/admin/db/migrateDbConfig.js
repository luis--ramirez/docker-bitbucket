'use strict';

define('bitbucket/internal/page/admin/db/migrate', ['aui', 'jquery', 'exports'], function (AJS, $, exports) {

    function showSpinner(msg) {
        var $cancel = $("#cancel");

        var $initText = $("<div class='next-text'></div>").text(msg);
        $initText.insertAfter($cancel);

        var $spinner = $("<div class='next-spinner' />");
        $spinner.insertAfter($cancel);
        $spinner.spin("small");

        $cancel.hide();
    }

    exports.onReady = function () {
        $("#test").click(function () {
            showSpinner(AJS.I18n.getText('bitbucket.web.admin.database.migration.test'));
        });

        $("#submit").click(function () {
            showSpinner(AJS.I18n.getText('bitbucket.web.admin.database.migration.migrate'));
        });
    };
});