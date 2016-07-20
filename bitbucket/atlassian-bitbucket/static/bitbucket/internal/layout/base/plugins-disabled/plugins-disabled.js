'use strict';

require(['aui', 'jquery', 'bitbucket/util/server'], function (AJS, $, server) {
    'use strict';

    $(document).ready(function () {
        $(".plugins-disabled-banner .close-banner").click(function () {
            var url = AJS.contextPath() + '/mvc/maintenance/upgrade-notification';
            server.rest({
                url: url,
                type: 'DELETE'
            });
            $(this).closest('.plugins-disabled-banner').remove();
        });
    });
});