'use strict';

define('bitbucket/internal/feature/file-content/source-view', ['jquery', 'lodash', 'bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/file-content/line-handle', 'bitbucket/internal/feature/file-content/request-source', 'bitbucket/internal/feature/file-content/source-line-info', 'bitbucket/internal/feature/file-content/text-view', 'bitbucket/internal/feature/file-content/text-view/attach-simple-scroll-behavior', 'bitbucket/internal/util/deep-linking', 'bitbucket/internal/util/function', 'bitbucket/internal/util/object', 'bitbucket/internal/util/property', 'bitbucket/internal/util/shortcuts'], function ($, _, events, nav, StashLineHandle, requestSource, sourceLineInfo, TextView, attachSimpleScrollBehavior, deepLinking, fn, obj, propertyUtil, shortcuts) {
    'use strict';

    /**
     * Get a public change object for editor change/load events
     *
     * @param {ChangeObject} change
     * @returns {PublicChange}
     */

    function getPublicChange(change) {
        var clone = _.extend({}, change);
        return obj.freeze(clone);
    }

    /**
     * Add line numbers to the editor's gutter
     *
     * @param {SourceView} sourceView - needs to be explicitly passed in so we can trigger events (the change only exposes the API)
     * @param {ContentChange} change
     */
    function addLineNumbers(sourceView, change) {
        var gutterMarkerArgs = [];
        var div = document.createElement("div");
        div.innerHTML = bitbucket.internal.feature.fileContent.sourceView.lineNumber();
        var element = div.childNodes[0];

        return change.eachLine(function (data) {
            var newElement = element.cloneNode(true);
            newElement.setAttribute('data-line-number', data.lineNumber);
            newElement.setAttribute('href', "#" + data.lineNumber);
            newElement.appendChild(document.createTextNode(data.lineNumber));

            gutterMarkerArgs.push([data.handles.SOURCE, 'line-number', newElement]);
        }).done(function () {
            sourceView.operation(function () {
                gutterMarkerArgs.forEach(function (args) {
                    sourceView.setGutterMarker.apply(sourceView, args);
                });
            });

            // fire the change event only once the lines are loaded.
            // This is necessary because we can't reliably address lines until the markers are rendered.
            var publicChange = getPublicChange(change);
            sourceView.trigger('change', publicChange);
            events.trigger('bitbucket.internal.feature.fileContent.sourceViewContentChanged', null, publicChange);
            if (change.type === 'INITIAL') {
                sourceView.trigger('load', publicChange);
                events.trigger('bitbucket.internal.feature.fileContent.sourceViewContentLoaded', null, publicChange);
            }
        });
    }

    /**
     *
     * @param {Object} data - REST data for the targeted page of source
     * @param {Object} options - options for the SourceView. Supports all otions listed on TextView.
     * @param {jQuery} options.$container - where to place the SourceView
     * @param {string} [options.anchor] - The hash encoded line numbers to focus initially
     * @param {boolean} [options.attachScroll] - whether to request full-page scroll control
     * @constructor
     */
    function SourceView(data, options) {
        TextView.call(this, options.$container, options);
        var self = this;

        this._editor = this._createEditor();

        this._syntaxHighlighting(options.fileChange.path.name, data.lines[0].text, this._editor);

        this.registerGutter('line-number', { weight: 1000 });

        //initialise as empty collection rather than undefined so we can rely on jQuery to no-op
        this._$focusedLines = $([]);

        this.on('internal-change', function (change) {
            addLineNumbers(self, change).done(function () {
                if (options.anchor) {
                    self._whenOpDone(function () {
                        self.updateAnchor(options.anchor, true);
                    });
                }
            });
        });

        this._scrollingReady = $.Deferred();
        this._scrollingReady.done(function () {
            self._modify('INITIAL', data, sourceLineInfo.convertToLineInfos(data));
            self._editor.setOption("scrollLineIntoViewFunc", function (lineInfo) {
                self.scrollHandleIntoFocus(self.getLineHandle({ lineNumber: lineInfo.from.line }));
            });
        }).done(this._loadRest.bind(this, data));
    }
    obj.inherits(SourceView, TextView);
    SourceView.defaults = TextView.defaults;

    SourceView.prototype.init = function () {
        TextView.prototype.init.call(this);
        var self = this;
        if (this._options.attachScroll) {
            // Deferred to file-content-spinner is removed before any heights are calculated.
            _.defer(function () {
                self._attachScrollBehavior().then(self._scrollingReady.resolve.bind(self._scrollingReady), self._scrollingReady.reject.bind(self._scrollingReady));
            });
        } else {
            // instantly resolve it because we don't need scrolling
            this._scrollingReady.resolve();
        }

        this._addDestroyable(shortcuts.bind('sourceViewFindPrev', function () {
            self._editor.execCommand("findPrev");
        }));
        this._addDestroyable(shortcuts.bind('sourceViewFindNext', function () {
            self._editor.execCommand("findNext");
        }));
        this._addDestroyable(shortcuts.bind('sourceViewFind', function () {
            self._editor.execCommand("find");
        }));

        var lastNumber = _.last(deepLinking.hashToLineNumbers(window.location.hash));

        $(this._editor.getWrapperElement()).on('click contextmenu', '.line-locator', function (e) {
            var newLineNumber = parseInt($(e.target).attr('href').substring(1), 10);

            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                e.preventDefault();
                var existingLineNumbers = deepLinking.hashToLineNumbers(window.location.hash);
                var newLineNumbers = deepLinking.updateSelectionRange(newLineNumber, {
                    existingLineNumbers: existingLineNumbers,
                    selectRange: !!e.shiftKey,
                    lastSelected: lastNumber
                });
                location.hash = deepLinking.lineNumbersToHash(newLineNumbers);

                //If the new line was removed from the selection, don't use it as an anchor for a range selection
                //It means the first shift+click after removing a line from the selection will add to, not extend, the selection
                newLineNumber = _.contains(newLineNumbers, newLineNumber) ? newLineNumber : null;
            }

            lastNumber = newLineNumber;
        });
    };

    /**
     * @param {Array<number>} lineNumbers - The line numbers to focus, one indexed
     * @param {boolean} shouldScrollIntoView - Whether to scroll the first focused line into view
     */
    SourceView.prototype.setFocusedLines = function (lineNumbers, shouldScrollIntoView) {
        //Unfocus existing lines, empty out _$focusedLines
        this._$focusedLines = this._$focusedLines.removeClass('target').filter();

        if (_.isEmpty(lineNumbers)) {
            return;
        }

        var handles = lineNumbers.map(function (lineNumber) {
            return {
                lineNumber: lineNumber
            };
        }).map(this.getLineHandle).filter(_.identity);

        if (handles.length) {
            this._$focusedLines = $(handles.map(fn.dot('_handle.gutterMarkers.line-number'))).addClass('target');

            if (shouldScrollIntoView) {
                this.scrollHandleIntoFocus(_.first(handles));
            }
        }
    };

    /**
     * @param {string} anchor - The hash encoded line numbers to focus
     * @param {boolean} shouldScrollIntoView - Whether to scroll the first focused line into view
     */
    SourceView.prototype.updateAnchor = function (anchor, shouldScrollIntoView) {
        this.setFocusedLines(deepLinking.hashToLineNumbers(anchor), shouldScrollIntoView);
    };

    SourceView.prototype._acceptModification = function (changeType, newContentJSON, newContentLineInfos, at) {
        at = at || 0;
        var editor = this._editor;

        var text = _.chain(newContentJSON.lines).pluck('text').invoke('replace', /[\r\n]/g, '').join('\n').value();

        switch (changeType) {
            case 'INITIAL':
                editor.setValue(text);
                break;
            case 'INSERT':
                editor._insert(text, at);
                break;
            default:
                throw new Error('Unrecognized change type: ' + changeType);
        }

        newContentLineInfos.forEach(function (lineInfo, i) {
            var handle = new StashLineHandle(undefined, undefined, lineInfo.lineNumber, editor.getLineHandle(i + at));
            lineInfo._setHandle(handle);
        });
    };

    SourceView.prototype._attachScrollBehavior = function () {
        return attachSimpleScrollBehavior(this, this._editor, $(this._editor.getWrapperElement()));
    };

    SourceView.prototype._getChangeAttributes = function (changeType, sourcePage) {
        return {
            firstLine: sourcePage.start + 1,
            isLastPage: sourcePage.isLastPage
        };
    };

    SourceView.prototype._loadRest = function (startingData) {
        var self = this;
        function loadRange(start, end) {
            var requestOptions = {
                start: start,
                limit: end - start
            };
            return requestSource(self._options.fileChange, requestOptions).then(function (data) {
                if (data.size < requestOptions.limit && !data.isLastPage) {
                    return loadRange(start + data.size, end).then(function (restOfData) {
                        return combineData(data, restOfData);
                    });
                }
                return data;
            });
        }
        function combineData(first, second) {
            return {
                start: first.start,
                lines: first.lines.concat(second.lines),
                size: first.size + second.size,
                isLastPage: second.isLastPage
            };
        }
        function insert(at, data) {
            if (data) {
                self._modify('INSERT', data, sourceLineInfo.convertToLineInfos(data), at);
            }
        }

        var haveStart = startingData.start;
        var haveEnd = startingData.start + startingData.size;

        propertyUtil.getFromProvider('display.max.source.lines').done(function (capacity) {
            var before = haveStart > 0 ? loadRange(0, haveStart) : $.Deferred().resolve();
            var after = !startingData.isLastPage && haveEnd < capacity ? loadRange(haveEnd, capacity) : $.Deferred().resolve();

            // only modify once they are both ready to go. This lets us keep them in the same operation.
            $.when(before, after).done(function (beforeValue, afterValue) {
                if (!self._editor) {
                    return; // already destroyed
                }
                self._editor.operation(function () {
                    insert(0, beforeValue);
                    insert(self._editor.lastLine() + 1, afterValue);

                    after.then(function isCapacityExceeded(afterData) {
                        var capacityReached = afterData ? !afterData.isLastPage : haveEnd >= capacity && !startingData.isLastPage;
                        if (capacityReached) {
                            self._renderCapacityReached();
                        }
                    });
                });

                self._$container.addClass('fully-loaded');
                self.trigger('resize');
            });
        });
    };

    SourceView.prototype._renderCapacityReached = function () {
        var fileChange = this._options.fileChange;
        var msgEl = $(bitbucket.internal.feature.fileContent.sourceView.capacityReachedLineWidget({
            rawUrl: nav.currentRepo().raw().path(fileChange.path).at(fileChange.commitRange.untilRevision.id).build()
        }))[0];
        this._$container.addClass('capacity-reached');
        this._editor.addLineWidget(this._editor.lastLine(), msgEl, {
            coverGutter: true,
            noHScroll: true
        });
        this.trigger('resize');
    };

    SourceView.prototype._editorForHandle = function () {
        return this._editor;
    };

    return SourceView;
});