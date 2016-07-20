'use strict';

define('bitbucket/internal/page/setupSettings', ['aui', 'jquery', 'bitbucket/internal/util/client-storage', 'bitbucket/internal/widget/setup-tracking', 'exports'], function (AJS, $, clientStorage, setupTracking, exports) {
    exports.onReady = function () {
        var $form = $('#settings');

        var setupDataKey = clientStorage.buildKey([AJS.contextPath(), 'setup']);
        var setupData = clientStorage.getSessionItem(setupDataKey);

        if (setupData) {
            setupData.applicationTitle && $('#applicationTitle').val(setupData.applicationTitle);
            setupData.baseUrl && $('#baseUrl').val(setupData.baseUrl);
        }

        $('#has-key-radio').attr('autocomplete', 'off');
        $('#no-key-radio').attr('autocomplete', 'off');

        $form.on('click', 'input[type="radio"]', function (e) {
            var $el = $(e.currentTarget);
            var elId = $el.attr("id");
            $('.license-section').hide();

            if (elId === "no-key-radio") {
                setupTracking.track('setup-settings-evaluate');
                $('#no-key').show();
            }

            if (elId === "has-key-radio") {
                setupTracking.track('setup-settings-has-key');
                $('#has-key').show();
                $('#license').focus();
            }
        });

        $form.submit(function () {
            clientStorage.setSessionItem(setupDataKey, {
                applicationTitle: $('#applicationTitle').val(),
                baseUrl: $('#baseUrl').val()
            });

            $('#licenseHidden').val($('#license').val());

            $('.button-spinner').show().spin();
            $('.next-text').show().text(AJS.I18n.getText('bitbucket.web.setup.settings.license.import', bitbucket.internal.util.productName()));
        });
    };
});