'use strict';

define('bitbucket/internal/feature/file-content/text-view/text-view-api', ['jquery', 'lodash', 'bitbucket/internal/util/array', 'bitbucket/internal/util/function', 'bitbucket/internal/util/mixin', 'bitbucket/internal/util/object', 'exports'], function ($, _, array, fn, mix, obj, exports) {
    'use strict';

    /**
     * Prepare the gutter marker element before it is added to the editors.
     *
     * @param {HTMLElement} el
     * @returns {HTMLElement}
     * @private
     */

    function prepareGutterMarkerElement(el) {
        el.classList.add("bitbucket-gutter-marker");
        return el;
    }

    var api = {
        /**
         * Add a CSS class to a specified line
         *
         * @param {StashLineHandle} lineHandle - line handle as returned from {@link getLineHandle}
         * @param {string} whichEl - 'wrap', 'background', or 'text' to specify which element to place the class on
         * @param {string} className - the class to add.
         * @returns {StashLineHandle}
         */
        addLineClass: function addLineClass(lineHandle, whichEl, className) {
            this._editorForHandle(lineHandle).addLineClass(lineHandle._handle, whichEl, className);
            return lineHandle;
        },

        /**
         * Add a widget to the specified line
         *
         * @param {StashLineHandle} lineHandle - as returned from {@link getLineHandle}
         * @param {HTMLElement} el - the root element of the line widget
         * @param {Object} options - any options accepted by CodeMirror's equivalent method.
         * @returns {LineWidget} the return value of CodeMirror's equivalent method.
         */
        addLineWidget: function addLineWidget(lineHandle, el, options) {
            var widget = this._editorForHandle(lineHandle).addLineWidget(lineHandle._handle, el, options);
            var self = this;
            self.trigger('widgetAdded');
            return {
                clear: function clear() {
                    widget.off('redraw');
                    widget.clear();
                    self.trigger('widgetCleared');
                },
                changed: function changed() {
                    widget.changed();
                    self.trigger('widgetChanged');
                },
                onRedraw: function onRedraw(redrawnCallback) {
                    widget.on('redraw', redrawnCallback);
                },
                getHeight: function getHeight() {
                    return widget.height;
                }
            };
        },

        /**
         * Return the text on the line with the given line handle.
         *
         * @param {StashLineHandle} lineHandle as returned from {@link getLineHandle}
         * @returns {string}
         */
        getLine: function getLine(lineHandle) {
            return lineHandle._handle.text;
        },

        /**
         * @typedef {Object} LineLocator
         *
         * @property {?string} fileType
         * @property {?string} lineType
         * @property {number} lineNumber
         */

        /**
         * Retrieve a handle for a given line identified by a DOM element element or {@link LineLocator}.
         *
         * If you pass in a DOM element or jQuery object, the handle returned will be for
         * the line that element is contained within.
         *
         * @param {HTMLElement|jQuery|LineLocator} locator - a DOM element inside one of the lines in this view, or an object with locator properties
         * @returns {StashLineHandle} an object that can be used to modify or query the view about the line.
         */
        getLineHandle: function getLineHandle(locator) {
            if (locator && locator.lineNumber == null) {
                var $locator = $(locator);
                if (!$locator.is('.line-locator')) {
                    $locator = $locator.closest('.line').find('.line-locator');
                }
                locator = {
                    fileType: $locator.attr('data-file-type'),
                    lineType: $locator.attr('data-line-type'),
                    lineNumber: $locator.attr('data-line-number')
                };
            }

            // This check might seem excessive, but in the event where a comment was made and the whitespace ignore option
            // changed, then the lineType may no longer be correct for this comment.
            // @TODO: Find a nicer way to solve comments + ignoreWhitespace
            var handles = locator && this._internalLines[locator.lineType || 'CONTEXT'][locator.lineNumber] && this._internalLines[locator.lineType || 'CONTEXT'][locator.lineNumber].handles;

            return handles && (handles[locator.fileType] || handles.all[0]);
        },

        operation: function operation(func) {
            if (!this._editors) {
                // already destroyed
                return;
            }

            var op = this._editors.reduce(function (fn, editor) {
                return editor.operation.bind(editor, fn);
            }, fn.arity(func.bind(null), 0));

            try {
                if (!this._inOp) {
                    this._opCallbacks = [];
                    this._inOp = 0;
                }
                this._inOp++;
                return op();
            } finally {
                this._inOp--;
                if (!this._inOp) {
                    try {
                        fn.applyAll(this._opCallbacks);
                    } catch (e) {
                        setTimeout(function () {
                            throw e;
                        }, 0);
                    }
                    this._opCallbacks = null;
                }
            }
        },

        /**
         * Register a gutter to be added to the diff view
         *
         * @param {string} name - The name of the gutter to register
         * @param {object} options
         * @param {number} [options.weight=0] - The weight of the gutter. This will determine where in the stack of gutters it will appear.
         * @param {DiffFileType} [options.fileType] - Used in SideBySideDiffView to determine which editor displays this gutter
         */
        registerGutter: function registerGutter(name, options) {
            options = options || {};

            if (!this._editors) {
                return; // already destroyed
            }

            // HACK: bit of abstraction leakage with fileType so the API documentation and behavior is consistent across diff types

            var gutter = {
                name: name,
                weight: options.weight || 0,
                fileType: options.fileType
            };
            // Add the new gutter
            this._gutters.push(gutter);
            this._gutters = obj.uniqueFromArray(this._gutters, ['name', 'fileType']).sort(function (a, b) {
                return a.weight - b.weight || a.name.localeCompare(b.name);
            });
            var self = this;
            this._editors.forEach(function (editor) {
                var newGutters = self._getGutters(editor._gutterFilter);
                if (!_.isEqual(editor.getOption('gutters'), newGutters)) {
                    editor.setOption('gutters', newGutters);
                }
            });
        },

        /**
         * Remove a CSS class from a specified line
         *
         * @param {StashLineHandle} lineHandle - as returned from {@link getLineHandle}
         * @param {string} whichEl - 'wrap', 'background', or 'text' to specify which element to remove the class from
         * @param {string} className - the class to remove.
         * @returns {StashLineHandle}
         */
        removeLineClass: function removeLineClass(lineHandle, whichEl, className) {
            this._editorForHandle(lineHandle).removeLineClass(lineHandle._handle, whichEl, className);
            return lineHandle;
        },

        /**
         * Set gutter element for the specified gutter at the specified line.
         *
         * @param {StashLineHandle} lineHandle - line handle as returned from {@link getLineHandle}
         * @param {string} gutterId - ID of the gutter for which to set a marker
         * @param {HTMLElement} el - element to set the gutter to.
         * @returns {StashLineHandle}
         */
        setGutterMarker: function setGutterMarker(lineHandle, gutterId, el) {
            this._editorForHandle(lineHandle).setGutterMarker(lineHandle._handle, gutterId, prepareGutterMarkerElement(el));
            return lineHandle;
        },

        /**
         * Add a CSS class to the container element. Useful for manipulating a whole gutter column at once.
         * @param {string} className
         */
        addContainerClass: function addContainerClass(className) {
            this._$container.addClass(className);
            this.refresh();
        },
        /**
         * Remove a CSS class to the container element. Useful for manipulating a whole gutter column at once.
         * @param {string} className
         */
        removeContainerClass: function removeContainerClass(className) {
            this._$container.removeClass(className);
            this.refresh();
        }
    };

    // The markText API includes a lineOffset and a line. This is not a nice API. It should take in two lines for the start and end, and ignore all the offset stuff.
    // So for now it's not part of the API.
    // refresh is removed because it shouldn't be needed by plugins
    var apiMethods = Object.keys(api);
    var apiEventWhitelist = {
        // eventName: arity
        'destroy': 0,
        'load': 1,
        'change': 1
    };

    /**
     * Setup the API that is exposed to plugin developers
     * @param {TextView} textView
     */
    function setupAPI(textView) {
        var boundEvents = {};
        textView._api = {};
        var eventAPI = {
            on: function on(eventName, f) {
                if (_.has(apiEventWhitelist, eventName)) {
                    if (!boundEvents[eventName]) {
                        boundEvents[eventName] = [];
                    }

                    var wrappedF = fn.arity(f.bind(textView._api), apiEventWhitelist[eventName]);
                    boundEvents[eventName].push({ f: f, wrappedF: wrappedF });
                    textView.on(eventName, wrappedF);
                }
            },
            off: function off(eventName, f) {
                if (boundEvents[eventName]) {
                    // lookup wrapped function
                    var index = array.findIndex(fn.dotEq('f', f))(boundEvents[eventName] || []);

                    if (index !== -1) {
                        textView.off(eventName, boundEvents[eventName][index].wrappedF);
                        boundEvents[eventName].splice(index, 1);
                    }
                }
            }
        };
        var apiArgs = [textView].concat(apiMethods);
        _.bindAll.apply(_, apiArgs);
        _.extend(textView._api, eventAPI, _.pick.apply(_, apiArgs));
    }

    exports.setupAPI = setupAPI;
    exports.mixInto = mix(api).into;
});