'use strict';

define('bitbucket/internal/layout/base', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/stash-user', 'bitbucket/internal/util/analytics', 'bitbucket/internal/util/client-storage', 'bitbucket/internal/util/events', 'bitbucket/internal/util/history', 'bitbucket/internal/widget/aui/dropdown', 'bitbucket/internal/widget/aui/form', 'exports'], function (AJS, $, _, nav, pageState, StashUser, analytics, clientStorage, events, history, dropdown, form, exports) {

    'use strict';

    // Only check for debugging params when there is a querystring.

    if (location.search) {
        var uri = nav.parse(location.href);
        var eveSelector = uri.getQueryParamValue('eve');

        // This is really handy for debugging the event lifecycle of the page, pass ?eve=selector to use (makes most sense with wildcards)
        // Logs to the console the event name, the 'this' context and the arguments passed to the handler.
        eveSelector && events.on(eveSelector, function () {
            console.log([events.name()], this, arguments);
        });
    }

    function initUserPageState(currentUserJson) {
        if (currentUserJson) {
            // TODO: Add this to $ij? Means InjectedDataFactory relies on permissionService
            currentUserJson.isAdmin = !!$('#header').find('a.admin-link').length;
            pageState.setCurrentUser(new StashUser(currentUserJson));
        }
    }

    /**
     * Trigger an analytics event containing some demographic information about the user
     * Only trigger this once per browser session
     *
     * @param {string} analyticsSessionKey - the session storage key
     */
    function triggerSessionDemographicAnalytics(analyticsSessionKey) {
        if (!clientStorage.getSessionItem(analyticsSessionKey)) {
            clientStorage.setSessionItem(analyticsSessionKey, true);
            analytics.add('demographics', { d_lang: document.documentElement.lang }, true);
        }
    }

    exports.onReady = function (currentUserJson, instanceName) {
        initUserPageState(currentUserJson);

        dropdown.onReady();
        form.onReady();

        // for use by keyboard-shortcuts.js, but could be useful elsewhere.
        // I realize this is the wrong place for an encodeURIComponent, but it _should_ do nothing, except for when
        // our build leaves a ${commitHash} here instead of a hex number.
        AJS.params["build-number"] = encodeURIComponent($('#product-version').attr('data-system-build-number'));

        var $window = $(window);

        var debouncedResize = _.debounce(function () {
            events.trigger('window.resize.debounced', $window, $window.width(), $window.height());
        }, 200);
        $window.on("resize", debouncedResize);

        var throttledScroll = _.throttle(function () {
            events.trigger('window.scroll.throttled', $window, $window.scrollTop());
        }, 25);
        $window.on('scroll', throttledScroll);

        history.setTitleSuffix(' - ' + instanceName);
        triggerSessionDemographicAnalytics(clientStorage.buildKey('demographic-analytics', 'user'));
    };

    events.on('bitbucket.internal.history.changestate', function (e) {
        var $loginLink = $("#login-link");
        if ($loginLink.length && e.state) {
            // don't rewrite on initial page load and if login-link is not present
            $loginLink.attr("href", nav.login().next().build());
        }

        // whenever we are changing the url, we need to be sure that the tipsies are cleared.
        $('body').children('.tipsy').remove();
    });
});