'use strict';

define('bitbucket/internal/page/project-create', ['jquery', 'bitbucket/util/events', 'bitbucket/internal/feature/project/project-avatar-picker', 'exports'], function ($, events, ProjectAvatarPicker, exports) {
    'use strict';

    exports.onReady = function () {
        $("#key").generateFrom($("#name"), {
            maxNameLength: 64,
            maxKeyLength: 64
        });

        var xsrfToken = {
            name: 'atl_token',
            value: $('.project-create input[name=atl_token]').val()
        };

        new ProjectAvatarPicker(".avatar-picker-field", {
            xsrfToken: xsrfToken
        });

        $('#avatar-picker-button').on('click', events.trigger.bind(null, 'bitbucket.internal.ui.project-create.change-avatar.clicked'));
        $('form.project-settings').on('submit', function (e) {
            var descriptionLength = $('#description').val().length;
            var avatarChanged = $('#avatar').val().length > 0;
            events.trigger('bitbucket.internal.ui.project-create.submitted', null, {
                descriptionLength: descriptionLength,
                avatarChanged: avatarChanged
            });
        });
    };
});