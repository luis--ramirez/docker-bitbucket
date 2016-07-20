'use strict';

define('bitbucket/internal/feature/file-content/source-handler', ['jquery', 'lodash', 'bitbucket/feature/files/file-handlers', 'bitbucket/internal/feature/file-content/binary-source-view', 'bitbucket/internal/feature/file-content/binary-view', 'bitbucket/internal/feature/file-content/content-message', 'bitbucket/internal/feature/file-content/request-source', 'bitbucket/internal/feature/file-content/source-view', 'bitbucket/internal/model/file-content-modes', 'bitbucket/internal/util/deep-linking', 'bitbucket/internal/util/error', 'bitbucket/internal/util/property', 'exports'], function ($, _, fileHandlersApi, BinarySourceView, binaryView, contentMessage, requestSource, SourceView, fileContentModes, deepLinking, errorUtil, propertyUtil, exports) {

    'use strict';

    var maxSourceLines = 5000;
    propertyUtil.getFromProvider('page.max.source.lines').done(function (val) {
        maxSourceLines = val;
    });

    /**
     * Wrap a basic handler function with the boilerplate for a source handler function (checking SOURCE vs DIFF,
     * getting the data, handling request errors)
     * @param {function(Object, Object) : Promise} fn
     * @param {bitbucket/feature/files/file-handlers.HandlerID} handlerID - the ID of this handler (for plugins to rely on)
     * @param {function(*)?} getStartFn - If supplied, use this to extract the start value from options.anchor
     * @returns {function(Object): Promise}
     */
    function asHandleFunc(fn, handlerID, getStartFn) {
        if (!handlerID) {
            throw new Error('Every handler we expose from core needs to have a handlerID.');
        }
        return function (options) {
            if (options.contentMode !== fileContentModes.SOURCE) {
                return $.Deferred().reject();
            }

            var params = {
                includeBlame: false
            };

            if (_.isFunction(getStartFn)) {
                _.extend(params, {
                    start: getStartFn(options.anchor)
                });
            }

            var $container = options.$container;
            return requestSource(options.fileChange, params).then(function (data) {
                return fn(data, options);
            }).then(function (ret) {
                if (!ret.handlerID) {
                    ret.handlerID = handlerID;
                }
                return ret;
            }, function (xhr, textStat, errorThrown, data) {
                if (data && data.errors && errorUtil.isErrorEntityWithinRepository(data.errors[0])) {
                    contentMessage.renderErrors($container, data);
                    return $.Deferred().resolve({
                        handlerID: fileHandlersApi.builtInHandlers.ERROR
                    });
                }
                return $.Deferred().reject();
            });
        };
    }

    exports.handleBinary = asHandleFunc(function (data, options) {
        if (!data.binary && !binaryView.treatTextAsBinary(options.fileChange.path.extension)) {
            return $.Deferred().reject();
        }
        return $.Deferred().resolve(new BinarySourceView(options));
    }, fileHandlersApi.builtInHandlers.SOURCE_BINARY);
    exports.handleImage = asHandleFunc(function (data, options) {
        if (!data.binary && !binaryView.treatTextAsBinary(options.fileChange.path.extension)) {
            return $.Deferred().reject();
        }

        var path = options.fileChange.path;
        var revision = options.fileChange.commitRange.untilRevision;
        var binaryInfo = binaryView.getRenderedBinary(path, revision);
        if (binaryInfo.type !== 'image') {
            return $.Deferred().reject();
        }
        return $.Deferred().resolve(new BinarySourceView(options));
    }, fileHandlersApi.builtInHandlers.SOURCE_IMAGE);

    exports.handleEmptyFile = asHandleFunc(function (data, options) {
        if (!data.lines || data.lines.length !== 0) {
            return $.Deferred().reject();
        }
        contentMessage.renderEmptyFile(options.$container, data, options.fileChange);
        return $.Deferred().resolve({});
    }, fileHandlersApi.builtInHandlers.SOURCE_EMPTY);

    /**
     * Parse the anchor string for the first line number and convert it to a `start` value
     * @param {string} anchor
     * @returns {number|undefined}
     */
    function getTextStartFromAnchor(anchor) {
        if (!_.isString(anchor)) {
            return undefined;
        }

        var lineNumbers = deepLinking.hashToLineNumbers(anchor);

        if (lineNumbers.length) {
            // Get the first line number, convert to 0 indexed and align to page size
            var pageNum = Math.floor((_.first(lineNumbers) - 1) / maxSourceLines);

            return pageNum * maxSourceLines;
        } else {
            return undefined;
        }
    }

    exports.handleTextDeepLink = asHandleFunc(handleTextCommon, fileHandlersApi.builtInHandlers.SOURCE_TEXT, getTextStartFromAnchor);
    exports.handleText = asHandleFunc(handleTextCommon, fileHandlersApi.builtInHandlers.SOURCE_TEXT);

    function handleTextCommon(data, options) {
        if (!data.lines || data.lines.length === 0) {
            return $.Deferred().reject();
        }

        var sourceView = new SourceView(data, options);
        // Deferred for backwards compatibility - web fragments in file-content must render before the view is initialized.
        _.defer(sourceView.init.bind(sourceView));
        return $.Deferred().resolve(sourceView);
    }
});

(function () {
    var fileHandlerApi = require('bitbucket/feature/files/file-handlers');

    function registerType(weight, handleProp) {
        fileHandlerApi.register({
            weight: weight,
            extraClasses: 'source-file-content',
            handle: function handle(options) {
                return require('bitbucket/internal/feature/file-content/source-handler')[handleProp](options);
            }
        });
    }

    registerType(10000, 'handleImage');
    registerType(10300, 'handleBinary');
    registerType(10700, 'handleEmptyFile');
    registerType(10999, 'handleTextDeepLink');
    registerType(11000, 'handleText');
})();