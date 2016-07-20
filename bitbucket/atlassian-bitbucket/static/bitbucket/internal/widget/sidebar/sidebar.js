'use strict';

define('bitbucket/internal/widget/sidebar', ['aui', 'jquery', 'bitbucket/internal/util/client-storage', 'bitbucket/internal/util/events', 'exports'], function (AJS, $, clientStorage, events, exports) {

    'use strict';

    var IS_EXPANDED_KEY = 'sidebar_expanded';

    var sidebarSelector = '.aui-sidebar';
    var sidebar;

    function initSidebar() {
        sidebar = AJS.sidebar(sidebarSelector);

        sidebar.on('collapse-end', function (e) {
            if (!e.isResponsive) {
                clientStorage.setItem(IS_EXPANDED_KEY, false);
            }
            events.trigger('bitbucket.internal.feature.sidebar.collapseEnd');
        });

        // On expand-start check if the sidebar's state has been manually set to collapsed,
        // if it has then don't invoke the responsive sidebar behaviour
        sidebar.on('expand-start', function (e) {
            if (e.isResponsive && clientStorage.getItem(IS_EXPANDED_KEY) === false) {
                e.preventDefault();
            }
        });

        sidebar.on('expand-end', function (e) {
            if (!e.isResponsive) {
                clientStorage.setItem(IS_EXPANDED_KEY, true);
            }
            events.trigger('bitbucket.internal.feature.sidebar.expandEnd');
        });

        initSidebarUIEvents();
    }

    function preloadSidebar() {
        var state = isCollapsed();
        $(document.body).toggleClass("aui-sidebar-collapsed", state);
        $(sidebarSelector).attr("aria-expanded", !state);
    }

    /**
     * Is the sidebar currently collapsed
     *
     * @returns {boolean}
     */
    function isCollapsed() {
        return !clientStorage.getItem(IS_EXPANDED_KEY);
    }

    /**
     * Initialise the sidebar UI events that will trigger bitbucket.internal.ui.* events
     */
    function initSidebarUIEvents() {
        // Click on any items in the actions menu
        sidebar.$el.find('.aui-sidebar-group-actions ul').on('click', '> li > a[data-web-item-key]', function () {
            events.trigger('bitbucket.internal.ui.sidebar.actions-menu.item.clicked', null, {
                isCollapsed: isCollapsed(),
                webItemId: $(this).attr('data-web-item-key')
            });
        });

        // Click on any navigation items
        sidebar.$el.find('.sidebar-navigation ul').on('click', '> li > a[data-web-item-key]', function () {
            var $el = $(this);
            var isCollapsed = !clientStorage.getItem(IS_EXPANDED_KEY);
            var listLevel = $el.parentsUntil('.aui-sidebar-group').filter('ul').length;

            events.trigger('bitbucket.internal.ui.sidebar.item.clicked', null, {
                webItemId: $el.attr('data-web-item-key'),
                isCollapsed: isCollapsed,
                level: listLevel
            });
        });

        // Click on the settings button
        sidebar.$el.find('.sidebar-settings-group').on('click', 'a', function () {
            events.trigger('bitbucket.internal.ui.sidebar.settings.clicked', null, {
                webItemId: $(this).attr('data-web-item-key')
            });
        });

        // Monitor the toggling of expand/collapse.
        // These are the same event handlers and selectors/filters used in aui-sidebar
        sidebar.$el.on('click', '.aui-sidebar-toggle', function (e) {
            triggerCollapseChange('button');
        });

        sidebar.$el.on('click', '.aui-sidebar-body', function (e) {
            if ($(e.target).is('.aui-sidebar-body')) {
                triggerCollapseChange('sidebar');
            }
        });

        AJS.whenIType('[').execute(function () {
            triggerCollapseChange('keyboard-shortcut');
        });

        sidebar.on('expand-end collapse-end', function (e) {
            if (e.isResponsive) {
                triggerCollapseChange('resize');
            }
        });
    }

    /**
     * Trigger a collapse state changed ui event
     *
     * @param {string} source
     */
    function triggerCollapseChange(source) {
        events.trigger('bitbucket.internal.ui.sidebar.collapse.change', null, {
            source: source,
            isCollapsed: isCollapsed(),
            windowWidth: window.innerWidth
        });
    }

    exports.preload = preloadSidebar;
    exports.onReady = initSidebar;
});