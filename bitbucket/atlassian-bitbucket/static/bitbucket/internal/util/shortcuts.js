'use strict';

define('bitbucket/internal/util/shortcuts', ['aui', 'bacon', 'bitbucket/util/events', 'bitbucket/internal/util/navigator', 'bitbucket/internal/widget/keyboard-shortcuts', 'exports'], function (AJS, Bacon, events, navigator, keyboardShortcuts, exports) {

    //TODO STASHDEV-8944: Replace this with a method for keyboard setup that doesn't rely on whenIType running an `evaluate`

    'use strict';

    var baconStreamInfos = {};

    /**
     * Binds the keys for a lazy keyboard shortcut.
     *
     * @param {string} name - The name of the keyboard shortcut to enable.
     */
    function bindLazyKeys(name) {
        var streamInfo = baconStreamInfos[name];
        if (streamInfo.lazy.whenIType) {
            streamInfo.lazy.whenIType.unbind();
        }

        var whenIType = AJS.whenIType(streamInfo.lazy.keys);
        streamInfo.lazy.whenIType = whenIType;
        whenIType.execute(streamInfo._sink);
        whenIType.execute(keyboardShortcuts.fireKeyboardShocutAnalyticsEvent.bind(null, streamInfo.lazy.analyticsContext, name));
    }

    /**
     * @typedef  {Object} StreamInfo
     * @property {Function|null}   baconSink             - The function to bind whenITypes to, it will forward to the
     *                                                     BaconStream sink if the BaconStream has been bound.
     * @property {string}          lazy.keys             - The keys to bind when creating a lazy stream.
     * @property {WhenIType}       lazy.whenIType        - The currently bound whenIType object for this shortcut.
     * @property {string}          lazy.analyticsContext - The context to use when firing analytics events.
     * @property {Bacon}           stream                - The Bacon stream.
     * @property {Function}        _sink                 - The current sink function used by the Bacon stream, can be
     *                                                     used to check if the stream is current;y bound.
     */

    /**
     * Gets the Stream information
     *
     * @param {string} name - name of the keyboard shortcut.
     * @returns {StreamInfo}
     */
    function getStreamInfo(name) {
        if (!baconStreamInfos.hasOwnProperty(name)) {
            baconStreamInfos[name] = {
                analyticsBound: false,
                lazy: {
                    keys: null,
                    whenIType: null,
                    analyticsContext: null
                },

                // The bacon sink is for exposing the internal sink function to the outside world from
                // baconjs' fromBinder method.
                // It is needed by whenIType.execute() to register the keyboard event as the source of the event stream.
                // This is used by non lazy shortcuts.
                baconSink: function baconSink(e) {
                    if (this._sink) {
                        this._sink(e);
                    }
                },
                _sink: null,
                stream: Bacon.fromBinder(function (sink) {
                    var streamInfo = baconStreamInfos[name];
                    streamInfo._sink = sink;

                    // Check if this is a lazy stream and we need to make a new WhenIType
                    if (streamInfo.lazy.keys) {
                        bindLazyKeys(name);
                    }
                    return function () {
                        streamInfo._sink = null;
                        if (streamInfo.lazy.whenIType) {
                            streamInfo.lazy.whenIType.unbind();
                        }
                    };
                })
            };
        }
        return baconStreamInfos[name];
    }

    /**
     * Register a keyboard shortcut, this method unbinds the whenIType and only rebinds it when someone calls
     * {@link bind}. This ensures whenIType won't be bound unless your shortcut is actively being used.
     *
     * @param {string}    name      - Name of the keyboard shortcut
     * @param {WhenIType} whenIType - WhenIType object that has been bound
     * @param {string}    keys      - Keys that this keyboard shortcut uses
     */
    function registerLazy(name, whenIType, keys) {
        if (navigator.isMac()) {
            // convert the ctrl key to meta
            // It would be nice to be able to let AUI do this, but the transform for mac keys is tied up with the fromJSON
            // function for enabling multiple sets of keys at once.
            keys = keys.replace(/ctrl/i, "meta");
        }
        whenIType.unbind();
        var streamInfo = getStreamInfo(name);
        streamInfo.lazy.keys = keys;
        streamInfo.lazy.analyticsContext = keyboardShortcuts.getEnablingContext();

        // finally check if the _sink exists because something has already call .bind() for this shortcut.
        if (streamInfo._sink) {
            bindLazyKeys(name);
        }
    }

    /**
     * Setups a new Keyboard Shortcut with a WhenIType
     *
     * Can be called multiple times for the same shortcut if the shortcut is registered multiple times.
     *
     * @param {string}    name      - Name of the keyboard shortcut
     * @param {WhenIType} whenIType - WhenIType object that has been bound
     * @param {string}    keys      - Keys that this keyboard shortcut uses
     */
    function setup(name, whenIType, keys) {
        var streamInfo = getStreamInfo(name);
        whenIType.execute(streamInfo.baconSink.bind(streamInfo));

        if (!streamInfo.analyticsBound) {
            streamInfo.analyticsBound = true;
            keyboardShortcuts.bindKeyboardShortcutAnalytics(name, baconStreamInfos[name].stream);
        }
        events.trigger('bitbucket.internal.keyboard.shortcuts.' + name, whenIType, keys);
    }

    /**
     * Binds a keyboard shortcut
     *
     * @param {string}          name     - Name of the keyboard shortcut.
     * @param {Function<Event>} callback - A function to call when the keyboard shortcut is typed.
     * @return {Function}                - A function you can call to unbind the callback
     */
    function bind(name, callback) {
        return getStreamInfo(name).stream.onValue(callback);
    }

    exports.registerLazy = registerLazy;
    exports.setup = setup;
    exports.bind = bind;
});