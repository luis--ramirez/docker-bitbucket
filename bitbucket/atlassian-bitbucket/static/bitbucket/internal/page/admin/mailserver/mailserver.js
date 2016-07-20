'use strict';

define('bitbucket/internal/page/admin/mailServer', ['aui', 'jquery', 'bitbucket/internal/util/notifications', 'bitbucket/internal/widget/confirm-dialog', 'exports'], function (AJS, $, notifications, ConfirmDialog, exports) {

    exports.onReady = function (protocolSelectSelector, useTlsCheckboxSelector, requireTlsCheckboxSelector, deleteButtonSelector, testButtonSelector, testAddressSelector) {

        notifications.showFlashes();

        // bind the 'Test' button to send a test email with the current config
        var $testButton = $(testButtonSelector);
        $testButton.click(function () {
            var $this = $(this);
            var $spinner = $("<div class='spinner'></div>");

            $this.nextAll().remove();
            $this.after($spinner);
            $spinner.spin();
        });

        $(testAddressSelector).keypress(function (event) {
            // so that it doesn't use the Save submit button
            if (event.which === 13) {
                event.preventDefault();
                $testButton.click();
            }
        });

        // bind the delete button
        var panelContent = bitbucket.internal.widget.paragraph({
            text: AJS.I18n.getText('bitbucket.web.mailserver.delete.confirm')
        });

        var confirmDialog = new ConfirmDialog({
            id: "delete-mail-sever-config-dialog",
            titleText: AJS.I18n.getText('bitbucket.web.mailserver.delete.config'),
            titleClass: 'warning-header',
            panelContent: panelContent,
            submitText: AJS.I18n.getText('bitbucket.web.button.delete')
        }, { type: 'DELETE' });

        confirmDialog.attachTo(deleteButtonSelector);

        confirmDialog.addConfirmListener(function (promise) {
            promise.done(function (data) {
                notifications.addFlash(AJS.I18n.getText('bitbucket.web.config.mail.deleted'), { type: 'info' });
                window.location.reload();
            });
        });

        $('#password').on('input', function () {
            $('#passwordChanged').val('true');
        });

        var $requireSslTlsCheckbox = $(requireTlsCheckboxSelector);
        var $useSslTlsCheckbox = $(useTlsCheckboxSelector);

        $(protocolSelectSelector).on('change', function () {
            if (this.value === 'SMTP') {
                $useSslTlsCheckbox.prop({ 'disabled': false });
                $requireSslTlsCheckbox.prop({ 'disabled': false });
            } else {
                $useSslTlsCheckbox.prop({ 'checked': true, 'disabled': true });
                $requireSslTlsCheckbox.prop({ 'checked': true, 'disabled': true });
            }
        });

        $useSslTlsCheckbox.on('change', function () {
            if (!this.checked) {
                $requireSslTlsCheckbox.prop({ 'checked': false });
            }
        });

        $requireSslTlsCheckbox.on('change', function () {
            if (this.checked) {
                $useSslTlsCheckbox.prop({ 'checked': true });
            }
        });
    };
});