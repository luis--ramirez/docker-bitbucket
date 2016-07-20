'use strict';

define('bitbucket/internal/feature/file-content/text-view', ['jquery', 'lodash', 'bitbucket/internal/bbui/widget/widget', 'bitbucket/internal/feature/file-content/stash-codemirror', 'bitbucket/internal/feature/file-content/text-view/common-modes', 'bitbucket/internal/feature/file-content/text-view/text-view-api', 'bitbucket/internal/feature/file-content/text-view/text-view-scrolling', 'bitbucket/internal/util/determine-language', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/util/horizontal-keyboard-scrolling', 'bitbucket/internal/util/object', 'bitbucket/internal/util/performance'], function ($, _, Widget, StashCodeMirror, commonModes, textViewApi, textViewScrolling, determineLanguage, events, fn, horizontalKeyboardScrolling, obj, performance) {
    'use strict';

    /**
     *
     * @param {jQuery} $container
     * @param {Object} options
     * @param {boolean} [options.autoResizing] - whether the view should adjust its height to fit its content.
     * @param {boolean} [options.asyncDiffModifications] - whether gutters should render async. This slows down total
     *                                                     render time, but allows the main content to appear earlier.
     * @param {number} [options.focusPoint=0.2] - fraction of the viewport (from the top) at which to place focused items.
     * @param {CommentContext} [options.commentContext] - the associated comment context for this diff view. Long term
     *                                                    this option should be removed and comment context should attach
     *                                                    to diff-view like any other plugin.
     * @constructor
     */

    function TextView($container, options) {
        Widget.call(this, options);
        var self = this;
        textViewApi.setupAPI(this);
        this._internalLines = {
            ADDED: {},
            REMOVED: {},
            CONTEXT: {}
        };
        this._editors = [];
        this._gutters = [];
        this._$container = $container;
        this._$fileToolbar = this._$container.siblings('.file-toolbar');

        this._$container.addClass('text-view');

        // add default gutters
        this.registerGutter('CodeMirror-linewidget', { weight: 0 });

        this._addDestroyable(function () {
            self._$container.removeClass('text-view');
            self._editors.forEach(function (editor) {
                editor.destroy();
            });
            self._editors = null;
            self._gutters = null;
            self._$container = null;
        });
    }
    obj.inherits(TextView, Widget);
    textViewApi.mixInto(TextView.prototype);
    textViewScrolling.mixInto(TextView.prototype);

    TextView.defaults = {
        // focusPoint indicates the point - expressed as a fraction of the viewport - to which we will scroll things
        // when bringing them in to focus.
        focusPoint: 0.2
    };

    TextView.prototype.init = function () {
        events.trigger('bitbucket.internal.feature.fileContent.textViewInitializing', null, this._api, this._options);
        horizontalKeyboardScrolling.init();
    };

    /**
     * All lines need this class on the wrap so we can reference the wrap and find the .line-locator inside
     * @param change
     */
    function addLineClassToWraps(change) {
        var view = change.view;
        change.eachLine(function (info) {
            info.handles.all.forEach(function (handle) {
                view.addLineClass(handle, 'wrap', 'line');
            });
        });
    }

    /**
     * Mark text on lines in the editor
     *
     * @abstract
     * @function
     * @param {LineInfo} line line to mark text on
     * @param {{lineOffset: number, ch: number}} from
     * @param {{lineOffset: number, ch: number}} to
     * @param {{className: string}} options
     * @returns {Array<CodeMirror.TextMarker>}
     */
    TextView.prototype.markText = function (line, from, to, options) {
        var self = this;
        return line.handles.all.map(function (lineHandle) {
            var editor = self._editorForHandle(lineHandle);
            var lineIndex = editor.getLineNumber(lineHandle._handle);
            return editor.markText({ line: lineIndex + from.lineOffset, ch: from.ch }, { line: lineIndex + to.lineOffset, ch: to.ch }, { className: options.className });
        });
    };

    /**
     * Update the editors when something has changed (e.g., size of the editor).
     */
    TextView.prototype.refresh = function () {
        _.invoke(this._editors, 'refresh');
        this.trigger('resize');
    };

    /**
     * Subclasses should call this to create CodeMirror editors.
     * @param {Object} options
     * @param {function(gutter:Object,i:index,gutters:Array):boolean} options.gutterFilter - a function to filter down gutters to apply to this view.
     * @param {jQuery} $container - jQuery element to attach the editor to
     * @returns {StashCodeMirror}
     * @protected
     */
    TextView.prototype._createEditor = function (options, $container) {
        options = options || {};
        var editor = new StashCodeMirror($container && $container.length ? $container[0] : this._$container[0], $.extend({}, options, {
            attachScroll: this._options.attachScroll,
            autoResizing: this._options.autoResizing,
            gutters: this._getGutters(options.gutterFilter),
            scrollStyle: this._options.scrollStyle,
            value: ''
        }));
        editor._gutterFilter = options.gutterFilter;
        this._editors.push(editor);
        horizontalKeyboardScrolling.setEditors(this._editors);

        if (!this._$firstEditor) {
            this._$firstEditor = $(editor.getWrapperElement());
        }
        return editor;
    };

    /**
     * Return the editor for a particular handle.
     *
     * @abstract
     * @function
     * @param {StashLineHandle} lineHandle - as returned from {@link getLineHandle}
     * @returns {CodeMirror} editor that is responsible for the given line
     * @protected
     */
    TextView.prototype._editorForHandle = function (lineHandle) {
        throw new Error("TextView implementation must define _editorForHandle.");
    };

    /**
     * Get the vertical offset between the root content-view container and the CodeMirror editors inside.
     * This is useful for various scrolling calculations.
     * @returns {number} px between top of .content-view and top of editor elements
     */
    TextView.prototype._editorInnerOffset = function editorInnerOffset() {
        return this._$firstEditor[0].getBoundingClientRect().top - this._$container[0].getBoundingClientRect().top;
    };

    /**
     * May be implemented by a subclass to add properties to the change object exposed in change and load events.
     * @returns {Object}
     * @protected
     */
    TextView.prototype._getChangeAttributes = function () {
        return {};
    };

    /**
     * Get unique gutters by given properties
     * @abstract
     * @returns {Array<object>}
     */
    TextView.prototype._getGutters = function (filterFn) {
        var gutters = this._gutters;
        if (filterFn) {
            gutters = gutters.filter(filterFn);
        }
        gutters = gutters.sort(function (a, b) {
            return a.weight - b.weight;
        });
        return _.chain(gutters).pluck('name').uniq().value();
    };

    /**
     *
     * @param {string} changeType
     * @param {Object} newContentJSON
     * @param {Array<Object>} newContentLineInfos - see diff-line-info.js or LineInfo in source-view.js
     * @protected
     */
    TextView.prototype._modify = function (changeType, newContentJSON, newContentLineInfos /*, ...args */) {
        var self = this;
        var args = [].slice.call(arguments);

        _.forEach(newContentLineInfos, function (lineInfo) {
            self._internalLines[lineInfo.lineType || 'CONTEXT'][lineInfo.lineNumber] = lineInfo;
        });

        this.operation(function () {
            self._acceptModification.apply(self, args);
            self.trigger('internal.acceptedModification', args);

            /**
             * A content-changed event will be triggered when content in the editor is updated/changed
             * The following object will be passed along:
             *
             * @typedef {Object} ContentChange
             * @property {ContentChangeType} type
             * @property {number} linesAdded - number of lines added in this change. Currently there are no changes that remove lines.
             * @property {function(function(LineInfo))} eachLine executes a function for each line in the change, passing through a {@link LineInfo}
             */
            var change = $.extend({
                type: changeType,
                linesAdded: newContentLineInfos.length,
                eachLine: function eachLine(fn) {
                    var map;
                    if (!self._options.asyncDiffModifications) {
                        map = function map(arr) {
                            var deferred = $.Deferred();
                            deferred.resolve(arr.map(fn));
                            return deferred;
                        };
                    } else {
                        map = performance.frameBatchedMap(fn, {
                            min: 500,
                            initial: 200 // just enough to render the first screen.
                        }, self.operation.bind(self));
                    }

                    var deferred = map(newContentLineInfos);
                    self._addDestroyable(deferred.reject.bind(deferred));
                    return deferred.promise();
                },
                view: self._api
            }, self._getChangeAttributes.apply(self, args));

            // acceptModification populates the handles on each lineInfo.
            // So now that that's done, we can freeze everything safely.
            // The CodeMirror line handle has access to DOM elements which we don't really want to freeze, and doing
            // so causes errors.
            // So we only shallow freeze the handles.
            _.chain(newContentLineInfos).pluck('handles').values().flatten().compact().forEach(obj.freeze).value();
            _.chain(newContentLineInfos).pluck('handle').compact().forEach(obj.freeze).value();
            // .line contians deprecated properties we don't want to set off, so we only shallow freeze it
            _.chain(newContentLineInfos).pluck('line').compact().forEach(obj.freeze).value();
            obj.deepFreeze(newContentLineInfos, !'refreezeFrozen');
            obj.deepFreeze(change, !'refreezeFrozen');

            // This is done before any events are fired so that we can ensure the line class is added before anyone else
            // gets a handle on the lines. THe line class affects line-height which can affect all kinds of scrolling
            // and positioning if it happens too late.
            addLineClassToWraps(change);

            if (changeType === 'INITIAL') {
                self.trigger('internal-load', change);
            }
            self.trigger('internal-change', change);
            self.refresh();
        });
    };

    /**
     * Highlight all of the strings that match 'search'
     * @param {string} search - term to highlight
     * @private
     */
    TextView.prototype._highlight = function (search) {
        if (!this._editors) {
            return;
        }
        this._editors.forEach(function (editor) {
            editor._highlight(search);
        });
    };

    /**
     * Setup Syntax highlighting for the view.
     *
     * @param {string} filename Name of the file that will be highlighted
     * @param {string} firstLine First line of the file to assist in language detection
     * @protected
     */
    TextView.prototype._syntaxHighlighting = function (filename, firstLine, editor) {
        var mode = determineLanguage.fromFileInfo({
            firstLine: firstLine,
            path: filename
        });

        var loadedPromise;

        if (mode.wrmKey) {
            loadedPromise = WRM.require("wr!" + mode.wrmKey);
        } else if (mode.builtIn && commonModes.indexOf(mode.mode) === -1) {
            loadedPromise = WRM.require("wr!com.atlassian.bitbucket.server.bitbucket-highlight:" + mode.mode);
        } else {
            loadedPromise = $.Deferred().resolve();
        }

        loadedPromise.done(function () {
            editor.setOption('mode', mode.mime);
        });
    };

    TextView.prototype._whenOpDone = function (fn) {
        if (this._opCallbacks) {
            this._opCallbacks.push(fn);
        } else {
            fn();
        }
    };

    return TextView;
});