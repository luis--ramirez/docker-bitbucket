'use strict';

define('bitbucket/internal/page/setup/database', ['aui', 'jquery', 'exports'], function (AJS, $, exports) {
    function toggleButtons(isInternal) {
        $("#test").toggleClass('disabled', isInternal).prop('disabled', isInternal);
        $("#submit").toggleClass('disabled', false).prop('disabled', false);
    }

    function toggleConfigFields($configFields, isInternal) {
        $("#test").toggleClass('hidden', isInternal);
        $configFields.toggleClass('hidden', isInternal);
        if (!isInternal) {
            $configFields.find('select[name="type"]').change(); // Fire change
        }
    }

    function showSpinner(msg) {
        var $test = $("#test");

        var $initText = $("<div class='next-text'>" + msg + "</div>");
        $initText.insertAfter($test);

        var $spinner = $("<div class='next-spinner' />");
        $spinner.insertAfter($test);
        $spinner.spin("small");
    }

    exports.onReady = function () {
        var $configFields = $(".config-fields");
        $('input[name="internal"]').on('change', function () {
            var isInternal = $(this).val() === 'true';
            toggleButtons(isInternal);
            toggleConfigFields($configFields, isInternal);
        }).filter(':checked').change(); // Fire on initial load to keep browser and page state in sync

        $("#test").click(function () {
            showSpinner(AJS.I18n.getText('bitbucket.web.setup.test.database'));
        });

        $("#submit").click(function () {
            showSpinner(AJS.I18n.getText('bitbucket.web.setup.init.database'));
        });
    };
});