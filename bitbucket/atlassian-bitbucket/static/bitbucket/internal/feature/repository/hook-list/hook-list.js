'use strict';

define('bitbucket/internal/feature/repository/hook-list', ['aui', 'backbone-brace', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/config-form', 'bitbucket/internal/widget/submit-spinner'], function (AJS, Brace, $, _, nav, ajax, ConfigForm, SubmitSpinner) {

    function Dialog(hook) {
        var dialog = this._dialog = new AJS.Dialog({
            width: 840,
            height: 480,
            id: 'repository-hook-dialog',
            closeOnOutsideClick: false,
            keypressListener: _.bind(function (e) {
                if (e.keyCode === AJS.keyCode.ESCAPE) {
                    e.stopImmediatePropagation(); // AUI-1054: AUIDialog.updateHeight() rebinds the keypressListener at every call;
                    // thus we need to have jQuery stops the immediate propagation of the event to prevent successive invocations.
                    this.close();
                }
            }, this)
        });
        dialog.addHeader(' ').addPanel('', '<div class="hook-config-contents"/>').addSubmit(AJS.I18n.getText('bitbucket.web.button.enable'), _.bind(this.saveHook, this)).addButton(AJS.I18n.getText('bitbucket.web.button.disable'), _.bind(this.disableHook, this), 'button-panel-disable-button').addCancel(AJS.I18n.getText('bitbucket.web.button.cancel'), _.bind(this.close, this));

        this._hook = hook;
        $('#repository-hook-dialog').on('submit', 'form', _.bind(function (e) {
            e.preventDefault();
            this.saveHook();
        }, this));
    }

    Dialog.prototype._resize = function () {
        _.delay(_.bind(this._dialog.updateHeight, this._dialog));
    };

    Dialog.prototype._getConfigContents = function () {
        return this.$('.hook-config-contents');
    };

    Dialog.prototype.saveHook = function () {
        var $spinner = new SubmitSpinner(this.$('.button-panel-submit-button', this._dialog.getPage(0).buttonpanel), 'before').show();
        this._dialog.disable();
        this._configForm.save(this._hook.getEnabled() ? _.bind(this._hook.saveSettings, this._hook) : _.bind(this._hook.enable, this._hook)).done(_.bind(this.close, this)).fail(_.bind(this._resize, this)).fail(_.bind(this._dialog.enable, this._dialog)).always(_.bind($spinner.remove, $spinner));
    };

    Dialog.prototype.disableHook = function () {
        var promise = this._hook.disable();
        promise.always(_.bind(this.close, this));
    };

    Dialog.prototype.$ = function (selector) {
        return $('#repository-hook-dialog').find(selector);
    };

    Dialog.prototype.close = function () {
        this._dialog.remove();
        this._hook = null;
        this._configForm = null;
    };

    Dialog.prototype.show = function () {
        var hook = this._hook;
        if (!hook.getDetails().getConfigFormKey()) {
            throw new Error("Dialog without configuration cannot be shown");
        }

        this.$('.dialog-title').text(hook.getDetails().getName());

        var $configContents = this._getConfigContents().empty();
        $configContents.spin('large');

        var configForm = this._configForm = new ConfigForm($configContents, hook.getDetails().getConfigFormKey());

        configForm.loadAndRender(_.bind(hook.loadSettings, hook)).done(_.bind(this._resize, this));

        this.$('.button-panel-disable-button')[hook.getEnabled() ? 'show' : 'hide']();
        this.$('.button-panel-submit-button').text(hook.getEnabled() ? AJS.I18n.getText('bitbucket.web.button.save') : AJS.I18n.getText('bitbucket.web.button.enable'));

        this._dialog.show();
        return this;
    };

    //noinspection UnnecessaryLocalVariableJS
    var HookListView = Brace.View.extend({
        initialize: function initialize() {
            this.collection.on("change:enabled", _.bind(this.changeEnabledState, this));
            this.currentHookPageStart = this.$('tbody > tr').length;
            this.$loadMoreLink = this.$('.load-more');
            _.bindAll(this, 'onHooksLoaded');
        },
        events: {
            'click .load-more': 'loadMore',
            'click .hook-name a': 'configureHook',
            'click .edit-button': 'configureHook',
            'click .mode-enabled': 'enableHook',
            'click .mode-disabled': 'disableHook'
        },
        loadMore: function loadMore(e) {
            e.preventDefault();
            this.$loadMoreLink.next('.spinner').show().spin();

            ajax.rest({
                url: nav.rest().currentRepo().hooks().build(),
                type: 'GET',
                data: { type: this.options.hookType, start: this.currentHookPageStart, limit: 25 }
            }).done(this.onHooksLoaded);
        },
        onHooksLoaded: function onHooksLoaded(data) {
            this.$el.children('tbody').append(bitbucket.internal.feature.repository.hookRows({ values: data.values }));
            this.currentHookPageStart += data.size;
            if (data.isLastPage) {
                this.$loadMoreLink.closest('.load-more-row').hide();
            }
            this.$loadMoreLink.next('.spinner').spinStop().hide();
        },
        configureHook: function configureHook(e) {
            e.preventDefault();
            var hookKey = $(e.target).closest('tr').attr('data-key');
            var hook = this.collection.get(hookKey);
            if (hook) {
                this.createDialog(hook);
            }
        },
        enableHook: function enableHook(e) {
            e.preventDefault();
            var $link = $(e.target);
            var hookKey = $link.closest('tr').attr('data-key');
            var hook = this.collection.get(hookKey);
            if (!hook.getConfigured() && hook.getDetails().getConfigFormKey()) {
                this.createDialog(hook);
            } else {
                this.changeEnabledStateNow(hook, hook.enable(), true);
            }
        },
        disableHook: function disableHook(e) {
            e.preventDefault();
            var $link = $(e.target);
            var hookKey = $link.closest('tr').attr('data-key');
            var hook = this.collection.get(hookKey);
            this.changeEnabledStateNow(hook, hook.disable(), false);
        },
        createDialog: function createDialog(hook) {
            var dialog = new Dialog(hook);
            dialog.show();
        },
        changeEnabledStateNow: function changeEnabledStateNow(changedHook, promise, enabled) {
            this.changeEnabledStateWithStatus(changedHook, enabled);
            promise.fail(_.bind(this.changeEnabledState, this, changedHook));
        },
        changeEnabledState: function changeEnabledState(changedHook) {
            this.changeEnabledStateWithStatus(changedHook, changedHook.getEnabled());
        },
        changeEnabledStateWithStatus: function changeEnabledStateWithStatus(changedHook, enabled) {
            var $actionsCell = this.$('tr[data-key="' + changedHook.getDetails().getKey() + '"] .cell-actions');
            $actionsCell.html(bitbucket.internal.feature.repository.hookActions({ enabled: enabled }));
        }
    });

    return HookListView;
});