'use strict';

define('bitbucket/internal/page/setup/jiraIntegration', ['jquery', 'exports'], function ($, exports) {

    exports.onReady = function () {
        // make the 'Skip' link set a hidden 'skip' field (used in SetupController) then post the form
        $("#submitSkip").click(function (e) {
            e.preventDefault();
            var form = $(this).parents("form.aui");
            form.find("#skip").val("true");
            form.submit();
        });
    };
});