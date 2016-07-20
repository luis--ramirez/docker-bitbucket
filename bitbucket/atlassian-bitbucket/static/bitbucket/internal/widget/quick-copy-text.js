'use strict';

define('bitbucket/internal/widget/quick-copy-text', ['jquery', 'exports'], function ($, exports) {

    'use strict';

    var first = true;
    exports.onReady = function () {
        if (first) {
            first = false;

            $(document).on('click', '.quick-copy-text', function (e) {
                this.focus();
                this.select();
            });
        }
    };
});