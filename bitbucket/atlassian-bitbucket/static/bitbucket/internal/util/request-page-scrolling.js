'use strict';

define('bitbucket/internal/util/request-page-scrolling', ['bitbucket/internal/layout/page-scrolling-manager'], function (pageScrollingManager) {
    return function () {
        return pageScrollingManager._requestScrollControl();
    };
});