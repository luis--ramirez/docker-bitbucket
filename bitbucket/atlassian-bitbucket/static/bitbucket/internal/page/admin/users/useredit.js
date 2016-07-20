'use strict';

define('bitbucket/internal/page/admin/userEdit', ['aui', 'aui/flag', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/user/user-groups-table', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/error', 'bitbucket/internal/util/notifications', 'bitbucket/internal/widget/confirm-dialog', 'bitbucket/internal/widget/delete-dialog', 'bitbucket/internal/widget/submit-spinner', 'bitbucket/internal/widget/user-avatar-form', 'exports'], function (AJS, auiFlag, $, _, nav, UserGroupsTable, ajax, errorUtil, notifications, ConfirmDialog, DeleteDialog, SubmitSpinner, UserAvatarForm, exports) {

    'use strict';

    function notify(message, type) {
        type = type || 'info';
        auiFlag({
            type: type,
            title: message,
            close: 'auto'
        });
    }

    function notifySuccess(message) {
        notify(message, 'success');
    }

    function notifyError(message) {
        notify(message, 'error');
    }

    function setErrorSpan(fieldSelector, message) {
        $(fieldSelector).parent(".field-group").append($("<span class='error'></span>").text(message));
    }

    function clearErrors() {
        $('.panel-details .error, .content-body .notifications > .error').remove();
    }

    function notifyErrors(errors) {
        if (_.isArray(errors)) {
            _.each(errors, function (error) {
                if (error.message && error.context && error.context === 'email') {
                    setErrorSpan("#email", error.message);
                } else if (error.message && error.context && error.context === 'displayName') {
                    setErrorSpan("#fullname", error.message);
                } else if (error.message) {
                    notifyError(error.message);
                } else {
                    notifyError(error);
                }
            });
        } else if (_.isString(errors)) {
            notifyError(errors);
        }
    }

    // dialog to confirm the deletion of the user
    function initialiseDeleteDialog(deleteLink) {
        DeleteDialog.bind(deleteLink, AJS.I18n.getText('bitbucket.web.user.delete'), AJS.I18n.getText('bitbucket.web.user.delete.success'), AJS.I18n.getText('bitbucket.web.user.delete.fail'), function (name) {
            notifications.addFlash(AJS.I18n.getText('bitbucket.web.user.delete.success', name));
            window.location = nav.admin().users().build();
            return false; // don't notify on view page, wait for page-pop
        }, function () {
            return $('#fullname').val();
        });
    }

    function initialiseClearCaptchaDialog(clearCaptchaLink) {
        var $panelContent = $(bitbucket.internal.admin.users.clearCaptchaDialog({ displayName: $('#fullname').val() }));

        var confirmDialog = new ConfirmDialog({
            id: "clear-captcha-dialog",
            titleText: AJS.I18n.getText('bitbucket.web.user.captcha.clear'),
            panelContent: $panelContent,
            submitText: AJS.I18n.getText('bitbucket.web.button.clear')
        }, { type: 'DELETE' });

        confirmDialog.attachTo(clearCaptchaLink);

        confirmDialog.addConfirmListener(function (promise) {
            promise.done(function () {
                $(clearCaptchaLink).remove();
                confirmDialog.destroy();
                notifySuccess(AJS.I18n.getText('bitbucket.web.user.captcha.cleared'));
            });
        });
    }

    // dialog to change the password
    function initialisePasswordDialog(user, passwordLink) {
        $(passwordLink).click(function (e) {
            e.preventDefault();

            var $form = $(bitbucket.internal.admin.users.passwordResetForm({}));

            var dialog = new AJS.Dialog({
                width: 433,
                id: 'change-password-dialog',
                closeOnOutsideClick: false,
                keypressListener: function keypressListener(e) {
                    // AUIDialog.updateHeight() rebinds the keypressListener at every call, even if it's already bound to the event;
                    // thus we need to have jQuery stops the immediate propagation of the event to prevent successive invocations.
                    // For example, the sequence dialog.show().updateHeight().updateHeight() would have the handler bound three times.
                    e.stopImmediatePropagation();
                    if (e.keyCode === AJS.keyCode.ENTER) {
                        e.preventDefault();
                        $(this).find('.button-panel-submit-button').click();
                    } else if (e.keyCode === AJS.keyCode.ESCAPE) {
                        e.preventDefault();
                        dialog.remove();
                    }
                }
            });
            dialog.addHeader(AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.user.change.password.dialog', user.name)));

            dialog.addPanel('content', $form);
            dialog.addSubmit(AJS.I18n.getText('bitbucket.web.button.save'), function (dialog) {
                var $spinner = new SubmitSpinner($(dialog.getPage(0).buttonpanel).find('.button-panel-submit-button'), 'before').show();

                dialog.disable(); // Prevent double submission
                var buttonPanel = dialog.getPage(0).buttonpanel;
                buttonPanel.addClass('disabled');

                ajax.rest({
                    url: $form.attr('action'),
                    type: 'PUT',
                    data: _.extend({ name: user.name }, ajax.formToJSON($form)),
                    statusCode: {
                        '*': function _() {
                            return false;
                            /* this is already a popup: handle all the errors locally */
                        }
                    }
                }).always(function () {
                    $spinner.remove();
                }).done(function () {
                    dialog.remove();
                    notifySuccess(AJS.I18n.getText('bitbucket.web.user.password.update.success'));
                }).fail(function (xhr, textStatus, errorThrown, data) {
                    dialog.enable();
                    buttonPanel.removeClass('disabled');

                    errorUtil.setFormErrors($form, data && data.errors && data.errors[0] && data.errors[0].message ? data.errors : [{ message: AJS.I18n.getText('bitbucket.web.user.change.password.failure') }]);
                    dialog.updateHeight();
                });
            });
            dialog.addCancel(AJS.I18n.getText('bitbucket.web.button.cancel'), function (dialog) {
                dialog.remove();
            });
            dialog.show();
            dialog.updateHeight();
        });
    }

    // dialog to rename the user
    function initialiseRenameDialog(user, renameLink) {
        $(renameLink).click(function (e) {
            e.preventDefault();
            var $form = $(bitbucket.internal.admin.users.renameUserForm({}));

            var dialog = new AJS.Dialog({
                width: 433,
                id: 'rename-user-dialog',
                closeOnOutsideClick: false,
                keypressListener: function keypressListener(e) {
                    // AUIDialog.updateHeight() rebinds the keypressListener at every call, even if it's already bound to the event;
                    // thus we need to have jQuery stops the immediate propagation of the event to prevent successive invocations.
                    // For example, the sequence dialog.show().updateHeight().updateHeight() would have the handler bound three times.
                    e.stopImmediatePropagation();
                    if (e.keyCode === AJS.keyCode.ENTER) {
                        e.preventDefault();
                        $(this).find('.button-panel-submit-button').click();
                    } else if (e.keyCode === AJS.keyCode.ESCAPE) {
                        e.preventDefault();
                        dialog.remove();
                    }
                }
            });
            dialog.addHeader(AJS.I18n.getText('bitbucket.web.user.rename.user.dialog', user.name));
            dialog.addPanel('content', $form);
            dialog.addSubmit(AJS.I18n.getText('bitbucket.web.button.save'), function (dialog) {
                var $spinner = new SubmitSpinner($('.button-panel-submit-button', dialog.getPage(0).buttonpanel), 'before').show();

                dialog.disable(); // Prevent double submission
                var buttonPanel = dialog.getPage(0).buttonpanel;
                buttonPanel.addClass('disabled');

                ajax.rest({
                    url: $form.attr('action'),
                    type: 'POST',
                    data: _.extend({ name: user.name }, ajax.formToJSON($form)),
                    statusCode: {
                        '*': function _() {
                            return false;
                            /* this is already a popup: handle all the errors locally */
                        }
                    }
                }).always(function () {
                    $spinner.remove();
                }).done(function (renamedUser) {
                    notifications.addFlash(AJS.I18n.getText('bitbucket.web.user.rename.success'));
                    location.href = nav.admin().users().view(renamedUser.name).build();
                }).fail(function (xhr, textStatus, errorThrown, data) {
                    dialog.enable();
                    buttonPanel.removeClass('disabled');

                    errorUtil.setFormErrors($form, data && data.errors && data.errors[0] && data.errors[0].message ? data.errors : [{ message: AJS.I18n.getText('bitbucket.web.user.rename.failure') }]);
                    dialog.updateHeight();
                });
            });
            dialog.addCancel(AJS.I18n.getText('bitbucket.web.button.cancel'), function (dialog) {
                dialog.remove();
            });
            dialog.show();
            dialog.updateHeight();
        });
    }

    // form for editing user details
    function initialiseForm() {

        // utility functions
        function rollback($form) {
            $form.find('input[type=text]').each(function () {
                var $this = $(this);
                $this.val($this.data('rollback'));
            });
        }
        function updateDetails($form, data) {
            $form.find('#fullname').val(data.displayName);
            $form.find('#email').val(data.emailAddress);
            $form.find('input[type=text]').each(function () {
                var $this = $(this);
                $this.data('rollback', $this.val());
            });
        }
        function closeEditDetails($form) {
            $form.removeClass('editing').find('#fullname, #email').attr('readonly', 'readonly');
            $('#ajax-status-message').empty();
            clearErrors();
        }

        // event bindings
        $('#edit-details').click(function (e) {
            $('.panel-details form.editable').addClass('editing').find('#fullname, #email').removeAttr('readonly');
            if (e.target.id !== 'email') {
                $('#fullname', '.panel-details form.editable').focus();
            }
            e.preventDefault();
        });
        $('.panel-details form.editable').keyup(function (e) {
            if (e.which === AJS.keyCode.ESCAPE) {
                $('a.cancel', this).click();
            }
        });
        $('.cancel', '.panel-details form.editable').click(function (e) {
            e.preventDefault();
            var $form = $(this).parents('form');
            rollback($form);
            closeEditDetails($form);
            return false;
        });
        $('.panel-details form.editable').submit(function (e) {
            e.preventDefault();
            clearErrors();
            var $form = $(this);
            var displayName = $form.find('#fullname').val();
            ajax.rest({
                url: $form.attr('action'),
                type: 'PUT',
                data: {
                    name: $form.find('#name').val(),
                    displayName: displayName,
                    email: $form.find('#email').val()
                },
                statusCode: { // these errors are handled locally.
                    '500': function _() {
                        return false;
                    },
                    '404': function _() {
                        return false;
                    },
                    '401': function _() {
                        return false;
                    },
                    '400': function _() {
                        return false;
                    }
                }
            }).done(function (data) {
                updateDetails($form, data);
                closeEditDetails($form);
                notifySuccess(AJS.I18n.getText('bitbucket.web.user.update.success', displayName));
            }).fail(function (xhr, textStatus, errorThrown, data) {
                var errors = data && data.errors ? data.errors : AJS.I18n.getText('bitbucket.web.user.update.failure');
                notifyErrors(errors);
            });
        });
    }

    function initialiseUserAvatarForm(user, avatarFormSelector) {
        var xsrfToken = {
            name: 'atl_token',
            value: $('.user-details-form input[name=atl_token]').val()
        };
        var avatarForm = new UserAvatarForm($(avatarFormSelector), user, xsrfToken);
        avatarForm.on('avatarChanged', clearErrors);
        avatarForm.on('avatarUploadError', notifyErrors);
        avatarForm.on('avatarDeleteError', notifyErrors);
    }

    function initialiseUserGroupsTable(groupsTableSelector) {
        var userGroupsTable = new UserGroupsTable({
            target: groupsTableSelector,
            onError: notifyErrors
        });
        userGroupsTable.init();
    }

    exports.onReady = function (user, selectors) {
        notifications.showFlashes();

        initialiseDeleteDialog(selectors.deleteLinkSelector);
        initialiseClearCaptchaDialog(selectors.clearCaptchaLinkSelector);
        initialisePasswordDialog(user, selectors.passwordLinkSelector);
        initialiseRenameDialog(user, selectors.renameUserLinkSelector);
        initialiseForm();
        initialiseUserAvatarForm(user, selectors.avatarFormSelector);
        initialiseUserGroupsTable(selectors.groupsTableSelector);
    };
});