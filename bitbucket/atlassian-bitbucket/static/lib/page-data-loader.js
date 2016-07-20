/* global _PageDataPlugin:true */
/**
 * WARNING: _PageDataPlugin is an underlying API, not meant for use by plugins.
 * This product MAY provide a wrapping, supported interface for working with page data.
 */
var _PageDataPlugin = (function() {

    'use strict';

    var has = Object.prototype.hasOwnProperty;
    var $ = jQuery;

    var data = {};

    var readyPromises = {};
    function load(context, dataByCompleteModuleKey) {
        for(var completeModuleKey in dataByCompleteModuleKey) {
            if (has.call(dataByCompleteModuleKey, completeModuleKey)) {
                var pluginPromises = readyPromises[completeModuleKey] || (readyPromises[completeModuleKey] = {});
                var promise = pluginPromises[context] || (pluginPromises[context] = $.Deferred());

                var pluginData = data[completeModuleKey] || (data[completeModuleKey] = {});
                pluginData[context] = dataByCompleteModuleKey[completeModuleKey];

                if (promise.state() !== 'pending') {
                    throw new Error("Attempt to set context " + context + " for plugin key " + completeModuleKey + " multiple times.");
                }
                promise.resolve(pluginData[context]);
            }
        }
    }

    function ready(completeModuleKey, context/*, ...handlers*/) {
        var handlers = Array.prototype.slice.call(arguments, 2);
        var pluginPromises = readyPromises[completeModuleKey] || (readyPromises[completeModuleKey] = {});
        var promise = pluginPromises[context] || (pluginPromises[context] = $.Deferred());
        handlers.forEach(function(handler) {
            promise.done(handler);
        });
        return promise;
    }

    function onDomReady() { // page data won't come after ready
        $.each(readyPromises, function(completeModuleKey, promiseByContext) {
            $.each(promiseByContext, function(context, promise) {
                promise.reject(data[completeModuleKey] ?
                    new Error("Provider " + completeModuleKey + " not included with context " + context) :
                    new Error("Provider " + completeModuleKey + " not included on page."));
            });
        });
    }

    $(document).ready(onDomReady);

    return {
        load: load,
        data : data,
        ready : ready,
        // visible for testing
        _domReady : onDomReady
    };
}());
