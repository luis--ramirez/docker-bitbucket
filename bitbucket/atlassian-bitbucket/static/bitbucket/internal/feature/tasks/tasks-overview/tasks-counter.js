'use strict';

define('bitbucket/internal/feature/tasks/tasks-overview/tasks-counter', ['bacon', 'jquery', 'lodash', 'bitbucket/internal/feature/tasks/model/task-state', 'bitbucket/internal/util/bacon', 'bitbucket/internal/util/function'], function (Bacon, $, _, TaskState, baconUtil, fn) {

    'use strict';

    /**
     * This object contains a stream of count change events for tasks, and can
     * provide a property that tracks the counts for a single pull requests to
     * be used on the pull requests list and pull request overview page task count
     * panel
     *
     * @constructor
     */

    function TasksCounter() {
        this.init.apply(this, arguments);
    }

    /**
     * Initialises a TaskCounter which contains a stream of count change events for tasks,
     * and can provide a property that tracks the counts for a single pull requests to
     * be used on the pull requests list and pull request overview page task count
     * panel
     */
    TasksCounter.prototype.init = function () {
        var self = this;
        this._destroyCallbacks = [];

        _.bindAll(this, '_mapEventData');

        var eventNames = ['created', 'resolved', 'reopened', 'deleted', 'failed-transition'];
        this._taskCounterStream = Bacon.mergeAll(_.map(eventNames, function (name) {
            return baconUtil.events('bitbucket.internal.feature.pull-request-tasks.' + name).map(self._mapEventData);
        }))
        // merge the set-counts event on separately as we don't want to run it through _mapEventData
        .merge(baconUtil.events('bitbucket.internal.feature.pull-request-tasks.set-counts'));
    };

    /**
     * Returns an empty object that is in the format that the counter maintains
     *
     * @param {object} [context]
     * @param {number} [context.pullRequestId=null] the pull request id to embed in the counter object
     * @param {number} [context.repositoryId=null] the repository id to embed in the counter object. Defaults to the current repository ID
     * @returns {object} a counter object with all values set to 0
     */
    TasksCounter.prototype.emptyCounter = function (context) {
        var counter = {
            openTaskCount: 0,
            resolvedTaskCount: 0,
            pullRequestId: context && context.pullRequestId || null,
            repositoryId: context && context.repositoryId || null
        };

        return counter;
    };

    /**
     * Internal function which maps the context of a Task event to an object containing
     * the change to the counts of various tasks that occurred
     *
     * @param {object} context - a context object delivered by an event triggered by the TaskModel
     * @returns {object} information about the change to each state of task that occurred due to this event
     * @private
     */
    TasksCounter.prototype._mapEventData = function (context) {
        var change = this.emptyCounter(context.task);

        switch (context.task.state) {
            case TaskState.OPEN:
                change.openTaskCount = 1;
                break;
            case TaskState.RESOLVED:
                change.resolvedTaskCount = 1;
                break;
        }

        switch (context.task.lastState) {
            case TaskState.OPEN:
                change.openTaskCount = -1;
                break;
            case TaskState.RESOLVED:
                change.resolvedTaskCount = -1;
                break;
        }

        return change;
    };

    /**
     * Creates a Bacon property that tracks the task count by state for a particular
     * pull request, given an initial starting count
     *
     * @param {object} context
     * @param {number} context.pullRequestId - the pull request id to filter events by
     * @param {number} context.repositoryId - the repository id to filter events by
     * @param {Bacon.Stream} initialValueProvider - a single value stream that provides the initial values for this pull request
     * @returns {Bacon.Property}
     */
    TasksCounter.prototype.countPropertyForPullRequest = function (context, initialValueProvider) {
        var self = this;
        var property = this._taskCounterStream.merge(initialValueProvider).filter(function (value) {
            return value.pullRequestId === context.pullRequestId && value.repositoryId === context.repositoryId;
        }).scan(this.emptyCounter(context), function (counts, change) {
            // "reset" events are expected to have the correct total values in them
            if (change.isReset) {
                counts = self.emptyCounter(change);
            }

            counts.openTaskCount += change.openTaskCount;
            counts.resolvedTaskCount += change.resolvedTaskCount;
            return counts;
        });

        /*
         * HACK: the behaviour of a Bacon property is that if nobody is listening
         * then it doesn't get updated, so we need a null listener to make sure
         * the task count is current even in this situation.
         */
        this._destroyCallbacks.push(property.onValue($.noop));

        return property;
    };

    /**
     * Destroys this TasksCounter by removing the internal listener for any
     * properties that have been created
     */
    TasksCounter.prototype.destroy = function () {
        fn.applyAll(this._destroyCallbacks);
    };

    return TasksCounter;
});