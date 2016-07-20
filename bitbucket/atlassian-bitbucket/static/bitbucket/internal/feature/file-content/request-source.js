'use strict';

define('bitbucket/internal/feature/file-content/request-source', ['jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/property'], function ($, _, nav, ajax, propertyUtil) {

    'use strict';

    var maxSourceLines = 5000;
    propertyUtil.getFromProvider('page.max.source.lines').done(function (val) {
        maxSourceLines = val;
    });

    // See notes on requestSource. We cache to avoid multiple server requests for the same information by different handlers,
    // and also so source=handler and source-view can both request the first page without a full AJAX request twice.
    var cache = {};

    /**
     * A builder to generate the source URL.
     *
     * @param {JSON.FileChangeJSON} fileChangeJSON a fileChange object describing the change
     * @param {Object} [options] - additional options
     * @param {number} [options.start]
     * @param {number} [options.limit]
     * @param {boolean} [options.includeBlame]
     * @returns {string} a source URL
     * @private
     */
    function getSourceUrl(fileChangeJSON, options) {
        //$.extend to remove undefined properties
        var params = $.extend({}, {
            start: options.start || 0,
            limit: options.limit || maxSourceLines,
            blame: options.includeBlame ? true : undefined
        });

        return nav.rest().currentRepo().browse().path(fileChangeJSON.path).at(fileChangeJSON.commitRange.untilRevision.displayId).withParams(params).build();
    }

    /**
     * Request diff information from the server. Requests are cached for the remainder of an event loop after they are resolved.
     * This helps with performance of multiple handlers requesting the same data.
     *
     * @param {JSON.FileChangeJSON} fileChange - a fileChange object describing the change
     * @param {Object} [options] - additional options
     * @param {number} [options.start]
     * @param {number} [options.limit]
     * @param {boolean} [options.includeBlame]
     * @param {Object} [options.statusCode]
     * @returns {Promise} a promise that resolves to the diff JSON returned form the server.
     */
    function requestSource(fileChange, options) {
        options = options || {};

        var fileChangeJSON = fileChange.toJSON ? fileChange.toJSON() : fileChange;
        var url = getSourceUrl(fileChangeJSON, options);

        if (cache.hasOwnProperty(url) && cache[url].state() !== 'rejected') {
            return cache[url];
        }

        var xhr = ajax.rest({
            url: url,
            statusCode: options.statusCode || ajax.ignore404WithinRepository()
        });

        var piped = xhr.then(function (data) {
            if (data.errors && data.errors.length) {
                return $.Deferred().rejectWith(this, [this, null, null, data]);
            }

            _.defer(function () {
                delete cache[url];
            });
            return data;
        });

        cache[url] = piped.promise(xhr);
        return cache[url];
    }

    return requestSource;
});