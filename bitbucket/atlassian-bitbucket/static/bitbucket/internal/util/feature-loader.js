'use strict';

define('bitbucket/internal/util/feature-loader', ['aui', 'jquery', 'lodash', 'require', 'bitbucket/internal/util/events'], function (AJS, $, _, require, events) {

    'use strict';

    /**
     * Checks that the shape of module fits the interface we expect.
     * @param module {Object} An object to be verified
     * @param handlerName {String} The name of the module's linked handler, for use in error messages.
     */

    function ensureValidModule(module, handlerName) {
        if (typeof module.load !== 'function' || typeof module.unload !== 'function') {
            throw new Error("Modules require both a load and unload callback. Please use:\n" + registerExample(handlerName));
        }
    }

    /**
     * Return an example usage of loader.
     * @param handlerName {String} the example seciton name to use.
     * @return {String} example text
     */
    function registerExample(handlerName) {
        return "FeatureLoader.registerHandler('" + handlerName + "', /urlMatcher/, {\n" + "    load : loadFn,\n" + "    unload : unloadFn,\n" + "    keyboardShortcutContexts : [ 'commit', ... ]" + "});";
    }

    /**
     * A class for loading handlers of the page from different AMD modules.
     * @constructor
     */
    function FeatureLoader(options) {
        if (!(this instanceof FeatureLoader)) {
            return new FeatureLoader(options);
        }

        options = $.extend({}, FeatureLoader.defaults, options);

        var currentUrl = window.location.href;
        var currentHandlers = [];
        var handlerData = {};

        var loadingPromise = $.Deferred().resolve();
        var hasPending;
        var inited = false;

        var el;
        var keyboardShortcuts;

        function setElement(newEl) {
            el = newEl;
        }

        function setKeyboardShortcuts(newKeyboardShortcuts) {
            keyboardShortcuts = newKeyboardShortcuts;
        }

        function registerHandler(handlerName, urlRegex, moduleOrModuleName) {
            var handler;

            if (_.has(handlerData, handlerName)) {
                throw new Error("A handler with the name '" + handlerName + "' already exists.");
            }
            if (!moduleOrModuleName) {
                throw new Error("No module or module name was provided. Please use:\n" + registerExample(handlerName));
            }

            if (typeof moduleOrModuleName === 'string') {
                handler = handlerData[handlerName] = {
                    name: handlerName,
                    urlRegex: urlRegex,
                    moduleName: moduleOrModuleName
                };
            } else {
                ensureValidModule(moduleOrModuleName, handlerName);

                handler = handlerData[handlerName] = {
                    name: handlerName,
                    urlRegex: urlRegex,
                    module: moduleOrModuleName
                };
            }

            // if it should be currently loaded and the current stuff isn't about to be unloaded,
            // load it immediately.
            if (inited && !hasPending && _.contains(getHandlersForUrl(window.location.href), handler)) {
                load(handler);
            }

            return this;
        }

        function unload(handler) {
            if (!_.contains(currentHandlers, handler)) {
                return $.Deferred().resolve();
            }

            var maybePromise = handler.module.unload(el);
            currentHandlers = _.without(currentHandlers, handler);

            function afterUnload() {
                events.trigger(options.unloadedEvent, null, handler);
            }

            if (maybePromise && maybePromise.then) {
                return maybePromise.then(afterUnload);
            } else {
                afterUnload();
                return $.Deferred().resolve();
            }
        }

        /**
         * Loads a module. Will first unload the current module if there is one.
         * @param handlerName {String} name of the handler to load.
         * @return {$.Deferred.promise}
         */
        function load(handler) {
            if (_.contains(currentHandlers, handler)) {
                return $.Deferred().resolve();
            }

            if (!handler.module) {
                handler.module = require(handler.moduleName);
                ensureValidModule(handler.module, handler.name);
            }

            var maybePromise = handler.module.load(el);
            currentHandlers.push(handler);

            function afterLoad() {
                events.trigger(options.loadedEvent, null, handler);
            }

            if (maybePromise && maybePromise.then) {
                return maybePromise.then(afterLoad);
            } else {
                afterLoad();
                return $.Deferred().resolve();
            }
        }

        /**
         * Accept a request to load new content. The url/handler may never actually be loaded (newer requests will
         * supercede it if they come in).
         * Fallback to reloading the page if the requested url isn't associated with a handler.
         */
        function loadForCurrentUrl() {
            if (inited && currentUrl === window.location.href) {
                return;
            }
            currentUrl = window.location.href;
            var handlers = getHandlersForUrl(currentUrl);
            if (handlers.length) {
                _.each(handlers, function (handler) {
                    events.trigger(options.requestedEvent, null, handler.name);
                });

                if (!hasPending) {
                    hasPending = true;
                    loadingPromise.then(onReadyForRequest);
                }
            } else if (!inited) {
                // This is loading the initial URL.
                // We don't want to get into an infinite reload loop, so just send an error event to whoever is in charge of this loader.
                events.trigger(options.errorEvent, null, {
                    message: AJS.I18n.getText('bitbucket.web.featureloader.nohandler'),
                    code: FeatureLoader.NO_HANDLER
                });
            } else {
                window.location.reload();
            }
        }

        /**
         * Executed when we are ready to load a pending module.
         *
         * Load a new handler's content. Fire pushState if a new url is provided.
         */
        function onReadyForRequest() {
            hasPending = false;

            var nextHandlers = getHandlersForUrl(window.location.href);

            var newHandlers = _.difference(nextHandlers, currentHandlers);
            var oldHandlers = _.difference(currentHandlers, nextHandlers);

            var handlersChanged = newHandlers.length || oldHandlers.length;

            if (handlersChanged) {
                var unloadAll = function unloadAll() {
                    if (!currentHandlers.length) {
                        // this page has no handlers, which is a bit of an error case. Empty the element for now.
                        $(el).empty();
                        return $.Deferred().resolve();
                    }
                    return $.when.apply($, _.map(oldHandlers, unload));
                };
                var loadAll = function loadAll() {
                    return $.when.apply($, _.map(newHandlers, load));
                };
                var unloadThenLoadAll = function unloadThenLoadAll() {
                    return unloadAll().then(loadAll);
                };

                loadingPromise = unloadThenLoadAll().then(function () {
                    // per-context disabling needs to be implemented in the plugin...FUUUUUUUU
                    // https://studio.atlassian.com/browse/AKS-14
                    // disable everything and reenable active contexts for now.
                    if (keyboardShortcuts) {
                        keyboardShortcuts.resetContexts();
                    }
                });
            }
        }

        function getHandlersForUrl(url) {
            return _.filter(handlerData, function (handler) {
                return handler.urlRegex && handler.urlRegex.test(url);
            });
        }

        function current() {
            return currentHandlers.slice();
        }

        function changeStateHandler() {
            loadForCurrentUrl();
        }

        function getKeyboardContextsForHandler(handler) {
            return handler.module && handler.module.keyboardShortcutContexts || [];
        }
        function keyboardShortcutHandler(keyboardShortcuts) {
            var contexts = _.chain(currentHandlers).map(getKeyboardContextsForHandler).flatten().uniq().value();

            _.each(contexts, function (context) {
                keyboardShortcuts.enableContext(context);
            });
        }

        function init(el) {
            setElement(el);

            loadForCurrentUrl();
            events.on('bitbucket.internal.history.changestate', changeStateHandler);
            events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', keyboardShortcutHandler);

            inited = true;
        }

        function destroy() {
            events.off('bitbucket.internal.history.changestate', changeStateHandler);
            events.off('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', keyboardShortcutHandler);
        }

        this.registerHandler = registerHandler;
        this.setElement = setElement;
        this.setKeyboardShortcuts = setKeyboardShortcuts;
        this.current = current;
        this.init = init;
        this.destroy = destroy;
        return this; // stop IDEA complaining about inconsistent return points
    }

    FeatureLoader.defaults = {
        unloadedEvent: 'stash.util.feature-loader.unloaded',
        loadedEvent: 'stash.util.feature-loader.loaded',
        requestedEvent: 'stash.util.feature-loader.loadRequested',
        errorEvent: 'stash.util.feature-loader.errorOccurred'
    };

    FeatureLoader.NO_HANDLER = 'NO_HANDLER';

    return FeatureLoader;
});