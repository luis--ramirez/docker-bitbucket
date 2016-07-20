'use strict';

define('bitbucket/internal/widget/exception', ['aui', 'jquery', 'exports'], function (AJS, $, exports) {

    'use strict';

    exports.onReady = function () {

        $(".formatted-throwable-toggle").click(function () {
            var $this = $(this);
            var $details = $this.next(".formatted-throwable");
            if ($this.data("message-visible")) {
                $details.hide('slow', function () {
                    $this.text(AJS.I18n.getText('bitbucket.web.message.throwable.twixie.show'));
                });
                $this.data("message-visible", false);
            } else {
                $details.show('slow', function () {
                    $this.text(AJS.I18n.getText('bitbucket.web.message.throwable.twixie.hide'));
                });
                $this.data("message-visible", true);
            }
        });
    };
});