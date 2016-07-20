'use strict';

define('bitbucket/internal/feature/pull-request-edit', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/repository/branch-selector', 'bitbucket/internal/feature/user/user-multi-selector', 'bitbucket/internal/model/revision-reference', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/client-storage', 'bitbucket/internal/util/dom-event', 'bitbucket/internal/util/events', 'bitbucket/internal/util/focus-snapshot', 'bitbucket/internal/util/function', 'bitbucket/internal/util/warn-before-unload', 'bitbucket/internal/widget/markup-editor'], function (AJS, $, _, nav, BranchSelector, UserMultiSelector, RevisionReference, ajax, clientStorage, domEventUtil, events, focus, fn, warnBeforeUnload, MarkupEditor) {

    var REVIEWERS = "reviewers";
    var PULL_REQUEST_OUT_OF_DATE_EXCEPTION = 'com.atlassian.bitbucket.pull.PullRequestOutOfDateException';

    function PullRequestEdit(pullRequest, options) {
        var defaults = {
            width: 800,
            height: 350,
            id: "edit-pull-request-dialog",
            closeOnOutsideClick: false,
            focusSelector: '#pull-request-description', // do not remove, otherwise this effectively disables mention support in the dialog
            keypressListener: _.bind(this.keypressListener, this)
        };

        this._pullRequest = pullRequest;
        this._currentReviewerUsers = this._pullRequest.getReviewers();
        this._opts = $.extend({}, defaults, options);
        this._dialog = new AJS.Dialog(this._opts);
        this._dialogEl = $('#' + this._opts.id);
        this._isDisabled = false;
        this._draftKey = clientStorage.buildKey('draft-description', 'pull-request');
        this.initDialog();
    }

    PullRequestEdit.prototype.keypressListener = function (e) {
        e.stopImmediatePropagation(); // AUIDialog.updateHeight() rebinds the keypressListener at every call, even if it's already bound to the event;
        // thus we need to have jQuery stops the immediate propagation of the event to prevent successive invocations.
        // For example, the sequence dialog.show().updateHeight().updateHeight() would have the handler bound three times.
        // MM: I've verified the above comment (found in useredit.js:initialisePasswordDialog) and raise an issue for it here - https://ecosystem.atlassian.net/browse/AUI-1054

        // Handle Ctrl+Enter/Cmd+Enter
        // TODO: Add to keyboard shortcut dialog?
        if (domEventUtil.isCtrlish(e) && e.which === AJS.keyCode.ENTER) {
            e.preventDefault();
            $('.button-panel-submit-button', this._dialogEl).click();
        }
        if (e.keyCode === 27 && this._dialogEl.is(":visible") && !this._isDisabled) {
            //Esc closes dialog only when it's not disabled (has pending request)
            MarkupEditor.unbindFrom(this._dialog.getCurrentPanel().body);
            this.hide();
        }
    };

    PullRequestEdit.prototype.initDialog = function () {
        this._$buttonPanel = this._dialog.addHeader(AJS.I18n.getText('bitbucket.web.pullrequest.edit.header')).addPanel(AJS.I18n.getText('bitbucket.web.pullrequest.edit.header')).addSubmit(AJS.I18n.getText('bitbucket.web.button.save'), _.bind(this.save, this)).addCancel(AJS.I18n.getText('bitbucket.web.button.cancel'), _.bind(this.cancel, this)).getPage(0).buttonpanel;

        this._$spinner = $('<div class="spinner"></div>').prependTo(this._$buttonPanel);

        this.triggerPanelResize = _.bind(this.triggerPanelResize, this);

        this._dialogEl.on('input', 'textarea#pull-request-description', this.updateDraftDescription.bind(this));
    };

    /**
     * Update the stored draft description, debounced by 300ms
     * Removes the draft if the textarea is cleared
     */
    PullRequestEdit.prototype.updateDraftDescription = _.debounce(function (e) {
        var text = e.target.value;

        if (text) {
            clientStorage.setSessionItem(this._draftKey, text);
        } else {
            this.deleteDraftDescription();
        }
    }, 300);

    /**
     * Remove the draft description
     */
    PullRequestEdit.prototype.deleteDraftDescription = function () {
        clientStorage.removeSessionItem(this._draftKey);
    };

    PullRequestEdit.prototype.populatePanelFromPullRequest = function () {
        var draftDescription = clientStorage.getSessionItem(this._draftKey);

        this.updatePanel({
            title: this._pullRequest.getTitle(),
            description: draftDescription || this._pullRequest.getDescription(),
            // TODO It shouldn't be required to add type - https://jira.atlassian.com/browse/STASHDEV-3538
            toRef: _.extend({ type: RevisionReference.type.BRANCH }, this._pullRequest.getToRef().toJSON()),
            reviewers: this._currentReviewerUsers.map(function (reviewer) {
                return reviewer.getUser().toJSON();
            })
        }, !!draftDescription);
    };

    PullRequestEdit.prototype.triggerPanelResize = function () {
        // blocks any resize of the dialog if it is maximised. Otherwise the method used by updateHeight() (which resets
        // the height of all dialog's panels to 'auto' to compute their unconstrained heights) means that any vertical
        // scrollbar is removed and then restored to its top position when the panel's height is assigned to the computed
        // height value.
        // For the user, this results in a jump of the scroll position to the top, as he/she is typing.
        // Additionally, memorizing the scroll position before invoking updateHeight() is not a solution either,
        // because the new vertical scrollbar might have a different scroll length after the resize of the panel.
        var isDialogMaximised = this._dialog.isMaximised();
        var visiblePanel = this._dialog.getCurrentPanel().body;
        var visiblePanelHasNoScrollbar = visiblePanel.innerHeight() >= visiblePanel.get(0).scrollHeight; // used to get out of the maximised state
        if (!isDialogMaximised || visiblePanelHasNoScrollbar) {
            _.defer(_.bind(function () {
                if (this.isVisible()) {
                    focus.save();
                    this._dialog.updateHeight();
                    focus.restore();
                }
            }, this));
        }
    };

    /**
     * Update the dialog contents
     * @param {object} templateData - The data to populate the soy template with
     * @param {boolean} isRestoredDraftDescription - Whether or not the update includes a restored draft description
     */
    PullRequestEdit.prototype.updatePanel = function (templateData, isRestoredDraftDescription) {
        var $editPanel = this._dialog.getCurrentPanel().body;

        if (templateData.reviewers.length && templateData.reviewers[0].user) {
            //If we are supplied a collection of Pull Request Participants (with role and approval state) , pluck out just the user object.
            templateData.reviewers = _.pluck(templateData.reviewers, 'user');
        }

        $editPanel.empty().append(bitbucket.internal.feature.pullRequest.edit(templateData));

        if (isRestoredDraftDescription) {
            $editPanel.find('textarea#pull-request-description').addClass('restored').attr("title", AJS.I18n.getText('bitbucket.web.pullrequest.edit.description.restored')).one('click keydown input', function (e) {
                $(e.target).removeClass('restored').removeAttr('title');
            });
        }

        this.userSelect = new UserMultiSelector($editPanel.find("#reviewers"), {
            initialItems: templateData.reviewers,
            excludedItems: [this._pullRequest.getAuthor().getUser().toJSON()], //Exclude the PR author from the user select, rather than the current user.
            urlParams: {
                "permission.1": 'LICENSED_USER', // only licensed users
                "permission.2": 'REPO_READ', // only users with READ to the target repository
                "permission.2.repositoryId": this._pullRequest.getToRef().getRepository().getId()
            }
        });

        var $branchSelectorTrigger = $editPanel.find('#toRef');
        this.branchSelector = new BranchSelector($branchSelectorTrigger, {
            id: 'toRef-dialog',
            repository: this._pullRequest.getToRef().getRepository(),
            field: $branchSelectorTrigger.next('input')
        });

        MarkupEditor.bindTo($editPanel).on('resize', this.triggerPanelResize.bind(this));

        this.triggerPanelResize();
    };

    function toReviewer(user) {
        return {
            user: user
        };
    }

    PullRequestEdit.prototype.getPullRequestUpdateFromForm = function ($form) {
        return {
            title: $form.find('#title').val(),
            description: $form.find('#pull-request-description').val(),
            reviewers: _.map(this.userSelect.getSelectedItems(), toReviewer),
            toRef: this.branchSelector.getSelectedItem().toJSON(),
            version: this._pullRequest.getVersion()
        };
    };

    /**
     *
     * @param original the original potentially decorated pull request
     * @returns a simple pull request object containing only the required properties by a PUT, apart from the version
     */
    function sanitizedPullRequestJSON(original) {
        var sanitized = _.pick(original, ['title', 'description']);

        if (_.has(original, 'reviewers')) {
            sanitized.reviewers = _.chain(original.reviewers)
            // we first pluck the user.name, sort the strings
            // then unpluck them. This gives us a deep copy,
            // which is sorted efficiently by not doing excessive
            // property lookups and only contains the properties
            // we want
            .map(fn.dot('user.name')).sort().map(function (name) {
                return {
                    user: {
                        name: name
                    }
                };
            }).value();
        }
        if (_.has(original, 'toRef')) {
            sanitized.toRef = {
                id: original.toRef.id
            };
        }

        return sanitized;
    }

    /**
     * Perform a three way merge of the pull request
     *
     * @param baseline the pull request as it existed when the page was loaded
     * @param them the pull request as it exists on the server right now
     * @param us the updated pull request which failed to be PUT to the server
     * @returns a simple object representation the pull request resulting from the merge, or null if there is a conflict
     */
    PullRequestEdit.prototype.mergePullRequestUpdate = function (baseline, them, us) {
        var themVersion = them.version;

        baseline = sanitizedPullRequestJSON(baseline);
        them = sanitizedPullRequestJSON(them);
        us = sanitizedPullRequestJSON(us);

        var merged = _.reduce(_.keys(us), function (merged, prop) {
            if (!merged) {
                return null;
            }

            var themProp = them[prop];
            var usProp = us[prop];
            if (_.isEqual(themProp, usProp)) {
                // There is no difference, ignore
                return merged;
            }

            var baseProp = baseline[prop];
            if (_.isEqual(baseProp, usProp)) {
                // We didn't make any change, ignore
                return merged;
            }

            if (_.isEqual(baseProp, themProp)) {
                // We made a change and there is no conflict
                // update the merged result
                merged[prop] = usProp;
                return merged;
            }

            // There is a conflict
            return null;
        }, _.merge({}, them));

        if (merged) {
            merged.version = themVersion;
        }
        return merged;
    };

    PullRequestEdit.prototype.save = function (dialog, page) {
        if (this._isDisabled) {
            return;
        }

        var pullRequestUpdate = this.getPullRequestUpdateFromForm(page.getCurrentPanel().body.find('form'));

        if (!pullRequestUpdate.title) {
            //PR title is empty, which means the rest endpoint would ignore it.
            var noTitleError = AJS.I18n.getText('bitbucket.web.pullrequest.edit.no.title');
            this.updatePanel($.extend({ fieldErrors: { 'title': [noTitleError] } }, pullRequestUpdate));
            return;
        }

        this._$spinner.show().spin('small');
        this.toggleDisabled(true);
        return this._doSave(pullRequestUpdate);
    };

    PullRequestEdit.prototype._doSave = function (pullRequestUpdate) {
        var self = this;
        var request = ajax.rest({
            url: nav.rest().currentPullRequest().withParams({ avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' }) }).build(),
            type: 'PUT',
            data: pullRequestUpdate,
            statusCode: {
                '400': false,
                '409': false
                //TODO: complete this list
            }
        });

        warnBeforeUnload(request, AJS.I18n.getText('bitbucket.web.pullrequest.pending.request', bitbucket.internal.util.productName()));

        request.done(function (updatedPullRequest) {
            //TODO: in future we should use `new PullRequest(updatedPullRequest))` to update the page without a refresh.
            self.deleteDraftDescription();
            window.location.reload();
        });

        request.fail(function (xhr, testStatus, errorThrown, data, fallbackError) {
            var errors = [];
            var fieldErrors = {};
            var validReviewers;

            // If the only error is that the pull request is out of date, and we are able to do a three way merge
            // of the updates, then automatically re-attempt the request
            if (data.errors.length === 1 && data.errors[0].exceptionName === PULL_REQUEST_OUT_OF_DATE_EXCEPTION) {
                var revisedPullRequestUpdate = self.mergePullRequestUpdate(self._pullRequest.toJSON(), data.errors[0].pullRequest, pullRequestUpdate);
                if (revisedPullRequestUpdate) {
                    self._doSave(revisedPullRequestUpdate);
                    return;
                }
            }

            _.each(data.errors, function (error) {
                if (error.context) {
                    if (!Object.prototype.hasOwnProperty.call(fieldErrors, error.context)) {
                        fieldErrors[error.context] = [];
                    }
                    if (error.context === REVIEWERS) {
                        // This is a bit clunky, but the rest response has the per user error messages and
                        // the collection of valid users _inside_ the single com.atlassian.stash.pull.InvalidPullRequestParticipantException
                        fieldErrors[error.context] = _.pluck(error.reviewerErrors, "message");
                        errors.push(error);
                        validReviewers = error.validReviewers;
                    } else {
                        fieldErrors[error.context].push(error.message);
                    }
                } else {
                    if (error.exceptionName === PULL_REQUEST_OUT_OF_DATE_EXCEPTION) {
                        //remove hash from href, else the browser will treat it as a hash change and won't refresh.
                        error.messageContent = AJS.escapeHtml(error.message) + " <a href='" + window.location.href.split("#")[0] + "'>" + AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.reload')) + "</a>.";
                    }
                    errors.push(error);
                }
            });

            //$.extend will ignore undefined properties, so if validReviewers is undefined, it will not overwrite pullRequestUpdate.reviewers
            self.updatePanel($.extend({ errors: errors, fieldErrors: fieldErrors }, pullRequestUpdate, { reviewers: validReviewers }));
            self._$spinner.spinStop().hide();
            self.toggleDisabled(false);
        });
    };

    PullRequestEdit.prototype.toggleDisabled = function (disable) {
        if ((typeof disable === 'undefined' ? 'undefined' : babelHelpers.typeof(disable)) === undefined) {
            disable = !this._isDisabled;
        }

        this._$buttonPanel.toggleClass("disabled", disable);
        this._$buttonPanel.find('button')[disable ? "attr" : "removeAttr"]('disabled', 'disabled');
        this._dialog[disable ? 'disable' : 'enable']();
        this._isDisabled = disable;
    };

    PullRequestEdit.prototype.cancel = function () {
        if (!this._isDisabled) {
            MarkupEditor.unbindFrom(this._dialog.getCurrentPanel().body);
            this.deleteDraftDescription();
            this.hide();
        }
    };

    PullRequestEdit.prototype.isVisible = function () {
        return this._dialogEl.is(":visible");
    };

    PullRequestEdit.prototype.show = function () {
        this.populatePanelFromPullRequest();
        this._dialog.show();
        events.on('window.resize.debounced', this.triggerPanelResize);
    };

    PullRequestEdit.prototype.hide = function () {
        document.activeElement.blur(); //Prevent dialog from maintaining focus on hide. https://ecosystem.atlassian.net/browse/AUI-1059
        this._dialog.hide();
        events.off('window.resize.debounced', this.triggerPanelResize);
    };

    PullRequestEdit.prototype.bind = function (selector) {
        var self = this;

        $(document).on('click', selector, function (e) {
            e.preventDefault();

            self.show();
        });
    };

    return PullRequestEdit;
});