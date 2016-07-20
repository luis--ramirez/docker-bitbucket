'use strict';

define('bitbucket/internal/feature/file-content/text-view/text-view-scrolling', ['jquery', 'bitbucket/internal/feature/file-content/text-view/request-window-scrolls', 'bitbucket/internal/util/mixin'], function ($, requestWindowScrolls, mix) {
    'use strict';

    var textViewScrolling = {
        /**
         * Scroll a line handle in to the focus area
         * @param {StashLineHandle} handle
         */
        scrollHandleIntoFocus: function scrollHandleIntoFocus(handle) {
            var editor = this._editorForHandle(handle);
            var editorScrollInfo = editor.getScrollInfo();
            var canScroll = editorScrollInfo.height > editorScrollInfo.clientHeight;
            // the editor-relative scroll position to scroll to.
            var scrollY = canScroll ? editor.heightAtLine(handle._handle.lineNo(), 'local') : 0;
            this._scrollToFocusedOffset(scrollY, editorScrollInfo, editor);
        },

        /**
         * Scroll the editor to a particular handle. Useful to scroll a line in to view when adding line widgets.
         *
         * We actually scroll the line below the targeted line in to view to ensure that the targeted
         * line is fully visible, including any widgets that may be part of the line.
         *
         * @param {StashLineHandle} handle - as returned from {@link getLineHandle}
         */
        scrollHandleIntoView: function scrollHandleIntoView(handle) {
            var editor = this._editorForHandle(handle);

            // We check if the handle is the last line of the editor and ensure the entire line is
            // visible by requesting the scroll position for the bottom of the last line.
            if (editor.lastLine() === handle._handle.lineNo()) {
                editor.scrollTo(null, editor.heightAtLine(editor.lastLine() + 1));
                return;
            }

            editor.scrollIntoView(handle._handle.lineNo() + 1);
        },

        /**
         * Scroll into the file comments
         *
         * @param {number} offset - The offset into the file comments to scroll
         * @param {number} [minimumPxBelow] - The minimum pixels to show below offset.
         */
        scrollToFileComments: function scrollToFileComments(offset, minimumPxBelow) {
            var editor = this._editors[0];
            var editorScrollInfo = editor.getScrollInfo();

            var pageOffsetTop = $('#page').offset().top;
            if (minimumPxBelow != null) {
                if (offset > pageOffsetTop && offset + minimumPxBelow < pageOffsetTop + editorScrollInfo.clientHeight) {
                    // file comment is already visible so don't scroll anywhere
                    return;
                }
            }

            this._scrollToFocusedOffset(offset - this._editorInnerOffset(), editorScrollInfo, editor);
        },

        /**
         * Scrolls the window back to the top.
         */
        scrollToTop: function scrollToTop() {
            this._scrollToSourcePosition(null, 0);
        },

        /**
         * Ensures the offset into a line widget is visible
         *
         * Scrolls the diff view until `offset` pixels into the line widget are visible,
         * If `minimumPxBelow` is specified it will ensure those pixels are also visible.
         * @param {StashLineHandle} handle - The line handle to scroll to.
         * @param {number} offset - The offset past the line to scroll to.
         * @param {number} [minimumPxBelow] - the minimum number of pixels to show below offset.
         */
        scrollToWidgetOffset: function scrollToWidgetOffset(handle, offset, minimumPxBelow) {
            var editor = this._editorForHandle(handle);
            var editorScrollInfo = editor.getScrollInfo();
            var canScroll = editorScrollInfo.height > editorScrollInfo.clientHeight;
            var scrollY; // the editor-relative scroll position to scroll to.

            if (canScroll) {
                var linePos = editor.heightAtLine(handle._handle.lineNo(), 'local');
                scrollY = Math.max(0, linePos + offset);
                if (minimumPxBelow != null) {
                    var diff = scrollY - editorScrollInfo.top;
                    if (diff >= 0 && diff < editorScrollInfo.clientHeight - minimumPxBelow) {
                        // don't scroll because the widget is already fully in view.
                        return;
                    }
                }
            } else {
                scrollY = 0;
            }

            this._scrollToFocusedOffset(scrollY, editorScrollInfo, editor);
        },

        _requestWindowScrolls: function _requestWindowScrolls(editorScrolling) {
            var self = this;
            return requestWindowScrolls(this, editorScrolling).done(function (scrollControl) {
                self._scrollToSourcePosition = function (x, y) {
                    // translate from editor coords into layout-forwardee coords.
                    scrollControl.scroll(x, y != null ? Math.max(0, y + self._editorInnerOffset()) : null);
                };
            }).fail(function (err) {
                self._scrollToSourcePosition = function (x, y) {
                    // This is not implemented when you don't have a page scroll (currently only the overview page).
                    throw new Error('Not implemented');
                };
            });
        },

        /**
         *
         * @param {number} offset - Offset to focus
         * @param {Object} editorScrollInfo - Scroll info to use to figure out focus point
         * @param {CodeMirror} editor - Editor that will be scrolled.
         * @private
         */
        _scrollToFocusedOffset: function _scrollToFocusedOffset(offset, editorScrollInfo, editor) {
            // Force the editor to blur to avoid scrolling issues.
            // If the editor has focus and the point where it has focus (i.e. the line that was clicked)
            // has moved beyond the top/bottom of the screen CodeMirror will try to keep it in focus on keypresses.
            // We only have to do this if we're going to actually scroll within the diff (hence the diffCanScroll check)
            editor.getInputField().blur();

            var focusOffset = editorScrollInfo.clientHeight * this._options.focusPoint;
            this._scrollToSourcePosition(null, offset - focusOffset);
        },

        _scrollToSourcePosition: function _scrollToSourcePosition() {
            throw new Error("_scrollToSourcePosition can't be called until _requestWindowScrolls returns.");
        }
    };

    return {
        mixInto: mix(textViewScrolling).into
    };
});