'use strict';

define('bitbucket/internal/widget/approve', ['aui', 'jquery', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events', 'bitbucket/internal/widget/button-trigger', 'bitbucket/internal/widget/keyboard-shortcuts'], function (AJS, $, pageState, ajax, events, ButtonTrigger, keyboardShortcuts) {

    'use strict';

    function Approve(selectorTrigger, url) {
        this._opts = {
            url: url,
            triggerHandler: this.buttonClicked
        };

        ButtonTrigger.call(this, selectorTrigger, this._opts);

        var self = this;

        var flag;

        var handler = function handler(data) {
            if (pageState.getCurrentUser() && data.user.name === pageState.getCurrentUser().getName() && data.pullRequestId === pageState.getPullRequest().getId()) {

                self.setTriggerActive(data.approved);

                var newTitle = data.approved ? AJS.I18n.getText('bitbucket.web.pullrequest.toolbar.approved.tooltip') : AJS.I18n.getText('bitbucket.web.pullrequest.toolbar.approve.tooltip');
                self._$trigger.attr('title', newTitle);
                appendKeyboardInstructions(self._$trigger);
            }
        };

        function appendKeyboardInstructions($trigger) {
            keyboardShortcuts.addTooltip($trigger, 'a');
        }

        // optimistic event listening (assume it works, then revert if necessary)
        events.on('bitbucket.internal.widget.approve-button.adding', handler);
        events.on('bitbucket.internal.widget.approve-button.removing', handler);
        events.on('bitbucket.internal.widget.approve-button.add.failed', handler);
        events.on('bitbucket.internal.widget.approve-button.remove.failed', handler);
        appendKeyboardInstructions(self._$trigger);
    }
    $.extend(Approve.prototype, ButtonTrigger.prototype);

    Approve.prototype.buttonClicked = function (isOn, event, extraData) {
        var self = this;

        function fireEvent(eventName, approved) {
            events.trigger(eventName, self, $.extend({
                approved: approved,
                pullRequestId: pageState.getPullRequest().getId(),
                user: pageState.getCurrentUser().toJSON()
            }, extraData));
        }

        fireEvent(isOn ? 'bitbucket.internal.widget.approve-button.adding' : 'bitbucket.internal.widget.approve-button.removing', isOn);

        ajax.rest({
            url: self._opts.url,
            type: isOn ? 'POST' : 'DELETE',
            statusCode: {
                '401': function _(xhr, textStatus, errorThrown, errors, dominantError) {
                    return $.extend({}, dominantError, {
                        title: AJS.I18n.getText('bitbucket.web.pullrequest.approve.error.401.title'),
                        message: AJS.I18n.getText('bitbucket.web.pullrequest.approve.error.401.message'),
                        fallbackUrl: false,
                        shouldReload: true
                    });
                },
                '409': function _(xhr, textStatus, errorThrown, errors, dominantError) {
                    return $.extend({}, dominantError, {
                        title: AJS.I18n.getText('bitbucket.web.pullrequest.approve.error.409.title'),
                        fallbackUrl: false,
                        shouldReload: true
                    });
                }
            }
        }).done(function () {
            fireEvent(isOn ? 'bitbucket.internal.widget.approve-button.added' : 'bitbucket.internal.widget.approve-button.removed', isOn);
        }).fail(function () {
            fireEvent(isOn ? 'bitbucket.internal.widget.approve-button.add.failed' : 'bitbucket.internal.widget.approve-button.remove.failed', !isOn);
        });
    };

    return Approve;
});