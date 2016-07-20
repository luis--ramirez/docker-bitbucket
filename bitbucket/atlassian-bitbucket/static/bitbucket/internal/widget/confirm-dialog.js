'use strict';

define('bitbucket/internal/widget/confirm-dialog', ['aui', 'jquery', 'lodash', 'bitbucket/internal/util/ajax', 'bitbucket/internal/widget/submit-spinner'], function (AJS, $, _, ajax, SubmitSpinner) {

    'use strict';

    function ConfirmDialog(dialogOptions, ajaxOptions) {
        this.dialogOptions = $.extend({}, ConfirmDialog.dialogDefaults, dialogOptions);
        this.ajaxOptions = ajaxOptions || {};
        this._selectors = [];
        this._okCallbacks = $.Callbacks();
        this._cancelCallback = $.Callbacks();
        this._detachers = $.Callbacks();
        this._attached = false;
    }

    ConfirmDialog.prototype.getConfirmButton = function () {
        return $("#" + this.dialogOptions.id + " ." + this.dialogOptions.confirmButtonClass);
    };

    ConfirmDialog.prototype.getButtons = function () {
        var $buttons = this.getConfirmButton();
        var dialogId = this.dialogOptions.id;
        _.each(this._selectors, function (selector) {
            $buttons = $buttons.add($("#" + dialogId + " " + selector));
        });
        return $buttons;
    };

    ConfirmDialog.prototype.setButtonsDisabled = function (disabled) {
        this.getButtons().each(function () {
            var $button = $(this);
            $button.prop("disabled", disabled).toggleClass("disabled", disabled);
            if (disabled) {
                $button.attr("aria-disabled", "true");
            } else {
                $button.removeAttr("aria-disabled");
            }
        });
    };

    ConfirmDialog.prototype.destroy = function () {
        this._detachers.fire();
        this._detachers = null;
    };

    ConfirmDialog.prototype.attachTo = function (anchorSelector, onShow, container) {
        var self = this;
        var dialogOptions = this.dialogOptions;
        var ajaxOptions = this.ajaxOptions;
        var okCallbacks = this._okCallbacks;
        var cancelCallbacks = this._cancelCallback;

        container = container || document;
        var $container = $(container);

        // Fix this: this doesn't take into account a container
        this._selectors.push(anchorSelector);

        var hideLayerHandler = function hideLayerHandler() {
            // HACK: hide.dialog doesn't fire when it should.  using this instead.
            // Will fire when ANY dialog is hidden, but shouldn't cause any bad side effects.
            self.setButtonsDisabled(false);
        };

        $container.on('hideLayer', hideLayerHandler);

        var clickHandler = function clickHandler(e) {
            e.preventDefault();
            var $trigger = $(this);
            if (!$trigger.is(":disabled")) {

                var remove = function remove(dialog) {
                    self.setButtonsDisabled(false);
                    dialog.remove();
                };
                var dialog = new AJS.Dialog({
                    width: dialogOptions.width,
                    height: dialogOptions.height,
                    id: dialogOptions.id,
                    focusSelector: dialogOptions.focusSelector,
                    closeOnOutsideClick: false,
                    keypressListener: function keypressListener(e) {
                        e.stopImmediatePropagation(); // successive call to AUIDialog.show() or AUIDialog.updateHeight()
                        // rebinds the keypressListener at every call, even if it's already bound;
                        // thus we need to have jQuery stops the immediate propagation of the
                        // event to prevent successive invocations, since we trigger
                        // non-repeatable operations: a REST call to the server on ENTER
                        // and the removal of the dialog from the DOM on ESCAPE.
                        if (e.keyCode === AJS.keyCode.ENTER) {
                            e.preventDefault();
                            self.getConfirmButton().click();
                        } else if (e.keyCode === AJS.keyCode.ESCAPE) {
                            e.preventDefault();
                            remove(dialog);
                        }
                    }
                });

                dialog.addHeader(dialogOptions.titleText, dialogOptions.titleClass);
                dialog.addPanel("", dialogOptions.panelContent, dialogOptions.panelClass);
                dialog.addButton(dialogOptions.submitText, function (dialog) {
                    self.setButtonsDisabled(true);
                    var promise = null;
                    var spinner = new SubmitSpinner(self.getConfirmButton(), 'before');
                    if (self.dialogOptions.submitToHref) {
                        spinner.show();

                        if ($trigger[0].tagName === 'A') {
                            promise = ajax.rest($.extend({ url: $trigger.attr('href') }, ajaxOptions)).always(function () {
                                spinner.hide();
                                remove(dialog);
                            });
                        } else {
                            $trigger.closest('form')[0].submit();
                        }
                    }
                    okCallbacks.fire(promise, $trigger, function () {
                        remove(dialog);
                    }, dialog, spinner);
                }, 'button ' + (dialogOptions.confirmButtonClass || ''));
                dialog.addCancel(AJS.I18n.getText('bitbucket.web.button.cancel'), function (dialog) {
                    remove(dialog);
                    cancelCallbacks.fire($trigger);
                });

                if (onShow) {
                    onShow(this, dialog, self); // anchor, AUI Dialog instance, ConfirmDialog instance
                }

                dialog.show();
                self._attached = true;
            }
        };

        $container.on("click", anchorSelector, clickHandler);

        this._detachers.add(function () {
            $container.off('hideLayer', hideLayerHandler);
            $container.off('click', anchorSelector, clickHandler);
        });
    };

    ConfirmDialog.prototype.addConfirmListener = function (func) {
        this._okCallbacks.add(func);
    };

    ConfirmDialog.prototype.addCancelListener = function (func) {
        this._cancelCallback.add(func);
    };

    ConfirmDialog.dialogDefaults = {
        id: undefined,
        titleText: AJS.I18n.getText('bitbucket.web.title.confirm'),
        titleClass: 'confirm-header',
        confirmButtonClass: 'confirm-button',
        panelContent: '<p>' + AJS.I18n.getText('bitbucket.web.dialog.confirm') + '</p>',
        panelClass: 'panel-body',
        submitText: AJS.I18n.getText('bitbucket.web.button.confirm'),
        submitToHref: true,
        height: 230,
        width: 433,
        focusSelector: '.confirm-button'
    };

    return ConfirmDialog;
});