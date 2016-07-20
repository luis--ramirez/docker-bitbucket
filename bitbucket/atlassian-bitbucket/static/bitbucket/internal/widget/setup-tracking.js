'use strict';

define('bitbucket/internal/widget/setup-tracking', ['jquery', 'lodash', 'bitbucket/internal/util/client-storage', 'exports'], function ($, _, clientStorage, exports) {
    'use strict';

    var SESSION_STORE_KEY = 'stash.setup.complete.data';

    /**
     * @typedef {Object} Tracking
     * @property {boolean} isDevMode
     * @property {String} pageId
     * @property {String} serverId
     * @property {String} version
     */

    /**
     * @param {Tracking} tracking
     */
    var setupIframe = function setupIframe(tracking) {
        var iframeHost = tracking.isDevMode ? "https://qa-wac.internal.atlassian.com" : "https://www.atlassian.com";
        var iframeContextPath = "/pingback";
        var iframeQueryStringParams = $.param({
            product: 'stash',
            sid: tracking.serverId,
            pg: tracking.pageId,
            v: tracking.version
        });
        var iframeId = 'setup-progress-iframe';
        var $iframe = $('#' + iframeId);
        var iframeSrc = iframeHost + iframeContextPath + "?" + iframeQueryStringParams;
        if ($iframe.length) {
            $iframe.attr('src', iframeSrc);
        } else {
            // Setup progress iframe tracker
            $("<iframe>").attr("id", iframeId).css("display", "none").appendTo("body").attr("src", iframeSrc);
        }
    };

    function clearCompleteTracking() {
        return clientStorage.removeSessionItem(SESSION_STORE_KEY);
    }

    /**
     * @returns {Tracking} The tracking information that should be used on the setup page, or null if its not in session
     * storage.
     */
    function getCompleteTracking() {
        return clientStorage.getSessionItem(SESSION_STORE_KEY);
    }

    /**
     * @param {Tracking} currentTracking The tracking page for the current page.
     */
    function storeCompleteTracking(currentTracking) {
        var completeTracking = _.extend({}, currentTracking, { pageId: 'setup-complete' });
        clientStorage.setSessionItem(SESSION_STORE_KEY, completeTracking);
    }

    /**
     * Tracks progress through the setup wizard in order to measure drop off
     */
    function track(maybePageId) {
        var $content = $("#content");
        // ServerId is used to uniquely identify an installation
        var serverId = $content.attr('data-server-id');
        var isDevMode = $content.attr('data-dev-mode-enabled') === "true";
        var version = $.trim($("#product-version").text());
        var pageId = maybePageId ? maybePageId : window.location.pathname.replace(/\//g, "_");
        var tracking = { isDevMode: isDevMode, serverId: serverId, pageId: pageId, version: version };
        storeCompleteTracking(tracking);
        setupIframe(tracking);
    }

    /**
     * Submits a tracking event only if a previous tracking event has been stored in session storage.
     */
    function trackLoginPage() {
        var tracking = getCompleteTracking();
        if (tracking) {
            clearCompleteTracking();
            setupIframe(tracking);
        }
    }

    exports.track = track;
    exports.trackLoginPage = trackLoginPage;
});