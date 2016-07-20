'use strict';

define('bitbucket/internal/page/repositoryGeneralSettings', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/util/server', 'bitbucket/internal/feature/project/project-selector', 'bitbucket/internal/feature/repository/branch-selector', 'bitbucket/internal/feature/repository/cloneUrlGen', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/error', 'bitbucket/internal/util/notifications', 'bitbucket/internal/widget/confirm-dialog', 'exports'], function (AJS, $, _, nav, server, ProjectSelector, BranchSelector, cloneUrlGen, pageState, errorUtil, notifications, ConfirmDialog, exports) {

    function createMoveDialog() {
        var moveDialog = new AJS.Dialog({
            id: 'repository-move-dialog'
        });

        var dialogContent = bitbucket.internal.page.moveRepositoryForm({
            repository: pageState.getRepository().toJSON()
        });

        moveDialog.addHeader(AJS.I18n.getText('bitbucket.web.repository.move.title'));
        moveDialog.addPanel('', dialogContent);

        // bind project selector
        var $projectSelectorTrigger = $('#moveProjectSelector');
        var projectSelector = new ProjectSelector($projectSelectorTrigger, {
            field: $projectSelectorTrigger.next('input')
        });

        // bind cloneUrlGen
        var $repoName = $("#moveName");
        var $cloneUrl = $(".clone-url-generated span");
        cloneUrlGen.bindUrlGeneration($cloneUrl, {
            elementsToWatch: [$repoName, $projectSelectorTrigger],
            getProject: projectSelector.getSelectedItem.bind(projectSelector),
            getRepoName: $repoName.val.bind($repoName)
        });

        function moveRepository() {
            var moveName = $('#moveName').val();
            var moveProject = projectSelector.getSelectedItem().toJSON();

            if (moveName === pageState.getRepository().getName() && moveProject.key === pageState.getProject().getKey()) {
                // nothing to save. just close the dialog
                moveDialog.hide();
                return;
            }

            server.rest({
                type: 'PUT',
                url: nav.rest().currentRepo().build(),
                data: {
                    name: moveName,
                    project: moveProject
                },
                statusCode: {
                    // Don't handle these globally. We will want to show
                    // an error message in the form
                    '400': false,
                    '409': false
                }
            }).done(function (repository) {
                notifications.addFlash(
                // It is possible to rename the repository only in the move dialog.
                repository.project.key === pageState.getProject().getKey() ? AJS.I18n.getText('bitbucket.web.repository.rename.success', pageState.getRepository().getName(), repository.name) : AJS.I18n.getText('bitbucket.web.repository.move.success', repository.name, repository.project.name));
                location.href = nav.project(repository.project.key).repo(repository.slug).settings().build();
            }).fail(function (xhr, testStatus, errorThrown, data) {
                errorUtil.setFormErrors(moveDialog.popup.element.find('form.aui'),
                // The move dialog uses different field names to prevent duplicate ids.
                // transform relevant contexts to something errorUtil will understand
                _.chain(data.errors).filter(function (error) {
                    return error.context !== 'slug';
                }).map(function (error) {
                    var context = error.context;
                    if (context === 'project' || context === 'name') {
                        error.context = 'move' + context.charAt(0).toUpperCase() + context.slice(1);
                    }
                    return error;
                }).value());
                moveDialog.updateHeight();
            });
        }

        moveDialog.addButton(AJS.I18n.getText('bitbucket.web.button.move'), moveRepository, 'button');
        moveDialog.popup.element.find('form.aui').on('submit', function (e) {
            e.preventDefault();
            moveRepository();
        });

        moveDialog.addCancel(AJS.I18n.getText('bitbucket.web.button.cancel'), function () {
            projectSelector.dialog.hide();
            moveDialog.hide();
        });
        return moveDialog;
    }

    function initMoveButton(moveButtonSelector) {
        var dialog;
        $(moveButtonSelector).on('click', function (e) {
            e.preventDefault();
            if (!dialog) {
                dialog = createMoveDialog();
            }
            dialog.show();
            errorUtil.clearFormErrors(dialog.popup.element);
            dialog.updateHeight();
        });
    }

    function initDeleteButton(deleteButtonSelector) {
        var repo = pageState.getRepository().toJSON();

        var deleteRepositoryDialog = new ConfirmDialog({
            id: "delete-repository-dialog",
            titleText: AJS.I18n.getText('bitbucket.web.repository.delete.title'),
            titleClass: 'warning-header',
            panelContent: bitbucket.internal.page.deleteRepositoryDialog({
                repository: repo
            }),
            submitText: AJS.I18n.getText('bitbucket.web.button.delete'),
            height: 240
        }, { type: 'DELETE' });

        deleteRepositoryDialog.attachTo(deleteButtonSelector);

        deleteRepositoryDialog.addConfirmListener(function (promise) {
            promise.then(function (data, status, xhr) {
                return server.poll({
                    url: $(deleteButtonSelector).attr('href'),
                    statusCode: {
                        '404': function _() {
                            notifications.addFlash(AJS.I18n.getText('bitbucket.web.repository.deleted', repo.name));

                            window.location = nav.currentProject().build();

                            return false; // don't handle this globally.
                        }
                    }
                });
            });
        });
    }

    function initSizes($field) {
        var $button = $field.find('.size-load-button');

        $button.click(function (e) {
            e.preventDefault();
            $button.remove();
            getSizes($field);
        });
    }

    function getSizes($field) {
        var $spinner = $field.find('.spinner').spin();

        server.rest({
            type: 'GET',
            url: nav.currentRepo().sizes().build(),
            statusCode: { '*': false }
        }).always(function () {
            $spinner.remove();
        }).done(function (sizes) {
            $field.html(bitbucket.internal.page.repositorySizeDisplay(sizes));
        }).fail(function () {
            var error = bitbucket.internal.page.repositoryInlineError({
                message: AJS.I18n.getText('bitbucket.web.repository.size.error')
            });
            $(error).insertAfter($field);
        });
    }

    exports.onReady = function (formSelector, moveButtonSelector, deleteButtonSelector) {
        // Ensure that any flash notifications which are available are added to the page
        notifications.showFlashes();

        initMoveButton(moveButtonSelector);
        initDeleteButton(deleteButtonSelector);
        initSizes($(formSelector).find('.field-group #size'));
        new BranchSelector($("#default-branch"), { field: $("#default-branch-field") });

        var $repoName = $("#name");
        var $cloneUrl = $(".clone-url-generated span");

        cloneUrlGen.bindUrlGeneration($cloneUrl, {
            elementsToWatch: [$repoName],
            getRepoName: $repoName.val.bind($repoName)
        });
    };
});