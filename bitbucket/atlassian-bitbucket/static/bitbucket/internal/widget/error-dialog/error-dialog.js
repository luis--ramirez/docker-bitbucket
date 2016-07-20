'use strict';

define('bitbucket/internal/widget/error-dialog', ['aui', 'jquery'], function (AJS, $) {

    'use strict';

    function ErrorDialog(dialogOptions) {
        this._okCallbacks = $.Callbacks();
        this._closeCallbacks = $.Callbacks();
        this.reinit(dialogOptions);

        var self = this;
        $(document).bind('hideLayer', function (type, hash) {
            // HACK: hide.dialog doesn't fire when it should.  using this instead.
            // Will fire when ANY dialog is hidden, so check that the hiding dialog is this one.
            if (self._dialog && self._dialog.popup === hash) {
                self.hide();
            }
        });
    }

    ErrorDialog.prototype.reinit = function (dialogOptions) {
        this.dialogOptions = $.extend({}, ErrorDialog.dialogDefaults, dialogOptions);

        return this;
    };

    ErrorDialog.prototype._createDialog = function () {
        if (!this._dialog) {

            var self = this;
            var dialogOptions = this.dialogOptions;
            var dialog = this._dialog = new AJS.Dialog({
                width: 433,
                height: 230,
                id: dialogOptions.id,
                closeOnOutsideClick: dialogOptions.closeOnOutsideClick,
                keypressListener: function keypressListener(e) {
                    //override the ESC handling so we get a callback
                    if (e.keyCode === AJS.keyCode.ESCAPE) {
                        self.hide();
                    }
                }
            });
            var callbacks = this._okCallbacks;

            dialog.popup.element.addClass('error-dialog');

            dialog.addHeader(dialogOptions.titleText, dialogOptions.titleClass);
            dialog.addPanel("", dialogOptions.panelContent, dialogOptions.panelClass);
            dialog.addButton(dialogOptions.okButtonText, function (dialog) {

                var e = $.Event('ok');
                callbacks.fireWith(self, [e]);

                if (!e.isDefaultPrevented()) {
                    self.remove();
                }
            }, 'button ' + (dialogOptions.okButtonClass || ''));

            if (dialogOptions.showCloseButton) {
                dialog.addCancel(dialogOptions.closeButtonText, function (dialog) {
                    self.remove();
                });
            }
        }
    };

    ErrorDialog.prototype.show = function () {
        this._createDialog();
        this._dialog.show();

        return this;
    };

    ErrorDialog.prototype.isShowing = function () {
        return this._dialog && this._dialog.popup.element.is(":visible");
    };

    ErrorDialog.prototype.hide = function () {
        if (this.isShowing()) {
            this._dialog.hide();
            this._closeCallbacks.fireWith(this, []);
        }

        return this;
    };

    ErrorDialog.prototype.remove = function () {
        if (this._dialog) {
            this.hide();
            this._dialog.remove();
            this._dialog = null;
        }

        return this;
    };

    ErrorDialog.prototype.addOkListener = function (funcOrFuncs) {
        this._okCallbacks.add(funcOrFuncs);

        return this;
    };

    ErrorDialog.prototype.addHideListener = function (funcOrFuncs) {
        this._closeCallbacks.add(funcOrFuncs);

        return this;
    };

    ErrorDialog.prototype.getOkButton = function () {
        this._createDialog();
        return this._dialog.popup.element.find('.' + this.dialogOptions.okButtonClass);
    };

    ErrorDialog.dialogDefaults = {
        id: undefined,
        titleText: AJS.I18n.getText('bitbucket.web.dialog.unexpected.error.title'),
        titleClass: 'error-header',
        panelContent: '<p>' + AJS.I18n.getText('bitbucket.web.dialog.unknown.error.detail') + '</p>',
        panelClass: 'panel-body',
        okButtonText: AJS.I18n.getText('bitbucket.web.dialog.button.ok'),
        okButtonClass: 'ok-button',
        showCloseButton: false,
        closeButtonText: AJS.I18n.getText('bitbucket.web.dialog.button.close'),
        closeOnOutsideClick: false
    };

    return ErrorDialog;
});