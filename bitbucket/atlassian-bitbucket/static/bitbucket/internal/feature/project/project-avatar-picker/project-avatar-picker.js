'use strict';

define('bitbucket/internal/feature/project/project-avatar-picker', ['aui', 'jquery', 'bitbucket/internal/widget/avatar-picker-dialog'], function (AJS, $, AvatarPickerDialog) {
    function ProjectAvatarPicker(container, options) {
        this.init.apply(this, arguments);
    }

    ProjectAvatarPicker.prototype.init = function (container, options) {
        this.$container = $(container);

        var $previewImage = this.$container.find('.project-avatar-preview .aui-avatar-project img');
        var $input = this.$container.find('.project-avatar-upload input[name=avatar]');
        var $changeAvatarButton = this.$container.find('.project-avatar-upload button');

        if (!$previewImage.attr('src')) {
            $('<div class="project-avatar-default-preview"></div>').insertAfter($previewImage);
        }

        if (AvatarPickerDialog.isSupported()) {
            var projectAvatarPicker = new AvatarPickerDialog({
                dialogTitle: AJS.I18n.getText('bitbucket.web.project.avatar.picker.title'),
                maskShape: AvatarPickerDialog.maskShapes.CIRCLE,
                trigger: $changeAvatarButton,
                onCrop: function onCrop(croppedDataURI) {
                    $previewImage.attr('src', croppedDataURI);
                    $input.val(croppedDataURI);
                },
                xsrfToken: options && options.xsrfToken ? options.xsrfToken : null
            });
        } else {
            $changeAvatarButton.remove();
        }
    };

    return ProjectAvatarPicker;
});