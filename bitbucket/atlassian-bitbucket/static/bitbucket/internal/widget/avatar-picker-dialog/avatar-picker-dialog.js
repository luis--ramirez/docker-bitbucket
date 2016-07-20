'use strict';

define('bitbucket/internal/widget/avatar-picker-dialog', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/util/text', 'bitbucket/internal/widget/image-upload-and-crop'], function (AJS, $, _, nav, TextUtil, ImageUploadAndCrop) {

    'use strict';

    function AvatarPickerDialog(opts) {
        if (!AvatarPickerDialog.isSupported()) {
            throw new Error("This browser doesn't support AvatarPickerDialog.");
        }
        return this.init(opts);
    }

    AvatarPickerDialog.isSupported = function () {
        return ImageUploadAndCrop.isSupported();
    };

    AvatarPickerDialog.maskShapes = ImageUploadAndCrop.maskShapes;

    AvatarPickerDialog.prototype.defaults = {
        dialogTitle: AJS.I18n.getText('bitbucket.web.avatar.picker.title'),
        dialogId: 'avatar-picker-dialog',
        dialogDoneButtonText: AJS.I18n.getText('bitbucket.web.button.done'),
        imageSrc: null,
        maskShape: null,
        fallbackDescription: AJS.I18n.getText('bitbucket.web.avatar.picker.instructions.fallback'),
        onCrop: $.noop,
        trigger: null
    };

    AvatarPickerDialog.prototype.init = function (opts) {
        _.bindAll(this, 'initDialog', '_enableDoneButton', '_disableDoneButton', '_toggleDoneButtonEnabled', 'chooseAvatar', 'hide', 'show');
        this.options = $.extend(true, {}, this.defaults, opts);
        this.initDialog();
        this._toggleDoneButtonEnabled(false);
        this.imageUploadAndCrop = new ImageUploadAndCrop(this.dialog.$el.find('.image-upload-and-crop-container'), {
            HiDPIMultiplier: 1, //The mask is already 2x the max size we need
            onCrop: this.options.onCrop,
            onImageUpload: this._enableDoneButton,
            onImageUploadError: this._disableDoneButton,
            onImageClear: this._disableDoneButton,
            fallbackUploadOptions: {
                uploadURL: nav.tmp().avatars().build(),
                uploadFieldName: 'avatar',
                responseHandler: function responseHandler(iframeBody, uploadPromise) {
                    var $iframeBody = $(iframeBody);
                    var $jsonResponseField = $iframeBody.find('#json-response');

                    if ($jsonResponseField.length) {
                        var jsonResponse;

                        try {
                            jsonResponse = JSON.parse($jsonResponseField.html());
                        } catch (e) {
                            uploadPromise.reject();
                        }

                        if (jsonResponse && jsonResponse.url) {
                            uploadPromise.resolve(jsonResponse.url);
                        } else {
                            uploadPromise.reject();
                        }
                    } else {
                        // See if we can parse a meaningful error out of the response.
                        // Firstly look for the main text on the 500 error page, then strip out nested exceptions which tend to make for unfriendly messages.
                        // If it can't find the h2, it will just reject with a blank string
                        var error = $iframeBody.find('.error-image + h2').text();

                        error = error.replace(/; nested exception.*$/, '.') //remove nested exceptions
                        .replace(/(\d+) bytes/, function (match, size) {
                            return TextUtil.formatSizeInBytes(size);
                        }); //convert any values in bytes to the most appropriate unit

                        uploadPromise.reject(error);
                    }
                },
                cancelTrigger: this.$doneButton.add(this.$cancelButton),
                xsrfToken: this.options.xsrfToken
            }
        });

        if (this.options.trigger) {
            this.$trigger = $(this.options.trigger);
            this.$trigger.click(_.bind(function (e) {
                e.preventDefault();
                this.show();
            }, this));
        }
        return this;
    };

    AvatarPickerDialog.prototype.initDialog = function () {
        this.dialog = AJS.dialog2(bitbucket.internal.widget.avatarPickerDialog({
            id: this.options.dialogId,
            title: this.options.dialogTitle,
            doneButtonText: this.options.dialogDoneButtonText,
            imageSrc: this.options.imageSrc,
            maskShape: this.options.maskShape,
            fallbackDescription: this.options.fallbackDescription,
            enableWebcam: this.options.enableWebcam
        }));

        this.dialog.$el.appendTo('body'); // Needs to be in page
        this.$doneButton = this.dialog.$el.find('.avatar-picker-save').on('click', this.chooseAvatar);
        this.$cancelButton = this.dialog.$el.find('.avatar-picker-cancel').on('click', this.hide);
    };

    AvatarPickerDialog.prototype._enableDoneButton = function () {
        this._toggleDoneButtonEnabled(true);
    };

    AvatarPickerDialog.prototype._disableDoneButton = function () {
        this._toggleDoneButtonEnabled(false);
    };

    AvatarPickerDialog.prototype._toggleDoneButtonEnabled = function (opt_enable) {
        if (opt_enable == null) {
            opt_enable = this.$doneButton.attr('disabled') != null;
        }

        if (opt_enable) {
            this.$doneButton.removeAttr('disabled');
        } else {
            this.$doneButton.attr('disabled', 'disabled');
        }
    };

    AvatarPickerDialog.prototype.chooseAvatar = function () {
        this.imageUploadAndCrop.crop();
        this.hide();
    };

    AvatarPickerDialog.prototype.hide = function () {
        this.dialog.hide();
        this.imageUploadAndCrop.resetState(); //Only resets errors and the file upload element, imageExplorer image is persisted.
    };

    AvatarPickerDialog.prototype.show = function () {
        this.dialog.show();
    };

    return AvatarPickerDialog;
});