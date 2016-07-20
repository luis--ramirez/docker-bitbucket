'use strict';

define('bitbucket/internal/feature/tasks/task-view', ['aui', 'backbone', 'jquery', 'lodash', 'bitbucket/internal/feature/tasks/model/task-state', 'bitbucket/internal/util/async-element-resize-helper', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function'], function (AJS, Backbone, $, _, TaskState, asyncElementResizeHelper, events, fn) {
    'use strict';

    /**
     * @enum {{VIEW: string, EDIT: string}}
     */

    var TaskViewMode = {
        VIEW: 'view',
        EDIT: 'edit'
    };

    /**
     * Represents the view of a single task - in either the view or edit state
     */
    var TaskView = Backbone.View.extend({
        events: {
            'click .task-checkbox': 'transitionTaskHandler',
            'click .task-edit': 'onTaskEditClick',
            'click .task-save': 'onTaskSaveClick',
            'click .task-cancel': 'onTaskCancelClick',
            'keydown .task-text': 'onTaskKeyDown',
            'click .task-delete': 'onTaskDeleteClick',
            'keypress textarea': 'onTaskTextareaKeypress'
        },

        defaults: {
            showLink: false,
            mode: TaskViewMode.VIEW
        },

        /**
         * Initialises the view for a task, listening for change and invalidation events
         * in the underlying model to trigger a re-render.
         *
         * @param {object} options
         * @param {TaskViewMode} [options.mode=TaskViewMode.VIEW] initial mode to render the view in
         * @param {object} [options.template=bitbucket.internal.feature.tasks.taskView.task] the Soy template to use to render this row
         * @param {boolean} [options.showLink=false] whether render this task with a contextual link
         */
        initialize: function initialize(options) {
            _.bindAll(this, 'focusEditor', '_onResize');
            this.listenTo(this.model, 'change invalid', this.render);
            this.listenToOnce(this.model, 'destroy', this._onResize);
            this.options = _.extend({}, this.defaults, options);
            this.mode = this.options.mode;

            if (this.mode === TaskViewMode.EDIT) {
                this.originalText = this.model.getText();
            }

            this._enableExpandingTextareas();
        },

        template: fn.dot('bitbucket.internal.feature.tasks.taskView.task')(window),

        /**
         * Render the task state on a comment for a given state.
         *
         * @returns {Backbone.View}
         */
        render: function render() {
            var $content = $(this.template({
                task: this.model.toJSON(),
                mode: this.mode,
                showLink: this.options.showLink,
                error: this.model.validationError
            }));

            this.$el.replaceWith($content);
            this.setElement($content);
            this._enableExpandingTextareas();

            if (this.mode === TaskViewMode.EDIT) {
                // if this is a new task then we won't be in the DOM until
                // the parent list adds us, so defer focus.
                _.defer(this.focusEditor);
            }

            _.defer(this._onResize);

            return this;
        },

        /**
         * Handle the click event on the action button for an individual task.
         */
        transitionTaskHandler: function transitionTaskHandler() {
            this.model.transitionToNextState();
        },

        /**
         * Handle saving a task, using updated text from the textarea
         */
        saveTask: function saveTask() {
            var self = this;
            var text = this.$('.task-text').val();

            // optimisitcally switch to view mode
            self.switchMode(TaskViewMode.VIEW);

            this.model.updateText(text).fail(function () {
                self.switchMode(TaskViewMode.EDIT);
            });
        },

        /**
         * Sets the current mode for this task view and triggers a re-render
         *
         * @param {string} newMode
         */
        switchMode: function switchMode(newMode) {
            this.mode = newMode;
            if (newMode === TaskViewMode.EDIT) {
                // if we've switched to edit mode store the current task text
                // in the event of a cancel. If there was more state we needed
                // to retain then we'd clone the whole model for editing.
                // We fall back to a previously saved originalText if the model's text is falsy
                // This fixes an issue where when someone attempts to save with no text the originalText
                // could be set to a blank string, where in fact the original text is the state *before* that
                this.originalText = this.model.getText() || this.originalText;
            }
            this.render();
        },

        /**
         * Cancels editing the task - if the task is new then trigger cancellation via
         * the model to ensure the deleted event is fired.
         */
        cancelTaskEdit: function cancelTaskEdit() {
            if (this.model.isNew()) {
                this.model.destroy();
            } else {
                this.model.setText(this.originalText);
                this.model.isValid(); //Force the model to revalidate, should clear the validationError if it exists
                this.originalText = null;
                this.switchMode(TaskViewMode.VIEW);
            }
        },

        /**
         * Handles the click on "Delete" under a task. This shows the delete dialog, and if
         * the affirmative action is clicked it will hide the task, have Backbone delete it
         * on the server, and finally destroy the model if the delete was successful.
         *
         * @param {Event} e
         */
        onTaskDeleteClick: function onTaskDeleteClick(e) {
            var self = this;
            e.preventDefault();
            if (this.model.isNew()) {
                return;
            }

            self.model.changeState(TaskState.DELETED);
            self.model.destroy({
                wait: true,
                error: function error() {
                    self.model.changeState(self.model.getLastState());
                }
            });
        },

        /**
         * Focuses input on the textarea for this task view
         */
        focusEditor: function focusEditor() {
            this.$('.task-text').focus();
        },

        /**
         * Get the text in the editor for this task view
         *
         * @returns {string}
         */
        getEditorText: function getEditorText() {
            return this.$('.task-text').val();
        },

        /**
         * Handle keydown events in the task textarea - note we don't do this
         * on keyup because that happens after the key is already processed by
         * the textarea and we don't want the enter to be processed.
         *
         * @param {Event} e
         */
        onTaskKeyDown: function onTaskKeyDown(e) {
            if (e.keyCode === AJS.keyCode.ESCAPE) {
                e.preventDefault();
                e.stopPropagation(); // To prevent the dialog from closing if editing a task inside of a dialog
                this.cancelTaskEdit();
            } else if (e.keyCode === AJS.keyCode.ENTER) {
                e.preventDefault();
                this.saveTask();
            }
        },

        /**
         * Handle clicking the Edit action for a task
         *
         * @param {Event} e
         */
        onTaskEditClick: function onTaskEditClick(e) {
            e.preventDefault();
            if (this.model.isNew()) {
                return;
            }
            this.switchMode(TaskViewMode.EDIT);
        },

        /**
         * Handle clicking save for a task - this is a no-op as task saving
         * is handled by a blur event on the textarea, however we handle the click
         * as there are scenarios where it still can receive a click.
         *
         * @param {Event} e
         */
        onTaskSaveClick: function onTaskSaveClick(e) {
            e.preventDefault();
            this.saveTask();
        },

        /**
         * Handle the Cancel action for a task. If this is a new task then we
         * fire an event so the taskable comment can cleanup the new task row,
         * otherwise we just switch back to view mode and re-render.
         *
         * @param {Event} e
         */
        onTaskCancelClick: function onTaskCancelClick(e) {
            e.preventDefault();
            this.cancelTaskEdit();
        },

        /**
         * Remove the error class from the textarea when typing something in
         *
         * @param {Event} e
         */
        onTaskTextareaKeypress: _.debounce(function (e) {
            $(e.target).removeClass('task-error');
        }, 300),

        /**
         * If the view is in edit mode then convert textareas to expanding ones as
         * appropriate.
         */
        _enableExpandingTextareas: function _enableExpandingTextareas() {
            if (this.mode === TaskViewMode.EDIT) {
                // This could probably be chained, but the testing version of AUI 5.4 `expandingTextarea` doesn't
                // return anything once STASHDEV-7762 is resolved
                this.$('textarea.expanding').expandingTextarea().on('input.expanding', this._onResize);
            }
        },

        /**
         * Trigger resize events for parent comment element
         * @private
         */
        _onResize: function _onResize() {
            var el = this.$el[0];
            // in unit tests el could be null since the task is created with a fake empty template,
            // calling asyncElementResizeHelper with a null element is invalid since it tries to read the size
            if (!el) {
                return;
            }
            asyncElementResizeHelper(el, function () {
                events.trigger('bitbucket.internal.webpanel.resize', null, {
                    location: "bitbucket.comments.extra",
                    el: el
                });
            });
        }
    }, {
        Mode: TaskViewMode
    });

    return TaskView;
});