'use strict';

define('bitbucket/internal/widget/settings-page-analytics', ['jquery', 'bitbucket/util/state', 'bitbucket/internal/util/events', 'exports'], function ($, pageState, events, exports) {

    function init() {
        var $settingsNav = $('.content-body > .aui-page-panel-inner > .aui-page-panel-nav');
        $settingsNav.on('click', 'li > a[data-web-item-key]', function (e) {

            var eventSpace = pageState.getRepository() != null ? 'repository' : 'project';
            events.trigger('bitbucket.internal.ui.' + eventSpace + '.settings.sidebar.clicked', null, {
                webItemKey: $(e.target).attr('data-web-item-key')
            });
        });
    }

    exports.init = init;
});