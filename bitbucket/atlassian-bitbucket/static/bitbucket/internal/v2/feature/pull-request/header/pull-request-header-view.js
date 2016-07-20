'use strict';

var _react = require('react');

var _react2 = babelHelpers.interopRequireDefault(_react);

define('bitbucket/internal/v2/feature/pull-request/header/pull-request-header-view', ['aui', 'aui/flag', 'jquery', 'lodash', 'react', 'react-redux', 'bitbucket/util/navbuilder', 'bitbucket/internal/bbui/models/models', 'bitbucket/internal/bbui/pull-request-header/pull-request-header', 'bitbucket/internal/feature/pull-request-edit', 'bitbucket/internal/model-transformer', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/participant', 'bitbucket/internal/model/pull-request', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events', 'bitbucket/internal/util/shortcuts', 'bitbucket/internal/widget/submit-spinner', '../action-creators/can-merge', '../action-creators/change-reviewer-status', '../action-creators/change-self-reviewer', '../action-creators/watch'], function (AJS, auiFlag, $, _, React, ReactRedux, nav, models, PullRequestHeader, PullRequestEdit, transformer, pageState, Participant, PullRequest, ajax, events, shortcuts, SubmitSpinner, canMerge, changeReviewerStatus, changeSelfReviewer, watch) {

    'use strict';

    var DEFAULT_MERGE_TIMEOUT_SEC = 5 * 60;
    var TRIGGERED_BY_KEYBOARD = { triggeredBy: 'keyboardShortcut' };
    var pullRequest;

    function initKeyboardFlags() {
        var shortcutFlag;

        function showApprovalUpdateFlag(options) {
            var flagTitle = options.approved ? AJS.I18n.getText('bitbucket.web.pullrequest.toolbar.approved.updateflag') : AJS.I18n.getText('bitbucket.web.pullrequest.toolbar.unapproved.updateflag');
            showUpdateFlag(flagTitle, options);
        }

        function showWatchUpdateFlag(options) {
            var flagTitle = options.watchState ? AJS.I18n.getText('bitbucket.web.watchable.watched.tooltip') : AJS.I18n.getText('bitbucket.web.watchable.unwatched.tooltip');
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

        events.on('bitbucket.internal.widget.approve-button.added', showApprovalUpdateFlag);
        events.on('bitbucket.internal.widget.approve-button.removed', showApprovalUpdateFlag);
        events.on('bitbucket.internal.web.watch-button.added', showWatchUpdateFlag);
        events.on('bitbucket.internal.web.watch-button.removed', showWatchUpdateFlag);
    }

    function expandCommitMessage() {
        $(this).closest('.commit-message-form').removeClass('collapsed');
    }

    function collapseCommitMessage(mergedialog) {
        mergedialog.$el.find('.commit-message').val('');
        mergedialog.$el.find('.commit-message-form').addClass('collapsed');
    }

    // Replicate the ConfirmDialog setButtonsDisabled method
    function setDialogButtonsDisabled(dialog, disabled) {
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

    function getActionUrl(action, withVersion) {
        var builder = nav.rest().currentPullRequest()[action]().withParams({
            avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' })
        });

        if (withVersion) {
            builder = builder.withParams({ version: pageState.getPullRequest().getVersion() });
        }

        return builder.build();
    }

    // Creates a AUI Dialog2 dialog, separate from the legacy actionDialog which uses ConfirmDialog (AUI Dialog 1)
    function createMergeDialog(options) {
        var mergeDialog = AJS.dialog2(bitbucket.internal.feature.pullRequest.merge.dialog(options.dialog));

        // we manually add the dialog to the body so that it's on the DOM and available for the branch deletion plugin
        // to disable the checkbox
        $('body').append(mergeDialog.$el);

        var mergeXhr;
        var promiseDecorator;

        mergeDialog.$el.find('.confirm-button').on('click', function () {

            var spinner = new SubmitSpinner(this, 'before');

            setDialogButtonsDisabled(mergeDialog, true);
            spinner.show();

            mergeXhr = ajax.rest($.extend({
                url: getActionUrl('merge', true),
                type: 'POST',
                data: { message: mergeDialog.$el.find('#commit-message').val() }
            }, options.ajax));

            var mergePromise = mergeXhr;

            mergeXhr.fail(function (xhr, textStatus, errorThrown, resp) {
                if (xhr.status === 400 || xhr.status === 409) {
                    var $mergeDialogContent = mergeDialog.$el.find('.aui-dialog2-content');

                    if (resp.errors) {
                        $mergeDialogContent.children('.aui-message').remove();
                        $mergeDialogContent.prepend(bitbucket.internal.feature.pullRequest.merge.errors({ 'errors': resp.errors }));
                    }
                } else {
                    mergeDialog.hide();
                }
            }).always(function () {
                mergeXhr = null; // null it out so that merge can't be cancelled below
                spinner.hide();
                setDialogButtonsDisabled(mergeDialog, false);
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

            mergePromise.done(function (StashPullRequestJSON) {
                events.trigger('bitbucket.internal.feature.pullRequest.merged', null, {
                    user: pageState.getCurrentUser().toJSON(),
                    pullRequest: StashPullRequestJSON
                });
                options.callback(StashPullRequestJSON);
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

        mergeDialog.$el.on('click', '.view-merge-veto-details-button', function () {
            mergeDialog.hide();
            events.trigger('bitbucket.internal.pull-request.show.cant.merge.help');
        });

        return mergeDialog;
    }

    function createDeclineDialog(options) {
        var declineDialog = AJS.dialog2(bitbucket.internal.feature.pullRequest.decline.dialog({ 'content': options.confirmDialog.content }));

        // we manually add the dialog to the body so that it's on the DOM and available for the branch deletion plugin
        // to disable the checkbox
        $('body').append(declineDialog.$el);

        var declineXhr;

        declineDialog.$el.find('.confirm-button').on('click', function () {

            var spinner = new SubmitSpinner(this, 'before');

            setDialogButtonsDisabled(declineDialog, true);
            spinner.show();

            declineXhr = ajax.rest($.extend({
                url: getActionUrl('decline', true),
                type: 'POST'
            }, options.ajax));

            var declinePromise = declineXhr;

            declineXhr.fail(function (xhr, textStatus, errorThrown, resp) {
                if (xhr.status === 400) {
                    var $declineDialogContent = declineDialog.$el.find('.aui-dialog2-content');

                    if (resp.errors) {
                        $declineDialogContent.children('.aui-message').remove();
                        $declineDialogContent.prepend(bitbucket.internal.feature.pullRequest.decline.errors({ 'errors': resp.errors }));
                    }
                } else {
                    declineDialog.hide();
                }
            }).always(function () {
                spinner.hide();
                setDialogButtonsDisabled(declineDialog, false);
                declineXhr = null;
            });

            declinePromise.done(function (StashPullRequestJSON) {
                events.trigger('bitbucket.internal.feature.pullRequest.declined', null, {
                    user: pageState.getCurrentUser().toJSON(),
                    pullRequest: StashPullRequestJSON
                });
                options.callback(StashPullRequestJSON);
            });
        });

        declineDialog.$el.find('.cancel-button').on('click', function () {
            if (declineXhr) {
                declineXhr.abort();
                declineXhr = null;
            }
            declineDialog.hide();
        });

        return declineDialog;
    }

    var PullRequestHeaderView = React.createClass({
        displayName: 'PullRequestHeaderView',


        propTypes: {
            hasRepoWrite: React.PropTypes.bool.isRequired,
            mergeTimeout: React.PropTypes.number
        },
        getInitialState: function getInitialState() {
            return {};
        },

        toggleWatch: function toggleWatch(options) {
            this.props.dispatch(watch(_.merge({}, { watchState: !this.props.pullRequest.isWatching }, options)));
        },

        mergeCheck: function mergeCheck() {
            if (this.props.pullRequest.state === models.PullRequestState.OPEN) {
                this.props.dispatch(canMerge(new PullRequest(this.props.pullRequest._stash)));
            }
        },

        initMergeThings: function initMergeThings() {
            var self = this;
            this.mergeCheck();
            events.on('bitbucket.internal.feature.pull-request.merge-check', this.mergeCheck);
            pullRequest = pageState.getPullRequest();

            var mergeTimeout = this.props.mergeTimeout;
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
                                if (self.mergeDialog.$el.attr('aria-hidden') !== 'false') {
                                    events.trigger('bitbucket.internal.pull-request.show.cant.merge.help');
                                }
                                return false;
                            }
                        }
                    },
                    timeout: (mergeTimeout || DEFAULT_MERGE_TIMEOUT_SEC) * 1000
                },
                callback: function callback(StashPullRequestJSON) {
                    self.updatePullRequest(transformer.pullRequest(StashPullRequestJSON), true);
                    self.mergeDialog.hide();
                }
            };

            this.mergeDialog = createMergeDialog(options);

            events.on('bitbucket.internal.branch.plugin.conflict.merge.help', function (mergeHelp) {
                self.setState({ mergeHelp: mergeHelp });
            });

            events.on('bitbucket.internal.pull-request.show.cant.merge.help', function () {
                // an internal component wants to show the merge help - lets pass that along to the PR header
                self.setState({ showMergeHelpDialog: true });
            });
        },

        initDeclineButton: function initDeclineButton($declineButton) {
            var panelContent = "<p class='decline-message'>" + AJS.I18n.getText('bitbucket.web.pullrequest.decline.dialog.message') + "</p>";

            var self = this;
            var options = {
                buttonSelector: '.decline-pull-request',
                confirmDialog: {
                    content: panelContent
                },
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
                },
                callback: function callback(StashPullRequestJSON) {
                    self.updatePullRequest(transformer.pullRequest(StashPullRequestJSON), true);
                    self.declineDialog.hide();
                }
            };

            this.declineDialog = createDeclineDialog(options);
        },

        componentDidMount: function componentDidMount() {
            var pullRequest = pageState.getPullRequest();
            // TODO destroy / re-init if Pull Request changes
            // use the pageState pullRequest for legacy PullRequestEdit, it expects a Brace model
            this._pullRequestEdit = new PullRequestEdit(pullRequest);

            var self = this;
            shortcuts.bind('pullRequestApprove', function () {
                var currentUserStatus = self.props.currentUserAsReviewer && self.props.currentUserAsReviewer.state;
                var newStatus = currentUserStatus === models.ApprovalState.APPROVED ? models.ApprovalState.UNAPPROVED : models.ApprovalState.APPROVED;
                self.onStatusClick(_.merge({ newStatus: newStatus }, TRIGGERED_BY_KEYBOARD));
            });

            shortcuts.bind('pullRequestEdit', function () {
                if (pullRequest.getState() !== models.PullRequestState.MERGED) {
                    self._pullRequestEdit.show();
                }
            });

            $(document).on('click', '.add-description', function () {
                self._pullRequestEdit.show();
            });

            shortcuts.bind('pullRequestWatch', function () {
                self.toggleWatch(TRIGGERED_BY_KEYBOARD);
            });

            events.once('bitbucket.internal.feature.comments.commentAdded', function () {
                // When a user comments check if they were already a participant
                // if they weren't then they should be set to watch the PR
                var allParticipants = [pullRequest.getAuthor().toJSON()].concat(pullRequest.getReviewers().toJSON()).concat(pullRequest.getParticipants().toJSON());
                var isParticipant = allParticipants.some(function (model) {
                    return model.user.name === pageState.getCurrentUser().id;
                });
                if (!isParticipant) {
                    pullRequest.setParticipants(pullRequest.getParticipants().toJSON().concat([new Participant({ user: pageState.getCurrentUser() })]));
                    self.toggleWatch({ watchState: true });
                }
            });

            this.initMergeThings();
            this.initDeclineButton();
            initKeyboardFlags();
        },
        onMoreAction: function onMoreAction(action) {
            switch (action) {
                case 'edit':
                    this._pullRequestEdit.show();
                    break;
                case 'watch':
                    this.toggleWatch();
                    break;
                case 'decline':
                    this.declineDialog.show();
                    break;
            }
        },
        onMergeClick: function onMergeClick() {
            this.mergeDialog.show();

            // Dialog2 automatically focuses the first focus-able element in the dialog, eg. the textarea, which
            // causes it to expand when the dialog is shown, so we re-add the .collapsed class to the form and
            // re-focus the Merge button instead.
            // Dialog2 docs mention a 'data-aui-focus-selector ' attribute to control what element receives focus
            // when the dialog is shown, but it appears to be ignored and overriden.
            // https://ecosystem.atlassian.net/browse/AUI-3299 to either re-implement it, or fix the docs
            collapseCommitMessage(this.mergeDialog);
            this.mergeDialog.$el.find('.confirm-button').focus();
        },
        onReOpenClick: function onReOpenClick() {
            var self = this;
            // pass along the promise so sub components can deal with promise outcomes too
            return ajax.rest({
                url: getActionUrl('reopen', true),
                type: 'POST'
            }).done(function (StashPullRequestJSON) {
                events.trigger('bitbucket.internal.feature.pullRequest.reopened', null, {
                    user: pageState.getCurrentUser().toJSON(),
                    pullRequest: StashPullRequestJSON
                });

                self.updatePullRequest(transformer.pullRequest(StashPullRequestJSON), true);
                self.mergeCheck();
            });
        },
        onSelfClick: function onSelfClick(addOrRemoveSelf, unwatch) {
            this.props.dispatch(changeSelfReviewer(this.props.pullRequest, this.props.currentUser, addOrRemoveSelf, this.props.currentUserAsReviewer && this.props.currentUserAsReviewer.state));

            if (addOrRemoveSelf === 'ADD_SELF') {
                this.props.dispatch(watch({
                    stateOnly: true,
                    watchState: true
                }));
            }

            if (unwatch) {
                this.props.dispatch(watch({ watchState: false }));
            }
        },
        onStatusClick: function onStatusClick(options) {
            if (!this.props.currentUserAsReviewer) {
                console.warn('Current user is not a reviewer');
            } else {
                this.props.dispatch(changeReviewerStatus(_.merge({
                    pullRequest: this.props.pullRequest,
                    user: this.props.currentUser,
                    oldStatus: this.props.currentUserAsReviewer.state
                }, options)));
            }
        },
        onMergeHelpDialogClose: function onMergeHelpDialogClose() {
            this.setState({ showMergeHelpDialog: false });
        },
        getConditions: function getConditions() {
            var isAuthor = this.props.pullRequest.author.user.name === this.props.currentUser.name;
            var canWrite = this.props.hasRepoWrite;
            var canEdit = canWrite || isAuthor;
            return {
                canMerge: canWrite,
                canDecline: canEdit,
                canEdit: canEdit,
                canReOpen: canEdit
            };
        },
        /**
         *
         * @param {Object} newPullRequestJSON
         * @param {boolean} dispatch - whether or not to dispatch the new pull request data
         */
        updatePullRequest: function updatePullRequest(newPullRequestJSON, dispatch) {
            // also update the pageState for current legacy operations.
            if (newPullRequestJSON._stash) {
                pageState.getPullRequest().set(newPullRequestJSON._stash);
            }
            if (dispatch === true) {
                this.props.dispatch({ type: 'PR_SET_PULL_REQUEST', payload: newPullRequestJSON });
            }
        },

        render: function render() {
            var props = {
                pullRequest: this.props.pullRequest,
                conditions: this.getConditions(),
                currentUser: this.props.currentUser,
                currentUserAsReviewer: this.props.currentUserAsReviewer,
                currentUserIsWatching: this.props.pullRequest.isWatching,
                mergeHelp: this.state.mergeHelp,
                onMoreAction: this.onMoreAction,
                currentUserStatus: this.props.currentUserAsReviewer && this.props.currentUserAsReviewer.state,
                onMergeClick: this.onMergeClick,
                onReOpenClick: this.onReOpenClick,
                onSelfClick: this.onSelfClick,
                onStatusClick: this.onStatusClick,
                permissionToReview: this.props.currentUser.name !== this.props.pullRequest.author.user.name,
                showMergeHelpDialog: this.state.showMergeHelpDialog,
                onMergeHelpDialogClose: this.onMergeHelpDialogClose
            };
            return React.createElement(PullRequestHeader, props);
        }
    });

    function mapStateToProps(state) {

        function currentUserAsReviewer() {
            return _.find(state.pullRequest.reviewers, function (reviewer) {
                return reviewer.user.name === state.currentUser.name;
            });
        }

        return {
            pullRequest: state.pullRequest,
            currentUser: state.currentUser,
            currentUserAsReviewer: currentUserAsReviewer()
        };
    }

    return ReactRedux.connect(mapStateToProps)(PullRequestHeaderView);
});