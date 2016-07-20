'use strict';

define('bitbucket/internal/feature/file-content/text-view/attach-simple-scroll-behavior', ['jquery'], function ($) {
    'use strict';

    /**
     * Requests full window scrolling for a single-editor text-view that simply receives the forwarded scrolls directly
     * on the editor.
     *
     * @param {TextView} view - the text-view to request full-window scrolling for
     * @param {StashCodeMirror} editor - the editor to forward scrolls to
     * @param {jQuery} #editorContainer - the DOM element for the editor instance.
     * @returns {Promise} resolving to whether scroll control was obtained
     */

    return function attachSimpleScrollBehavior(view, editor, $editorContainer) {
        if (!editor) {
            return $.Deferred().reject(); // destroyed before we started
        }

        return view._requestWindowScrolls({
            scrollSizing: function scrollSizing() {
                return editor.getScrollInfo();
            },
            scroll: function scroll(x, y) {
                editor.scrollTo(null, y);
            },
            resize: function resize(width, height) {
                // Use element data as a cache to avoid reflows.
                var cachedHeight = $editorContainer.data('height');
                var cachedWidth = $editorContainer.data('width');
                if (height !== cachedHeight) {
                    $editorContainer.height(height);
                    $editorContainer.data('height', height);
                }
                if (width !== cachedWidth) {
                    // noop - width is handled by CSS. We still need to call .refresh() though
                    $editorContainer.data('width', width);
                }
                if (height !== cachedHeight || width !== cachedWidth) {
                    view.refresh();
                }
            },
            onSizeChange: function onSizeChange(fn) {
                view.on('resize', fn);
            }
        });
    };
});