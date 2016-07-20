'use strict';

define('bitbucket/internal/layout/admin', ['jquery', 'exports'], function ($, exports) {

    var initDropdowns = function initDropdowns() {
        var $menuItems = $(".tabs-menu .menu-item");

        $menuItems.children(".aui-dd-trigger").mouseenter(function () {
            var $activeMenu = $menuItems.filter(".active");
            var $this = $(this);
            if ($activeMenu.length > 0 && $activeMenu[0] !== $this.parent()[0]) {
                $this.click();
            }
        });
    };

    exports.onReady = function () {
        initDropdowns();
    };
});