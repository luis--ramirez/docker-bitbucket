'use strict';

/**
 * Use with the feature-wrm-data.xml plugin
 * @since 3.1
 */
define('bitbucket/internal/util/feature-enabled', ['jquery', 'exports'], function ($, exports) {
    'use strict';

    var cache = {};
    var has = Object.prototype.hasOwnProperty;

    exports.getFromProviderSync = function (key) {
        return has.call(cache, key) ? cache[key] : cache[key] = WRM.data.claim("com.atlassian.bitbucket.server.feature-wrm-data:" + key + ".data");
    };

    exports.getFromProvider = function (key) {
        return $.Deferred().resolve(exports.getFromProviderSync(key));
    };
});