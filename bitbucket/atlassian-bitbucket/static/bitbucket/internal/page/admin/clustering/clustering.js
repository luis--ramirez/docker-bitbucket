'use strict';

define('bitbucket/internal/page/admin/clustering', ['jquery', 'exports'], function ($, exports) {
    exports.onReady = function (currentNodeIconSelector) {
        var $currentNodeIcon = $(currentNodeIconSelector);
        //the icon is full of whitespace. this brings the tooltip anchor in by 1/4 the height of the icon
        var offset = $currentNodeIcon.height() / -4;
        $currentNodeIcon.tooltip({ gravity: 's', offset: offset });
    };
});