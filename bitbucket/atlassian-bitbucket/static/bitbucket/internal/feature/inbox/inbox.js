'use strict';

define('bitbucket/internal/feature/inbox', ['aui', 'jquery', 'lodash', 'bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/util/server', 'bitbucket/util/state', 'exports'], function (AJS, $, _, events, nav, server, pageState, exports) {
    var inlineDialog;
    var $inboxTrigger;

    function getInboxCountResourceUrl() {
        return nav.rest().addPathComponents('inbox', 'pull-requests', 'count').build();
    }

    var hideOnEscapeKeyUp = function hideOnEscapeKeyUp(e) {
        if (e.keyCode === $.ui.keyCode.ESCAPE) {
            inlineDialog.hide();
            e.preventDefault();
        }
    };

    var hideOnDialogShown = function hideOnDialogShown() {
        inlineDialog.hide();
    };

    function initialiseDialog($container) {
        require('bitbucket/internal/feature/inbox-dialog').onReady($container[0]);
    }

    var onShowDialog = function onShowDialog($content, trigger, showPopup) {
        showPopup();
        $(document).on('keyup', hideOnEscapeKeyUp);

        /*
         * This has been added for interaction with the other dialogs using dialog2,
         * and so the inline dialog for the inbox doesn't know about them which causes
         * layering issues when they're opened from the PR list.
         *
         * This might be able to be removed in future if there's an InlineDialog2
         * and the Inbox is updated to use it.
         */
        AJS.dialog2.on('show', hideOnDialogShown);

        /*
         * This has been added for interaction with drop down menus that stay
         * shown even with the inbox dialog shown. See BSERV-7835
         */
        $(".aui-dropdown2-active").trigger("aui-button-invoke");

        loadDialogResources($content, _.partial(initialiseDialog, $content));
    };

    var loadDialogResources = _.once(function ($content, callback) {
        var $spinner = $('<div class="loading-resource-spinner"></div>');
        $content.empty().append($spinner);
        $spinner.show().spin('medium');

        WRM.require('wrc!bitbucket.pullRequest.inbox').done(function () {
            $spinner.spinStop().remove();
            callback();
        }).always(function () {
            $spinner.spinStop().remove();
        });
    });

    var onHideDialog = function onHideDialog() {
        $(document).off('keyup', hideOnEscapeKeyUp);
        AJS.dialog2.off('show', hideOnDialogShown);

        if ($(document.activeElement).closest('#inline-dialog-inbox-pull-requests-content').length) {
            // if the focus is inside the dialog, you get stuck when it closes.
            document.activeElement.blur();
        }
    };

    var fetchInboxCount = function fetchInboxCount() {
        server.rest({
            url: getInboxCountResourceUrl(),
            type: 'GET',
            statusCode: {
                '*': false
            }
        }).done(function (data) {
            if (data.count > 0) {
                var $badge = $(aui.badges.badge({
                    'text': data.count
                }));
                $inboxTrigger.html(bitbucket.internal.inbox.triggerIcon({ isEmpty: false })).append($badge);
                setTimeout(function () {
                    // Needed for the transition to trigger
                    $badge.addClass('visible');
                }, 0);
            } else {
                // The badge fadeOut transition happens with a CSS3 transition, which we can't hook into.
                // Use a setTimeout instead, unfortunately.
                var cssTransitionDuration = 500;
                $inboxTrigger.find('.aui-badge').removeClass('visible');
                setTimeout(function () {
                    $inboxTrigger.html(bitbucket.internal.inbox.triggerIcon({ isEmpty: true }));
                }, cssTransitionDuration);
            }
            $inboxTrigger.attr('data-countLoaded', true);
        });
    };

    exports.onReady = function () {
        $inboxTrigger = $("#inbox-trigger");
        if ($inboxTrigger.length && pageState.getCurrentUser()) {
            $inboxTrigger.html(bitbucket.internal.inbox.triggerIcon({ isEmpty: true }));
            inlineDialog = AJS.InlineDialog($inboxTrigger, 'inbox-pull-requests-content', onShowDialog, {
                width: 800,
                closeOnTriggerClick: true,
                hideCallback: onHideDialog
            });

            fetchInboxCount();

            var _reviewerStatusUpdateHandler = function _reviewerStatusUpdateHandler(data) {
                if (data.user.name === pageState.getCurrentUser().name) {
                    fetchInboxCount();
                }
            };

            events.on('bitbucket.internal.widget.approve-button.added', _reviewerStatusUpdateHandler);
            events.on('bitbucket.internal.widget.approve-button.removed', _reviewerStatusUpdateHandler);
            events.on('bitbucket.internal.widget.needs-work.added', _reviewerStatusUpdateHandler);
            events.on('bitbucket.internal.widget.needs-work.removed', _reviewerStatusUpdateHandler);
            events.on('bitbucket.internal.feature.pullRequest.self.added', _reviewerStatusUpdateHandler);
            events.on('bitbucket.internal.feature.pullRequest.self.removed', _reviewerStatusUpdateHandler);
        }
    };
});

jQuery(document).ready(function () {
    require('bitbucket/internal/feature/inbox').onReady();
});