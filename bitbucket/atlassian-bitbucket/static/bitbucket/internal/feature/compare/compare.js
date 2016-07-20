'use strict';

define('bitbucket/internal/feature/compare', ['aui', 'bacon', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/pull-request/pull-request-create', 'bitbucket/internal/feature/repository/source-target-selector', 'bitbucket/internal/model/repository', 'bitbucket/internal/model/revision-reference', 'bitbucket/internal/util/bacon', 'bitbucket/internal/util/dom-event', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/util/history', 'bitbucket/internal/util/shortcuts', 'bitbucket/internal/widget/keyboard-shortcuts', 'exports'], function (AJS, Bacon, $, _, nav, PullRequestCreate, SourceTargetSelector, Repository, RevisionReference, bacon, domEventUtil, events, fn, history, shortcuts, keyboardShortcuts, exports) {

    'use strict';

    var $tabMenu = $('.tabs-menu');

    /**
     * Generates the URL for the current state (selected tab, source branch, target branch).
     *
     * @param {boolean} prCreateMode               - If the page state should stay in a create PR context
     * @param {boolean} prShowing                  - If the page is in Pull Request create mode
     * @param {string} tab                         - currently selected tab, which should correspond to the name of a
     *                                               method on navbuild compare().
     * @param {SourceTargetSelectorState} selector - state of the repository/branch selector
     * @returns {string}          - url that represents the current state of `selector`
     */
    function calculateUrlForState(prCreateMode, prShowing, tab, selector) {
        var builder = nav.project(selector.sourceRepo.getProject()).repo(selector.sourceRepo);
        if (prShowing || prCreateMode) {
            builder = builder.createPullRequest();
        } else {
            builder = builder.compare()[tab]();
        }
        if (selector.target && !selector.target.isDefault()) {
            builder = builder.targetBranch(selector.target.getId());
        }
        if (selector.source && !selector.source.isDefault()) {
            builder = builder.sourceBranch(selector.source.getId());
        }
        builder = builder.targetRepo(selector.targetRepo.getId());
        return builder.build();
    }

    /**
     * Generates the URL that the form should POST to.
     *
     * @param {SourceTargetSelectorState} selector - state of the repository/branch selector
     * @returns {string} the URL the form should use, "" if no valid URL can be found.
     */
    function caculateFormURL(selector) {
        if (selector.targetRepo) {
            return nav.project(selector.targetRepo.getProject()).repo(selector.targetRepo).createPullRequest().build();
        }
        return "";
    }

    /**
     * Calculates the new page url and title
     *
     * @param {boolean} prCreateMode               - If the page state should stay in a create PR context
     * @param {boolean} prShowing                  - If the page is in Pull Request create mode
     * @param {string} tab                         - currently selected tab, which should correspond to the name of a
     *                                               method on navbuild compare().
     * @param {SourceTargetSelectorState} selector - state of the repository/branch selector
     * @returns {{url: string, title: string, selector: SourceTargetSelectorState, prShowing: boolean, tab: string}}
     */
    function calculateNewPageState(prCreateMode, prShowing, tab, selector) {
        var source = selector.sourceRepo;
        return {
            url: calculateUrlForState(prCreateMode, prShowing, tab, selector),
            formURL: caculateFormURL(selector),
            title: prShowing || prCreateMode ? AJS.I18n.getText('bitbucket.web.pullrequest.create.windowtitle', source.getProject().getName(), source.getName()) : AJS.I18n.getText('bitbucket.web.repository.compare.page.title', source.getProject().getName(), source.getName()),
            selector: selector,
            prShowing: prShowing,
            tab: tab
        };
    }

    /**
     * @returns {boolean} true if both refs are selected, otherwise false
     */
    function allRefsSelected(sourceTargetSelector) {
        return sourceTargetSelector.branchesSelected();
    }

    /**
     * The state for a `SourceTargetSelector`
     *
     * @typedef {object} SourceTargetSelectorState
     * @property {?object} source     - The currently selected source branch.
     * @property {object} sourceRepo - The currently selected source repository.
     * @property {?object} target     - The currently selected target branch.
     * @property {object} targetRepo - The currently selected target repository.
     */

    /**
     * @param {SourceTargetSelector} sourceTargetSelector
     * @returns {Bacon.Property<SourceTargetSelectorState>} a property of the state representing branch or
     *                                                      repository selectors, seeded with the current state
     */
    function branchStateProperty(sourceTargetSelector) {
        var branchState = function branchState() {
            return {
                source: sourceTargetSelector.getSourceBranch(),
                sourceRepo: sourceTargetSelector.getSourceRepository(),
                target: sourceTargetSelector.getTargetBranch(),
                targetRepo: sourceTargetSelector.getTargetRepository()
            };
        };

        var eventStreams = ['source.repositoryChanged', 'source.revisionRefChanged', 'source.revisionRefUnselected', 'target.repositoryChanged', 'target.revisionRefChanged', 'target.revisionRefUnselected'].map(function (name) {
            return bacon.events('bitbucket.internal.feature.repository.sourceTargetSelector.' + name);
        });
        return Bacon.mergeAll.apply(Bacon, eventStreams).map(branchState).toProperty(branchState());
    }

    /**
     * @param {Array<{pathSegment: string, init: function}>} tabs - an object where the key is the name of the tab and
     *                                                              value a function used to create the view..
     * @returns {Bacon<string>} return a stream of tab events (seeded with the initial value)
     */
    function initTabs(tabs) {

        var tabLookup = _.reduce(tabs, function (obj, value) {
            obj['compare-' + value.pathSegment + '-tab'] = value;
            return obj;
        }, {});

        var selectedTabDestroy = $.noop;

        function setTabActive($tab) {
            $tab.addClass('active-tab').siblings().removeClass('active-tab');
            selectedTabDestroy();
            var selectedTab = tabLookup[$tab.attr('data-module-key')];
            selectedTabDestroy = selectedTab.init();
            keyboardShortcuts.resetContexts();
            return selectedTab.pathSegment;
        }

        var tab = setTabActive($tabMenu.find('.active-tab'));

        // Create a event stream from the tab header clicks
        var tabChanges = $tabMenu.asEventStream('click', 'a').filter(domEventUtil.openInSameTab)
        // Stop the click only if someone subscribes - dirty but works
        .doAction(domEventUtil.preventDefault())
        // Discard the click if the tab is already active
        .flatMap(function (e) {
            var $tab = $(e.currentTarget).parent();
            if (!$tab.is('.active-tab')) {
                // Activate the tab and return the name
                return Bacon.constant(setTabActive($tab));
            }
            // Don't return anything, could have also done this as a filter
            return Bacon.never();
        });

        // Return a stream of the tab changes, starting with the current tab
        return tabChanges.toProperty(tab);
    }

    /**
     * Handles the render/destroy lifecycle of a tab, destroying the content when finished.
     *
     * @param {SourceTargetSelector} sourceTargetSelector -
     * @param {Function} createView                       - function that creates a single instance of a view and should return a destroy function
     * @returns {Function} function that destroys the current view
     */
    function renderTab(sourceTargetSelector, createView) {
        var $el = $('#compare-content');
        var destroy = $.noop;

        function doCreateView() {
            destroy();
            $el.empty();
            // Ideally we get a jQuery object back and add it ourselves
            destroy = createView($el);
        }

        // TODO Yuck - would like to do this in a cleaner way
        var events = bacon.events('bitbucket.internal.feature.repository.sourceTargetSelector.source.revisionRefChanged').merge(bacon.events('bitbucket.internal.feature.repository.sourceTargetSelector.target.revisionRefChanged')).map(fn.constant(sourceTargetSelector)).filter(allRefsSelected).onValue(doCreateView);

        // Execute the view creation immediately if both refs are selected.
        // Note that we explicitly execute this here rather than trying to make the bacon stream
        // execute immediately with ".merge(Bacon.fromArray([0]))" because that will cause the
        // execution to be delayed by an event cycle. That delay could cause other events to fire
        // before this method has executed.
        if (allRefsSelected(sourceTargetSelector)) {
            doCreateView();
        }
        return function () {
            destroy();
            events();
        };
    }

    function bindKeyboardShortcuts() {
        shortcuts.bind('requestBranchCompareSectionHandler', function (e) {
            var number = parseInt(String.fromCharCode(e.which), 10);
            var $tabLink = $tabMenu.children().eq(number - 1).children('a');
            $tabLink.click();
        });

        bacon.events('bitbucket.internal.widget.keyboard-shortcuts.register-contexts').onValue(function (keyboardShortcuts) {
            keyboardShortcuts.enableContext('branch-compare');
        });
    }

    /**
     * Sets up the transitions for going between the ref selector form and the PR details form.
     *
     * @param {Bacon.Property<boolean>} prShowingProperty - The current state of the form.
     * @param {Bacon.Property<SourceTargetSelectorState>} selectorProperty - The current state of the branch selectors.
     * @param {boolean} prCreateMode - If the form should always be in a PR create context.
     * @param {jQuery} $showPRButton - The button on the page that continues to the next stage.
     * @param {jQuery} $prFormParent - The parent that can be unhidden to revel the PR details form.
     * @param {jQuery} $compareEl    - The element that contains all of the compare feature elements.
     */
    function initFormTransitions(prShowingProperty, selectorProperty, prCreateMode, $showPRButton, $prFormParent, $compareEl) {
        var $title = $('.aui-page-header-main h2');
        var $expandedBranches = $compareEl.find('.expanded-branches');
        var $firstRefSelector = $compareEl.find('#sourceRepo');
        var $descriptionBox = $compareEl.find('#pull-request-description');

        prShowingProperty.doAction($showPRButton, 'toggleClass', 'hidden').doAction($expandedBranches, 'toggleClass', 'hidden').not().doAction($prFormParent.toggleClass.bind($prFormParent, 'hidden')).doAction(function (prNotShowing) {
            var oldNew = prNotShowing ? ['pullRequest', 'compare'] : ['compare', 'pullRequest'];
            events.trigger('bitbucket.internal.feature.compare.form.state', null, {
                oldForm: oldNew[0],
                newForm: oldNew[1]
            });
        }).doAction(function (prNotShowing) {
            (prNotShowing ? $firstRefSelector : $descriptionBox).focus();
        }).map(function (prNotShowing) {
            return prNotShowing && !prCreateMode ? AJS.I18n.getText('bitbucket.web.repository.compare.header.title') : AJS.I18n.getText('bitbucket.web.pullrequest.create.title');
        }).onValue($title.text.bind($title));

        prShowingProperty.combine(selectorProperty, function (prShowing, selector) {
            return { prShowing: prShowing, selector: selector };
        }).onValue(function (state) {
            if (state.prShowing) {
                var HTML = bitbucket.internal.feature.compare.collapsedBranches({
                    sourceBranch: state.selector.source.toJSON(),
                    targetBranch: state.selector.target.toJSON()
                });
                $(HTML).insertBefore($expandedBranches);
            } else {
                $compareEl.find('.collapsed-branches').remove();
            }
        });
    }

    /**
     *
     * @param {jQuery} $showPRButton      - The button on the page that continues to the next stage.
     * @returns {Bacon.Property<boolean>} - True => The PR details form is showing, False => The ref selectors are showing
     */
    function initPRShowingProperty($showPRButton) {
        return $(document).asEventStream('click', '.show-hide-button').map(function (e) {
            return $(e.target).is($showPRButton);
        }).toProperty($showPRButton.hasClass('hidden'));
    }

    /**
     * Sets up a stream of events for when the branches changes
     *
     * @param {Bacon.Property<SourceTargetSelectorState>} selectorProperty - The current state of the branch selectors.
     * @param {jQuery} $container                                          - The element containing the compare feature.
     * @returns {Bacon.EventStream}                                        - True => the selected refs are not the same, False => The selected refs are the same
     */
    function initCanCreatePR(selectorProperty, $container) {
        var creationErrorType = {
            REF_UNSELECTED: 'REF_UNSELECTED',
            TAG_SELECTED: 'TAG_SELECTED',
            REFS_EQUAL: 'REFS_EQUAL'
        };
        var prFromProperty = selectorProperty.debounce(0) // debounce for when the swap button is pressed
        .map(function (state) {
            var output = {
                canCreate: false
            };
            if (!state.source || !state.target) {
                output.reason = creationErrorType.REF_UNSELECTED;
            } else if (state.source.isTag() || state.target.isTag()) {
                output.reason = creationErrorType.TAG_SELECTED;
            } else if (state.source.isEqual(state.target)) {
                output.reason = creationErrorType.REFS_EQUAL;
            } else {
                output.canCreate = true;
            }
            return output;
        }).skipDuplicates().toProperty();

        var $createPrButton = $container.find('#show-create-pr-button');
        var $refsEqualWarning = $container.find('.refs-equal-warning');
        var $tagsWarning = $container.find('.tags-warning');
        var $tabs = $container.find('.aui-tabs');

        var canCreatePRProperty = prFromProperty.doAction(function (state) {
            $refsEqualWarning.toggleClass("hidden", state.reason !== creationErrorType.REFS_EQUAL);
            $tagsWarning.toggleClass("hidden", state.reason !== creationErrorType.TAG_SELECTED);
            $tabs.toggleClass("hidden", state.reason === creationErrorType.REF_UNSELECTED);
        }).map(fn.dot('canCreate'));

        canCreatePRProperty.doAction($createPrButton, 'enable').not().onValue($createPrButton, 'attr', 'aria-disabled');

        return canCreatePRProperty;
    }

    /**
     * Sets up what will happen to revert the page when a popstate event happens
     *
     * Because all of the transitions are controlled by bacon, and events firing on elements this function has to
     * invoke the events on each HTML level element.
     *
     * @param {Bacon.Property<Array>} rawStateProperty    - Array of <prShowing, tab, selector>.
     * @param {jQuery} $showPRButton                      - The show PR button to take the page to the next screen.
     * @param {jQuery} $compareEl                         - The element to find compare features in.
     * @param {SourceTargetSelector} sourceTargetSelector - Selector of set the state of when the page is changed.
     * @returns {Function} a destroy function that will unbind the bacon stream.
     */
    function initPopstate(rawStateProperty, $showPRButton, $compareEl, sourceTargetSelector) {
        var $cancelButton = $compareEl.find('#cancel-button');

        // filter out events that are caused by the user clicking #blah links.
        var historyEvents = bacon.events('bitbucket.internal.history.popstate').filter(fn.not(fn.dotEq('state', null)));
        return Bacon.combineAsArray(rawStateProperty, historyEvents).sampledBy(historyEvents).filter(function (state) {
            // check for popstate of {}
            return _.keys(state[1].state).length !== 0;
        }).map(function (state) {
            // clean up state object
            var rawState = state[0];
            var historyEvent = state[1];
            return {
                prShowing: rawState[0],
                tab: rawState[1],
                selector: rawState[2],
                oldState: historyEvent.state
            };
        }).onValue(function (state) {
            if (state.prShowing !== state.oldState.prShowing) {
                if (state.prShowing) {
                    $cancelButton.click();
                } else {
                    $showPRButton.click();
                }
            }

            if (state.tab !== state.oldState.tab) {
                $compareEl.find('li.menu-item[data-module-key=compare-' + state.oldState.tab + '-tab] > a').click();
            }

            // Check for changes in the branch or reference.
            // We cannot revert back to having nothing selected as that isn't supported by the ref selectors

            var oldSelector = state.oldState.selector;

            sourceTargetSelector.refSelectors.source.setSelection({
                repository: oldSelector.sourceRepo ? new Repository(oldSelector.sourceRepo) : null,
                branch: oldSelector.source ? new RevisionReference(oldSelector.source) : null
            });

            sourceTargetSelector.refSelectors.target.setSelection({
                repository: oldSelector.targetRepo ? new Repository(oldSelector.targetRepo) : null,
                branch: oldSelector.target ? new RevisionReference(oldSelector.target) : null
            });
        });
    }

    /**
     * Sanitizes a state object for pushing to history
     *
     * @param {object} state                             - A object representing the state of the page.
     * @param {string} state.url                         - URL that the page should be set to.
     * @param {string} state.title                       - A title that the page should have.
     * @param {boolean} state.prShowing                  - Is the PR details form showing.
     * @param {SourceTargetSelectorState} state.selector - The state of the selectors
     */
    function sanitizedState(state) {
        // clone the state object rather than changing it
        var safeState = _.clone(state);
        safeState.selector = {};

        // sanitize the selectors so they can be stored by the browser.
        _.each(state.selector, function (value, key) {
            safeState.selector[key] = value ? value.toJSON() : null;
        });

        return safeState;
    }

    /**
     * @param {HTMLElement} compareEl The element containing the compare feature.
     * @param {object} opts.targetRepositoryJson target branch's repository
     * @param {object} opts.sourceRepositoryJson source branch's repository
     * @param {object} opts.tabs tab notification callbacks
     * @param {Array<object>} opts.submittedReviewers reviewers to auto fill the suggestion with
     * @param {Array<object>} opts.additionalPreloadRepositories a list of repos to preload to speed up the selector
     * @param {boolean} opts.prCreateMode If the page state should stay in the PR creation context
     * @param {object} opts extra option options.
     */
    exports.onReady = function (compareEl, opts) {
        var $compareEl = $(compareEl);
        opts.prCreateMode = !!opts.prCreateMode;

        var additionalPreloadRepositories = _.map(opts.additionalPreloadRepositories, fn.create(Repository));

        var sourceTargetSelector = new SourceTargetSelector($compareEl.find('.compare-selector'), new Repository(opts.sourceRepositoryJson), new Repository(opts.targetRepositoryJson), additionalPreloadRepositories, { showTags: true });

        var tabProperty = initTabs(_.map(opts.tabs, function (callback, key) {
            return {
                pathSegment: key,
                init: _.partial(renderTab, sourceTargetSelector, _.partial(callback, sourceTargetSelector))
            };
        }));

        var selectorProperty = branchStateProperty(sourceTargetSelector);
        var canCreatePRProperty = initCanCreatePR(selectorProperty, $compareEl);

        var $prFormParent = $compareEl.find('.pull-request-create-form');
        var $showPRButton = $compareEl.find('#show-create-pr-button');
        var $prForm = $compareEl.find('form.aui');

        PullRequestCreate.init($prFormParent, opts.submittedReviewers || [], selectorProperty, tabProperty, canCreatePRProperty);
        var prShowingProperty = initPRShowingProperty($showPRButton);
        initFormTransitions(prShowingProperty, selectorProperty, opts.prCreateMode, $showPRButton, $prFormParent, $compareEl);

        var needsInitialState = true;

        var rawStateProperty = Bacon.combineAsArray(prShowingProperty, tabProperty, selectorProperty);
        initPopstate(rawStateProperty, $showPRButton, $compareEl, sourceTargetSelector);

        // Combine the _latest_ from either the tab events or changes to the branch selections
        // What's neat about this is we keep the last 'tab' so we don't need to track our own state
        // One sourceTargetSelector is merged in to give its stream an initial value
        rawStateProperty.map(Function.apply.bind(_.partial(calculateNewPageState, opts.prCreateMode)), null).onValue(function (state) {
            $prForm.attr('action', state.formURL);
            if (needsInitialState) {
                history.initialState(sanitizedState(state));
                needsInitialState = false;
            } else if (window.location.href.indexOf(state.url) === -1) {
                history.pushState(sanitizedState(state), state.title, state.url);
            }
        });

        bindKeyboardShortcuts();
    };
});