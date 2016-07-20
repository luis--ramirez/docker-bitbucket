'use strict';

define('bitbucket/internal/page/admin/userCreate', ['jquery', 'exports'], function ($, exports) {

    function togglePasswordFields() {
        $('#password, #confirmPassword').parent('.field-group').toggleClass('hidden', $(this).is(':checked'));
    }

    exports.onReady = function () {
        var $notifyCheckbox = $('#notify');
        $notifyCheckbox.click(togglePasswordFields);
        togglePasswordFields.call($notifyCheckbox[0]);
    };
});