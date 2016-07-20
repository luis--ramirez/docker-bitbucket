'use strict';

define('bitbucket/internal/feature/tasks/task-analytics', ['jquery', 'lodash', 'bitbucket/util/events', 'bitbucket/util/state', 'bitbucket/internal/feature/tasks/model/task', 'bitbucket/internal/feature/tasks/model/task-collection', 'bitbucket/internal/feature/tasks/model/task-state', 'bitbucket/internal/util/analytics', 'exports'], function ($, _, eventsApi, pageState, TaskModel, TaskCollection, TaskState, analytics, exports) {

    'use strict';

    /**
     * Sources of activity.
     *
     * @type {{ACTIVITY_STREAM: string, TASK_LIST: string, DIFF_TAB: string}}
     */

    var Source = {
        ACTIVITY_STREAM: 'activity-stream',
        COMMITS: 'commits-tab',
        DIFF: 'diff-tab',
        TASK_LIST: 'task-list'
    };

    // Various shorthands
    var collection = TaskCollection.getCollection();

    var TASK_LIST_DIALOG_ID = '#task-list-dialog';

    var RESTRICTED = true;
    var UNRESTRICTED = false;

    var PREFIX = 'pullRequest.task.';

    // internal state
    var taskListOpenedTimestamp;

    /**
     * Trigger an analytics event with a given name and extra data attributes.
     *
     * @param {string} name
     * @param {object} data
     */
    function triggerAnalyticsEvent(name, data) {
        analytics.add(PREFIX + name, data);
    }

    /**
     * Get the age of a passed in timestamp in ms
     *
     * @param {number} timestamp
     * @returns {number}
     */
    function age(timestamp) {
        return Date.now() - timestamp;
    }

    /**
     * Get the role of the current user in the pull request
     *
     * @returns {string}
     */
    function getUserRole() {
        var userRole;
        if (isPRAuthor()) {
            userRole = 'author';
        } else if (isPRReviewer()) {
            userRole = 'reviewer';
        } else if (isPRParticipant()) {
            userRole = 'participant';
        } else {
            userRole = 'other';
        }
        return userRole;
    }

    /**
     * Return an enriched set of attributes to attach to an analytics event
     *
     * @param {?TaskJSON} task - task that can be used to obtain extra information from
     * @param {object} [extraAttributes] - Extra attributes to mix in. Note that this can override the
     *                                   generic attributes but not the task attributes
     *
     * @returns {object}
     */
    function attributesEnricher(task, extraAttributes) {
        var taskAttributes;
        if (task) {
            taskAttributes = {
                "task.text.length": task.text.length,
                "task.id": task.id,
                "task.time.since.created": age(task.createdDate)
            };
        }

        var genericAttributes = {
            source: getSource(),
            "pullRequest.id": pageState.getPullRequest().id,
            "repository.id": pageState.getRepository().id,
            'userRole': getUserRole()
        };

        return $.extend({}, genericAttributes, extraAttributes, taskAttributes);
    }

    function init() {
        eventsApi.chain().on('bitbucket.internal.feature.pull-request-tasks.resolved', onTaskResolved).on('bitbucket.internal.feature.pull-request-tasks.reopened', onTaskReopened).on('bitbucket.internal.feature.tasks.list.opened', onTaskListOpened).on('bitbucket.internal.feature.tasks.list.closed', onTaskListClosed).on('bitbucket.internal.feature.tasks.list.expand', onTaskListTaskExpanded).on('bitbucket.internal.feature.tasks.visit-task', onTaskListVisitTask);

        collection.on('change:id', onTaskCreated).on('change:text', onTaskEdited).on('destroy', onTaskDeleted);
    }

    /**
     * @param {object} data
     * @param {TaskJSON} data.task
     */
    function onTaskResolved(data) {
        triggerAnalyticsEvent('resolved.' + subject.taskTransitionAction(data.task), attributesEnricher(data.task));
    }
    /**
     * @param {object} data
     * @param {TaskJSON} data.task
     */
    function onTaskReopened(data) {
        triggerAnalyticsEvent('reopened.' + subject.taskTransitionAction(data.task), attributesEnricher(data.task));
    }

    /**
     * @param {object} [data]
     * @param {HTMLElement} [data.sourceEl] - the element the original event was triggered from.
     */
    function onTaskListOpened(data) {
        taskListOpenedTimestamp = Date.now();
        var secondarySource = 'keyboard-shortcut';
        if (data && data.sourceEl) {
            secondarySource = 'link';
        }
        triggerAnalyticsEvent('list.opened.' + subject.genericAction(), attributesEnricher(null, { "source.secondary": secondarySource }));
    }

    function onTaskListClosed() {
        triggerAnalyticsEvent('list.closed.' + subject.genericAction(), attributesEnricher(null, { age: age(taskListOpenedTimestamp) }));
    }

    /**
     * @param {TaskListRowView} rowView
     */
    function onTaskListTaskExpanded(rowView) {
        triggerAnalyticsEvent('list.expandTask.' + subject.genericAction(), attributesEnricher(rowView.model.toJSON()));
    }

    /**
     * @param {object} data
     * @param {TaskJSON} data.task
     * @param {TaskJSON} data.location
     */
    function onTaskListVisitTask(data) {
        var subEvent = 'gotoTask';
        if (data.location === 'diff') {
            subEvent = 'gotoFile';
        }
        triggerAnalyticsEvent('list.' + subEvent + '.' + subject.genericAction(), attributesEnricher(data.task));
    }

    /**
     * @param {TaskJSON} task
     */
    function onTaskCreated(task) {
        var taskJSON = task.toJSON();
        var extraAttributes;
        if (taskJSON.anchor.type === TaskModel.Anchor.COMMENT) {
            var commentDetails = getCommentDetails(taskJSON);
            extraAttributes = {
                "is.comment.owner": commentDetails.author === pageState.getCurrentUser().name, // find if the user is the comment owner
                "duplicates.comment": taskJSON.text.trim() === commentDetails.text.trim()
            };
        }

        triggerAnalyticsEvent('created.' + (task.prefilled ? 'prefilled.' : '') + subject.genericAction(), attributesEnricher(taskJSON, extraAttributes));
    }

    /**
     * @param {Task} task
     */
    function onTaskEdited(task) {
        // If the task text has changed and this isn't a new task.
        if (task.isNew()) {
            return;
        }

        var taskResolved = task.getState() === TaskState.RESOLVED;
        var hasPermissionToEdit = isPRAuthor() || isAdmin() || isTaskAuthor(task.toJSON());

        // Check whether this user has permission to edit the task or if the task is resolved.
        if (!hasPermissionToEdit || taskResolved) {
            return;
        }
        if (task.attributes.text !== task._previousAttributes.text) {
            triggerAnalyticsEvent('edited.' + subject.taskAction(task.toJSON(), RESTRICTED), attributesEnricher(task.toJSON()));
        }
    }
    /**
     * @param {Task} task
     */
    function onTaskDeleted(task) {
        // don't trigger a deleted analytics event if this was the cancellation of a new task.
        if (task.isNew()) {
            return;
        }
        triggerAnalyticsEvent('deleted.' + subject.taskAction(task.toJSON(), RESTRICTED), attributesEnricher(task.toJSON()));
    }

    var subject = {
        Type: {
            other: 'byOther',
            PRAuthor: 'byPRAuthor',
            taskAuthor: 'byTaskAuthor',
            admin: 'byAdmin',
            reviewer: 'byReviewer'
        },
        /**
         * Subject for the Generic Action events. These are events that are not directly related to a task,
         * or where the task can not be determined.
         *
         * @returns {string}
         */
        genericAction: function genericAction() {
            var subject = this.Type.other;
            if (isPRAuthor()) {
                subject = this.Type.PRAuthor;
            } else if (isPRReviewer()) {
                subject = this.Type.reviewer;
            }

            return subject;
        },
        /**
         * Subject for the Task Action events. These are events that are in direct relation to a task.
         *
         * @param {TaskJSON} task
         * @param {boolean} [restricted=false] - whether the action is restricted
         * @returns {string}
         */
        taskAction: function taskAction(task, restricted) {
            var subject = this.Type.other;
            restricted = !!restricted;

            // Admin is a lower level priority than PR author and Task Author
            // Note that we only care about adding this for restricted events
            // i.e. events that are normally only allowed by either the PR or Task Authors
            if (isAdmin() && restricted) {
                subject = this.Type.admin;
            }

            if (isPRAuthor()) {
                // PR Author > Task Author
                subject = this.Type.PRAuthor;
            } else if (isTaskAuthor(task)) {
                subject = this.Type.taskAuthor;
            }

            return subject;
        },
        /**
         * Get the subject for a task transition action, it's the same as a regular taskAction subject
         * except that these are unrestricted.
         *
         * @param {TaskJSON}
         * @return {string}
         */
        taskTransitionAction: function taskTransitionAction(task) {
            return this.taskAction(task, UNRESTRICTED);
        }

    };

    /**
     * The source of the action, diff tab, task list, activity stream
     *
     * @returns {string}
     */
    function getSource() {
        // If the dialog is open, that's the source
        var $dialog = $(TASK_LIST_DIALOG_ID);
        if ($dialog.length && $dialog.attr('aria-hidden') === 'false') {
            return Source.TASK_LIST;
        }

        // if the dialog is not open, figure out which tab we're on.
        // The tabs for the switching of views have a data attribute containing
        // bitbucket.pull-request.nav.*

        var navKey = $('.active-tab[data-module-key]').attr('data-module-key');
        if (_.endsWith(navKey, 'diff')) {
            return Source.DIFF;
        }
        if (_.endsWith(navKey, 'commits')) {
            return Source.COMMITS;
        }

        // by default assume the overview
        return Source.ACTIVITY_STREAM;
    }

    /**
     * Is the current user the PR owner
     *
     * @returns {boolean}
     */
    function isPRAuthor() {
        return pageState.getCurrentUser().id === pageState.getPullRequest().author.user.id;
    }

    /**
     * Is the current user an admin
     *
     * @returns {boolean}
     */
    function isAdmin() {
        return pageState.getCurrentUser().isAdmin;
    }

    /**
     * Is the current user a PR reviewer
     *
     * @returns {boolean}
     */
    function isPRReviewer() {
        var reviewers = pageState.getPullRequest().reviewers;
        return reviewers.length && reviewers.some(function (reviewer) {
            return reviewer.user.id === pageState.getCurrentUser().id;
        });
    }

    /**
     * Is the current user a PR participant
     *
     * @returns {boolean}
     */
    function isPRParticipant() {
        var participants = pageState.getPullRequest().participants;
        return participants.length && participants.some(function (participant) {
            return participant.user.id === pageState.getCurrentUser().id;
        });
    }

    /**
     * Is the current user the Task Creator
     *
     * @param {TaskJSON} task
     * @returns {boolean}
     */
    function isTaskAuthor(task) {
        return pageState.getCurrentUser().name === task.author.name;
    }

    /**
     * If a task was created from a comment find some details about the comment.
     *
     * @param {TaskJSON} task
     * @returns {?{text: string, author: string}}
     */
    function getCommentDetails(task) {
        if (task.anchor.type !== TaskModel.Anchor.COMMENT) {
            return null;
        }

        var $comment = $('.comment[data-id="' + task.anchor.id + '"]');

        return {
            text: $comment.find('> .content > .message').text(),
            author: $comment.find('span[data-username]').attr('data-username')
        };
    }

    exports.init = init;
});