'use strict';

define('bitbucket/internal/v2/feature/pull-request/action-creators/watch', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/util/server', 'bitbucket/internal/bbui/actions/pull-request', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/events'], function (AJS, $, _2, nav, server, Actions, pageState, events) {

    'use strict';

    var defaultOptions = {
        stateOnly: false
    };

    return function (options) {
        var promise;
        options = _2.assign({}, defaultOptions, options);

        // Do not make the REST call if the change is stateOnly
        if (options.stateOnly) {
            promise = $.Deferred().resolve();
        } else {
            var url = nav.rest().currentPullRequest().watch().build();
            promise = server.rest({
                url: url,
                type: options.watchState ? 'POST' : 'DELETE',
                statusCode: {
                    '401': function _(xhr, textStatus, errorThrown, errors, dominantError) {
                        return _2.assign({}, dominantError, {
                            title: AJS.I18n.getText('bitbucket.web.watch.default.error.401.title'),
                            message: AJS.I18n.getText('bitbucket.web.watch.default.error.401.message'),
                            fallbackUrl: false,
                            shouldReload: true
                        });
                    },
                    '409': function _(xhr, textStatus, errorThrown, errors, dominantError) {
                        return _2.assign({}, dominantError, {
                            title: AJS.I18n.getText('bitbucket.web.watch.default.error.409.title'),
                            fallbackUrl: false,
                            shouldReload: true
                        });
                    }
                }
            });
        }

        promise.done(function () {
            pageState.setIsWatching(options.watchState);
            var eventName = options.watchState ? 'bitbucket.internal.web.watch-button.added' : 'bitbucket.internal.web.watch-button.removed';
            // Note that the original event passed in a context (the Watch button instance)
            events.trigger(eventName, null, options);
        });

        return {
            type: Actions.PR_WATCH,
            payload: options.watchState,
            meta: {
                promise: promise
            }
        };
    };
});