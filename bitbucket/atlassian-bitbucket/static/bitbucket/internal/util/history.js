'use strict';

define('bitbucket/internal/util/history', ['bitbucket/util/events', 'bitbucket/internal/bbui/history/history', 'bitbucket/internal/util/deprecation'], function (events, history, deprecation) {
    'use strict';

    function trigger(name, event) {
        var oldEvent = "memoir." + name;
        var newEvent = "bitbucket.internal.history." + name;

        deprecation.triggerDeprecated(oldEvent, undefined, event, null, '4.2', '5.0');
        events.trigger(newEvent, undefined, event);
    }

    history.on('popstate', trigger.bind(null, 'popstate'));
    history.on('changestate', trigger.bind(null, 'changestate'));

    return history;
});