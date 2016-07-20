'use strict';

define('bitbucket/internal/feature/pull-request/pull-request-create', ['bacon', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/util/server', 'bitbucket/internal/feature/pull-request/metadata-generator', 'bitbucket/internal/feature/user/user-multi-selector', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/util/text', 'bitbucket/internal/widget/markup-editor', 'bitbucket/internal/widget/searchable-multi-selector', 'exports'], function (Bacon, $, _, nav, server, metadataGenerator, UserMultiSelector, pageState, events, fn, textUtil, MarkupEditor, SearchableMultiSelector, exports) {

    'use strict';

    /**
     * Initialises the PR form
     *
     * @param parent               - A container to put the form in
     * @param submittedReviewers   - If this is a failed submission, the reviewers who should go in the box
     * @param {Bacon.Property<SourceTargetSelectorState>} selectorProperty - The current state of the branch selectors.
     * @param {Bacon.Property<string>} tabProperty - The current state of the branch selectors.
     * @param canCreatePRProperty - A stream of True/False events describing the refs in the sourceTargetSelector
     */

    function initPullRequestForm(parent, submittedReviewers, selectorProperty, tabProperty, canCreatePRProperty) {
        var destroyables = [];

        var $form = $(parent);

        MarkupEditor.bindTo($form.find('.markup-editor'));

        var currentUser = pageState.getCurrentUser();

        var urlParams = {
            avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' }),
            permission: 'LICENSED_USER' // filter out non-licensed users
        };
        var dataSource = new SearchableMultiSelector.PagedDataSource(nav.rest().users().build(), urlParams);

        new UserMultiSelector($form.find('#reviewers'), {
            initialItems: submittedReviewers,
            excludedItems: currentUser ? [currentUser.toJSON()] : [],
            dataSource: dataSource
        });

        var updateReviewerSelector = selectorProperty.onValue(function (selectorState) {
            // filter out users with no read permission to the target
            $.extend(urlParams, {
                "permission.1": 'REPO_READ',
                "permission.1.repositoryId": selectorState.targetRepo.id
            });
        });
        destroyables.push({ destroy: updateReviewerSelector });

        var $button = $form.find('#submit-form');

        var destroy = canCreatePRProperty.onValue(function (notEqual) {
            $button.enable(notEqual).attr('aria-disabled', !notEqual);
        });
        destroyables.push({ destroy: destroy });

        var $title = $form.find("#title");
        if ($title.val() === '') {
            var titleChangedStream = $title.asEventStream('keydown').doAction(function (e) {
                $(e.target).data('title-changed', true);
            });
            destroy = selectorProperty.map(_.compose(textUtil.convertBranchNameToSentence.bind(textUtil), fn.dotX('source.getDisplayId'))).takeUntil(titleChangedStream).onValue($title.val.bind($title));

            destroyables.push({ destroy: destroy });
        }

        if ($('#pull-request-description').val() === '') {
            destroyables.push({ destroy: initDescriptionGeneration(selectorProperty, tabProperty) });
        }

        destroyables.push({ destroy: initPageState(selectorProperty) });

        return {
            destroy: function destroy() {
                _.invoke(destroyables, 'destroy');
            }
        };
    }

    /**
     * Initialise the PR create form description generation.
     *
     * @param {Bacon.Property<SourceTargetSelectorState>} selectorProperty - The current state of the branch selectors.
     * @param {Bacon.Property<string>} tabProperty - The current state of the branch selectors.
     * @returns {Function} to destroy all the listeners this function setup
     */
    function initDescriptionGeneration(selectorProperty, tabProperty) {
        var allSelected = selectorProperty.filter(function (state) {
            return state.source && state.target;
        });

        var waitingForCommitsTab = false;
        var pendingXHR;

        var onContentAdded = function onContentAdded(data) {
            if (waitingForCommitsTab) {
                waitingForCommitsTab = false;
                var commitMessageEls = $(data.values).filter(':not(.merge)').find('.message-subject');
                var commitMessages = _.map(commitMessageEls, function (e) {
                    return $(e).attr('title');
                });
                setTitleAndDescription(commitMessages);
            }
        };

        var onRestDone = function onRestDone(data) {
            var commits = _.filter(data.values, function (c) {
                return c.parents.length === 1;
            });
            var commitMessages = _.map(commits, fn.dot('message'));
            setTitleAndDescription(commitMessages);
            pendingXHR = null;
        };

        events.on('bitbucket.internal.widget.commitsTable.contentAdded', onContentAdded);

        var descriptionChangedStream = $('#pull-request-description').asEventStream('keydown').doAction(function (e) {
            $(e.target).data('description-changed', true);
            if (pendingXHR) {
                pendingXHR.abort();
                pendingXHR = null;
            }
        });

        var unsubSelector = Bacon.combineAsArray(allSelected, tabProperty)
        // combineAsArray seemed to produce duplicates that need to be skipped when changing tabs
        .skipDuplicates(function (a, b) {
            return a[0] === b[0] && a[1] === b[1];
        }).takeUntil(descriptionChangedStream).slidingWindow(2, 1).map(function (states) {
            // add a third item to the state indicating if the tab states are the same as previous
            if (states.length === 1) {
                states[0].push(false);
                return states[0];
            }
            states[1].push(states[0][1] !== states[1][1]);
            return states[1];
        }).onValue(function (states) {
            var selector = states[0];
            var tab = states[1];
            var tabStateChanged = states[2];

            if (tabStateChanged && waitingForCommitsTab || !tabStateChanged && tab !== 'commits') {
                waitingForCommitsTab = false;
                if (pendingXHR) {
                    pendingXHR.abort();
                    pendingXHR = null;
                }
                pendingXHR = updateDescriptionFromRest(selector.source, selector.target, onRestDone);
            } else if (!tabStateChanged && tab === 'commits') {
                waitingForCommitsTab = true;
            }
        });

        return function () {
            events.off('bitbucket.internal.widget.commitsTable.contentAdded', onContentAdded);
            unsubSelector();
        };
    }

    /**
     * Makes a REST request to get the commit information to load into the description
     *
     * @param {object} source The source branch
     * @param {object} target The target branch
     * @param {Function} onRestDone A callback to call when the rest request returns
     * @returns {jqXHR}
     */
    function updateDescriptionFromRest(source, target, onRestDone) {
        console.log("Rest for: " + source.getDisplayId() + " " + target.getDisplayId());
        var url = nav.project(source.getRepository().getProject()).repo(source.getRepository()).commits().withParams({
            until: source.getLatestCommit(),
            since: target.getLatestCommit(),
            secondaryRepositoryId: target.getRepository().getId(),
            start: 0,
            limit: 10
        }).build();

        return server.rest({
            type: 'GET',
            url: url,
            statusCode: { '*': false } // fail silently.
        }).done(onRestDone);
    }

    /**
     * Sets the title and description of the Pull Request, unless they were already changed manually.
     *
     * @param {string[]} commitMessages - commit messages to extract title/description from
     */
    function setTitleAndDescription(commitMessages) {
        if (commitMessages.length === 0) {
            return;
        }

        var $title = $('#title');
        var $description = $('#pull-request-description');
        var setTitle = !$title.data('title-changed');
        var setDescription = !$description.data('description-changed');

        if (setTitle && commitMessages.length === 1) {
            var data = metadataGenerator.generateTitleAndDescriptionFromCommitMessage(commitMessages[0]);
            $title.val(data.title);
            if (setDescription) {
                $description.val(data.description).trigger('input');
            }
        } else if (setDescription) {
            // Not setting the title is ok, as one was already set from the branch name
            var description = metadataGenerator.generateDescriptionFromCommitMessages(commitMessages);
            $description.val(description).trigger('input');
        }
    }

    /**
     * Depends on sourceTargetSelector already having been initialised
     *
     * @param {Bacon.Property<SourceTargetSelectorState>} selectorProperty - The current state of the branch selectors.
     */
    function initPageState(selectorProperty) {

        pageState.extend('sourceRepository');
        pageState.extend('targetBranch');
        pageState.extend('sourceBranch');

        return selectorProperty.onValue(function (state) {
            pageState.setProject(state.targetRepo.getProject());

            pageState.setRepository(state.targetRepo);
            pageState.setSourceRepository(state.sourceRepo);

            pageState.setTargetBranch(state.target);
            pageState.setSourceBranch(state.source);
        });
    }

    exports.init = initPullRequestForm;
});