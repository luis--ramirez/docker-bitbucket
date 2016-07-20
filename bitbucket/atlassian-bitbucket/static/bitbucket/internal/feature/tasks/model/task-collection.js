'use strict';

define('bitbucket/internal/feature/tasks/model/task-collection', ['backbone-brace', 'bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/util/state', 'bitbucket/internal/feature/tasks/model/task', 'bitbucket/internal/feature/tasks/model/task-state'], function (Brace, eventsApi, nav, pageStateApi, Task, TaskState) {

    'use strict';

    var TaskCollection = Brace.Collection.extend({
        model: Task,

        initialize: function initialize() {
            // N.B. The 'remove' event on the collection is fired when a task is *deleted* from the collection
            this.on('remove', function (model) {
                if (!model.isNew()) {
                    // Only trigger the event if this is a task that has been synced to the server.
                    // The data passed the event needs to reflect the correct last state so that the right value is
                    // decremented
                    var task = model.toJSON();
                    task.lastState = task.state;
                    task.state = TaskState.DEFAULT;
                    eventsApi.trigger('bitbucket.internal.feature.pull-request-tasks.deleted', null, { task: task });
                }
            });
        },

        url: nav.rest('tasks').addPathComponents('pull-requests').withParams({
            repositoryId: pageStateApi.getRepository().id,
            pullRequestId: pageStateApi.getPullRequest().id,
            start: 0,
            limit: 1000
        }).build()
    });

    var sharedCollection = new TaskCollection();

    /**
     * Get a task collection instance that can be shared between modules to ensure that the same Tasks are being
     * manipualted.
     *
     * @returns {TaskCollection} a shared TaskCollection
     */
    TaskCollection.getCollection = function () {
        return sharedCollection;
    };

    return TaskCollection;
});