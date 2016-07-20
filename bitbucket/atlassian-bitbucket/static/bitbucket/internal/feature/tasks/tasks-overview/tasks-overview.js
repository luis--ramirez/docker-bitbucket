'use strict';

define('bitbucket/internal/feature/tasks/tasks-overview', ['bacon', 'jquery', 'lodash', 'bitbucket/util/events', 'bitbucket/util/state', 'bitbucket/internal/feature/tasks/tasks-overview/tasks-counter', 'bitbucket/internal/feature/tasks/tasks-overview/tasks-overview-panel', 'exports'], function (Bacon, $, _, eventsApi, stateApi, TasksCounter, TasksOverviewPanel, exports) {

    'use strict';

    var taskCountProperty; // Bacon property that tracks the open task count
    var tasksCounter;
    var overviewPanels = []; // Array of instanciated TaskOverviewPanels for later destruction

    /**
     * Adds dynamic behaviour to any open task count panels that are found in the DOM
     */
    function createTaskCountPanels() {
        var pullRequestId = stateApi.getPullRequest().id;
        var repositoryId = stateApi.getRepository().id;
        var initialValueProperty = Bacon.fromPromise(_PageDataPlugin.ready('com.atlassian.bitbucket.server.bitbucket-web:pull-request-tasks-page-provider', 'bitbucket.layout.pullRequest')).map(function (value) {
            return _.extend(value.hasOwnProperty('openTaskCount') ? value : tasksCounter.emptyCounter(), {
                pullRequestId: pullRequestId,
                repositoryId: repositoryId
            });
        });

        if (!taskCountProperty) {
            taskCountProperty = tasksCounter.countPropertyForPullRequest({
                pullRequestId: pullRequestId,
                repositoryId: repositoryId
            }, initialValueProperty);
        }

        $('.plugin-item-task-count').each(function () {
            overviewPanels.push(new TasksOverviewPanel(this, taskCountProperty));
        });
    }

    /**
     * Handler for contextLoaded events to trigger a call to createTaskCountPanels
     * when we are on the Overview PR tab
     *
     * @param {object} info about context that is being loaded
     */
    function contextLoadedHandler(context) {
        if (context.name === "bitbucket.pull-request.nav.overview") {
            createTaskCountPanels();
        }
    }

    /**
     * Handler for contextUnloaded events to destroy any open task count panels
     * when leave the Overview PR tab
     *
     * @param {object} info about context that is being unloaded
     */
    function contextUnloadedHandler(context) {
        if (context.name === "bitbucket.pull-request.nav.overview") {
            _.invoke(overviewPanels, 'destroy');
            overviewPanels = [];
        }
    }

    /**
     * Context provider for the PR Overview task count panel
     *
     * @param {Object} context
     * @returns {{openTaskCount: number}}
     */
    exports.openTaskCountContext = function (context) {
        // the task count is loaded asynchronously when the page data becomes available (see countTasks())
        return TasksCounter.prototype.emptyCounter({
            pullRequestId: context.pullRequest.id,
            repositoryId: context.pullRequest.fromRef.repository.id
        });
    };

    exports.onReady = function () {

        tasksCounter = new TasksCounter();

        eventsApi.on('bitbucket.internal.page.pull-request.view.contextLoaded', contextLoadedHandler);
        eventsApi.on('bitbucket.internal.page.pull-request.view.contextUnloaded', contextUnloadedHandler);

        createTaskCountPanels();
    };
});