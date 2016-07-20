'use strict';

define('bitbucket/internal/feature/tasks/pull-request-list', ['bacon', 'jquery', 'bitbucket/internal/feature/tasks/tasks-overview/tasks-counter', 'bitbucket/internal/util/function', 'bitbucket/internal/util/promise', 'bitbucket/internal/widget/updating-section', 'exports'], function (Bacon, $, TasksCounter, fn, promiseUtil, UpdatingSection, exports) {

    'use strict';

    var taskCounter;

    function pullRequestRowItem(context) {
        if (!taskCounter) {
            taskCounter = new TasksCounter();
        }

        var pullRequest = context.pullRequest;
        var pullRequestId = pullRequest.id;
        var repositoryId = pullRequest.toRef.repository.id;

        // Initial value for the Task Counter in the format that the task
        // counter expects to receive
        var initialValueProperty = Bacon.once({
            pullRequestId: pullRequestId,
            repositoryId: repositoryId,
            // the openTaskCount property is not present if there aren't any, and it returns an array of a string even with a single value,
            // so we either use that value or a default of 0
            openTaskCount: fn.dot('properties.openTaskCount')(pullRequest) || 0,
            resolvedTaskCount: 0
        });

        var pullRequestTaskCount = taskCounter.countPropertyForPullRequest({
            pullRequestId: pullRequestId,
            repositoryId: repositoryId
        }, initialValueProperty);

        // We wait for the element to be added to the DOM - we return the HTML from the Soy template from this
        // function but it's not yet in the DOM when this function returns so it won't be found, we need to wait for
        // it to be added in order to attach code to it.
        //
        // @TODO: when STASHDEV-4078 is fixed we can change this in concordance with the API it will expose

        promiseUtil.waitFor({
            predicate: function predicate() {
                var $el = $(".replacement-placeholder[data-pull-request-id='" + pullRequest.id + "'][data-repository-id='" + repositoryId + "']");
                return $el.length ? $el.parent() : false;
            },
            name: 'PR List Item',
            interval: 50
        }).then(function (el) {
            new UpdatingSection(el, pullRequestTaskCount, bitbucket.internal.feature.tasks.pullRequestList.openTaskCount, {
                context: {
                    pullRequest: pullRequest
                }
            });
        });

        return bitbucket.internal.feature.tasks.pullRequestList.rowItem(context);
    }

    exports.pullRequestRowItem = pullRequestRowItem;
});