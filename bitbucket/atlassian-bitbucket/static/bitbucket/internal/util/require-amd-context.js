'use strict';

/*global WRM:false */
define('bitbucket/internal/util/require-amd-context', ['jquery'], function ($) {

    'use strict';

    /**
     * Use WRM.require() to load resources for a given Web Resource Context.
     * Once loaded, use AMD to require a number of AMD module.
     * @returns {Promise} promise that will resolve to the required modules.
     */

    return function requireAMDContext(context, moduleNames) {
        return WRM.require("wrc!" + context).pipe(function () {
            var deferred = $.Deferred();
            require(moduleNames, function () {
                deferred.resolve.apply(deferred, arguments);
            });
            return deferred.promise();
        });
    };
});