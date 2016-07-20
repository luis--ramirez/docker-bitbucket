'use strict';

define('bitbucket/internal/layout/pull-request', ['aui', 'aui/flag', 'jquery', 'lodash', 'bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/pull-request-edit', 'bitbucket/internal/feature/pull-request/can-merge', 'bitbucket/internal/feature/pull-request/merge-help', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/participant', 'bitbucket/internal/model/pull-request', 'bitbucket/internal/model/stash-user', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/dom-event', 'bitbucket/internal/util/events', 'bitbucket/internal/util/feature-loader', 'bitbucket/internal/util/history', 'bitbucket/internal/util/horizontal-keyboard-scrolling', 'bitbucket/internal/util/shortcuts', 'bitbucket/internal/widget/approve', 'bitbucket/internal/widget/avatar-list', 'bitbucket/internal/widget/confirm-dialog', 'bitbucket/internal/widget/submit-spinner', 'exports'], function (AJS, auiFlag, $, _, eventsApi, nav, PullRequestEdit, canMerge, mergeHelp, pageState, Participant, PullRequest, StashUser, ajax, domEventUtil, events, FeatureLoader, history, horizontalKeyboardScrolling, shortcuts, Approve, AvatarList, ConfirmDialog, SubmitSpinner, exports) {

    var HANDLER_TYPES = {
        diff: 'bitbucket.pull-request.nav.diff',
        overview: 'bitbucket.pull-request.nav.overview',
        commits: 'bitbucket.pull-request.nav.commits'
    };

    var pullRequest;
    var $actionToolbar;
    var $actionToolbarSpinner;
    var $tabMenu;

    var haveKeyboardShortcutsObject = $.Deferred();

    var DEFAULT_MERGE_TIMEOUT_SEC = 5 * 60;
    var TRIGGERED_BY_KEYBOARD = { triggeredBy: 'keyboardShortcut' };

    function getActionUrl(action, withVersion) {
        var builder = nav.rest().currentPullRequest()[action]();

        if (withVersion) {
            builder = builder.withParams({ version: pageState.getPullRequest().getVersion() });
        }
        return builder.build();
    }

    function initActionButton($button, action) {
        $button.click({ action: action }, buttonAction);
    }

    function initMergeButton($mergeButton, mergeTimeout) {
        if ($mergeButton.length) {
            var options = {
                dialog: {
                    person: pageState.getCurrentUser() && pageState.getCurrentUser().toJSON(),
                    pullRequest: pullRequest.toJSON()
                },
                ajax: {
                    statusCode: {
                        '400': function _() {
                            return false;
                        },
                        '401': function _(xhr, textStatus, errorThrown, errors, dominantError) {

                            return $.extend({}, dominantError, {
                                title: AJS.I18n.getText('bitbucket.web.pullrequest.merge.error.401.title'),
                                message: AJS.I18n.getText('bitbucket.web.pullrequest.merge.error.401.message'),
                                fallbackUrl: false,
                                shouldReload: true
                            });
                        },
                        '409': function _(xhr, textStatus, errorThrown, errors, dominantError) {

                            var error = errors.errors && errors.errors.length && errors.errors[0];
                            if (error && (error.conflicted || error.vetoes && error.vetoes.length)) {
                                events.trigger('bitbucket.internal.pull-request.cant.merge', null, pullRequest, error.conflicted, error.vetoes);
                                events.trigger('bitbucket.internal.pull-request.show.cant.merge.help');
                                return false;
                            }
                        }
                    },
                    timeout: (mergeTimeout || DEFAULT_MERGE_TIMEOUT_SEC) * 1000
                }
            };

            createMergeDialog($mergeButton, options);
            $(document).ready(function () {
                checkCanMerge($mergeButton);
            });
        }
    }

    function initDeclineButton($declineButton) {
        if ($declineButton.length) {
            var panelContent = "<p class='decline-message'>" + AJS.I18n.getText('bitbucket.web.pullrequest.decline.dialog.message') + "</p>";

            var options = {
                buttonSelector: '.decline-pull-request',
                confirmDialog: {
                    titleText: AJS.I18n.getText('bitbucket.web.pullrequest.decline.dialog.title'),
                    panelContent: panelContent,
                    submitText: AJS.I18n.getText('bitbucket.web.button.decline')
                },
                confirmEvent: 'bitbucket.internal.feature.pullRequest.declined',
                ajax: {
                    statusCode: {
                        '401': function _(xhr, textStatus, errorThrown, errors, dominantError) {
                            return $.extend({}, dominantError, {
                                title: AJS.I18n.getText('bitbucket.web.pullrequest.decline.error.401.title'),
                                message: AJS.I18n.getText('bitbucket.web.pullrequest.decline.error.401.message'),
                                fallbackUrl: false,
                                shouldReload: true
                            });
                        }
                    }
                }
            };

            createActionDialog('decline', options);
        }
    }

    function buttonAction(e) {
        e.preventDefault();

        if ($actionToolbar.hasClass('disabled')) {
            return;
        }
        $actionToolbar.addClass('disabled');
        $actionToolbarSpinner.show().spin('small');

        ajax.rest({
            url: getActionUrl(e.data.action, true),
            type: 'POST'
        }).done(function () {
            window.location.reload();
        }).fail(function () {
            $actionToolbar.removeClass('disabled');
            $actionToolbarSpinner.spinStop().hide();
        });
    }

    function createActionDialog(action, options) {
        var actionDialog = new ConfirmDialog($.extend({
            id: "pull-request-" + action + "-dialog",
            submitToHref: false,
            resizeOnShow: true,
            width: 650,
            height: 200
        }, options.confirmDialog));

        var actionXhr;
        var promiseDecorator;

        actionDialog.addConfirmListener(function (promise, $trigger, removeDialog, dialog, $spinner) {
            actionDialog.setButtonsDisabled(true);
            $spinner.show();

            actionXhr = ajax.rest($.extend({
                url: getActionUrl(action, true),
                type: 'POST'
            }, options.ajax));

            var actionPromise = actionXhr;

            if (promiseDecorator) {
                var decoratedPromise = promiseDecorator(actionXhr, $trigger, removeDialog, dialog, $spinner);
                if (decoratedPromise) {
                    actionPromise = decoratedPromise;
                }
            }

            actionPromise.done(function () {
                if (options.confirmEvent) {
                    events.trigger(options.confirmEvent);
                }
                window.location = nav.currentPullRequest().build();
            }).fail(function () {
                removeDialog();
            }).always(function () {
                actionXhr = null;
            });
        });

        actionDialog.addCancelListener(function (dialog) {
            if (actionXhr) {
                actionXhr.abort();
            }
        });

        // An extension point for branch delete on merge - allows it to hook in after
        actionDialog.setPromiseDecorator = function (decorator) {
            promiseDecorator = decorator;
        };

        actionDialog.attachTo(options.buttonSelector, options.onShow);

        return actionDialog;
    }

    // Creates a AUI Dialog2 dialog, separate from the legacy actionDialog which uses ConfirmDialog (AUI Dialog 1)
    function createMergeDialog($mergeButton, options) {
        var mergeDialog = AJS.dialog2(bitbucket.internal.feature.pullRequest.merge.dialog(options.dialog));

        // we manually add the dialog to the body so that it's on the DOM and available for the branch deletion plugin
        // to disable the checkbox
        $('body').append(mergeDialog.$el);

        $mergeButton.on('click', function () {
            mergeDialog.show();

            // Dialog2 automatically focuses the first focus-able element in the dialog, eg. the textarea, which
            // causes it to expand when the dialog is shown, so we re-add the .collapsed class to the form and
            // re-focus the Merge button instead.
            // Dialog2 docs mention a 'data-aui-focus-selector ' attribute to control what element receives focus
            // when the dialog is shown, but it appears to be ignored and overriden.
            // https://ecosystem.atlassian.net/browse/AUI-3299 to either re-implement it, or fix the docs
            collapseCommitMessage(mergeDialog);
            mergeDialog.$el.find('.confirm-button').focus();
        });

        var mergeXhr;
        var promiseDecorator;

        mergeDialog.$el.find('.confirm-button').on('click', function () {

            var spinner = new SubmitSpinner(this, 'before');

            setMergeDialogButtonsDisabled(mergeDialog, true);
            spinner.show();

            mergeXhr = ajax.rest($.extend({
                url: getActionUrl('merge', true),
                type: 'POST',
                data: { message: mergeDialog.$el.find('#commit-message').val() }
            }, options.ajax));

            var mergePromise = mergeXhr;

            mergeXhr.fail(function (xhr, textStatus, errorThrown, resp) {
                if (xhr.status === 400) {
                    var $mergeDialogContent = mergeDialog.$el.find('.aui-dialog2-content');

                    if (resp.errors) {
                        $mergeDialogContent.children('.aui-message').remove();
                        $mergeDialogContent.prepend(bitbucket.internal.feature.pullRequest.merge.errors({ 'errors': resp.errors }));
                    }
                    spinner.hide();
                    setMergeDialogButtonsDisabled(mergeDialog, false);
                } else {
                    mergeDialog.hide();
                }
            }).always(function () {
                mergeXhr = null; // null it out so that merge can't be cancelled below
            });

            // HACK - we don't want to expose plugin points for the promise yet
            // we hard code a link to the branch deletion, if it's available
            if (!promiseDecorator) {
                try {
                    promiseDecorator = require('pullRequest/branchDeletion').getMergePromiseDecorator;
                } catch (e) {
                    // ignore
                }
            }

            if (promiseDecorator) {
                var decoratedPromise = promiseDecorator(mergePromise, function () {
                    mergeDialog.hide();
                });
                if (decoratedPromise) {
                    mergePromise = decoratedPromise;
                }
            }

            mergePromise.done(function () {
                events.trigger('bitbucket.internal.feature.pullRequest.merged');
                window.location = nav.currentPullRequest().build();
            });
        });

        mergeDialog.$el.find('.cancel-button').on('click', function () {
            if (mergeXhr) {
                mergeXhr.abort();
                mergeXhr = null;
            }
            collapseCommitMessage(mergeDialog);
            mergeDialog.hide();
        });

        mergeDialog.$el.find('.commit-message').on('focus', expandCommitMessage);

        mergeDialog.$el.find('.cancel-commit-message-link').click(function (e) {
            e.preventDefault();
            collapseCommitMessage(mergeDialog);
        });

        mergeDialog.on('hide', function () {
            collapseCommitMessage(mergeDialog);
        });

        return mergeDialog;
    }

    function bindKeyboardShortcuts() {

        events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', function (keyboardShortcuts) {
            keyboardShortcuts.enableContext('pull-request');
            haveKeyboardShortcutsObject.resolve(keyboardShortcuts);
        });

        events.on('bitbucket.internal.keyboard.shortcuts.requestGotoPullRequestsListHandler', function (keys) {
            (this.execute ? this : AJS.whenIType(keys)).execute(function () {
                window.location.href = nav.currentRepo().allPullRequests().build();
            });
        });

        events.on('bitbucket.internal.keyboard.shortcuts.requestChangePullRequestSectionHandler', function (keys) {
            (this.execute ? this : AJS.whenIType(keys)).execute(function (e) {
                var number = parseInt(String.fromCharCode(e.which), 10);
                var $link = $tabMenu.children().eq(number - 1).children('a');
                $link.click();
            });
        });
    }

    // Replicate the ConfirmDialog setButtonsDisabled method
    function setMergeDialogButtonsDisabled(dialog, disabled) {
        var $buttons = dialog.$el.find('.aui-dialog2-footer-actions .aui-button');

        $buttons.each(function () {
            var $button = $(this);
            $button.prop("disabled", disabled).toggleClass("disabled", disabled);
            if (disabled) {
                $button.attr("aria-disabled", "true");
            } else {
                $button.removeAttr("aria-disabled");
            }
        });
    }

    function checkCanMerge($mergeButton) {
        var $conflictWarning;
        events.on('bitbucket.internal.pull-request.cant.merge', function (pullRequest, conflicted, vetoes) {
            if (!$conflictWarning) {
                $mergeButton.attr('aria-disabled', 'true').attr('disabled', 'disabled').attr('title', AJS.I18n.getText('bitbucket.web.pullrequest.merge.issue.tooltip'));

                $conflictWarning = $(bitbucket.internal.feature.pullRequest.mergeDisabledIcon({
                    conflicted: conflicted,
                    vetoes: vetoes
                })).insertBefore($mergeButton).tooltip({
                    delayOut: 200,
                    gravity: 'n',
                    html: true,
                    hoverable: true,
                    offset: 7
                }).on('click', function (e) {
                    e.preventDefault();
                    $('.tipsy').hide();
                    events.trigger('bitbucket.internal.pull-request.show.cant.merge.help');
                });
            }
        });

        events.on('bitbucket.internal.pull-request.can.merge', function () {
            if ($conflictWarning) {
                $mergeButton.attr('aria-disabled', 'false').removeAttr('disabled').removeAttr('title');

                $conflictWarning.remove();
                $conflictWarning = null;
            }
        });

        canMerge(pullRequest);
    }

    function expandCommitMessage() {
        $(this).closest('.commit-message-form').removeClass('collapsed');
    }

    function collapseCommitMessage(mergedialog) {
        mergedialog.$el.find('.commit-message').val('');
        mergedialog.$el.find('.commit-message-form').addClass('collapsed');
    }

    function initTabs() {
        function setTabActive($tab) {
            $tab.addClass('active-tab').siblings().removeClass('active-tab');
        }

        haveKeyboardShortcutsObject.done(function (keyboardShortcuts) {
            _.each($tabMenu.children(), function (tab, index) {
                var $tab = $(tab);
                var key = String(index + 1);
                var message = AJS.I18n.getText('bitbucket.web.keyboardshortcut.pull-request.switch.tabs', $tab.text());
                keyboardShortcuts.addCustomShortcut('pull-request', [[key]], message);
                $tab.attr('title', ($tab.attr('title') || message) + AJS.I18n.getText('bitbucket.web.keyboardshortcut.type', key));
            });
        });

        $tabMenu.on('click', 'a', function (e) {
            if (!domEventUtil.openInSameTab(e)) {
                return;
            }
            var $a = $(this);
            var $tab = $a.parent();

            if (!$tab.is('.active-tab')) {
                setTabActive($tab);
                events.trigger('bitbucket.internal.layout.pull-request.urlRequested', null, $a.prop('href'));
            }

            e.preventDefault();
        });
        events.on('bitbucket.internal.page.pull-request.view.contextLoaded', function (context) {
            setTabActive($tabMenu.find('[data-module-key="' + context.name + '"]'));

            // Pause the scrolling functionality on the overview section for pull request page
            // This piece of code can be removed on pull request 2.0
            if (context.name === HANDLER_TYPES.diff) {
                horizontalKeyboardScrolling.resume();
            } else {
                horizontalKeyboardScrolling.pause();
            }
        });
    }

    function initReviewersLists($reviewersList) {
        return new AvatarList($reviewersList, pullRequest.getReviewers(), {
            pullRequestId: pullRequest.getId()
        });
    }

    function initUpdateApproval() {
        var shortcutFlag;

        function updateApproval(approvalJSON) {
            // remove __json reference in 4.0 when no longer a deprecated Brace model.
            var user = new StashUser(approvalJSON.user.__json || approvalJSON.user);
            var reviewer = pullRequest.getReviewers().findByUser(user);

            if (reviewer) {
                reviewer.setApproved(approvalJSON.approved);
                pullRequest.getReviewers().sort(); // Changing attributes does not trigger an automatic sort
            } else {
                    var participant = pullRequest.getParticipants().findByUser(user);

                    if (participant) {
                        participant.setApproved(approvalJSON.approved);
                        pullRequest.getParticipants().sort();
                    }
                }
        }

        function showApprovalUpdateFlag(options) {
            var flagTitle = options.approved ? AJS.I18n.getText('bitbucket.web.pullrequest.toolbar.approved.updateflag') : AJS.I18n.getText('bitbucket.web.pullrequest.toolbar.unapproved.updateflag');
            showUpdateFlag(flagTitle, options);
        }

        function showWatchUpdateFlag(options) {
            var flagTitle = options.watched ? AJS.I18n.getText('bitbucket.web.watchable.watched.tooltip') : AJS.I18n.getText('bitbucket.web.watchable.unwatched.tooltip');
            showUpdateFlag(flagTitle, options);
        }

        function showUpdateFlag(flagTitle, options) {
            if (_.isMatch(options, TRIGGERED_BY_KEYBOARD)) {
                if (shortcutFlag) {
                    shortcutFlag.close();
                }

                shortcutFlag = auiFlag({
                    type: 'success',
                    title: flagTitle,
                    close: 'auto'
                });
            }
        }

        events.on('bitbucket.internal.widget.approve-button.adding', updateApproval);
        events.on('bitbucket.internal.widget.approve-button.removing', updateApproval);
        events.on('bitbucket.internal.widget.approve-button.add.failed', updateApproval);
        events.on('bitbucket.internal.widget.approve-button.remove.failed', updateApproval);
        events.on('bitbucket.internal.widget.approve-button.added', showApprovalUpdateFlag);
        events.on('bitbucket.internal.widget.approve-button.removed', showApprovalUpdateFlag);
        events.on('bitbucket.internal.web.watch-button.added', showWatchUpdateFlag);
        events.on('bitbucket.internal.web.watch-button.removed', showWatchUpdateFlag);
    }

    function initParticipants() {

        function addParticipant(participantJSON) {
            var newParticipant = new Participant(participantJSON);
            var reviewer = pullRequest.getReviewers().findByUser(newParticipant.getUser());

            if (!reviewer) {
                var participant = pullRequest.getParticipants().findByUser(newParticipant.getUser());

                if (!participant) {
                    pullRequest.addParticipant(newParticipant);

                    return true;
                }
            }

            return false;
        }

        events.on('bitbucket.internal.widget.approve-button.adding', function (approvalJSON) {
            addParticipant({
                approved: approvalJSON.approved,
                // remove __json reference in 4.0 when no longer a deprecated Brace model.
                user: approvalJSON.user.__json || approvalJSON.user,
                role: 'PARTICIPANT'
            });
        });

        /**
         * Add an author of something as a participant if they are not the Pull Request author.
         *
         * @param {AuthorJSON} author
         */
        function addValidParticipant(author) {
            if (author.name !== pullRequest.getAuthor().getUser().getName()) {
                addParticipant({
                    approved: false, // if the user has already approved, this won't remove it.
                    user: author,
                    role: 'PARTICIPANT'
                });
            }
        }

        events.on('bitbucket.internal.feature.comments.commentAdded', function (comment) {
            addValidParticipant(comment.author);
        });
        events.on('bitbucket.internal.feature.pull-request-tasks.saved', function (data) {
            // Note that for task save events, we're interested in the current user as
            // the "author" of the event. Not the author of the task.
            addValidParticipant(pageState.getCurrentUser().toJSON());
        });

        pullRequest.getParticipants().on('add', function (participant) {
            var currentUser = pageState.getCurrentUser();
            if (currentUser && currentUser.getName() === participant.getUser().getName()) {
                pageState.setIsWatching(true);
            }
        });
    }

    var loader = new FeatureLoader({
        loadedEvent: 'bitbucket.internal.page.pull-request.view.contextLoaded',
        unloadedEvent: 'bitbucket.internal.page.pull-request.page.pull-request.view.contextUnloaded',
        requestedEvent: 'bitbucket.internal.page.pull-request.view.contextRequested'
    });

    function initLoader(contentSelector, dataReady) {
        // TODO: Consider Jason's idea of contexts. Lots of weirdness to flesh out with
        // TODO: the best API for this stuff.

        loader.registerHandler(HANDLER_TYPES.diff, /^[^\?\#]*pull-requests\/\d+\/diff/, 'bitbucket/internal/page/pull-request/view/pull-request-view-diff');
        loader.registerHandler(HANDLER_TYPES.overview, /^[^\?\#]*pull-requests\/\d+\/overview/, 'bitbucket/internal/page/pull-request/view/pull-request-view-overview');
        loader.registerHandler(HANDLER_TYPES.commits, /^[^\?\#]*pull-requests\/\d+\/commits/, 'bitbucket/internal/page/pull-request/view/pull-request-view-commits');

        /**
         * @param eventType {String} 'start' or 'end'
         * @param handlerName {String} name of the feature loader handler
         */
        function getBrowserMetricsEventHandler(eventType, handlerName) {
            var handlerKey = _.findKey(HANDLER_TYPES, _.matches(handlerName));
            if (handlerKey) {
                eventsApi.trigger('bitbucket.internal.browser-metrics.pull-request.' + handlerKey + '.' + eventType);
            }
        }

        // Raising context requested/loaded events for Stash apdex plugin. The tab types are defined on {@code HANDLER_TYPES}.
        events.on('bitbucket.internal.page.pull-request.view.contextRequested', getBrowserMetricsEventHandler.bind(null, 'start'));

        events.on('bitbucket.internal.page.pull-request.view.contextLoaded', function (handler) {
            getBrowserMetricsEventHandler('end', handler.name);
        });

        events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', function (keyboardShortcuts) {
            loader.setKeyboardShortcuts(keyboardShortcuts);
            keyboardShortcuts.enableContext('pull-request');
        });

        events.on('bitbucket.internal.layout.pull-request.urlRequested', function (url) {
            if (url !== window.location.href) {
                history.pushState(null, '', url);
            }
        });

        events.on('bitbucket.internal.util.feature-loader.errorOccurred', function (error) {
            if (error.code === FeatureLoader.NO_HANDLER) {
                console.log("You did not register a handler for this page. Please call\n" + "require('bitbucket/internal/layout/pull-request').registerHandler(\n" + "   'tab-web-item-module-key',\n" + "   /^[^\\?\\#]*url-regex/,\n" + "   {\n" + "       load : function (contentElement) {},\n" + "       unload : function (contentElement) {}\n" + "   }\n" + ")");
            } else {
                console.log(error.message);
            }
        });

        dataReady.done(function (data) {
            loader.init($(contentSelector).get(0));
        });
    }

    exports.registerHandler = $.proxy(loader.registerHandler, loader);

    exports.onReady = function (pullRequestJSON, startingSection, contentSelector, diffTreeHeaderWebItems, commitsTableWebSections, maxChanges, mergeTimeout, relevantContextLines) {
        pageState.setPullRequest(new PullRequest(pullRequestJSON));
        pageState.extend("pullRequestViewInternal", function () {
            return {
                diffTreeHeaderWebItems: diffTreeHeaderWebItems,
                commitsTableWebSections: commitsTableWebSections,
                maxChanges: maxChanges,
                relevantContextLines: relevantContextLines
            };
        });
        pageState.extend('isWatching');
        var isWatchingPromise = $.Deferred();
        _PageDataPlugin.ready('com.atlassian.bitbucket.server.bitbucket-web:iswatching-provider', 'bitbucket.internal.pull-request.view', function (data) {
            pageState.setIsWatching(data.isWatching);
            isWatchingPromise.resolve();
        });

        mergeHelp.init();

        pullRequest = pageState.getPullRequest();

        var $mergeButton = $('.merge-pull-request');
        var $declineButton = $('.decline-pull-request');
        var $reopenButton = $('.reopen-pull-request');
        var $approveButton = $('.approve');
        var $editButton = $('.edit-pull-request');
        var pullRequestEdit = new PullRequestEdit(pullRequest);

        // Won't know which buttons exist on the page so add all of them
        $actionToolbar = $('.pull-request-toolbar .aui-toolbar2-secondary');
        $actionToolbarSpinner = $("<div class='spinner'/>").prependTo($actionToolbar.children(':first-child'));

        $tabMenu = $('.content-body .aui-page-panel-content > .aui-tabs > .tabs-menu');

        shortcuts.bind('pullRequestApprove', _.ary($approveButton.trigger.bind($approveButton, 'click', TRIGGERED_BY_KEYBOARD), 0));
        shortcuts.bind('pullRequestEdit', _.ary($editButton.trigger.bind($editButton, 'click', TRIGGERED_BY_KEYBOARD), 0));
        shortcuts.bind('pullRequestWatch', function () {
            // the edit and approve buttons are sent in the original page, but the watch link gets added after the fact
            // check for link dynamically so we don't need to handle timing issues
            $('.plugin-item.watch a').trigger('click', TRIGGERED_BY_KEYBOARD);
        });

        initMergeButton($mergeButton, mergeTimeout);
        initDeclineButton($declineButton);
        initActionButton($reopenButton, 'reopen');
        pullRequestEdit.bind('.edit-pull-request, .add-description'); //.add-description is from pull-request-overview

        new Approve($approveButton, getActionUrl('approve'));

        initReviewersLists($('.reviewers'));
        initParticipants();
        initUpdateApproval();

        bindKeyboardShortcuts();

        initTabs();

        initLoader(contentSelector, isWatchingPromise);
    };
});