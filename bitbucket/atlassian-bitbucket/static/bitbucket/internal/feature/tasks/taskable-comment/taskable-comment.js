'use strict';

define('bitbucket/internal/feature/tasks/taskable-comment', ['jquery', 'lodash', 'bitbucket/util/events', 'bitbucket/util/state', 'bitbucket/internal/feature/comments/comment-async-web-panel', 'bitbucket/internal/feature/tasks/model/task', 'bitbucket/internal/feature/tasks/model/task-collection', 'bitbucket/internal/feature/tasks/task-list/comment-task-list-view', 'exports'], function ($, _, eventsApi, pageStateApi, commentAsyncWebPanel, Task, TaskCollection, TaskListView, exports) {

    'use strict';

    var taskCollection = TaskCollection.getCollection();

    var commentTaskListViews = {};

    eventsApi.on('bitbucket.internal.feature.tasks.createTask', createTaskHandler);

    /**
     * Handles a "Create task" click on a comment - Grabs any selected text from the current comment to use
     * as the initial text for the task and delegates to the {CommentTaskListView} to get the task
     * created and added to the view.
     *
     * @param {jQuery|HTMLElement} comment comment element to create task for
     */
    function createTaskHandler(comment) {
        var $comment = $(comment);
        var commentId = $comment.data('id');

        var text = '';
        var selection = window.getSelection();
        if (selection) {
            // we can use the selection if it's within the content of this comment text, however if you double-click
            // to select a whole paragraph and it's the last paragraph then the selection.focusNode (end of selection) is
            // actually the ul.actions so we allow that too.
            var message = $comment.find('.message').get(0);
            if ($.contains(message, selection.anchorNode) && ($.contains(message, selection.focusNode) || $comment.find('.actions').is(selection.focusNode))) {
                text = Task.sanitiseText(selection.toString());
                selection.removeAllRanges();
            }
        }

        // create the new task in the comment list and add it to the shared
        // task collection, if it didn't already exist
        var listView = commentTaskListViews[commentId];
        var newTask = listView.createTask(text);
        if (newTask) {
            taskCollection.add(newTask);
        } else if (text) {
            // only proceed if we're augmenting the task with text from a selection
            newTask = listView.getCurrentTask();
            var currentTaskText = listView.getCurrentTaskText();
            currentTaskText = currentTaskText ? currentTaskText.trim() + ' ' : '';
            newTask.setText(currentTaskText + text);
        }
    }

    eventsApi.on('bitbucket.internal.feature.comments.commentDeleted', commentDeletedHandler);

    /**
     * If a comment with a task is deleted, remove that task from the collection
     *
     * @param {Object} comment
     */
    function commentDeletedHandler(comment) {
        // grab the first task we can find attached to this comment
        var task = taskCollection.find(function (task) {
            return task.getAnchor().id === comment.id;
        });
        if (task) {
            taskCollection.remove(task);
        }
    }

    eventsApi.on('bitbucket.internal.comment.commentContainerDestroyed', commentContainerDestroyHandler);

    /**
     * If a comment container with new tasks in progress is destroyed then destroy the associated task
     * models to ensure that the count is correctly updated.
     * @param $container
     */
    function commentContainerDestroyHandler($container) {
        var commentIds = $container.find('.task').map(function (idx, task) {
            return +task.dataset.commentId;
        });
        taskCollection.filter(function (task) {
            return _.contains(commentIds, task.getAnchor().id) && task.isNew();
        }).forEach(function (task) {
            return task.destroy();
        });
    }

    /**
     * A taskable comment view.
     *
     * Set up a new Model and View for this comment.
     *
     * @param context
     * @returns {*}
     */
    function newTaskableCommentView(context) {

        var comment = context.comment;

        // commentTaskCollection is a collection of tasks for the current comment, which should be a subset of
        // tasks that are present in the shared taskCollection - this means interactions between the activity stream
        // and dialog should work correctly as they will be sharing task model objects
        var commentTaskCollection = new TaskCollection();
        _.each(comment.tasks, function (taskJSON) {
            var task = taskCollection.get(taskJSON.id);
            if (!task) {
                task = new Task(taskJSON);
                task.setPullRequestId(pageStateApi.getPullRequest().id);
                task.setRepositoryId(pageStateApi.getRepository().id);
                taskCollection.add(task);
            }
            commentTaskCollection.add(task);
        });

        var renderContext = {
            comment: comment,
            collection: commentTaskCollection
        };

        // We wait for the task list element to be added to the DOM, then attach to
        // Backbone task views
        return commentAsyncWebPanel.getWebPanelEl(function ($placeholder) {
            var $ul = $(bitbucket.internal.feature.tasks.taskableComment.taskListPlaceholder());
            $placeholder.replaceWith($ul);
            renderTaskListPlaceholder($ul, renderContext);
        });
    }

    /**
     * Create and render a TaskListView with a Task List placeholder for a given element
     * @param {HTMLElement} el
     * @param {object} context - the render context
     * @param {TaskCollection} context.collection
     * @param {Comment} context.comment
     */
    function renderTaskListPlaceholder(el, context) {
        var $el = $(el);
        var taskListView = new TaskListView({
            collection: context.collection,
            el: $el,
            comment: context.comment,
            pullRequestId: pageStateApi.getPullRequest().id,
            repositoryId: pageStateApi.getRepository().id
        });
        taskListView.render();
        commentTaskListViews[context.comment.id] = taskListView;
    }

    /**
     * If we are currently in a Pull Request context
     * @param {object} context
     * @returns {boolean}
     */
    function isPullRequest(context) {
        return !!context.pullRequest;
    }

    exports.newTaskableCommentView = newTaskableCommentView;
    exports.isPullRequest = isPullRequest;
    // exposed for testing
    exports._commentTaskListViews = commentTaskListViews;
});