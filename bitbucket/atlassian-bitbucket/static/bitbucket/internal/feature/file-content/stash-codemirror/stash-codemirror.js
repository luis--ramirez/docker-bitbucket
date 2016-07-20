'use strict';

define('bitbucket/internal/feature/file-content/stash-codemirror', ['aui', 'codemirror', 'jquery', 'lodash', 'bitbucket/internal/util/function', 'bitbucket/internal/feature/file-content/stash-codemirror/stash-scrollbar'], function (AJS, CodeMirror, $, _, fn) {
    'use strict';

    /*
     * README:
     * This file make large assumptions that its only ever going to be used in a context where CodeMirror is readonly.
     * This means a lot of the key handling is done in ways that would be incompatible with an editable CodeMirror.
     * Specifically `blurEditorOnArrowKeys` blocks keys that would be needed for an edit mode,
     */

    CodeMirror.defineOption('stashDestroyables', null);

    /**
     * Blur the editor when an arrow key is pressed inside and it is not extending a selection.
     *
     * When CodeMirror has focus, you can use the arrow keys to navigate the diff. This is largely because we're
     * using a readonly mode for CodeMirror and there is no cursor (so it's not clear that your cursor is in fact
     * focused in the editor).
     *
     * This solution isn't bulletproof. Because we're monitoring the keydown event, we need at least 1 event to fire
     * to blur away from the textarea before the keydown event will scroll the page/diff again.
     *
     * @param {CodeMirror} editor
     */
    function blurEditorOnArrowKeys(editor) {

        editor.on('keydown', function (editor, e) {
            // If this is an arrow or page movement key and the Shift key was NOT pressed down then we want to blur the editor.
            // 33, 34 are Page Up and Page Down.
            // 35, 36 are End and Home.
            // 37 - 40 are keyCodes for arrow keys.
            // We also check that there isn't anything selected and that the shift key isn't pressed
            // as this would be used when creating/extending a selection.
            if (e.which >= 33 && e.which <= 40 && !e.shiftKey && !editor.somethingSelected()) {
                // make sure the first event from the page movement keys is lost rather than letting
                // CodeMirror do strange things.
                if (e.which < 37) {
                    e.preventDefault();
                }
                editor.getInputField().blur();
            }
        });
    }

    /**
     * When the editor is blurred we'll want to clear any selections that might be present.
     * @param {CodeMirror} editor
     */
    function clearSelectionOnEditorBlur(editor) {
        var isContextMenuBlur = false;

        // This is a debounced function so that the editor has a chance to fire the
        // contextmenu event which we'll want to exclude as a blurrer (so that users can right-click and copy text)
        var clearSelection = fn.lazyDelay(function () {
            var firstVisibleLine;
            if (!isContextMenuBlur) {
                firstVisibleLine = editor.lineAtHeight(editor.getScrollInfo().top + editor.heightAtLine(0));
                // We add +1 to the firstVisibleLine so CM won't scroll the diff up by a few px if we're in between lines.
                // i.e. you're scrolled between lines 12 and 13, it will unset the selection on line 14 so the diff
                // doesn't scroll by half a line
                editor.setSelection({ line: firstVisibleLine + 1, ch: 0 });
            }
            isContextMenuBlur = false;
        }, 10);

        editor.on('contextmenu', function () {
            isContextMenuBlur = true;
        });

        editor.on('blur', function (editor) {
            if (editor.somethingSelected()) {
                clearSelection();
            }
            isContextMenuBlur = false;
        });
    }

    /**
     * Set up an event handler to handle keydown events on the editor that can then be passed through to the
     * document for regular handling. Our events don't fire because the CodeMirror events take place
     * in a textarea and the Stash keyboard shortcut handler ignores these events.
     *
     * @param {CodeMirror} editor
     */
    function allowEditorKeysPassThrough(editor) {
        editor.on('keydown', keyPassThroughHandler);
        editor.on('keypress', keyPassThroughHandler);
    }

    // Set up the keys that CodeMirror should ignore for us in ReadOnly mode.
    var disAllowedKeys = {};
    disAllowedKeys[AJS.keyCode.TAB] = true;

    /**
     * Filters the key code on the event to see if it is in the disAllowed keys list.
     * @param {Event} e
     * @returns {boolean}
     */
    function disAllowedEditorKeys(e) {
        var key = e.which || e.keyCode;
        return !!disAllowedKeys[key];
    }

    var keyEventAttributesToCopy = ['which', 'keyCode', 'shiftKey', 'ctrlKey', 'metaKey'];

    /**
     * Handle the editor keydown/keypress event and pass it through to the document
     * @param {CodeMirror} editor
     * @param {Event} e
     */
    function keyPassThroughHandler(editor, e) {
        var passThroughEvent = _.extend(jQuery.Event(e.type), _.pick(e, keyEventAttributesToCopy));

        //pass the event along to the document
        $(document).trigger(passThroughEvent);

        // Check if the key that was pressed is in the disAllowed list. If it is, then we will set the
        // codemirrorIgnore property on the event so that CodeMirror does not handle this key event
        // and perhaps more importantly, does not swallow the event.
        e.codemirrorIgnore = disAllowedEditorKeys(e);
    }

    /**
     * Create a facade object that exposes some of the incoming object's methods, optionally replacing their return value.
     * @param {Object} obj
     * @param {Array<string, *>|string...} method - Either a method name (string) or a method name and a return value
     * @returns {Object}
     */
    function facade(obj /*, ...methods*/) {
        var onto = {};
        var methods = Array.prototype.slice.call(arguments, 1);
        var handleMethod = fn.spread(function (method, ret) {
            // spread will expand array, or not touch string.
            onto[method] = ret !== undefined ? _.compose(fn.constant(ret), obj[method].bind(obj)) : obj[method].bind(obj);
        });
        methods.forEach(fn.unary(handleMethod));
        return onto;
    }

    /**
     * Create the CodeMirror instance for the given source container.
     *
     * @param {HTMLElement} containerEl
     * @param {Object} [options] - any options to pass to CodeMirror
     * @param {boolean} [options.autoResizing] - if true, CSS styles and options will be applied to make CodeMirror
     * resize to fit its contents.
     * @param {string} [options.scrollStyle] - The style of the scrollbar to use, "fixed" or "inline", if not set it
     * will default to the CodeMirror "native" mode.
     * @returns {StashCodeMirror}
     */
    function StashCodeMirror(containerEl, options) {
        var editor = new CodeMirror(containerEl, $.extend({
            mode: 'text/plain',
            readOnly: true,
            lineNumbers: false, // we do this ourselves
            wholeLineUpdateBefore: false,
            scrollbarStyle: options.scrollStyle ? 'stash-' + options.scrollStyle : 'native',
            cursorBlinkRate: 0,
            styleSelectedText: true,
            stashDestroyables: [],
            theme: "stash-default"
        }, {
            // separate object so jQuery won't copy it in if it's undefined
            viewportMargin: options && options.autoResizing ? Infinity : undefined
        }, options));

        // Skate doesn't perform well on big DOMs. We block it at the elements closest to where DOM is added/removed
        // to avoid MutationObserver having to navigate up the DOM very far.
        // .CodeMirror-code holds all the lines, so we place an ignore there.
        // We hit .CodeMirror-lines because lots of elements get added to the "measure" div, which is outside of .CodeMirror-code
        $(editor.getWrapperElement()).find('.CodeMirror-lines, .CodeMirror-code').attr('data-skate-ignore', 'true');

        if (options && options.autoResizing) {
            containerEl.className += ' codemirror-auto-resizing-container';
        }

        blurEditorOnArrowKeys(editor);
        allowEditorKeysPassThrough(editor);
        clearSelectionOnEditorBlur(editor);

        // we limit the methods available for maintainability - we'll know exactly which things we need to support
        var codemirrorFacade = facade(editor,
        // [ method, return value override ]
        ['addLineClass', this], 'addLineWidget', 'charCoords', 'execCommand', 'getDoc', 'getInputField', 'getLine', 'getLineHandle', 'getLineNumber', 'getOption', 'getScrollInfo', 'getWrapperElement', 'heightAtLine', 'lastLine', 'lineAtHeight', ['markText', this], ['off', this], ['on', this], ['refresh', this], ['removeLineClass', this], 'replaceRange', ['scrollIntoView', this], ['scrollTo', this], ['setGutterMarker', this], ['setOption', this], ['setSelection', this], ['setValue', this]);
        $.extend(this, codemirrorFacade);
        this.operation = function (op) {
            // pass in the StashCodeMirror instead of the editor
            editor.operation(fn.unary(_.partial(op, this)));
            return this;
        };

        this.destroy = function () {
            _.invoke(editor.getOption('stashDestroyables'), 'destroy');
            $(editor.getWrapperElement()).remove();
        };

        // CodeMirror.commands.highlight doesn't work with a StashCodemirror, so we give it the real deal.
        this._highlight = function (term) {
            // Can't use editor.execCommand() because for some stupid reason you can't pass arguments...
            CodeMirror.commands.highlight(editor, term);
        };

        /**
         *
         * @param {string} text - text to insert
         * @param {number} [at] - line index to place the text. This is the first line index that will occur _after_ the inserted text.
         * @param {boolean} [scrollToInserted] - whether to ensure the new content is scrolled into view
         * @private
         */
        this._insert = function (text, at, scrollToInserted) {
            // # A note about content insertion positions
            //
            // While the CodeMirror 'wholeLineUpdateBefore' option sounds like what you need, realise that it just
            // makes CodeMirror behave more consistently when adding lines that have a trailing newline.
            // When this is set to `true` and you insert content with a trailing newline on to a blank line, the
            // line at that position gets moved down, including its gutter markers and line widgets. This is
            // undesirable when injecting content at any place that is not the first line.
            //
            // Because of the way CodeMirror deals with the references to lines and how it injects content, it is
            // necessary for us to define some offsets so that content gets injected at the right place and we
            // retain our gutter markers and line widgets.
            //
            // When content is injected at:
            //
            // - First Line:
            //   - Insertion point: Line 0, Char 0
            //   - A newline will be appended to the injected content
            //   - This is the only time when wholeLineUpdateBefore should be `true`
            //
            // - Middle Line:
            //   - Insertion point: Line n - 1, Char (Line n - 1).length
            //   - A newline will be prepended to the injected content.
            //
            // - Last Line:
            //   - Insertion point: Line (lastLine), Char (lastLine).length
            //   - A newline will be prepended to the injected content.
            //

            var isPrepend = 0 === at;
            var lineIndexBefore = at - 1;

            // We don't want to insert content after the first line if we're injecting the pre-first-line hunk
            var oldWholeLineUpdateBefore = editor.getOption('wholeLineUpdateBefore');
            editor.setOption('wholeLineUpdateBefore', isPrepend);

            var doc = editor.getDoc();
            // We use replaceRange, with only the "from" object it is effectively an insert method.
            var where = {
                line: lineIndexBefore,
                // Find the character position of the line we'll be inserting on.
                // When we're inserting at the last line it will be the line that was clicked on, if it
                // was a line in the middle, it is the length of the previous line.
                ch: isPrepend ? 0 : editor.getLine(lineIndexBefore).length
            };
            doc.replaceRange(isPrepend ? text + '\n' : '\n' + text, where);

            // When the context is expanded up, scroll the window to the context that was revealed.
            if (scrollToInserted) {
                doc.setSelection({ line: lineIndexBefore, ch: 0 });
            }

            editor.setOption('wholeLineUpdateBefore', oldWholeLineUpdateBefore);
        };

        return this;
    }

    return StashCodeMirror;
});