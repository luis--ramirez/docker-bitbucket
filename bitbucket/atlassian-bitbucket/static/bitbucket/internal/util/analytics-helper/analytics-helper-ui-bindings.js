'use strict';

define('bitbucket/internal/util/analytics-helper/analytics-helper-ui-bindings', ['jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/util/state', 'bitbucket/internal/util/analytics-helper/analytics-helper', 'bitbucket/internal/util/events', 'bitbucket/internal/util/html'],
/**
 * The Analytics Helper UI Bindings module will bind several UI events and broadcast generic Events for them
 * These Events can then be listened to by the Analytics Helper to broadcast analytics events
 * and attach attributes to those events
 */
function ($, _, navBuilder, pageState, analyticsHelper, events, htmlUtil) {

    'use strict';

    /**
     * The default context selector for child elements in a context.
     * @type {string}
     */

    var DEFAULT_CONTEXT_SELECTOR = 'a';
    /**
     * The default event to monitor on context containers
     * @type {string}
     */
    var DEFAULT_CONTEXT_EVENT = 'click';

    /**
     * A UI event context.
     * One of eventName or eventMap should be used. If eventName is present, it will be used to fire the UI event
     * if eventMap is present (and only if eventName isn't simultaneously present) it will be used.
     *
     * @typedef {Object} UIContext
     * @property {jQuery} container - the jQuery object to scope event handlers to
     * @property {string} selector - a selector to use as a scope for event handlers bound on the `container`.
     *                               Set this to the same value as the container for events that need to be
     *                               directly monitored on the container.
     * @property {?UIEventMap} eventMap
     * @property {?string} - eventName - The event name to trigger as soon as the UI event fires
     * @property {?string} - event - The event to monitor on the container
     */

    /**
     * A generic event context
     * Generic event contexts will monitor non-ui based events (i.e. things triggered by events.trigger())
     *
     * @typedef {Object} GenericContext
     * @property {string} on - the event name
     * @property {Function<UIEvent>} callback - the callback that will return the event object
     */

    /**
     * This contains a set of properties that contain either {string}s or {UIEventCallback}s
     * Property names are CSS Selectors.
     *
     * @typedef {Object} UIEventMap
     * @property {string|UIEventCallback} *
     */

    /**
     * @callback UIEventCallback
     * @param {Event} e
     * @returns {string|UIEvent}
     */

    /**
     * @typedef {Object} UIEvent
     * @property {string} eventName
     * @property {Object} data
     */

    function init() {
        // the document should ideally only be used when instrumenting things that are
        // not present in the DOM until a user initiated event happens.
        var $document = $(document);
        var $header = $('#header');
        var $appSwitcher = $('#app-switcher');
        var $helpMenu = $(htmlUtil.sanitizeId('#com.atlassian.bitbucket.server.bitbucket-server-web-fragments-help-menu'));
        var $profileMenu = $('#user-dropdown-menu');
        var $inboxLink = $('#inbox-trigger');
        var $inboxMenu = $('.inbox-menu');

        /**
         *
         * @type {Array<UIContext>}
         */
        var UIContexts = [
        // HEADER LINKS
        {
            container: $header,
            eventMap: {
                '#logo a': 'nav.logo.clicked',
                '.projects-link': 'nav.projects.clicked',
                '.admin-link': 'nav.globalsettings.clicked'
            }
        },
        // APPSWITCHER
        {
            container: $appSwitcher,
            // Use the container as the selector when watching an event on the container.
            selector: $appSwitcher,
            event: 'aui-dropdown2-show',
            eventName: 'applinks.menu.opened'
        }, {
            container: $appSwitcher,
            eventName: 'applinks.menu.clicked'
        },
        // HELP MENU
        {
            container: $helpMenu,
            selector: $helpMenu,
            event: 'aui-dropdown2-show',
            eventName: 'nav.help.opened'
        }, {
            container: $helpMenu,
            eventMap: {
                'a': function a() {
                    return {
                        eventName: 'nav.help.item.clicked',
                        data: {
                            webItemKey: $(this).attr('data-web-item-key')
                        }
                    };
                }
            }
        },
        // PROFILE MENU
        {
            container: $profileMenu,
            selector: $profileMenu,
            event: 'aui-dropdown2-show',
            eventName: 'nav.profile.opened'
        }, {
            container: $profileMenu,
            eventMap: {
                'a': function a() {
                    return {
                        eventName: 'nav.profile.item.clicked',
                        data: {
                            webItemKey: $(this).attr('data-web-item-key')
                        }
                    };
                }
            }
        },
        // PR INBOX
        {
            container: $inboxMenu,
            selector: $inboxLink,
            eventMap: {
                'a': function a() {
                    return {
                        eventName: 'nav.inbox.opened',
                        data: {
                            count: $(this).find('.aui-badge').text()
                        }
                    };
                }
            }
        }, {
            container: $document,
            selector: '#inline-dialog-inbox-pull-requests-content a',
            eventMap: {
                '.menu-item a': function menuItemA() {
                    var href = $(this).attr('href');
                    var needsWorkCount = $(href).find('tr.prNeedsWork').length;
                    return {
                        eventName: 'nav.inbox.tab.selected',
                        data: {
                            name: href === '#inbox-pull-request-reviewer' ? 'reviewing' : 'created',
                            reviewed: needsWorkCount,
                            unreviewed: $(href).find('tr').length - needsWorkCount
                        }
                    };
                },
                '.pull-requests-table td.title a': function pullRequestsTableTdTitleA() {
                    var $el = $(this);
                    var isAuthor = $el.closest('.tabs-pane').is('#inbox-pull-request-created');
                    return {
                        eventName: 'nav.inbox.item.clicked',
                        data: {
                            isAuthor: isAuthor,
                            status: isAuthor ? null : $el.closest('tr').is('.prNeedsWork') ? 'NEEDS_WORK' : 'UNAPPROVED'
                        }
                    };
                }
            }
        },
        // FOOTER
        {
            container: $("#footer ul"),
            eventMap: {
                'a': function a() {
                    return {
                        eventName: 'nav.footer.item.clicked',
                        data: {
                            linkId: $(this).closest('li').attr('data-key')
                        }
                    };
                }
            }
        }];

        // "Generic" contexts are non-ui specific events. Generally used for watching 'bitbucket.*' events
        // and following up with a callback.
        var genericContexts = [
        // Diff View
        {
            on: 'bitbucket.internal.feature.fileContent.diffViewDataLoaded',
            callback: function callback() {

                // On the PullRequest overview page bail out early to avoid triggering an analytics
                // event for every diff with a comment.
                if (pageState.getPullRequest() && window.location.pathname === navBuilder.currentPullRequest().overview().build()) {
                    return;
                }

                // Get the source of the diff view
                var source;
                if (pageState.getPullRequest() !== false) {
                    source = 'pullrequest';
                } else if (pageState.getCommit() !== false) {
                    source = 'commit';
                } else if (pageState.getPullRequest() === false && pageState.getCommit() === false && pageState.getRef()) {
                    source = 'source-view';
                } else if (pageState.getPullRequest() === false && pageState.getCommit() === false && pageState.getRef() === false) {
                    source = 'create-pullrequest';
                    if (window.location.pathname === navBuilder.currentRepo().compare().diff().build()) {
                        source = 'compare-branch';
                    }
                }
                var dvOptions = require('bitbucket/internal/feature/file-content/diff-view-options').getOptions();
                return {
                    eventName: 'diff-view.viewed',
                    data: {
                        ignoreWhitespace: dvOptions.ignoreWhitespace,
                        hideComments: dvOptions.hideComments,
                        hideEdiff: dvOptions.hideEdiff,
                        diffType: dvOptions.diffType,
                        source: source
                    }
                };
            }
        }, {
            on: 'bitbucket.internal.feature.branch-creation.branchCreated',
            callback: function callback() {
                return {
                    eventName: 'branch.created'
                };
            }
        }, {
            on: 'bitbucket.internal.page.branches.revisionRefRemoved',
            callback: function callback() {
                return {
                    eventName: 'branch.deleted'
                };
            }
        }];

        UIContexts.forEach(instrumentUIContext);
        genericContexts.forEach(instrumentGenericContext);
    }

    /**
     * Parse the context objects and set up event listeners that execute callbacks and trigger events.
     *
     * @param {GenericContext} context
     */
    function instrumentGenericContext(context) {
        if (context.on) {
            events.on(context.on, function (data) {
                triggerUIEvent(context.callback.call(this, data));
            });
        }
    }

    /**
     * Parse the context objects and set up UI event listeners that execute callbacks and trigger events.
     *
     * @param {UIContext} context
     */
    function instrumentUIContext(context) {
        context.container.on(context.event || DEFAULT_CONTEXT_EVENT, context.selector || DEFAULT_CONTEXT_SELECTOR, function (e) {
            if (context.eventName) {
                triggerUIEvent(context.eventName);
                return;
            }

            var $el = $(this);
            var self = this;

            /**
             * @param {string|UIEventCallback} eventName - can be one of:
             *                                - a string (the event name)
             *                                - a function (which when called will return either a string with
             *                                  the event name or an {UIEvent}
             *
             * @param {string} selector - a valid CSS selector
             */
            _.forEach(context.eventMap, function (eventName, selector) {
                var event;
                if ($el.is(selector)) {
                    event = _.isFunction(eventName) ? eventName.call(self, e) : eventName;
                    if (event) {
                        triggerUIEvent(event);
                    }
                }
            });
        });
    }

    /**
     * Trigger a UI event.
     * @param {string|UIEvent} event
     */
    function triggerUIEvent(event) {
        // bail out if we have a non-event
        if (!event) {
            return;
        }
        if (_.isString(event)) {
            event = { eventName: event };
        }
        events.trigger(analyticsHelper.prefixEventName(event.eventName), null, event.data);
    }

    // Self initialise when the DOM is ready
    $(document).ready(init);
});