'use strict';

var _react = require('react');

var _react2 = babelHelpers.interopRequireDefault(_react);

define('bitbucket/internal/v2/layout/pull-request', ['aui', 'chaperone', 'jquery', 'lodash', 'react', 'react-dom', 'react-redux', 'bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/util/state', 'bitbucket/internal/bbui/actions/pull-request', 'bitbucket/internal/model-transformer', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/pull-request', 'bitbucket/internal/model/revision', 'bitbucket/internal/util/dom-event', 'bitbucket/internal/util/events', 'bitbucket/internal/util/feature-loader', 'bitbucket/internal/util/history', 'bitbucket/internal/util/horizontal-keyboard-scrolling', 'bitbucket/internal/v2/feature/pull-request/analytics', 'bitbucket/internal/v2/feature/pull-request/header/pull-request-header-view', 'bitbucket/internal/v2/feature/pull-request/store/pull-request-store', 'exports'], function (AJS, Chaperone, $, _, React, ReactDOM, ReactRedux, eventsApi, nav, state, Actions, transformer, pageState, PullRequest, Revision, domEventUtil, events, FeatureLoader, history, horizontalKeyboardScrolling, pullRequestAnalytics, PullRequestHeaderView, pullRequestStore, exports) {

    var HANDLER_TYPES = {
        diff: 'bitbucket.pull-request.nav.diff',
        overview: 'bitbucket.pull-request.nav.overview',
        commits: 'bitbucket.pull-request.nav.commits'
    };

    var $tabMenu;

    var haveKeyboardShortcutsObject = $.Deferred();

    function bindKeyboardShortcuts() {

        events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', function (keyboardShortcuts) {
            keyboardShortcuts.enableContext('pull-request');
            haveKeyboardShortcutsObject.resolve(keyboardShortcuts);
        });

        events.on('bitbucket.internal.keyboard.shortcuts.requestGotoPullRequestsListHandler', function (keys) {
            (this.execute ? this : AJS.whenIType(keys)).execute(function () {
                window.location.href = nav.currentRepo().allPullRequests().build();
            });
        });

        events.on('bitbucket.internal.keyboard.shortcuts.requestChangePullRequestSectionHandler', function (keys) {
            (this.execute ? this : AJS.whenIType(keys)).execute(function (e) {
                var number = parseInt(String.fromCharCode(e.which), 10);
                var $link = $tabMenu.children().eq(number - 1).children('a');
                $link.click();
            });
        });
    }

    function initTabs() {
        function setTabActive($tab) {
            $tab.addClass('active-tab').siblings().removeClass('active-tab');
        }

        function updateDiffTabUrl(commit, pullRequest) {
            var tabUrl = commit ? nav.currentRepo().pullRequest(pullRequest).commit(commit.id).build() : nav.currentRepo().pullRequest(pullRequest).diff().build();
            $tabMenu.find('.menu-item[data-module-key="bitbucket.pull-request.nav.diff"] > a').attr('href', tabUrl);
        }

        $tabMenu.on('click', 'a', function (e) {
            if (!domEventUtil.openInSameTab(e)) {
                return;
            }
            var $a = $(this);
            var $tab = $a.parent();

            if (!$tab.is('.active-tab')) {
                setTabActive($tab);
                events.trigger('bitbucket.internal.layout.pull-request.urlRequested', null, $a.prop('href'));

                var tabName = $tab.data('module-key').split('.').pop();
                var data = {
                    'keyboard': !(e.originalEvent instanceof MouseEvent)
                };
                // Analytics event: stash.client.pullRequest.tab.commits
                // Analytics event: stash.client.pullRequest.tab.diff
                // Analytics event: stash.client.pullRequest.tab.overview
                events.trigger('bitbucket.internal.feature.pullRequest.tab.' + tabName, null, data);
            }

            e.preventDefault();
        });
        events.on('bitbucket.internal.page.pull-request.view.contextLoaded', function (context) {
            setTabActive($tabMenu.find('[data-module-key="' + context.name + '"]'));

            // Pause the scrolling functionality on the overview section for pull request page
            // This piece of code can be removed on pull request 2.0
            if (context.name === HANDLER_TYPES.diff) {
                horizontalKeyboardScrolling.resume();
            } else {
                horizontalKeyboardScrolling.pause();
            }
        });

        events.on('bitbucket.internal.feature.commitselector.commitSelected', function (commit, pullRequest) {
            pageState.setCommit(commit ? new Revision(commit) : null);
            updateDiffTabUrl(commit, pullRequest);
        });

        haveKeyboardShortcutsObject.done(function (keyboardShortcuts) {
            _.each($tabMenu.children(), function (tab, index) {
                var $tab = $(tab);
                var key = String(index + 1);
                var message = AJS.I18n.getText('bitbucket.web.keyboardshortcut.pull-request.switch.tabs', $tab.text());
                keyboardShortcuts.addCustomShortcut('pull-request', [[key]], message);
                $tab.attr('title', ($tab.attr('title') || message) + AJS.I18n.getText('bitbucket.web.keyboardshortcut.type', key));
            });
        });

        updateDiffTabUrl(state.getCommit(), state.getPullRequest());
    }

    var loader = new FeatureLoader({
        loadedEvent: 'bitbucket.internal.page.pull-request.view.contextLoaded',
        unloadedEvent: 'bitbucket.internal.page.pull-request.page.pull-request.view.contextUnloaded',
        requestedEvent: 'bitbucket.internal.page.pull-request.view.contextRequested'
    });

    function initLoader(contentSelector, dataReady) {
        // TODO: Consider Jason's idea of contexts. Lots of weirdness to flesh out with
        // TODO: the best API for this stuff.

        loader.registerHandler(HANDLER_TYPES.diff, /^[^\?\#]*pull-requests\/\d+\/(diff|commits\/\b[0-9a-fA-F]{5,40}\b)/, 'bitbucket/internal/page/pull-request/view/pull-request-view-diff');
        loader.registerHandler(HANDLER_TYPES.overview, /^[^\?\#]*pull-requests\/\d+\/overview/, 'bitbucket/internal/v2/page/pull-request/view/pull-request-view-overview');
        loader.registerHandler(HANDLER_TYPES.commits, /^[^\?\#]*pull-requests\/\d+\/commits(\/?)($|[#?])/, 'bitbucket/internal/page/pull-request/view/pull-request-view-commits');

        /**
         * @param eventType {String} 'start' or 'end'
         * @param handlerName {String} name of the feature loader handler
         */
        function getBrowserMetricsEventHandler(eventType, handlerName) {
            var handlerKey = _.findKey(HANDLER_TYPES, _.matches(handlerName));
            if (handlerKey) {
                eventsApi.trigger('bitbucket.internal.browser-metrics.pull-request.' + handlerKey + '.' + eventType);
            }
        }

        // Raising context requested/loaded events for Stash apdex plugin. The tab types are defined on {@code HANDLER_TYPES}.
        events.on('bitbucket.internal.page.pull-request.view.contextRequested', getBrowserMetricsEventHandler.bind(null, 'start'));

        events.on('bitbucket.internal.page.pull-request.view.contextLoaded', function (handler) {
            getBrowserMetricsEventHandler('end', handler.name);
        });

        events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', function (keyboardShortcuts) {
            loader.setKeyboardShortcuts(keyboardShortcuts);
            keyboardShortcuts.enableContext('pull-request');
        });

        events.on('bitbucket.internal.layout.pull-request.urlRequested', function (url) {
            if (url !== window.location.href) {
                history.pushState(null, '', url);
            }
        });

        events.on('bitbucket.internal.util.feature-loader.errorOccurred', function (error) {
            if (error.code === FeatureLoader.NO_HANDLER) {
                console.log("You did not register a handler for this page. Please call\n" + "require('bitbucket/internal/layout/pull-request').registerHandler(\n" + "   'tab-web-item-module-key',\n" + "   /^[^\\?\\#]*url-regex/,\n" + "   {\n" + "       load : function (contentElement) {},\n" + "       unload : function (contentElement) {}\n" + "   }\n" + ")");
            } else {
                console.log(error.message);
            }
        });

        dataReady.done(function (data) {
            loader.init($(contentSelector).get(0));
        });
    }

    function initReviewerStatusFeatureDiscovery() {
        Chaperone.registerFeature('reviewer-status', [{
            id: 'reviewer-status',
            alignment: 'top right',
            selector: '.reviewing.reviewer-status-selector',
            content: bitbucket.internal.feature.pullRequest.feature.discovery.reviewerStatus(),
            close: {
                text: AJS.I18n.getText("bitbucket.web.got.it")
            },
            moreInfo: {
                href: bitbucket_help_url('bitbucket.help.pull.request'),
                text: AJS.I18n.getText('bitbucket.web.pullrequest.learn.more'),
                extraAttributes: {
                    target: "_blank"
                }
            },
            once: true
        }]);

        events.on('bitbucket.internal.feature.pullRequest.self.added', Chaperone.checkFeatureVisibility);
    }

    exports.registerHandler = $.proxy(loader.registerHandler, loader);

    /**
     *
     * @param {Object} options
     * @param {Object} options.commitJSON
     * @param {Object} options.pullRequestJSON
     * @param {Object} options.hasRepoWrite - does the current user have repo write
     * @param {string} options.contentSelector
     * @param {Object} options.commitsTableWebSections
     * @param {?number} options.maxChanges
     * @param {?number} options.mergeTimeout
     * @param {?number} options.relevantContextLines
     */
    exports.onReady = function (options) {
        pageState.setPullRequest(new PullRequest(options.pullRequestJSON));
        if (options.commitJSON) {
            pageState.setCommit(new Revision(options.commitJSON));
        }
        pageState.extend("pullRequestViewInternal", function () {
            return {
                commitsTableWebSections: options.commitsTableWebSections,
                maxChanges: options.maxChanges,
                relevantContextLines: options.relevantContextLines,
                seenCommitReview: options.seenCommitReview
            };
        });
        pageState.extend('isWatching');

        var store = pullRequestStore();
        store.dispatch({ type: 'PR_SET_PULL_REQUEST', payload: transformer.pullRequest(options.pullRequestJSON) });
        store.dispatch({ type: 'SET_CURRENT_USER', payload: transformer.user(pageState.getCurrentUser().toJSON()) });

        ReactDOM.render(React.createElement(
            ReactRedux.Provider,
            { store: store },
            React.createElement(PullRequestHeaderView, {
                hasRepoWrite: options.hasRepoWrite,
                mergeTimeout: options.mergeTimeout
            })
        ), document.getElementById('pull-request-header'));

        $tabMenu = $('.content-body .aui-page-panel-content > .aui-tabs > .tabs-menu');

        var isWatchingPromise = $.Deferred();
        _PageDataPlugin.ready('com.atlassian.bitbucket.server.bitbucket-web:iswatching-provider', 'bitbucket.internal.pull-request.view', function (data) {
            store.dispatch({
                type: Actions.PR_SET_IS_WATCHING,
                payload: data.isWatching
            });
            pageState.setIsWatching(data.isWatching);
            isWatchingPromise.resolve();
        });

        if (options.seenNeedsWork !== true) {
            initReviewerStatusFeatureDiscovery();
        }

        $(document).on('click', 'button.needs-work', function () {
            Chaperone.registerFeature('needs-work-click', [{
                id: 'needs-work-click',
                selector: 'button.needs-work',
                alignment: 'bottom center',
                title: AJS.I18n.getText('bitbucket.web.pullrequest.reviewer.status.feature.discovery.needs.work.click.title'),
                content: bitbucket.internal.feature.pullRequest.feature.discovery.reviewerStatusClick(),
                close: {
                    text: AJS.I18n.getText("bitbucket.web.got.it")
                },
                moreInfo: {
                    href: bitbucket_help_url('bitbucket.help.pull.request'),
                    text: AJS.I18n.getText('bitbucket.web.pullrequest.learn.more'),
                    extraAttributes: {
                        target: "_blank"
                    }
                },
                width: 340,
                once: true
            }]);
        });

        pullRequestAnalytics.init();

        bindKeyboardShortcuts();

        initTabs();

        initLoader(options.contentSelector, isWatchingPromise);
    };
});