'use strict';

define('bitbucket/internal/widget/delete-dialog', ['aui', 'jquery', 'bitbucket/internal/widget/confirm-dialog', 'exports'], function (AJS, $, ConfirmDialog, exports) {

    'use strict';

    exports.bind = function (deleteTrigger, title, successMessage, failureMessage, successCallback, nameProvider) {

        // create the dialog
        var confirmDialog = new ConfirmDialog({
            id: 'delete-dialog',
            titleClass: 'warning-header',
            titleText: title,
            panelContent: bitbucket.internal.widget.deleteDialog(),
            submitText: AJS.I18n.getText('bitbucket.web.button.delete')
        }, { type: 'DELETE',
            statusCode: {
                '*': false /* opt out of the Stash's default error handling for AJAX requests and uses our own */
            }
        });

        // notifications when the deletion is successful or fails
        var notify = function notify(content) {
            var $notification = $('#content .aui-page-panel .notifications');
            $notification.empty().html(content);
        };
        var notifySuccess = function notifySuccess(message) {
            notify(aui.message.success({ content: message }));
        };
        var notifyError = function notifyError(message) {
            notify(aui.message.error({ content: message }));
        };

        // bind the notification callbacks
        confirmDialog.addConfirmListener(function (promise, $trigger) {
            // notification when the deletion was successful
            promise.done(function (data) {
                var name = data ? data.displayName ? data.displayName : data.name ? data.name : '' : '';
                var message = successMessage.replace('{0}', AJS.escapeHtml(name));

                // notify via message successCallback if undefined or returns true, or returns a promise that succeeds
                var successCallbackReturn = !successCallback || successCallback(name);
                if (successCallbackReturn && !successCallbackReturn.promise) {
                    notifySuccess(message);
                } else if (successCallbackReturn && successCallbackReturn.promise) {
                    successCallbackReturn.done(function () {
                        notifySuccess(message);
                    });
                }
                // notification when the deletion failed
            }).fail(function (xhr, textStatus, errorThrown, data) {
                var message = data && data.errors && data.errors[0] && data.errors[0].message ? data.errors[0].message : failureMessage;
                notifyError(AJS.escapeHtml(message));
            });
        });

        // bind to the trigger(s)
        confirmDialog.attachTo(deleteTrigger, function (deleteLink, dialog) {
            var entityName = nameProvider ? nameProvider() : $(deleteLink).data('for');
            dialog.getPanel(0).body.find('.display-name').text(entityName);
        });
    };
});