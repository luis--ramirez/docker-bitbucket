'use strict';

define('bitbucket/internal/feature/repository/source-target-selector', ['jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/repository/branch-selector', 'bitbucket/internal/feature/repository/related-repository-selector', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/dom-event', 'bitbucket/internal/util/events'], function ($, _, nav, BranchSelector, RelatedRepositorySelector, ajax, domEvent, events) {

    /**
     * A selector for picking source, target branches/repositories
     *
     * @param $container
     * @param sourceRepository
     * @param targetRepository
     * @param additionalPreloadRepositories
     * @param options
     * @constructor
     */
    function SourceTargetSelector($container, sourceRepository, targetRepository, additionalPreloadRepositories, options) {
        this.init.apply(this, arguments);
    }

    SourceTargetSelector.prototype.defaults = {
        showCommitBadges: true,
        showTags: false
    };

    SourceTargetSelector.prototype.init = function ($container, sourceRepository, targetRepository, additionalPreloadRepositories, options) {
        var self = this;

        self.refSelectors = {};
        self.options = $.extend({}, self.defaults, options);

        var contexts = [{ name: 'source', repository: sourceRepository }, { name: 'target', repository: targetRepository }];

        var preloadedRepoPage = RelatedRepositorySelector.constructDataPageFromPreloadArray(_.chain(contexts).pluck('repository').union(additionalPreloadRepositories).compact().uniq(function (repo) {
            return repo.getId();
        }) // remove dupes
        .invoke('toJSON').value());

        _.each(contexts, function (context) {
            var $branchSelectorTrigger = $('.' + context.name + 'Branch', $container);
            var $branchInput = $branchSelectorTrigger.next('input');
            var $repoSelectorTrigger = $('.' + context.name + 'Repo', $container);
            var $repoInput = $repoSelectorTrigger.next('input');

            var refSelector = {
                $headCommitSpinner: $("<div class='spinner'/>").insertAfter($branchInput),
                branchSelector: new BranchSelector($branchSelectorTrigger, {
                    id: context.name + 'BranchDialog',
                    context: context.name,
                    repository: context.repository,
                    field: $branchInput,
                    show: { branches: true, tags: self.options.showTags },
                    paginationContext: 'source-target-selector'
                }),
                repoSelector: new RelatedRepositorySelector($repoSelectorTrigger, {
                    id: context.name + "RepoDialog",
                    context: context.name,
                    repository: context.repository,
                    field: $repoInput,
                    preloadData: preloadedRepoPage
                }),
                getBranch: function getBranch() {
                    return this.branchSelector.getSelectedItem();
                },
                getRepo: function getRepo() {
                    return this.repoSelector.getSelectedItem();
                },
                getSelection: function getSelection() {
                    return {
                        repository: this.getRepo(),
                        branch: this.getBranch()
                    };
                },
                setSelection: function setSelection(selection) {
                    // Repo selection has to be first
                    if (selection.repository) {
                        this.repoSelector.setSelectedItem(selection.repository);
                    } else {
                        this.repoSelector.clearSelection();
                    }

                    if (selection.branch) {
                        this.branchSelector.setSelectedItem(selection.branch);
                    } else {
                        this.branchSelector.clearSelection();
                        this._getCommitBadge().empty();
                    }
                },
                _getCommitBadge: function _getCommitBadge() {
                    return this.branchSelector.$trigger.siblings('.commit-badge-detailed');
                }
            };

            refSelector._getCommitBadge().find('.commitid').tooltip();

            self.refSelectors[context.name] = refSelector;
        });

        $container.find('.swap-button').on('click', domEvent.preventDefault(this.swap.bind(this)));

        events.on('bitbucket.internal.feature.repository.revisionReferenceSelector.revisionRefChanged', function (revisionRef, context) {
            var refSelector = self.refSelectors[context];

            if (self.options.showCommitBadges) {
                self._updateCommitBadge(refSelector, revisionRef);
            }

            // Focus the next input user needs to fill in
            if (context === 'source') {
                self.refSelectors.target.repoSelector.$trigger.focus();
            }

            events.trigger('bitbucket.internal.feature.repository.sourceTargetSelector.' + context + '.revisionRefChanged', self, revisionRef);
        });

        events.on('bitbucket.internal.feature.repository.repositorySelector.repositoryChanged', function (repository, context) {
            var refSelector = self.refSelectors[context];
            refSelector.branchSelector.setRepository(repository);
            refSelector.branchSelector.$trigger.focus();

            if (self.options.showCommitBadges) {
                self._updateCommitBadge(refSelector, null);
            }

            events.trigger('bitbucket.internal.feature.repository.sourceTargetSelector.' + context + '.repositoryChanged', self, repository);
        });

        events.on('bitbucket.internal.feature.repository.revisionReferenceSelector.revisionRefUnselected', function (revisionRef, context) {
            var refSelector = self.refSelectors[context];

            if (self.options.showCommitBadges) {
                self._updateCommitBadge(refSelector, revisionRef);
            }

            events.trigger('bitbucket.internal.feature.repository.sourceTargetSelector.' + context + '.revisionRefUnselected', self, revisionRef);
        });

        return self;
    };

    SourceTargetSelector.prototype.swap = function () {
        var sourceSelector = this.refSelectors.source;
        var targetSelector = this.refSelectors.target;
        var sourceSelection = sourceSelector.getSelection();

        sourceSelector.setSelection(targetSelector.getSelection());
        targetSelector.setSelection(sourceSelection);
    };

    SourceTargetSelector.prototype._updateCommitBadge = function (refSelector, revisionRef) {
        var self = this;
        var $commitBadge = refSelector._getCommitBadge();

        $commitBadge.hide().empty();

        if (revisionRef) {
            refSelector.$headCommitSpinner.show().spin('small');
            var repo = refSelector.getRepo();
            ajax.rest({
                url: nav.rest().project(repo.getProject()).repo(repo).commit(revisionRef.getLatestCommit()).build()
            }).done(function (commit) {
                var $newCommitBadge = $(bitbucket.internal.feature.commit.commitBadge.oneline({
                    commit: commit,
                    linkAuthor: false,
                    messageTooltip: true,
                    repository: repo.toJSON()
                }));

                $commitBadge.append($newCommitBadge);
                $commitBadge.fadeIn();
                $commitBadge.find('.commitid').tooltip();
            }).always(function () {
                refSelector.$headCommitSpinner.spinStop().hide();
            });
        } else {
            $commitBadge.empty();
        }
    };

    SourceTargetSelector.prototype.branchesSelected = function () {
        return !!(this.refSelectors.source.getBranch() && this.refSelectors.target.getBranch());
    };

    SourceTargetSelector.prototype.refsAreEqual = function () {
        var sourceRef = this.refSelectors.source.getBranch();
        var targetRef = this.refSelectors.target.getBranch();

        return !!(sourceRef && sourceRef.isEqual(targetRef));
    };

    SourceTargetSelector.prototype.getSourceRepository = function () {
        return this.refSelectors.source.getRepo();
    };

    SourceTargetSelector.prototype.getTargetRepository = function () {
        return this.refSelectors.target.getRepo();
    };

    SourceTargetSelector.prototype.getSourceBranch = function () {
        return this.refSelectors.source.getBranch();
    };

    SourceTargetSelector.prototype.getTargetBranch = function () {
        return this.refSelectors.target.getBranch();
    };

    return SourceTargetSelector;
});