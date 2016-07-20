'use strict';

define('bitbucket/internal/feature/tasks/task-list', ['jquery', 'bitbucket/util/events', 'bitbucket/util/state', 'bitbucket/internal/feature/tasks/model/task-collection', 'bitbucket/internal/feature/tasks/task-list/task-list-dialog', 'exports'], function ($, eventsApi, pageStateApi, TaskCollection, TaskListDialog, exports) {
    var _taskListDialog;
    var openEventData = {};

    /**
     * Initialises (if required) and opens the PR Task List dialog
     *
     * @param {string} projectKey the project that the repo & PR belong to, to display tasks for
     * @param {object} repository object containing the id and slug of the repository to display tasks for
     * @param {number} pullRequestId PR within the repository to display tasks for
     * @param {HTMLElement} [target] - the target of the DOM event that triggered this. Optional because this can be
     *                                 triggered programmatically as well.
     */
    function openTaskListDialog(projectKey, repository, pullRequestId, target) {
        var context = {
            projectKey: projectKey,
            repository: repository,
            pullRequestId: pullRequestId
        };

        openEventData.sourceEl = target;

        if (!_taskListDialog) {
            _taskListDialog = new TaskListDialog(TaskCollection.getCollection());
            _taskListDialog._dialog.on('beforeShow', function () {
                eventsApi.trigger('bitbucket.internal.feature.tasks.list.opened', null, openEventData);
            });
            _taskListDialog._dialog.on('close', function () {
                eventsApi.trigger('bitbucket.internal.feature.tasks.list.closed');
            });
        }

        _taskListDialog.openDialog(context);
    }

    /**
     * This is used by the keyboard shortcut to open the dialog for the current
     * PR
     */
    exports.openTaskListDialogForCurrentPullRequest = function () {
        openTaskListDialog(pageStateApi.getProject(), pageStateApi.getRepository(), pageStateApi.getPullRequest().id);
    };

    exports.onReady = function () {
        $(document).on('click', '.task-list-dialog-link', function (event) {
            event.preventDefault();
            var $target = $(event.currentTarget);
            var projectKey = $target.data('project-key') || pageStateApi.getProject().key;
            var pullRequestId = $target.data('pull-request-id') || pageStateApi.getPullRequest().id;

            /* The reason repository is an object is because in the Task List Dialog we need to make a REST
             * request to get the list of tasks, which requires a PR id, and also provide a link to a
             * comment in the activity stream, which requires a repo slug.  Creating this mini repo
             * object avoids having to pass both variables and the navBuilder supports building from
             * an object with this signature.
             */
            var repository = {
                id: $target.data('repository-id') || pageStateApi.getRepository().id,
                slug: $target.data('repository-slug') || pageStateApi.getRepository().slug
            };
            openTaskListDialog(projectKey, repository, pullRequestId, event.currentTarget);
        });
    };
});