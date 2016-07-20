define('internal/util/regexp', [
    'exports'
], function(
	exports
) {

    'use strict';

    function escapeRegexp(text) {
        return text.replace(/[\-\[\]{}()+?.,\\\^$|#\s]/g, '\\$&');
    }

    exports.escape = escapeRegexp;
});