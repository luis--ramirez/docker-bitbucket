'use strict';

define('bitbucket/internal/feature/file-content/file-blame/blame-gutter', ['jquery', 'lodash', 'bitbucket/util/events', 'bitbucket/util/state', 'bitbucket/internal/bbui/widget/widget', 'bitbucket/internal/feature/file-content/diff-view-segment-types', 'bitbucket/internal/util/css', 'bitbucket/internal/util/object'], function ($, _, events, pageStateApi, Widget, DiffViewSegmentTypes, css, obj) {
    'use strict';

    function createBlameElementCache(blames) {
        var repo = pageStateApi.getRepository();
        var filePath = pageStateApi.getFilePath().components.join('/');
        var blameStats = blames.map(function (blameSpan) {
            var templateData = {
                spannedLines: blameSpan.spannedLines,
                filePath: filePath,
                repository: repo,
                commit: _.extend({
                    id: blameSpan.commitHash,
                    displayId: blameSpan.displayCommitHash
                }, blameSpan)
            };
            var els = [];
            //Make the array indexes start at the lineNumber
            els[blameSpan.lineNumber] = $(bitbucket.internal.feature.fileContent.fileBlameGutterDetailed(templateData))[0];

            if (blameSpan.spannedLines === 1) {
                return {
                    commitId: blameSpan.commitHash,
                    els: els
                };
            }

            var restEl = $(bitbucket.internal.feature.fileContent.fileBlameGutterSpan(templateData))[0];
            els.push(restEl);

            return {
                commitId: blameSpan.commitHash,
                els: els.concat(_.times(blameSpan.spannedLines - 2, function () {
                    return restEl.cloneNode(true);
                }))
            };
        });

        //Merge the els arrays, preserving line indexes, into a new array
        var byLine = $.extend.apply($, [[]].concat(_.pluck(blameStats, 'els')));

        var stat = {
            byLine: byLine,
            byCommitId: {},
            all: _.compact(byLine)
        };

        _.transform(blameStats, function (byCommitId, stat) {
            if (byCommitId[stat.commitId]) {
                byCommitId[stat.commitId] = byCommitId[stat.commitId].concat(_.compact(stat.els));
            } else {
                byCommitId[stat.commitId] = _.compact(stat.els);
            }
        }, stat.byCommitId);
        return stat;
    }

    var BLAME_GUTTER_ID = 'blame';

    function getSetGutterMarkerArgs(untilBlameElementsByLine, sinceBlameElementsByLine, change) {
        var setGutterMarkerArgs = [];

        return change.eachLine(function (lineInfo) {
            var blameEl;
            var lineHandle;

            switch (lineInfo.lineType) {
                case undefined:
                    //Source View
                    blameEl = untilBlameElementsByLine[lineInfo.lineNumber];
                    lineHandle = lineInfo.handles.SOURCE;
                    break;
                case DiffViewSegmentTypes.ADDED:
                    blameEl = untilBlameElementsByLine[lineInfo.line.destination];
                    lineHandle = lineInfo.handles.TO;
                    break;
                case DiffViewSegmentTypes.REMOVED:
                    blameEl = sinceBlameElementsByLine[lineInfo.line.source];
                    lineHandle = lineInfo.handles.FROM;
                    break;
                case DiffViewSegmentTypes.CONTEXT:
                    //Normally use sinceBlame for context, unless it wasn't fetched due to criteria defined in blame-diff
                    if (sinceBlameElementsByLine) {
                        blameEl = sinceBlameElementsByLine[lineInfo.line.source];
                        lineHandle = lineInfo.handles.FROM;
                    } else {
                        blameEl = untilBlameElementsByLine[lineInfo.line.destination];
                        lineHandle = lineInfo.handles.TO;
                    }
                    break;
            }

            setGutterMarkerArgs.push([lineHandle, BLAME_GUTTER_ID, blameEl]);
        }).then(function () {
            return setGutterMarkerArgs;
        });
    }

    function BlameGutter(textView, requestBlame) {
        Widget.call(this);
        this._enabled = false;
        this._textView = textView;
        this._requestBlame = requestBlame;
        this._pendingChanges = [];

        var self = this;
        this._textView.on('change', function (change) {
            if (self._pendingChanges) {
                self._pendingChanges.push(change);
            } else {
                self._fillForChange(change);
            }
        });

        this._textView.addContainerClass('blame-disabled');
        this._textView.registerGutter(BLAME_GUTTER_ID, { weight: 0 });
    }
    obj.inherits(BlameGutter, Widget);

    BlameGutter.prototype.setEnabled = function (shouldEnable) {
        shouldEnable = Boolean(shouldEnable);
        var whenChanged;
        if (this._enabled !== shouldEnable) {
            this._enabled = shouldEnable;
            if (this._enabled === shouldEnable) {
                // event listener didn't call setEnabled.
                if (shouldEnable) {
                    this._textView.removeContainerClass('blame-disabled');
                    whenChanged = this._fillGutter();
                } else {
                    this._textView.addContainerClass('blame-disabled');
                    whenChanged = $.Deferred().resolve();
                }
                var self = this;
                whenChanged.done(function () {
                    events.trigger('bitbucket.internal.feature.fileContent.fileBlameExpandedStateChanged', null, self._enabled);
                });
            }
        }
        return whenChanged || $.Deferred().resolve();
    };

    BlameGutter.prototype._addHoverBehavior = function (blameCache) {
        var $byCommitId = _.transform(blameCache.byCommitId, function ($byCommitId, els, commitId) {
            $byCommitId[commitId] = $(els);
        }, {});
        var _unhover;
        var hoveredCommitId;
        var unhoverTimeout;

        function mouseEnter(e) {
            if (e.target !== this) {
                return;
            }
            var commitId = this.getAttribute('data-commitid');
            clearTimeout(unhoverTimeout);

            if (hoveredCommitId === commitId) {
                return;
            }

            if (_unhover) {
                _unhover();
            }

            hoveredCommitId = commitId;
            var $newHovered = $byCommitId[commitId];
            var unstyle;
            // At some point the number of elements out of the DOM is so great it's actually slower to change them than to change global styles.
            // This especially affects IE, Firefox slightly, and Chrome almost not at all. But the result is that for very large
            // blames, we add rules to style them, instead of adding style classes
            if ($newHovered.length < 500) {
                $newHovered.addClass('commitid-hovered');
                unstyle = $newHovered.removeClass.bind($newHovered, 'commitid-hovered');
            } else {
                unstyle = css.appendRule('.blame.bitbucket-gutter-marker[data-commitid="' + commitId + '"] {' +
                // Change with @primaryHighlightColor and @primaryHighlight
                'background-color: #f5f5f5;' + 'border-right-color: #3b73af;' + '}');
            }
            _unhover = function unhover() {
                unstyle();
                hoveredCommitId = null;
                _unhover = null;
            };
        }

        function mouseLeave(e) {
            if (e.target !== this) {
                return;
            }
            if (_unhover) {
                unhoverTimeout = setTimeout(function () {
                    if (_unhover) {
                        _unhover();
                    }
                }, 100);
            }
        }

        // jQuery event handling invalidates layout due to copying of some properties on the event
        // So we're resorting to native handling.
        // Turns a 40ms frame into a 30ms one due to not having to do weird requests for SVG data URIs.
        blameCache.all.forEach(function (el) {
            el.addEventListener('mouseenter', mouseEnter);
            el.addEventListener('mouseleave', mouseLeave);
        });

        this._addDestroyable(function () {
            if (_unhover) {
                // must call this to remove added CSS rules.
                _unhover();
            }
        });
    };

    /**
     * Fill the gutter for a given change.
     *
     * @param {TextViewChange} change
     * @private
     */
    BlameGutter.prototype._fillForChange = function (change) {
        var untilBlameElementsByLine = this._untilBlameElCache && this._untilBlameElCache.byLine;
        var sinceBlameElementsByLine = this._sinceBlameElCache && this._sinceBlameElCache.byLine;
        var self = this;

        getSetGutterMarkerArgs(untilBlameElementsByLine, sinceBlameElementsByLine, change).done(function (setGutterMarkerArgs) {
            self._textView.operation(function () {
                setGutterMarkerArgs.forEach(function (args) {
                    if (!args[2]) {
                        // This means the line for the change is outside the range we have blame for
                        // A future improvement would be to request more blame, for now we just show nothing in the blame gutter.
                        return;
                    }

                    self._textView.setGutterMarker.apply(self._textView, args);
                });
            });
        });
    };

    /**
     * Fill the gutter the first time it is shown. Requires requesting the blame information for all existing changes.
     *
     * @private
     */
    BlameGutter.prototype._fillGutter = function () {
        if (this._gutterFilled) {
            return $.Deferred().resolve();
        }
        this._gutterFilled = true;

        var self = this;
        return this._requestBlame.get().done(function (untilBlames, sinceBlames) {
            if (untilBlames) {
                self._untilBlameElCache = createBlameElementCache(untilBlames);
                self._addHoverBehavior(self._untilBlameElCache);
            }
            if (sinceBlames) {
                self._sinceBlameElCache = createBlameElementCache(sinceBlames);
                self._addHoverBehavior(self._sinceBlameElCache);
            }

            self._textView.operation(function () {
                self._pendingChanges.forEach(self._fillForChange.bind(self));
            });
            self._pendingChanges = null;
        });
    };

    return BlameGutter;
});