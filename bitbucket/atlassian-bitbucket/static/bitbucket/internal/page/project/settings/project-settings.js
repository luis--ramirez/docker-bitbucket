'use strict';

define('bitbucket/internal/page/project/settings', ['aui', 'jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/project/project-avatar-picker', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/notifications', 'bitbucket/internal/widget/confirm-dialog', 'exports'], function (AJS, $, nav, ProjectAvatarPicker, pageState, ajax, notifications, ConfirmDialog, exports) {

    exports.initDeleteButton = function (deleteButtonSelector) {

        var $panelContent = $("<div class='container'></div>"); // css class used for func test
        var $spinner;

        var confirmDialog = new ConfirmDialog({
            id: "delete-project-dialog",
            titleText: AJS.I18n.getText('bitbucket.web.project.delete'),
            titleClass: 'warning-header',
            confirmButtonClass: 'delete-confirm-button',
            panelContent: $panelContent,
            submitText: AJS.I18n.getText('bitbucket.web.button.delete')
        }, { type: 'DELETE' });

        function initContent() {
            $panelContent.empty();
            $spinner = $("<div class='spinner'></div>").appendTo($panelContent);
        }

        function setDeleteButtonEnabled(enabled) {
            $(".delete-confirm-button").prop("disabled", !enabled).toggleClass("disabled", !enabled);
        }

        function okToDeleteProject() {
            $panelContent.append(bitbucket.internal.project.deleteDialog({
                project: pageState.getProject().toJSON()
            }));
            setDeleteButtonEnabled(true);
        }

        function cannotDeleteProject() {
            $panelContent.append(bitbucket.internal.project.deleteDisabledDialog({
                project: pageState.getProject().toJSON()
            }));
            setDeleteButtonEnabled(false);
        }

        confirmDialog.attachTo(deleteButtonSelector, function () {
            initContent();
            setDeleteButtonEnabled(false);
            $spinner.spin('large');
            ajax.rest({
                url: nav.rest().currentProject().allRepos().build(),
                statusCode: {
                    '*': function _() {
                        return false; // don't show any error messages.
                    }
                }
            }).done(function (data) {
                if (data && data.size) {
                    cannotDeleteProject();
                } else {
                    okToDeleteProject();
                }
            }).fail(function () {
                okToDeleteProject();
            }).always(function () {
                $spinner.spinStop().remove();
            });
        });

        confirmDialog.addConfirmListener(function (promise) {
            promise.done(function (data) {
                notifications.addFlash(AJS.I18n.getText('bitbucket.web.project.deleted', pageState.getProject().getName()));

                window.location = nav.allProjects().build();
            });
        });
    };

    exports.onReady = function () {
        var xsrfToken = {
            name: 'atl_token',
            value: $('.project-settings input[name=atl_token]').val()
        };

        new ProjectAvatarPicker(".avatar-picker-field", {
            xsrfToken: xsrfToken
        });
    };
});