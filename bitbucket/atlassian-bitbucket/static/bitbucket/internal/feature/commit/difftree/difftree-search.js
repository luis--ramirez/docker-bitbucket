'use strict';

define('bitbucket/internal/feature/commit/difftree/difftree-search', ['aui', 'bacon', 'jquery', 'lodash', 'bitbucket/internal/feature/commit/difftree/difftree-search-input', 'bitbucket/internal/model/path', 'bitbucket/internal/model/path-and-line', 'bitbucket/internal/util/bacon', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/util/promise', 'bitbucket/internal/util/shortcuts', 'exports'], function (AJS, Bacon, $, _, SearchInput, Path, PathAndLine, bacon, events, fn, promiseUtil, shortcuts, exports) {

    'use strict';

    /**
     * Represents a single line change.
     *
     * @typedef {Object} LineChangeData
     * @property {string} path
     * @property {string} type
     * @property {number} lineNumber
     * @property {string} line
     */

    function TextWrapper(text, caseSensitive) {
        return {
            length: text.length,
            indexOf: function indexOf(s, offset) {
                return caseSensitive ? s.indexOf(text, offset) : s.toLowerCase().indexOf(text.toLowerCase(), offset);
            }
        };
    }

    /**
     *
     * @param {string} line - the line of text to decorate
     * @param {TextWrapper} filter - case insensitive filter for finding the index in another string
     * @returns {string} an HTML value to be displayed
     */
    function decorateTitle(line, filter) {
        // Number of characters to show before the first match of the filtered text
        // This depends somewhat on the current default width of the difftree
        var magicOffset = 30;
        var i = filter.indexOf(line);
        line = i > magicOffset ? '...' + line.substring(i - magicOffset) : line;
        var offset = 0;
        var html = '';
        for (var j = 0; offset < line.length && j < 100; j++) {
            i = filter.indexOf(line, offset);
            i = i < 0 ? line.length : i;
            html += AJS.escapeHtml(line.substring(offset, i));
            if (i < line.length) {
                html += '<strong>' + AJS.escapeHtml(line.substring(i, i + filter.length)) + '</strong>';
            }
            offset = i + filter.length;
        }
        return html;
    }

    /**
     * Indexes the tree data by file path so file nodes can be quickly referenced.
     *
     * @param {DiffTreeData} diffTreeData
     * @returns {Object.<string, DiffTreeData>}
     */
    function indexFiles(diffTreeData) {
        var dataByFilePath = {};
        function indexDataRecursive(data) {
            if (data.metadata.isDirectory) {
                data.children.forEach(indexDataRecursive);
            } else {
                dataByFilePath[data.data.attr.href.substring(1)] = data;
            }
        }
        indexDataRecursive(diffTreeData);
        return dataByFilePath;
    }

    /**
     * We're using Bacon here as a convenience for lazy streams (or creating a new array).
     * Be warned that Bacon is only a 'hot' stream, and will only support one consumer (eg. the first onValue() call).
     * We may want to investigate lazy.js or RxJS as an alternative at some point.
     *
     * @param {DiffData} data
     * @returns {Bacon<LineChangeData>}
     */
    function convertHunksToLines(data) {
        return Bacon.fromBinder(function (sink) {
            data.diffs.forEach(function (diff) {
                // By default we want destination unless the file has been removed
                var file = new Path(diff.destination || diff.source);
                (diff.hunks || []).forEach(function (hunk) {
                    hunk.segments.forEach(function (segment) {
                        segment.lines.forEach(function (line) {
                            sink({
                                path: file.toString(),
                                type: segment.type,
                                // By default we want the destination line unless there is none
                                lineNumber: segment.type === 'ADDED' ? line.destination : line.source,
                                line: line.line
                            });
                        });
                    });
                });
            });
            // Make sure we flush!
            sink(new Bacon.End());
            return $.noop;
        });
    }

    /**
     * Filters a copy (in place) of the difftree data with a subset of the hunk results that match 'text'.
     * This is _very_ much about the format of the data that jstree expects.
     *
     * @param {DiffTreeData} difftreeData
     * @param {TextWrapper} text
     * @param {DiffData} results
     * @returns {DiffTreeData}
     */
    function filterDiffTree(difftreeData, text, results) {
        // Search results _may_ have been truncated see STASH-7517 for some more background
        difftreeData.searchTruncated = results.truncated;
        var fileMap = indexFiles(difftreeData);
        // The only reason we want to split on path is to calculate the longest 'lineNumber' to align the numbers,
        // otherwise don't bother...
        bacon.split(convertHunksToLines(results).filter(function (line) {
            return text.indexOf(line.line) >= 0;
        }), fn.dot('path')).onValue(function (fileLines) {

            // Calculate the maximum lineNumber length (as a string) just for display purposes
            var maxLineNumberLength = _.reduce(fileLines, function (l, line) {
                return Math.max(l, line.lineNumber.toString().length);
            }, 0);
            fileLines.forEach(function (row) {
                var data = fileMap[row.path];
                // Should never happen, except when the user rescopes and adds a new file
                // For now we will ignore it, but longer term we need a way of 'updating' the list of files
                if (!data) {
                    return;
                }

                data.children = data.children || [];
                var path = new PathAndLine(row.path, row.lineNumber, row.type === 'ADDED' ? 'TO' : 'FROM');
                var title = bitbucket.internal.feature.difftree.searchTreeNode({
                    changeType: row.type,
                    lineNumber: row.lineNumber.toString(),
                    padding: maxLineNumberLength,
                    titleContent: decorateTitle(row.line.trim(), text)
                });
                data.children.push({
                    data: {
                        title: title,
                        attr: {
                            'class': 'jstree-search-leaf',
                            title: row.line.trim(),
                            href: '#' + path.toString()
                        }
                        // Copy the metadata over to let tree-and-diff-view play nice
                    }, metadata: _.extend({}, data.metadata, { path: path })
                });
            });
        });

        // TODO Currently this only updates the original structure, so we may have sub-folders where none are needed
        // We should recreate only the 'directories' that we need to support the searched files
        function filterEmptyNodes(tree) {
            tree.children = tree.children.filter(function (child) {
                if (child.metadata.isDirectory) {
                    return filterEmptyNodes(child);
                } else {
                    return child.children && child.children.length > 0;
                }
            });
            return tree.children.length > 0;
        }
        filterEmptyNodes(difftreeData);

        var analyticsData = {
            linesMatched: _.reduce(difftreeData.children, function (sum, child) {
                return sum + child.children.length;
            }, 0),
            filesMatched: difftreeData.children.length,
            searchTruncated: difftreeData.searchTruncated
        };
        events.trigger("bitbucket.internal.ui.diff-view.search.result.details", null, analyticsData);

        return difftreeData;
    }

    function DiffTreeSearch(caseSensitive) {
        this.input = new SearchInput({
            placeholder: AJS.I18n.getText('bitbucket.web.difftree.search.placeholder')
        });
        this.caseSensitive = caseSensitive;

        this._destroyables = [];
        this._destroyables.push(this.input);
        this._destroyables.push(events.chainWith(this.input.$el.closest('form')).on('submit', fn.invoke('preventDefault')));
        this._destroyables.push({ destroy: shortcuts.bind('requestDiffTreeSearch', this.focusSearch.bind(this)) });
    }

    /**
     * Start listening for search inputs and return a stream of difftree updates to be rendered.
     *
     * @param {function(string): Promise<DiffData>} requestFilteredDiffs - callback for requesting a diff
     * @param {function(): DiffTreeData} getDiffTreeData - callback for returning the difftree data
     * @returns {Bacon<DiffTreeData>} a stream of data updates as the user updates their search
     */
    DiffTreeSearch.prototype.register = function (requestFilteredDiffs, getDiffTreeData) {
        var self = this;
        var inputs = this.input.getInputs();
        return inputs.flatMap(function (text) {
            if (!text) {
                // Blank text should clear the search and restore the tree to it's 'normal' state
                return Bacon.fromArray([{ data: getDiffTreeData(), search: text }]);
            }
            var $spinner = $('<div class="difftree-search-spinner"></div>').prependTo(self.input.$el);
            var $searchIcon = self.input.$el.parent().find('.search-icon');
            $searchIcon.addClass('invisible');
            var promise = promiseUtil.spinner($spinner, requestFilteredDiffs(text)).always(function () {
                $searchIcon.removeClass('invisible');
            });
            return Bacon.fromPromise(promise, true)
            // Cancel if newer inputs have taken flight
            .takeUntil(inputs).map(_.partial(filterDiffTree, $.extend(true, {}, getDiffTreeData()), new TextWrapper(text, self.caseSensitive))).map(function (data) {
                return { data: data, search: text };
            });
        });
    };

    DiffTreeSearch.prototype.focusSearch = function () {
        this.trigger('search-focus');
        this.input.$el.find('input').focus();
    };

    _.extend(DiffTreeSearch.prototype, events.createEventMixin("diffTreeSearch", { localOnly: true }));

    DiffTreeSearch.prototype.destroy = function () {
        _.invoke(this._destroyables, 'destroy');
    };

    exports.DiffTreeSearch = DiffTreeSearch;

    // All for testing
    exports._filterDiffTree = filterDiffTree;
    exports._Text = TextWrapper;
    exports._decorateTitle = decorateTitle;
});