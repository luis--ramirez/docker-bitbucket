'use strict';

define('bitbucket/internal/feature/tasks/task-list/comment-task-list-view', ['backbone', 'lodash', 'bitbucket/internal/feature/tasks/model/task', 'bitbucket/internal/feature/tasks/task-list/task-list-row-view', 'bitbucket/internal/feature/tasks/task-view', 'bitbucket/internal/util/events', 'bitbucket/internal/util/feature-detect', 'bitbucket/internal/util/function'], function (Backbone, _, Task, TaskListRowView, TaskView, events, feature, fn) {

    'use strict';

    /**
     * Represents the task list for a single comment, the model should be a
     * {Backbone.Collection} of {Task} models.  This view handles rendering the
     * rows of tasks, with the task itself being rendered by a {TaskView}.
     */

    var CommentTaskListView = Backbone.View.extend({
        defaults: {
            pullRequestId: null
        },

        /**
         * Initialises the view and setups up event listeners for the underlying collection
         *
         * @param {object} options
         * @param {object} options.defaultTaskAttrs default attributes to add to a task created by this view
         *
         */
        initialize: function initialize(options) {
            var self = this;
            this.comment = options.comment;
            // we only care about tasks being added and removed, changes will be
            // handled within the task views
            ['add', 'remove'].forEach(function (event) {
                self.listenTo(self.collection, event, self.render.bind(self, event));
            });

            this.options = _.extend({}, this.defaults, options);
            this.taskRowViews = [];
        },

        /**
         * Get the new task that is currently being added to this comment task list view
         *
         * @returns {Task}
         */
        getCurrentTask: function getCurrentTask() {
            return this.collection.find(fn.invoke('isNew'));
        },

        /**
         * Get the text currently in the editor for the currently active task
         * @returns {string}
         */
        getCurrentTaskText: function getCurrentTaskText() {
            return this.getCurrentTaskRowView().getEditorText() || '';
        },

        /**
         * Get the current task row view based on the current task.
         *
         * @returns {TaskListRowView}
         */
        getCurrentTaskRowView: function getCurrentTaskRowView() {
            return this._findRowViewForTask(this.getCurrentTask());
        },

        /**
         * Creates a new task in this view, using the provided text as the initial
         * task text. If the text is provided then we auto-save the task to have
         * it appear in view mode straight away (rather than edit mode).
         *
         * @param [text] initial text to use for the task
         * @returns {?Task} the task that was created or null if there is already a task being created
         */
        createTask: function createTask(text) {

            // if there is already a task being created then focus on it and abort early
            var rowView = this.getCurrentTaskRowView();
            if (rowView) {
                rowView.focusEditor();
                return null;
            }

            var task = new Task({
                anchor: {
                    id: this.comment.id,
                    type: Task.Anchor.COMMENT
                },
                pullRequestId: this.options.pullRequestId,
                repositoryId: this.options.repositoryId,
                text: text
            });

            // new task should show at the top of the list of tasks
            this.collection.unshift(task);

            if (text) {
                // if this task was prefilled, add a transient property to the task
                // so various other places can use this if required.
                task.prefilled = true;
                // if the save failed remove from the collection to cause
                // it to be removed from the DOM (AJAX utils take care of
                // showing an error dialog)
                task.save().fail(this.collection.remove.bind(this.collection, task));
            }

            return task;
        },

        /**
         * Handle rendering the view, if there is no action supplied then the whole
         * view and all it's rows are re-rendered, this should only happen on initial
         * render to populate the initial tasks, otherwise an action should be supplied
         * in order to cause the correct manipulation to happen. We can't re-render the
         * full view each time because we need to be able to better handle animations.
         *
         * @param {string} [action] - action that resulted in this render, should be one of add, remove or change:id.
         * @param {Task} [task] - task model object that is being rendered if this is the result of a collection event
         *
         * @returns {CommentTaskListView} this view
         */
        render: function render(action, task) {
            var self = this;
            var view;

            // we remove the `.pending-delete` class so that the current height calculations includes it,
            // and the height transition to the new height is visible
            this.$('.pending-delete').removeClass('pending-delete');
            var currentHeight = this.$el.outerHeight(true);

            this.$el.css({ height: currentHeight });

            function taskRowViewForTask(task) {
                return new TaskListRowView({
                    model: task,
                    initialTaskViewMode: task.isNew() && task.getText() === '' ? TaskView.Mode.EDIT : TaskView.Mode.VIEW,
                    isCollapsible: false,
                    showLink: false
                });
            }

            var animateTask = false;
            switch (action) {
                case 'remove':
                    view = this._findRowViewForTask(task);

                    if (view) {
                        view.$el.addClass('pending-delete').trigger('comment-child-removed');
                        view.remove();
                        this.taskRowViews = _.without(this.taskRowViews, view);
                    }

                    animateTask = true;
                    break;

                case 'add':
                    // for an `add` event the 4th argument is an object that
                    // includes information about the change, including the index
                    // in the collection that the change occurred at in an `at` property.
                    var index = arguments[3].at;
                    view = taskRowViewForTask(task);
                    this.taskRowViews.splice(index, 0, view);

                    var $view = view.render().$el;
                    var $context = this.$(this.$('li').get(index));

                    if ($context.length) {
                        $context.before($view);
                    } else {
                        this.$el.append($view);
                    }

                    // if this is a new task with pre-populated text then highlight now
                    if (task.isNew() && task.getText() !== '') {
                        view.highlight();
                    }

                    $view.trigger('comment-child-added');
                    animateTask = true;
                    break;

                default:
                    // re-render everything (should only be initial render)
                    _.invoke(this.taskRowViews, 'remove');
                    this.taskRowViews = this.collection.map(taskRowViewForTask);
                    this.$el.append(this.taskRowViews.map(function (taskRowView) {
                        return taskRowView.render().$el;
                    }));
                    break;
            }

            var taskListHeight = this.taskRowViews.reduce(function (total, taskView) {
                return total + taskView.$el.outerHeight(true);
            }, 0);

            function _resetTaskListHeight(fireEvent) {
                self.$el.removeClass('transition-height') // required for Safari - STASHDEV-7774
                .css({ height: 'auto' });

                if (fireEvent) {
                    events.trigger('bitbucket.internal.webpanel.resize', null, {
                        location: "bitbucket.comments.extra",
                        el: self.$el.get(0)
                    });
                }
            }

            if (feature.cssTransition() && animateTask) {
                this.$el.addClass('transition-height') // required for Safari - STASHDEV-7774
                .css({ height: taskListHeight }).one(feature.transitionEndEventName(), _resetTaskListHeight.bind(self, true));
            } else {
                _resetTaskListHeight(false);
            }

            return this;
        },

        _findRowViewForTask: function _findRowViewForTask(task) {
            return _.find(this.taskRowViews, { model: task });
        }
    });

    return CommentTaskListView;
});