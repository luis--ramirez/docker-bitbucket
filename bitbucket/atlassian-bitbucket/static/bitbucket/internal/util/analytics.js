'use strict';

define('bitbucket/internal/util/analytics', ['aui', 'jquery', 'bitbucket/internal/util/navigator', 'exports'], function (AJS, $, navigatorUtil, exports) {

    'use strict';

    var EVENT_PREFIX = 'stash.client.';

    /**
     * Add browser/platform/resolution demographic info to the analytics data
     * @param {object} data
     * @returns {object}
     */
    function _mixinDemographics(data) {
        var demographics = {
            d_platform: navigatorUtil.shortPlatform(),
            d_browser: navigatorUtil.shortBrowser(),
            d_version: navigatorUtil.majorVersion(),
            d_windowHeight: window.innerHeight,
            d_windowWidth: window.innerWidth,
            d_screenHeight: screen.height,
            d_screenWidth: screen.width
        };

        return $.extend({}, data, demographics);
    }

    /**
     * Record an analytics event
     * @param {string} eventName
     * @param {object} data - A simple, unnested object with the event attributes
     * @param {boolean?} trackDemographics
     */
    function add(eventName, data, trackDemographics) {
        if (eventName) {
            if (data != null && !$.isPlainObject(data)) {
                throw new Error("Analytics only supports plain objects");
            }

            if (eventName.indexOf(EVENT_PREFIX) !== 0) {
                eventName = EVENT_PREFIX + eventName;
            }

            if (trackDemographics) {
                data = _mixinDemographics(data);
            }

            var payload = $.extend({
                name: eventName
            }, {
                data: data
            });

            AJS.trigger('analytics', payload);
        }
    }

    exports.add = add;

    exports._mixinDemographics = _mixinDemographics;
});