'use strict';

define('bitbucket/internal/util/determine-language', ['codemirror', 'jquery', 'lodash', 'exports'],
/**
 * Determines what language a file is written in from extension
 * or #! declaration.
 * *
 * @exports bitbucket/internal/util/determine-language
 */
function (CodeMirror, $, _, exports) {
    'use strict';

    // Add the Stash CodeMirror Highlight theme class to the top level element

    document.documentElement.className += ' cm-s-stash-default';

    var knownLanguages = WRM.data.claim('com.atlassian.bitbucket.server.bitbucket-web:determine-language.syntax-highlighters') || {};
    var knownExtensions = {};
    var knownExecutables = {};

    _.forEach(knownLanguages, function (config, lang) {
        _.forEach(config.e, function (ext) {
            knownExtensions[ext] = lang;
        });
        _.forEach(config.x, function (exe) {
            knownExecutables[exe] = lang;
        });
    });

    var registeredModeExtensions = {};
    var registeredModeExecutables = {};

    /**
     * CodeMirror mode representation.
     * @typedef {Object} CodeMirrorMode
     * @property {string} mode - The mode string used to load the mode.
     * @property {string} mime - The MIME type associated with the mode.
     * @property {string} [wrmKey] - The WRM Key that can be used to load this mode
     * @property {boolean} [builtIn=false] - true if the mode is shipped with Stash core
     */

    /**
     * Returns the language that corresponds to
     * a particular extension.
     *
     * @param {string} extension
     * @return {string} language
     */
    function fromExtension(extension) {
        return _.has(knownExtensions, extension) ? knownExtensions[extension] : null;
    }

    /**
     * Returns the language that corresponds to
     * a particular executable.
     *
     * @param {string} executable
     * @return {string} language
     */
    function fromExecutable(executable) {
        return _.has(knownExecutables, executable) ? knownExecutables[executable] : null;
    }

    /**
     * Converts a language into a {@link CodeMirrorMode}
     * @param {string} hardcodedTypeLookup A value from the WRM lookup data, should be a MIME Type.
     * @return {CodeMirrorMode}
     */
    function toCodeMirrorMode(hardcodedTypeLookup) {
        return CodeMirror.findModeByMIME(hardcodedTypeLookup);
    }

    /**
     * Returns the language that corresponds to
     * an executable declared by a #! in the first
     * line of a file.
     *
     * @param {string} line The first line of the file
     * @return {string} language
     */
    function fromFirstLine(line) {
        var pattern = /^#!(?:\/(?:usr\/)?(?:local\/)?bin\/([^\s]+))(?:\s+([^\s]+))?/;

        var match = pattern.exec(line);
        if (match) {
            var exe = match[1];
            if (exe === 'env') {
                exe = match[2];
            }
            return exe;
        }

        return null;
    }

    /**
     * Attempts to match the file to a {@code CodeMirrorMode} registered by a plugin
     *
     * @param {string} extension - The extension of the file
     * @param {string} [executable] - The executable from the #! if known
     * @returns {CodeMirrorMode}
     */
    function findRegisteredMode(extension, executable) {
        return registeredModeExtensions.hasOwnProperty(extension) ? registeredModeExtensions[extension] : executable && registeredModeExecutables.hasOwnProperty(executable) ? registeredModeExecutables[executable] : null;
    }

    /**
     * Returns either a MIME type or a language that corresponds
     * to a particular language depending on fileInfo.legacy.
     *
     * @param {Object} fileInfo Object with information about the file
     * @param {Object} fileInfo.firstLine The first line of the file
     * @param {string} fileInfo.path The path to the file
     * @return {CodeMirrorMode} CodeMirror mode for the file.
     */
    function fromFileInfo(fileInfo) {
        var filename = fileInfo.path;
        var extensionLocation = filename.lastIndexOf('.');

        var extension = extensionLocation === -1 ? filename : // file without an extension. May be Makefile or something similar
        filename.substring(extensionLocation + 1);

        var exe = fileInfo.firstLine.length > 1 ? fromFirstLine(fileInfo.firstLine) : null;

        var mode = findRegisteredMode(extension, exe);
        var hardcodedTypeLookup;
        if (!mode) {
            hardcodedTypeLookup = fromExtension(extension) || (exe != null ? fromExecutable(exe) : null);
            if (hardcodedTypeLookup) {
                mode = toCodeMirrorMode(hardcodedTypeLookup);
            } else {
                mode = CodeMirror.findModeByFileName(filename);
            }
            mode = mode || CodeMirror.findModeByMIME('text/plain');
            mode.builtIn = true;
        }

        if (fileInfo.legacy) {
            return hardcodedTypeLookup || 'text';
        }
        return mode;
    }

    /**
     * Register a custom mode that can be used to highlight code.
     *
     * To ensure that your mode is available on all places highlighting is used you should register it with the
     * stash.feature.files.fileHandlers context.
     *
     * @param {CodeMirrorMode} mode
     * @param {Array<string>} [extensions] list of extensions that mode can be used with
     * @param {Array<string>} [executables] list of executables that mode can be used with
     */
    function registerCodeMirrorMode(mode, extensions, executables) {
        if (extensions) {
            extensions.forEach(function (ext) {
                registeredModeExtensions[ext] = mode;
            });
        }
        if (executables) {
            executables.forEach(function (exec) {
                registeredModeExecutables[exec] = mode;
            });
        }
    }

    /**
     * Load a highlighting mode, unless it's already loaded
     *
     * @param {string} mode - the name of the mode. should match a CodeMirror mode or file extension.
     * @returns {Promise} - a promise that when resolved contains a CodeMirror mode
     */
    function getCodeMirrorModeForName(mode) {
        // See if CodeMirror knows about this mode yet.
        // Note that this will allow searching by mode name *and* extension here because
        // after this the CodeMirror Mode will be used.
        var cmMode = CodeMirror.findModeByName(mode) || CodeMirror.findModeByExtension(mode);
        if (!cmMode) {
            // resolve with a default mode
            return $.Deferred().resolve(CodeMirror.findModeByMIME('text/plain'));
        }
        // If we can't find the highlighting mode attempt to load it via WRM.
        if (typeof CodeMirror.mimeModes[cmMode.mime] === 'undefined') {
            return WRM.require('wr!com.atlassian.bitbucket.server.bitbucket-highlight:' + cmMode.mode).then(function () {
                return cmMode;
            });
        }
        // already loaded. yay.
        return $.Deferred().resolve(cmMode);
    }

    exports.fromFileInfo = fromFileInfo;
    exports.registerCodeMirrorMode = registerCodeMirrorMode;
    exports.getCodeMirrorModeForName = getCodeMirrorModeForName;
});