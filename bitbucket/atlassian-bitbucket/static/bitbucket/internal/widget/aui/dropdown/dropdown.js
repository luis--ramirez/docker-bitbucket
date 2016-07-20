'use strict';

define('bitbucket/internal/widget/aui/dropdown', ['aui', 'jquery', 'exports'], function (AJS, $, exports) {

    'use strict';

    exports.onReady = function () {
        var options = {};

        options.dropDown = ".aui-dropdown-left:not(.aui-dropdown-ajax)";
        options.alignment = "left";
        AJS.dropDown.Standard($.extend({}, options));

        options.dropDown = ".aui-dropdown-right:not(.aui-dropdown-ajax)";
        options.alignment = "right";
        AJS.dropDown.Standard($.extend({}, options));
    };
});