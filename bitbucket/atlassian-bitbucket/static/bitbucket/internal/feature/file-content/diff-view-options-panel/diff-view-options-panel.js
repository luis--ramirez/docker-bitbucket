'use strict';

define('bitbucket/internal/feature/file-content/diff-view-options-panel', ['aui', 'chaperone', 'jquery', 'lodash', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/util/shortcuts'], function (AJS, Chaperone, $, _, events, fn, shortcuts) {
    'use strict';

    var ddTrigger = '#diff-options-dropdown-trigger';

    Chaperone.registerFeature('side-by-side-diff-discovery', [{
        id: 'side-by-side-diff-discovery',
        selector: '.diff-view-options',
        title: AJS.I18n.getText('bitbucket.web.diff.sidebyside.feature.discovery.title'),
        content: AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.diff.sidebyside.feature.discovery.content')),
        width: 330,
        alignment: 'bottom right',
        once: true
    }]);

    return function ($document, diffViewOptions) {

        var ddList = '#diff-options-dropdown';
        var ddCoreItems = '#diff-options-core .aui-dropdown2-checkbox, #diff-options-core .aui-dropdown2-radio';
        var destroyables = [];

        // Update the diffOptions when an item is checked/unchecked
        function itemCheckStateChanged(e) {
            closeDiffViewOptions();
            var $el = $(this);
            var key = $el.attr('data-key');
            var val = $el.attr('data-value');
            var checked = e.type === 'aui-dropdown2-item-check';

            if (!checked && $el.hasClass('aui-dropdown2-radio')) {
                return;
            }

            diffViewOptions.set(key, val || checked);
        }

        // Check/Uncheck options visually when the dropdown is shown.
        function optionsDropdownShown(e) {
            // If an item has a matching diff option set it to the value.
            // default to false
            $(this).find(ddCoreItems).each(function () {
                var $el = $(this);
                var key = $el.attr('data-key');
                var val = $el.attr('data-value');
                var storedValue = diffViewOptions.get(key);
                var isChecked = storedValue && (storedValue === val || storedValue === true);

                $el.toggleClass('aui-dropdown2-checked checked', isChecked).attr('aria-checked', isChecked);
            });

            destroyables.push(events.chain().on('window.scroll.throttled', closeDiffViewOptions).destroy);
        }

        function optionsDropdownHidden(e) {
            events.off('window.scroll.throttled', closeDiffViewOptions);
        }

        /**
         * Close the Diff View Options dropdown
         *
         * When the page is scrolled or when the options have changed, we want to
         * close the menu to avoid having it open when the user gets back to the page.
         *
         * In this particular scenario, the toolbar that contains the dropdown
         * can become position:fixed. This detaches the dropdown from the button location
         * and causes it to float on the page by itself until the toolbar is no longer fixed.
         *
         * @param {Event} e
         */
        function closeDiffViewOptions(e) {
            if ($document.find(ddList).attr('aria-hidden') === 'false') {
                $document.find(ddTrigger).trigger('aui-button-invoke');
            }
        }

        /**
         * Toggle a diff view option.
         *
         * @param {string} optionKey
         */
        function toggleDiffViewOption(optionKey) {
            closeDiffViewOptions();
            diffViewOptions.set(optionKey, !diffViewOptions.get(optionKey));
        }

        /**
         * Toggle the side-by-side-diff view. This would be triggered from a keyboard shortcut
         */
        function changeDiffType() {
            closeDiffViewOptions();
            diffViewOptions.set('diffType', diffViewOptions.get('diffType') === 'unified' ? 'side-by-side' : 'unified');
        }

        destroyables.push(shortcuts.bind('requestIgnoreWhitespace', toggleDiffViewOption.bind(null, 'ignoreWhitespace')));
        destroyables.push(shortcuts.bind('requestHideComments', toggleDiffViewOption.bind(null, 'hideComments')));
        destroyables.push(shortcuts.bind('requestHideEdiff', toggleDiffViewOption.bind(null, 'hideEdiff')));
        destroyables.push(shortcuts.bind('changeDiffTypeRequested', changeDiffType));
        destroyables.push(events.chainWith($document).on('aui-dropdown2-item-check aui-dropdown2-item-uncheck', ddCoreItems, itemCheckStateChanged).on('aui-dropdown2-show', ddList, optionsDropdownShown).on('aui-dropdown2-hide', ddList, optionsDropdownHidden).destroy);

        return {
            destroy: _.partial(fn.applyAll, destroyables)
        };
    };
});