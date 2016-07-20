'use strict';

define('bitbucket/internal/util/browser-location', ['exports'],
/**
 * Simple shim for getting the browser's location object to allow it to be mocked
 * during testing.
 */
function (exports) {

    'use strict';

    exports.location = window.location;
});