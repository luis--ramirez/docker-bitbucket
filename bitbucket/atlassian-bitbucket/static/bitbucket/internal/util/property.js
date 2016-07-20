'use strict';

/**
 * Use with the config-wrm-data.xml plugin
 * @since 3.1
 */
define('bitbucket/internal/util/property', ['jquery', 'exports'], function ($, exports) {
    'use strict';

    function coerce(value, type) {
        if (value == null) {
            return value;
        }

        switch (type) {
            case 'STRING':
                return value;
            case 'NUMBER':
                return Number(value);
            case 'BOOLEAN':
                return value.toLowerCase() === "true";
        }
    }

    var cache = {};

    exports.getFromProvider = function (key) {
        var data = cache[key] || (cache[key] = WRM.data.claim("com.atlassian.bitbucket.server.config-wrm-data:" + key + ".data"));
        return $.Deferred().resolve(coerce(data.value, data.type));
    };

    // Visible for testing
    exports._coerce = coerce;
});