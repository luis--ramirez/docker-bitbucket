'use strict';

define('bitbucket/internal/feature/tasks/model/task-state', function () {

    'use strict';

    /**
     * @enum {{DEFAULT: string, OPEN: string, RESOLVED: string, DELETED: string, Transitions: object}}
     */

    var TaskState = {
        'DEFAULT': 'NONE',
        'OPEN': 'OPEN',
        'RESOLVED': 'RESOLVED',
        'DELETED': 'DELETED'
    };

    TaskState.Transitions = {};
    TaskState.Transitions[TaskState.DEFAULT] = TaskState.OPEN;
    TaskState.Transitions[TaskState.OPEN] = TaskState.RESOLVED;
    TaskState.Transitions[TaskState.RESOLVED] = TaskState.OPEN;

    return TaskState;
});