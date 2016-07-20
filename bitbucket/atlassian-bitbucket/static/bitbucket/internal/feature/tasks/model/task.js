'use strict';

define('bitbucket/internal/feature/tasks/model/task', ['aui', 'backbone', 'backbone-brace', 'lodash', 'bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/tasks/model/task-state', 'bitbucket/internal/model/stash-user'], function (AJS, Backbone, Brace, _, eventsApi, nav, TaskState, StashUser) {

    'use strict';

    /**
     * Task anchor types
     * @enum {{COMMENT: string}}
     */

    var Anchor = {
        COMMENT: 'COMMENT'
    };

    var taskUrlBuilder = nav.rest().addPathComponents('tasks');

    function getEventName(postfix) {
        return postfix && 'bitbucket.internal.feature.pull-request-tasks.' + postfix;
    }

    var Task = Brace.Model.extend({
        namedAttributes: {
            // mandatory fields
            id: 'number',
            anchor: null,
            state: 'string',
            author: StashUser,
            createdDate: 'number',
            // optional fields
            text: 'string',
            html: 'string',
            properties: null,
            permittedOperations: null,
            // transient fields
            lastState: 'string',
            pendingSync: 'boolean',
            pullRequestId: 'number',
            repositoryId: 'number'
        },

        defaults: {
            state: TaskState.OPEN,
            text: '',
            pendingSync: false,
            permittedOperations: {}
        },

        url: function url() {
            var builder = taskUrlBuilder;

            // for updates add the ID to the path
            if (!this.isNew()) {
                builder = builder.addPathComponents(this.getId());
            }

            return builder.build();
        },

        /**
         * Initialise this task, if this is a new open task then we fire the correct
         * event so that the counter gets updated.
         */
        initialize: function initialize() {
            // new task created in open state - fire event
            if (this.getState() === TaskState.OPEN && this.isNew()) {
                this._triggerTaskEvent(this.eventNameForState(this.getState()));
            }
            this.on('destroy', this._onDestroy);
            this.on('sync', this._triggerTaskEvent.bind(this, getEventName('saved')));
        },

        /**
         * Triggers a deletion event for new tasks that are cancelled - tasks that
         * aren't new should have this taken care of as part of any optimistic deletion
         * that takes place.
         *
         * @private
         */
        _onDestroy: function _onDestroy() {
            if (this.isNew()) {
                this.changeState(TaskState.DELETED);
            }
        },

        /**
         * Figure out what the next state after the current state is.
         *
         * @returns {TaskState}
         */
        nextState: function nextState() {
            return TaskState.Transitions[this.getState()];
        },

        eventNameForState: function eventNameForState(nextState) {
            // find out what the next event name for this task should be.
            switch (nextState) {

                case TaskState.OPEN:
                    if (this.isNew()) {
                        return getEventName('created');
                    } else {
                        return getEventName('reopened');
                    }
                    break;

                case TaskState.RESOLVED:
                    return getEventName('resolved');

                case TaskState.DELETED:
                    return getEventName('deleted');

                case TaskState.DEFAULT:
                /* falls through */
                default:
                    return getEventName('default');

            }
        },
        /**
         * Transition a task from one state to the next.
         *
         * @returns {Promise}
         */
        transitionToNextState: function transitionToNextState() {
            return this._updateState(this.nextState());
        },

        changeState: function changeState(newState) {
            this.set({
                state: newState,
                lastState: this.getState()
            }, {
                local: true
            });
            this._triggerTaskEvent(this.eventNameForState(newState));
        },

        _updateState: function _updateState(nextState) {
            var currentState = this.getState();
            var eventName = this.eventNameForState(nextState);
            var self = this;

            // Note that we explicitly set the new values *before* saving (and not as part of the save) to generate
            // 2 distinct events, the `change` event when setting properties and the `sync` event when the save completes.
            this.changeState(nextState);

            return this.save().done(function () {
                // If the server's state and the local state mismatch, trigger the appropriate event
                // for the state of the task on the server
                if (self.getState() !== nextState) {
                    eventName = self.eventNameForState(self.getState());
                    self._triggerTaskEvent(eventName);
                }
            }).fail(function () {
                // revert the task state.
                self.set({
                    state: currentState,
                    lastState: nextState
                });

                self._triggerTaskEvent(getEventName('failed-transition'));
            });
        },

        /**
         * Update the text of a task and save it, restoring the old text on failure
         * (for optimisic updates).  Always returns a promise, if there's a validation
         * error then this promise will be rejected with the error.
         *
         * @param {string} text
         * @returns {Promise}
         */
        updateText: function updateText(text) {
            var self = this;
            var oldText = this.getText();
            var sanitisedText = Task.sanitiseText(text);
            this.setText(sanitisedText);

            return (this.save() || Backbone.$.Deferred().reject(this.validationError)).fail(function () {
                if (sanitisedText !== '') {
                    self.setText(oldText);
                }
            });
        },

        validate: function validate(attrs, options) {
            var sanitisedText = Task.sanitiseText(attrs.text);
            if (sanitisedText !== attrs.text) {
                return AJS.I18n.getText('bitbucket.web.tasks.error.invalidText');
            }

            if (attrs.text === '') {
                return AJS.I18n.getText('bitbucket.web.tasks.error.missingText');
            }
        },

        sync: function sync(method, model, options) {
            // We set a transient property to indicate a pending sync in order to
            // have something for the soy template for rendering a task to use to
            // determine whether to add a 'task-pending-sync' class
            this.setPendingSync(true);

            var syncPromise = Backbone.sync(method, model, _.extend(options, {
                statusCode: {
                    '404': function _(xhr, testStatus, errorThrown, data) {
                        var error = data && data.errors && data.errors.length && data.errors[0];
                        var message = error && error.message;
                        if (method !== 'create') {
                            message = AJS.I18n.getText('bitbucket.web.tasks.noSuchTask', bitbucket.internal.util.productName());
                        }
                        return {
                            title: AJS.I18n.getText('bitbucket.web.tasks.noSuchTask.title'),
                            message: message,
                            shouldReload: true,
                            fallbackUrl: undefined
                        };
                    }
                }
            }));

            syncPromise.always(this.setPendingSync.bind(this, false));

            return syncPromise;
        },

        _triggerTaskEvent: function _triggerTaskEvent(name, data) {
            if (data === this) {
                // don't extend a task model
                data = {};
            }
            eventsApi.trigger(name, null, _.extend({
                task: this.toJSON()
            }, data));
        }
    }, {
        Anchor: Anchor
    });

    /**
     * Sanitises an input text string to ensure that it is valid task text - ie. a trimmed single line
     *
     * @param {string} text
     * @returns {string}
     */
    Task.sanitiseText = function (text) {
        return text.trim().replace(/\s+/gm, ' ');
    };

    return Task;
});