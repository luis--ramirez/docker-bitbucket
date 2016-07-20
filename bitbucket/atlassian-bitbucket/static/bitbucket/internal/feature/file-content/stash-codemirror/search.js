'use strict';

define('bitbucket/internal/feature/file-content/stash-codemirror/search', ['codemirror', 'jquery', 'bitbucket/internal/util/navigator'], function (CodeMirror, $, navigator) {

    'use strict';

    /**
     * Creates an overlay that highlights things matching {@code query}
     *
     * @param {string|RegExp} query       The query to highlight
     * @param {boolean} [caseInsensitive] If the query should be tested case insensitively
     * @returns {{token: Function}}       A CodeMirror highlight mode
     */

    function searchOverlay(query, caseInsensitive) {
        if (typeof query === "string") {
            query = new RegExp("^" + query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), caseInsensitive ? "i" : "");
        } else {
            query = new RegExp("^(?:" + query.source + ")", query.ignoreCase ? "i" : "");
        }
        return {
            token: function token(stream) {
                if (stream.match(query)) {
                    return "searching";
                }
                while (!stream.eol()) {
                    stream.next();
                    if (stream.match(query, false)) {
                        break;
                    }
                }
            }
        };
    }

    /**
     * @typedef {Object} SearchState
     * @property {CodeMirror.SearchCursor} cursor
     * @property {HTMLElement} dialogEl
     * @property {Object} overlay
     * @property {string|RegExp} query
     */

    /**
     * Creates a new SearchState object
     * @constructor
     */
    function SearchState() {
        this.cursor = null;
        this.dialogEl = null;
        this.overlay = null;
        this.query = null;
    }

    /**
     * Gets the current search state for this CodeMirror or creates one if it doesn't exist
     *
     * @param cm
     * @returns {SearchState}
     */
    function getSearchState(cm) {
        return cm.state.search || (cm.state.search = new SearchState());
    }

    /**
     * Tests if the query should be handled case insensitively.
     *
     * @param {string|RegExp} query
     * @returns {boolean}
     */
    function queryCaseInsensitive(query) {
        return typeof query === "string";
    }

    /**
     * Gets a new SearchCursor attached to the provided CodeMirror.
     *
     * @param {CodeMirror} cm
     * @param {string|RegExp} query
     * @param {CodeMirror.Pos} pos
     * @returns {CodeMirror.SearchCursor}
     */
    function getSearchCursor(cm, query, pos) {
        // Heuristic: if the query string is all lowercase, do a case insensitive search.
        return cm.getSearchCursor(query, pos, queryCaseInsensitive(query));
    }

    /**
     * Parses a raw query into a RegExp object if applicable.
     *
     * @param {string} query
     * @returns {string|RegExp}
     */
    function parseQuery(query) {
        var isRE = query.match(/^\/(.*)\/([a-z]*)$/);
        return isRE ? new RegExp(isRE[1], isRE[2].indexOf("i") === -1 ? "" : "i") : query;
    }

    /**
     * Adds a highlight overlay to the CodeMirror
     *
     * @param {CodeMirror} cm
     * @param {SearchState} state
     */
    function addOverlay(cm, state) {
        cm.operation(function () {
            cm.removeOverlay(state.overlay);
            state.overlay = searchOverlay(state.query, queryCaseInsensitive(state.query));
            cm.addOverlay(state.overlay);
        });
    }

    /**
     * Remove any current highlight overlays
     *
     * @param {CodeMirror} cm
     * @param {SearchState} state
     */
    function removeOverlay(cm, state) {
        cm.operation(function () {
            cm.removeOverlay(state.overlay);
            state.overlay = null;
        });
    }

    /**
     * Setups up the CodeMirror with the correct state for the provided query.
     *
     * @param {CodeMirror} cm
     * @param {string} query  - the raw query
     * @param {boolean} [rev] - If the search should be conducted in reverse
     */
    function doSearch(cm, query, rev) {
        query = query && query.trim();
        if (!query || query.length === 0) {
            return;
        }
        cm.operation(function () {
            var state = getSearchState(cm);
            if (query !== state.query) {
                state.query = parseQuery(query);
                state.cursor = null;
                addOverlay(cm, state);
            } else if (!state.overlay) {
                addOverlay(cm, state);
            }
            findNext(cm, rev);
        });
    }

    /**
     * Opens a find dialog box at the top of the CodeMirror.
     * If the dialog is already open it will be re-focused.
     *
     * @param {CodeMirror} cm
     */
    function find(cm, rev) {
        var state = getSearchState(cm);
        if (state.dialogEl) {
            var searchBox = state.dialogEl.getElementsByClassName('search-query')[0];
            searchBox.focus();

            doSearch(cm, searchBox.value, rev);
            return;
        }

        var $dialog = $(bitbucket.internal.feature.fileContent.codemirror.searchQuery());
        $dialog.find('.search-button').on('click', function (e) {
            findNext(cm, $(e.target).closest('.aui-button').data('rev'));
        }).tooltip();
        var inputEl = $dialog.find('input')[0];

        // jQuery.hotkeys will never detect key press events in input boxes so we have to bind this handler to manually
        // take care of them and stop them bubbling up to window and the native browser find taking over.
        inputEl.onkeydown = function (e) {
            // ensure that the search term is reevaluated
            state.query = undefined;
            var isMac = navigator.isMac();
            // this is a bad thing to do generally but should work OK for this case
            var character = String.fromCharCode(e.keyCode);
            var isCtrl = isMac && e.metaKey && !e.ctrlKey || !isMac && !e.metaKey && e.ctrlKey;
            if (character === 'F' && isCtrl && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                // do nothing find box is already focused
            } else if (character === 'G' && isCtrl && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    doSearch(cm, inputEl.value);
                } else if (character === 'G' && isCtrl && e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    doSearch(cm, inputEl.value, true);
                }
        };
        state.dialogEl = $dialog[0];

        var dialogOpts = {
            value: cm.getSelection() || state.query,
            closeOnEnter: false,
            closeOnBlur: false,
            onClose: function onClose() {
                removeOverlay(cm, state);
                // reset the state but don't reset the query string.
                state.dialogEl = state.cursor = null;
            }
        };

        cm.openDialog(state.dialogEl, function (query, e) {
            e.preventDefault();
            doSearch(cm, query);
        }, dialogOpts);

        // do an initial search to ensure that the buttons and keyboard shortcuts work.
        doSearch(cm, dialogOpts.value, rev);
    }

    /**
     * Finds the next occurrence based on the SearchState of the CodeMirror.
     *
     * @param {CodeMirror} cm
     * @param {boolean} [rev] - If the search should be conducted in reverse
     */
    function findNext(cm, rev) {
        cm.operation(function () {
            var state = getSearchState(cm);
            if (!state.query || !state.dialogEl) {
                // refocus/open the find dialog so the user can type a query
                find(cm, rev);
                return;
            }

            if (!state.cursor) {
                if (rev) {
                    // rewind 1 character to so the current match isn't found again.
                    // minus 1 isn't good enough, goCharLeft will go back up a line if at the start of a line.
                    cm.execCommand('goCharLeft');
                }
                state.cursor = getSearchCursor(cm, state.query, cm.getCursor());
            }
            if (!state.cursor.find(rev)) {
                state.cursor = getSearchCursor(cm, state.query, rev ? CodeMirror.Pos(cm.lastLine()) : CodeMirror.Pos(cm.firstLine(), 0));
                if (!state.cursor.find(rev)) {
                    return;
                }
            }
            cm.setSelection(state.cursor.from(), state.cursor.to());

            var pos = { from: state.cursor.from(), to: state.cursor.to() };
            var scrollLineIntoView = cm.getOption("scrollLineIntoViewFunc");
            if (scrollLineIntoView) {
                scrollLineIntoView(pos);

                var editorPos = cm.charCoords(pos.from, 'local');
                var editorScrollInfo = cm.getScrollInfo();

                if (editorScrollInfo.left > editorPos.left || editorScrollInfo.left + editorScrollInfo.clientWidth < editorPos.left) {
                    cm.scrollTo(Math.max(0, editorPos.left - 20), null);
                }
            } else {
                cm.scrollIntoView(pos, 100);
            }
        });
    }

    /**
     * Highlights the query in the diff,
     *
     * @param cm
     * @param query
     */
    function highlight(cm, query) {
        var state = getSearchState(cm);
        if (query.length === 0) {
            removeOverlay(cm, state);
        } else {
            state.query = parseQuery(query);
            addOverlay(cm, state);
        }
    }

    CodeMirror.defineOption("scrollLineIntoViewFunc", null);
    CodeMirror.commands.find = find;
    CodeMirror.commands.findNext = findNext;
    CodeMirror.commands.findPrev = function (cm) {
        return findNext(cm, true);
    };
    CodeMirror.commands.highlight = highlight;
});