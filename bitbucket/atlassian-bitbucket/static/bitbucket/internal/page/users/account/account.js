'use strict';

define('bitbucket/internal/page/users/account', ['jquery', 'bitbucket/internal/widget/user-avatar-form', 'exports'], function ($, UserAvatarForm, exports) {
    'use strict';

    function cleanErrors() {
        $('.user-avatar-error').remove();
    }

    function notifyError(message) {
        cleanErrors();
        $('.aui-page-panel-content > .aui-page-header').after(aui.message.error({
            content: message,
            extraClasses: 'user-avatar-error'
        }));
    }

    exports.onReady = function (user, avatarContainerSelector) {
        var xsrfToken = {
            name: 'atl_token',
            value: $('.account-settings input[name=atl_token]').val()
        };
        var avatarForm = new UserAvatarForm($(avatarContainerSelector), user, xsrfToken);
        avatarForm.on('avatarChanged', cleanErrors);
        avatarForm.on('avatarUploadError', notifyError);
        avatarForm.on('avatarDeleteError', notifyError);
    };
});