define('internal/util/navigator', [
    'exports'
], function (
    exports
) {

    "use strict";

    // Avoid using this file at all costs.
    // Instead, use feature detection to determine a browser's capabilites.

    var userAgent = window.navigator.userAgent;
    var platform = window.navigator.platform;

    var isChrome = false;
    var isIE = false;
    var isMozilla = false;
    var isSafari = false;
    var isWebkit = false;
    var isOpera = false;
    var shortBrowser;

    var majorVersion = NaN;

    var isLinux = false;
    var isMac = false;
    var isWin = false;
    var shortPlatform;

    /**
     * User agent parsing.
     *
     * Inspired by jQuery:
     *     jQuery JavaScript Library v1.8.2
     *     http://jquery.com/
     *
     *     Copyright 2012 jQuery Foundation and other contributors
     *     Released under the MIT license
     *     http://jquery.org/license
     */
    function parseUA (ua) {
        ua = ua.toLowerCase();

        var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
            /(webkit)(?:.*version\/)([\w.]+)/.exec ( ua ) ||
            /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
            /(msie) ([\w.]+)/.exec( ua ) ||
            ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
            [];

        // IE 11
        if (match[ 1 ] === "mozilla" && /\btrident\b/.test( ua )) {
            match[ 1 ] = "msie";
        }

        return {
            browser: match[ 1 ] || "",
            version: match[ 2 ] || "0"
        };
    }


    /**
     * Return the key for the first truthy property in the object
     * (Deterministic "first" is not guaranteed by the spec but in practice matches insertion order for non-numeric keys)
     * @param {object} obj
     * @returns {string}
     * @private
     */
    function _getFirstTruthyPropKey(obj) {
        if (typeof obj !== 'object') {
            return undefined;
        }

        return Object.keys(obj).filter(function(key){
            return obj[key];
        })[0];
    }

    /**
     * Calculate and cache values based on parsing the navigator object.
     */
    function init() {
        var match = parseUA(userAgent);
        var browserName = match.browser;
        var browserVersion = match.version;

        isChrome = (browserName === "chrome");

        isIE = (browserName === "msie");

        isMozilla = (browserName === "mozilla");

        isWebkit = isChrome || (browserName === "webkit");

        isSafari = isWebkit && !isChrome;

        isOpera = (browserName === "opera");

        var browsers = {
            'Chrome': isChrome,
            'Firefox': isMozilla,
            'IE': isIE,
            'Safari': isSafari,
            'Opera': isOpera
        };

        shortBrowser = _getFirstTruthyPropKey(browsers);

        majorVersion = parseInt(browserVersion, 10);

        isLinux = platform.indexOf('Linux') !== -1;

        isMac = platform.indexOf('Mac') !== -1;

        isWin = platform.indexOf('Win') !== -1;

        var platforms = {
            'Win': isWin,
            'Mac': isMac,
            'Linux': isLinux
        };

        shortPlatform = _getFirstTruthyPropKey(platforms);
    }

    exports.isChrome = function() { return isChrome; };
    exports.isIE = function() { return isIE; };
    exports.isMozilla = function() { return isMozilla; };
    exports.isSafari = function() { return isSafari; };
    exports.isWebkit = function() { return isWebkit; };
    exports.isOpera = function() { return isOpera; };
    exports.shortBrowser = function() { return shortBrowser; };
    exports.majorVersion = function() { return majorVersion; };

    exports.isLinux = function() { return isLinux; };
    exports.isMac = function() { return isMac; };
    exports.isWin = function() { return isWin; };
    exports.shortPlatform = function() { return shortPlatform; };

    // Expose for testing.
    exports._setUserAgent = function(uaString) {
        userAgent = uaString;
        init();
    };

    exports._setPlatform = function(platformString) {
       platform = platformString;
       init();
    };

    exports._getFirstTruthyPropKey = _getFirstTruthyPropKey;

    // Initialise
    init();
});
