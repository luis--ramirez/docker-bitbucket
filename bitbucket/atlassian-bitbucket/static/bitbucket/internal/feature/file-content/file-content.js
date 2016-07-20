'use strict';

define('bitbucket/internal/feature/file-content', ['aui', 'jquery', 'lodash', 'require', 'bitbucket/feature/files/file-handlers', 'bitbucket/util/navbuilder', 'bitbucket/internal/bbui/ediff/ediff', 'bitbucket/internal/feature/comments', 'bitbucket/internal/model/commit-range', 'bitbucket/internal/model/content-tree-node-types', 'bitbucket/internal/model/file-change', 'bitbucket/internal/model/file-change-types', 'bitbucket/internal/model/file-content-modes', 'bitbucket/internal/model/revision', 'bitbucket/internal/util/dom-event', 'bitbucket/internal/util/events', 'bitbucket/internal/util/promise'], function (AJS, $, _, require, fileHandlers, nav, ediff, comments, CommitRange, ContentNodeType, FileChange, ChangeType, FileContentModes, Revision, eventUtil, events, promise) {

    function getRawUrl(path, revisionRef) {
        var urlBuilder = nav.currentRepo().raw().path(path);

        if (revisionRef && !revisionRef.isDefault()) {
            urlBuilder = urlBuilder.at(revisionRef.getId());
        }

        return urlBuilder.build();
    }

    function FileContent(containerSelector, id) {

        var self = this;

        this._id = id || undefined;
        this._containerSelector = containerSelector;

        events.on('bitbucket.internal.feature.commitselector.commitSelected', function (commit, pullRequest, path, srcPath) {
            var revision = new Revision(commit);
            if (this === self.untilRevisionPicker) {
                events.trigger('bitbucket.internal.feature.filecontent.untilRevisionChanged', self, revision, path, srcPath);
            }
        });

        this._lastInitPromise = promise.thenAbortable($.Deferred().resolve());
    }

    // These are only implemented in diffs currently, not source.
    FileContent.commentMode = comments.commentMode;

    FileContent.diffPreset = {
        contentMode: FileContentModes.DIFF,
        untilRevisionPicker: true,
        rawLink: false,
        sourceLink: false,
        modeToggle: true,
        changeTypeLozenge: false,
        changeModeLozenge: false,
        breadcrumbs: false,
        commentMode: FileContent.commentMode.NONE
    };

    FileContent.sourcePreset = {
        contentMode: FileContentModes.SOURCE,
        untilRevisionPicker: true,
        rawLink: true,
        sourceLink: false,
        modeToggle: true,
        changeTypeLozenge: false,
        changeModeLozenge: false,
        breadcrumbs: false,
        commentMode: FileContent.commentMode.NONE
    };

    FileContent.defaults = {
        contentMode: FileContentModes.SOURCE,
        untilRevisionPicker: false,
        rawLink: false,
        sourceLink: false,
        modeToggle: false,
        changeTypeLozenge: false,
        changeModeLozenge: false,
        fileIcon: false,
        breadcrumbs: false,
        scrollPaneSelector: undefined,
        commentMode: FileContent.commentMode.REPLY_ONLY,
        pullRequestDiffLink: false,
        toolbarWebFragmentLocationPrimary: null,
        toolbarWebFragmentLocationSecondary: null,
        asyncDiffModifications: true,
        attachScroll: true,
        scrollStyle: 'fixed'
    };

    FileContent.prototype.initToolbarItems = function (headRef, fileChange, autoSrcPath) {
        var $container = $(this._containerSelector);
        var untilRevision = fileChange.getCommitRange().getUntilRevision();
        var $self = $(bitbucket.internal.feature.fileContent.main($.extend({
            id: this._id,
            preloaded: !!fileChange.getDiff(),
            sourceUrl: this._options.sourceUrl || this._options.modeToggle ? nav.currentRepo().browse().path(fileChange.getPath()).at(headRef.getDisplayId()).until(untilRevision && untilRevision.getId()).build() : '',
            diffUrl: this._options.modeToggle ? nav.currentRepo().diff(fileChange, headRef, this._options.headPath, autoSrcPath).at(headRef.getDisplayId()).build() : '',
            fileChange: fileChange.toJSON()
        }, this._options)));

        this.$self && this.$self.remove();
        this.$self = $self.appendTo($container);
        var $toolbar = this.$toolbar = $self.children('.file-toolbar');
        this.$contentView = $self.children('.content-view');

        this._initCommands();

        if (this._options.breadcrumbs) {
            this.$breadcrumbs = $toolbar.find(".breadcrumbs");
        } else {
            this.$breadcrumbs = null;
        }

        if (this._options.changeTypeLozenge) {
            this.$changeTypeLozenge = $toolbar.find(".change-type-placeholder");
        } else {
            this.$changeTypeLozenge = null;
        }

        if (this._options.changeModeLozenge) {
            this.$changeModeLozenge = $toolbar.find(".change-mode-placeholder");
        } else {
            this.$changeModeLozenge = null;
        }

        if (this._options.sourceLink) {
            this.$viewSource = $toolbar.find(".source-view-link").tooltip({
                gravity: 'ne'
            });
        } else {
            this.$viewSource = null;
        }

        if (this._options.pullRequestDiffLink) {
            $toolbar.find(".pull-request-diff-outdated-lozenge").tooltip({
                gravity: 'ne'
            });
        }
    };

    FileContent.prototype._initCommands = function () {
        var $container = this._containerSelector;
        var $contentView = this.$contentView;
        var $toolbar = this.$toolbar;

        if (this._options.scrollPaneSelector === 'self') {
            $contentView.addClass('scroll-x');
        }

        if (this.untilRevisionPicker) {
            this.untilRevisionPicker.destroy();
        }
        if (this._options.untilRevisionPicker) {
            var CommitSelector = require('bitbucket/internal/feature/file-content/commit-selector');

            this.untilRevisionPicker = new CommitSelector({
                buttonEl: $toolbar.find('.until-commit-button'),
                id: 'until-commit'
            });
        } else {
            this.untilRevisionPicker = null;
        }

        if (this._options.rawLink) {
            this.$viewRaw = $toolbar.find('.raw-view-link');
        } else {
            this.$viewRaw = null;
        }

        if (this._options.modeToggle) {
            this.$modeToggle = $toolbar.find('.mode-toggle').tooltip({
                gravity: 'ne'
            });
        } else {
            this.$modeToggle = null;
        }
    };

    /**
     * @param {FileChange} fileChange - A change object for this diff.
     * @param {object} options - Options for this initForContent function.
     * @param {Path} options.headPath - The path of the file at HEAD.
     * @param {RevisionReference} options.headRef - The file's target revision reference.
     * @param {*} options.anchor - An anchor for deep linking.
     * @param {String} options.contentMode - The mode of content. This is either 'source' or 'diff'.
     * @param {boolean} options.followRenames - Whether to follow renames, used in the history dropdown.
     * @param {boolean} options.autoSrcPath - If true, follow renames in diff view.
     * @param {function} options.commentUrlBuilder - The comments rest endpoint to use.
     *
     * @returns {Promise}
     */
    FileContent.prototype.initForContent = function (fileChange, options) {
        options = options || {};
        var untilRevision = fileChange.getCommitRange().getUntilRevision();

        if (this.$viewSource) {
            if (fileChange.getType() === ChangeType.DELETE || fileChange.getNodeType() === ContentNodeType.SUBMODULE) {
                this.$viewSource.addClass("hidden");
            } else {
                this.$viewSource.attr('href', nav.currentRepo().browse().path(fileChange.getPath()).at(untilRevision && untilRevision.getId()).build());
            }
        }

        if (this.$viewRaw) {
            this.$viewRaw.attr('href', getRawUrl(fileChange.getPath(), untilRevision && untilRevision.getRevisionReference()));
        }

        if (this.untilRevisionPicker) {
            var itemUrl = function itemUrl(commit, self) {
                var urlBuilder = nav.currentRepo();
                if (self._mode === FileContentModes.DIFF) {
                    urlBuilder = urlBuilder.diff(new FileChange({
                        commitRange: new CommitRange({
                            untilRevision: commit
                        }),
                        path: commit.properties && commit.properties.change.path || self._path,
                        srcPath: commit.properties && commit.properties.change.srcPath || undefined
                    }), self._headRevisionRef, self._path, false);
                } else {
                    var urlParams = { until: commit.id };
                    if (commit.properties.change.path !== self._path.toString()) {
                        urlParams.untilPath = commit.properties.change.path;
                    }
                    if (commit.properties.change.srcPath) {
                        urlParams.sincePath = commit.properties.change.srcPath;
                    } else {
                        urlParams.autoSincePath = false;
                    }
                    urlBuilder = urlBuilder.browse().path(self._path).withParams(urlParams);
                }
                return urlBuilder.build();
            };
            this.untilRevisionPicker.init({
                followRenames: options.followRenames,
                headRevisionReference: options.headRef,
                itemTemplate: bitbucket.internal.feature.fileContent.commitSelectorItemAuthor,
                itemTitle: function itemTitle(commitId) {
                    return AJS.I18n.getText('bitbucket.web.file.history.revision.clicktoview', commitId);
                },
                itemUrl: itemUrl,
                mode: options.contentMode,
                path: options.headPath,
                selectedCommit: untilRevision && untilRevision.toJSON()
            });
        }

        if (this.$breadcrumbs) {
            this.$breadcrumbs.html(this.renderBreadCrumbs(fileChange.getPath()));
        }

        if (this.$changeTypeLozenge) {
            this._initChangeTypeLozenge(fileChange);
        }

        if (this.$changeModeLozenge) {
            var lozenge = this.getFileChangedModeLozenge(fileChange);
            if (lozenge) {
                this.$changeModeLozenge.append($(lozenge).tooltip());
            }
        }

        if (this.$modeToggle) {
            this.$modeToggle.on('click', 'a:not(.active,.disabled)', function (e) {
                if (!eventUtil.openInSameTab(e)) {
                    return;
                }
                e.preventDefault();
                events.trigger('bitbucket.internal.feature.filecontent.requestedModeChange', this, $(this).hasClass('mode-diff') ? FileContentModes.DIFF : FileContentModes.SOURCE);
            });
        }

        // Check the documentation in bitbucket/feature/files/file-handlers - please update if changing this
        var fileHandlingContext = {
            $toolbar: this.$toolbar,
            $container: this.$contentView,
            asyncDiffModifications: this._options.asyncDiffModifications,
            attachScroll: this._options.attachScroll,
            autoResizing: this._options.autoResizing,
            contentMode: this._options.contentMode,
            commentMode: this._options.commentMode,
            diffUrlBuilder: this._options.diffUrlBuilder,
            fileChange: fileChange.toJSON(),
            isExcerpt: !!this._options.isExcerpt,
            lineComments: this._options.lineComments,
            relevantContextLines: this._options.relevantContextLines,
            scrollStyle: this._options.scrollStyle,
            anchor: options.anchor,
            autoSrcPath: options.autoSrcPath,
            commentUrlBuilder: options.commentUrlBuilder
        };

        var $spinner = $("<div />").addClass('file-content-spinner').appendTo(this.$self);
        return promise.spinner($spinner, fileHandlers._handle(fileHandlingContext).done(_.bind(function (handler, errors) {
            this.renderErrors(errors);

            this.handler = handler;
            this.$self.addClass(handler.extraClasses);

            var webFragmentContext = {
                handlerID: handler.handlerID,
                displayType: this._options.contentMode,
                fileChange: fileHandlingContext.fileChange,
                commentMode: this._options.commentMode
            };
            if (this._options.toolbarWebFragmentLocationPrimary) {
                this.$toolbar.children('.primary').append(bitbucket.internal.widget.webFragmentButtons({
                    location: this._options.toolbarWebFragmentLocationPrimary,
                    context: webFragmentContext
                }));
            }
            if (this._options.toolbarWebFragmentLocationSecondary) {
                this.$toolbar.children('.secondary').prepend(bitbucket.internal.widget.webFragmentButtons({
                    location: this._options.toolbarWebFragmentLocationSecondary,
                    context: webFragmentContext,
                    isReverse: true
                }));
            }
        }, this)), 'large', { zIndex: 10 }).done(_.defer.bind(_, function () {
            events.trigger('bitbucket.internal.feature.fileContent.requestHandled', null, fileHandlingContext);
        }));
    };

    FileContent.prototype.renderErrors = function (errors) {
        this.$self.parent().find('.file-content-errors').remove();
        if (errors.length > 0) {
            // TODO STASHDEV-6164 to improve the UI
            this.$self.before(bitbucket.internal.feature.fileContent.errors({
                errors: _.map(errors, function (error) {
                    // Fallback to error which might be a raw string
                    return error.message || error;
                })
            }));
        }
    };

    FileContent.prototype.toggleToolbarDisable = function (disable) {
        this.$self.find('.file-toolbar .aui-button').toggleClass('disabled', disable).prop('disabled', disable).attr('aria-disabled', disable); // prop doesn't work on anchors
    };

    FileContent.prototype.renderBreadCrumbs = function (path) {
        var components = _.map(path.getComponents(), function (str) {
            return { text: str };
        });
        return bitbucket.internal.widget.breadcrumbs.crumbs({
            pathComponents: components,
            primaryLink: this._options.diffType === 'COMMIT' && !this._options.pullRequestDiffCurrent ? null : this._options.pullRequestDiffLinkUrl
        });
    };

    FileContent.prototype.getFileChangedModeLozenge = function (fileChange) {
        var srcExecutable = fileChange.getSrcExecutable();
        var executable = fileChange.getExecutable();

        // executable can be null if the file has been deleted. We want to show the lozenge when a file has been
        // added and is executable, but not when the it has been deleted or when a file has been added without +x
        var added = null;

        if (srcExecutable == null && executable === true || srcExecutable === false && executable === true) {
            added = true;
        } else if (srcExecutable === true && executable === false) {
            added = false;
        }

        if (added !== null) {
            return $(bitbucket.internal.feature.fileContent.fileChangeModeLozenge({
                added: added
            }));
        }
        return null;
    };

    /**
     * Init the FileContent
     *
     * @param {FileChange} fileChange
     * @param {object} options
     *
     * @returns {Promise}
     */
    FileContent.prototype.init = function (fileChange, options) {
        var initInternal = this._initInternal.bind(this, fileChange, options);
        this._lastInitPromise = this.reset().thenAbortable(initInternal, initInternal);
        return this._lastInitPromise;
    };

    /**
     * REALLY init the FileContent
     *
     * @param {FileChange} fileChange
     * @param {object} options
     *
     * @returns {Promise}
     */
    FileContent.prototype._initInternal = function (fileChange, options) {
        options = this._options = $.extend({}, FileContent.defaults, options);

        var commitRange = fileChange.getCommitRange();
        var headRef = options.headRef || commitRange.getUntilRevision() && commitRange.getUntilRevision().getRevisionReference();

        if (options.changeTypeLozenge && !fileChange.getType()) {
            throw new Error("Change type is required to show the change type lozenge.");
        }

        if (!commitRange.getUntilRevision() && (options.sourceLink || options.rawLink || options.untilRevisionPicker)) {
            throw new Error("Revision info is required to show a link to the source or raw file, or a revision picker.");
        }

        this.initToolbarItems(headRef, fileChange, options.autoSrcPath);

        return this.initForContent(fileChange, {
            headPath: options.headPath || fileChange.getPath(),
            headRef: headRef,
            anchor: options.anchor,
            contentMode: options.contentMode,
            followRenames: options.followRenames,
            autoSrcPath: options.autoSrcPath,
            commentUrlBuilder: options.commentUrlBuilder
        });
    };

    FileContent.prototype.reset = function () {
        if (this._lastInitPromise) {
            // if init has previously been called, abort it
            this._lastInitPromise.abort();
        }
        var resetInternal = this._resetInternal.bind(this);
        // normal .then() is used here because we want to enforce that reset is called after the initPromise and that abort doesn't
        // stop after the init but before the reset.
        return promise.thenAbortable(this._lastInitPromise.then(resetInternal, resetInternal));
    };

    FileContent.prototype._resetInternal = function resetInternal() {
        if (this.handler) {
            if (this.handler.extraClasses) {
                this.$self.removeClass(this.handler.extraClasses);
            }

            if (_.isFunction(this.handler.destroy)) {
                this.handler.destroy();
            }

            delete this.handler;
        }

        return $.Deferred().resolve();
    };

    FileContent.prototype.destroy = function () {
        this.reset();
    };

    /**
     * Init the the change type lozenge
     *
     * @param {FileChange} fileChange
     */
    FileContent.prototype._initChangeTypeLozenge = function initChangeTypeLozenge(fileChange) {
        var srcPathHtml;
        var dstPathHtml;

        var path = fileChange.getPath();
        var srcPath = fileChange.getSrcPath() || path;

        if (fileChange.getType() === ChangeType.RENAME) {
            srcPathHtml = AJS.escapeHtml(srcPath.getName());
            dstPathHtml = AJS.escapeHtml(path.toString());
        } else if (srcPath) {
            var src = srcPath.toString();
            var dst = path.toString();
            var diff = ediff.diff(ediff.tokenizeString(src), ediff.tokenizeString(dst));

            srcPathHtml = markRegions(src, diff.originalRegions, 'deleted');
            dstPathHtml = markRegions(dst, diff.revisedRegions, 'added');
        }

        this.$changeTypeLozenge.append(bitbucket.internal.feature.fileContent.fileChangeTypeLozenge({
            changeType: fileChange.getType(),
            previousPathContent: srcPathHtml,
            pathContent: dstPathHtml
        }));

        var gravity = function gravity() {
            var spaceRight = $(document).width() - $(this).offset().left - $(this).width() / 2;
            var tooltipWidth = $('.tipsy').outerWidth();
            return spaceRight > tooltipWidth / 2 + 10 ? 'n' : 'ne';
        };
        this.$changeTypeLozenge.find('.change-type-lozenge').tooltip({
            html: true,
            className: 'change-type-lozenge-tooltip',
            gravity: gravity
        });
    };

    function markRegions(s, regions, markClass) {
        var result = '';
        var start = 0;
        for (var i = 0; i < regions.length; i++) {
            var region = regions[i];
            result += AJS.escapeHtml(s.substring(start, region.start)) + '<span class="' + markClass + '">' + AJS.escapeHtml(s.substring(region.start, region.end)) + '</span>';
            start = region.end;
        }
        if (start < s.length) {
            result += AJS.escapeHtml(s.substring(start));
        }
        return result;
    }

    return FileContent;
});