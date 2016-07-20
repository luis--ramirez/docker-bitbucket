'use strict';

define('bitbucket/internal/feature/pull-request/pull-request-activity', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/comments', 'bitbucket/internal/feature/file-content', 'bitbucket/internal/model/commit-range', 'bitbucket/internal/model/file-change', 'bitbucket/internal/model/file-content-modes', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/path', 'bitbucket/internal/model/path-and-line', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/client-storage', 'bitbucket/internal/util/codemirror', 'bitbucket/internal/util/events', 'bitbucket/internal/util/scroll', 'bitbucket/internal/util/syntax-highlight', 'bitbucket/internal/util/time-i18n-mappings', 'bitbucket/internal/widget/paged-scrollable'], function (AJS, $, _, nav, comments, FileContent, CommitRange, FileChange, FileContentModes, pageState, Path, PathAndLine, ajaxUtil, clientStorage, codeMirrorUtil, events, scrollUtil, syntaxHighlight, customTimeMappings, PagedScrollable) {

    function bindAddGeneralCommentHandler(keys) {
        (this.execute ? this : AJS.whenIType(keys)).execute(function () {
            var $form = $(".general-comment-form");
            scrollUtil.scrollTo($form);
            $form.find("textarea").focus();
        });
    }

    function lastCommentDeletedHandler($container) {
        $container.closest('.diff-comment-activity, .file-comment-activity').remove();
    }

    function getPathAndLine(fileChange) {
        var path = fileChange.getPath();
        var firstHunk = fileChange.getDiff().hunks[0];
        if (!firstHunk) {
            return new PathAndLine(path);
        }

        if (firstHunk.sourceLine !== 0) {
            return new PathAndLine(path, firstHunk.sourceLine, 'FROM');
        } else {
            return new PathAndLine(path, firstHunk.destinationLine, 'TO');
        }
    }

    function PullRequestActivity(contextSelector, pullRequest, fromType, fromId, options) {
        this._$container = $(contextSelector);
        this.pullRequest = pullRequest;
        this.pullRequestPathComponents = {
            projectKey: pageState.getProject().getKey(),
            repoSlug: pageState.getRepository().getSlug(),
            pullRequestId: this.pullRequest.getId()
        };
        this.fromType = fromType;
        this.fromId = fromId;
        this.dataLoadedEvent = 'bitbucket.internal.feature.pullRequestActivity.dataLoaded';

        this._$spinner = $('<div class="spinner"/>').insertAfter(this._$container);

        PagedScrollable.call(this, options.scrollableElement || contextSelector, {
            pageSize: 25, /* Makes a lot of git calls on each request. Fewer items => faster response. */
            dataLoadedEvent: this.dataLoadedEvent,
            autoLoad: 'next',
            paginationContext: 'pull-request-activity'
        });
    }
    $.extend(PullRequestActivity.prototype, PagedScrollable.prototype);

    PullRequestActivity.prototype.init = function (options) {
        this.renderedDiffFileContents = [];
        PagedScrollable.prototype.init.call(this, options);

        this._inited = true;

        if (!this.loadedRange.isEmpty()) {
            // render the initial diffs now since attachNewContent won't be called.
            this.renderedDiffFileContents = this.renderedDiffFileContents.concat(PullRequestActivity.renderDiffs(this._$container.children('.diff-comment-activity'), options.diffCommentData, new CommitRange({
                pullRequest: this.pullRequest
            })));
        }

        comments.bindContext(this._$container, new comments.PullRequestAnchor(this.pullRequestPathComponents));
        var self = this;
        this._approvalHandler = function (data) {
            self.addApprovalActivity(data.approved, data.user, new Date());
        };
        events.on('bitbucket.internal.widget.approve-button.added', this._approvalHandler);
        events.on('bitbucket.internal.widget.approve-button.removed', this._approvalHandler);
        events.on('bitbucket.internal.feature.comments.lastCommentDeleted', lastCommentDeletedHandler);
        events.on('bitbucket.internal.keyboard.shortcuts.pullrequest.addCommentHandler', bindAddGeneralCommentHandler);
    };

    PullRequestActivity.prototype.reset = function () {
        events.off('bitbucket.internal.widget.approve-button.added', this._approvalHandler);
        events.off('bitbucket.internal.widget.approve-button.removed', this._approvalHandler);
        events.off('bitbucket.internal.feature.comments.lastCommentDeleted', lastCommentDeletedHandler);
        events.off('bitbucket.internal.keyboard.shortcuts.pullrequest.addCommentHandler', bindAddGeneralCommentHandler);

        _.chain(this.renderedDiffFileContents).pluck('inlineInfo').pluck('fileContent').invoke('destroy').value();
        delete this.renderedDiffFileContents;

        _.invoke(this.fileCommentContexts, 'destroy');
        delete this.fileCommentContexts;

        comments.unbindContext(this._$container);

        PagedScrollable.prototype.reset.call(this);
        this.currentTime = undefined;
        this._inited = false;
    };

    PullRequestActivity.prototype.checkCommentIsNew = function (comment) {
        comment.isUnread = comment.updatedDate > this.lastViewed && (!pageState.getCurrentUser() || comment.author.name !== pageState.getCurrentUser().getName());

        if (comment.comments.length) {
            _.each(comment.comments, _.bind(this.checkCommentIsNew, this));
        }
    };

    PullRequestActivity.prototype.checkCommentActivitiesAreNew = function (activities) {
        var self = this;
        _.each(activities, function (activity) {
            if (activity.action === 'COMMENTED') {
                self.checkCommentIsNew(activity.comment);
            }
        });
    };

    PullRequestActivity.prototype.requestData = function (start, limit) {
        var self = this;
        //Use permalink params only for the first page request where the current page url is clearly a permalink
        var permalinkParams = start === 0 && !_.isUndefined(this.fromType) && !_.isUndefined(this.fromId) ? { fromType: this.fromType, fromId: this.fromId } : {};

        this._$spinner.spin('large');
        return ajaxUtil.rest({
            url: nav.rest().project(this.pullRequestPathComponents.projectKey).repo(this.pullRequestPathComponents.repoSlug).pullRequest(this.pullRequestPathComponents.pullRequestId).activities().withParams($.extend(permalinkParams, {
                start: start,
                limit: limit,
                avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'medium' }),
                markup: true
            })).build(),
            statusCode: {
                //A 404 should only ever happen if the current URL is for a permalink and the comment has been deleted
                //or the comment or activity ID is invalid
                '404': function _(xhr, textStatus, errorThrown, errors, dominantError) {
                    var title = self.fromType === 'activity' ? AJS.I18n.getText('bitbucket.web.pullrequest.activity.notfound.title') : AJS.I18n.getText('bitbucket.web.pullrequest.comment.notfound.title');
                    var message = self.fromType === 'activity' ? AJS.I18n.getText('bitbucket.web.pullrequest.activity.notfound.message') : AJS.I18n.getText('bitbucket.web.pullrequest.comment.notfound.message');
                    return $.extend({}, dominantError, {
                        title: title,
                        titleClass: 'confirm-header',
                        message: message,
                        fallbackTitle: AJS.I18n.getText('bitbucket.web.pullrequest.activity.notfound.fallback.title'),
                        fallbackUrl: nav.project(self.pullRequestPathComponents.projectKey).repo(self.pullRequestPathComponents.repoSlug).pullRequest(self.pullRequestPathComponents.pullRequestId).overview().build(),
                        canClose: false,
                        shouldReload: false
                    });
                }
            }
        }).done(function (data, textStatus, xhr) {
            // Only set the currentTime on the first rest request for activity
            if (!self.currentTime) {
                // Use server time otherwise fallback to client time
                var currentTime = new Date(xhr.getResponseHeader('Date')).getTime();
                var lastViewedKey = clientStorage.buildKey('last-viewed', 'pull-request');

                self.currentTime = isNaN(currentTime) ? new Date().getTime() : currentTime;

                // If first time viewing, we don't want all the comments to be marked as unread
                self.lastViewed = clientStorage.getItem(lastViewedKey) || self.currentTime;
                clientStorage.setItem(lastViewedKey, self.currentTime);
            }

            self.checkCommentActivitiesAreNew(data.values);
        }).fail(function () {
            self._$spinner.spinStop();
        });
    };

    PullRequestActivity.prototype.attachContent = function attach(method, elem) {
        this._$container[method === 'html' ? 'append' : method](elem);
    };

    PullRequestActivity.prototype.decorateForFocus = function (data) {
        var isActivityPermalink = this.fromType === 'activity';
        var focusedActivityId;
        if (isActivityPermalink) {
            var activityId = parseInt(this.fromId, 10);
            _.some(data.values, function (activity, index) {
                if (activity.id === activityId) {
                    activity.isFocused = true;
                    focusedActivityId = activityId;
                    return true;
                }
                return false;
            });
        } else {
            var commentId = parseInt(this.fromId, 10);

            var focusComment = function focusComment(comment) {
                if (comment.id === commentId) {
                    comment.isFocused = true;
                    return true;
                } else if (comment.comments) {
                    return _.some(comment.comments, function (reply) {
                        return focusComment(reply);
                    });
                }
                return false;
            };

            _.some(data.values, function (activity, index) {
                if (activity.comment && focusComment(activity.comment)) {
                    focusedActivityId = activity.id;
                    return true;
                }
                return false;
            });
        }
        return focusedActivityId;
    };

    PullRequestActivity.prototype.onAttachFirstPermalinkPage = function (data, attachmentMethod) {
        var self = this;

        var $loadPrevious = $(bitbucket.internal.feature.pullRequest.loadPreviousActivities());
        this.attachContent(attachmentMethod, $loadPrevious);
        var $loadPreviousLink = $loadPrevious.find('a');

        var $topSpinner = $loadPrevious.append($('<div class="spinner"/>'));

        var fromId = data.previousPageStartId;
        var lastFromId = data.values[0].id;

        function loadPreviousActivities() {
            $loadPreviousLink.hide();
            $topSpinner.spin('large');

            var params = self.loadedRange.pageBefore(self.options.pageSize);
            ajaxUtil.rest({
                url: nav.rest().project(self.pullRequestPathComponents.projectKey).repo(self.pullRequestPathComponents.repoSlug).pullRequest(self.pullRequestPathComponents.pullRequestId).activities().withParams($.extend(params, {
                    avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'medium' }),
                    markup: true
                })).build()
            }).done(function (data, textStatus, xhr) {
                self.loadedRange.add(data.start, data.size, data.isLastPage, data.nextPageStart);

                //Remove duplicates from this new previous page - this may happen
                //when loading the very first page because we've run out of activities
                var oldActivityIndex;
                _.any(data.values, function (activity, index) {
                    if (activity.id === lastFromId) {
                        oldActivityIndex = index;
                        return true;
                    }
                });
                var nonDuplicates = data.values.slice(0, oldActivityIndex);

                self.checkCommentActivitiesAreNew(nonDuplicates);

                //Attach new activities after the load-previous button
                self.attachActivities(nonDuplicates, function (element) {
                    $loadPrevious.after(element);
                });

                if (data.isFirstPage || self.loadedRange.reachedStart()) {
                    //Delete the tear and load previous button because we've loaded everything
                    $loadPreviousLink.unbind('click');
                    $loadPrevious.remove();
                    $topSpinner.remove();
                } else {
                    //Set up for the next load request
                    lastFromId = fromId;
                    fromId = data.previousPageStartId;
                }

                events.trigger(self.dataLoadedEvent, self, data.start, data.limit, data);
            }).always(function () {
                $topSpinner.spinStop();
                $loadPreviousLink.show();
            });
        }

        $loadPreviousLink.click(function (e) {
            e.preventDefault();
            loadPreviousActivities();
        });
    };

    PullRequestActivity.prototype.attachActivities = function (values, attach) {
        var self = this;

        var index = 0;
        var commitRange = new CommitRange({
            pullRequest: this.pullRequest
        });

        var $newItems = $(_.map(values, function (activity) {
            var activityItem = bitbucket.internal.feature.pullRequest.activityListItem({
                activity: activity,
                pullRequest: self.pullRequest.toJSON(),
                commitRange: commitRange.toJSON(),
                customMapping: customTimeMappings.commentEditedAge,
                isNew: false
            });
            index++;
            return activityItem;
        }).join(''));

        // perform any syntax highlighting necessary
        // Note that this will highlight only the activity-comments and not diff-comments
        syntaxHighlight.container($newItems);

        var dataByActivityId = _.reduce(values, function (map, activityData) {
            map[activityData.id] = activityData;
            return map;
        }, {});

        // Must attach before rendering diffs because the diffs need to know their width.
        // We never use 'html' because we have loaded one "item" already, which is the general activity form.
        // Doing this ruins our ability to "reset" (if we every want to switch to another activity stream) after
        // we've already loaded items. We'll have to manually reset if we ever want that.
        attach($newItems);

        this.fileCommentContexts = PullRequestActivity.addBreadcrumbsAndBindFileComments($newItems.filter('.file-comment-activity'), dataByActivityId, commitRange);

        var diffs = PullRequestActivity.renderDiffs($newItems.filter('.diff-comment-activity'), dataByActivityId, commitRange);

        this.renderedDiffFileContents = this.renderedDiffFileContents.concat(diffs);

        this._$container.find(".pull-request-diff-outdated-lozenge").tooltip({
            gravity: 'ne'
        });

        this._$container.find(".reviewers-updated-activity .aui-avatar img").tooltip({
            gravity: 'n'
        });

        return diffs;
    };

    PullRequestActivity.prototype.attachNewContent = function (data, attachmentMethod) {
        var self = this;

        var $commentContainer = $('#pull-request-activity > li.comment-form-container');
        var isPermalinked = !_.isUndefined(this.fromId) && !_.isUndefined(this.fromType);
        var isCommentPermalink = this.fromType === 'comment';
        var isFirstAttach = $commentContainer.siblings().length === 0;

        var focusedActivityId;
        if (isPermalinked && isFirstAttach) {
            focusedActivityId = this.decorateForFocus(data);
        }

        if (isPermalinked && !data.isFirstPage && isFirstAttach) {
            //Only show the tear and load-previous button if we are in fact
            //permalinking, we are not permalinked to the very first activity
            //and this is the very first page of results we are showing
            this.onAttachFirstPermalinkPage(data, attachmentMethod);
        }

        var inlineInfos = this.attachActivities(data.values, function (element) {
            self.attachContent(attachmentMethod, element);
        }); //attach fn

        this._$spinner.spinStop();
        if (data.isLastPage) {
            this._$spinner.remove();
        }

        function scrollToFocused($root) {
            if (!self._inited) {
                // destroyed in the meantime.
                return;
            }

            var $focused = isCommentPermalink ? $('.comment.focused', $root) : $('.activity-item.focused', $root);
            if ($focused.length) {
                scrollUtil.scrollTo($focused, {
                    waitForImages: true,
                    cancelIfScrolled: true,
                    duration: 400
                });
                events.trigger('bitbucket.internal.feature.pullRequestActivity.focused', null, $focused);
                return;
            }

            if (isCommentPermalink) {
                // wasn't found initially, wait until more comments are rendered.
                events.once('bitbucket.internal.feature.comments.commentContainerAdded', scrollToFocused);
            }
        }

        if (focusedActivityId != null) {
            var focusedActivityData = _.findWhere(inlineInfos, { activityId: focusedActivityId });
            if (focusedActivityData) {
                focusedActivityData.inlineInfo.initPromise.done(scrollToFocused.bind(null, null));
            } else {
                scrollToFocused();
            }
        }
    };

    PullRequestActivity.renderDiffForComment = function ($container, data, commitRange) {
        var fileContent = new FileContent($container);
        var repository = commitRange.getPullRequest().getToRef().getRepository();
        var fileChange = FileChange.fromDiff(data.diff, commitRange, repository);
        var pathAndLine = getPathAndLine(fileChange);
        var isCurrent = data.commentAnchor ? data.commentAnchor.orphaned === false : true; // defaults to current if information is not supplied
        var initPromise = fileContent.init(fileChange, {
            commentMode: FileContent.commentMode.REPLY_ONLY,
            lineComments: [data.comment],
            asyncDiffModifications: false,
            attachScroll: false,
            autoResizing: true,
            scrollStyle: 'inline',

            isExcerpt: true,
            contentMode: FileContentModes.DIFF,
            changeTypeLozenge: false, //TODO maybe we can add this later? Don't have the data now though.
            changeModeLozenge: false,
            fileIcon: true,
            breadcrumbs: true,
            scrollPaneSelector: 'self',
            pullRequestDiffLink: true,
            pullRequestDiffCurrent: isCurrent,
            pullRequestDiffLinkUrl: nav.currentPullRequest().diff().change(pathAndLine.toString()).build(),
            toolbarWebFragmentLocationPrimary: 'bitbucket.pull-request.activity.diff.toolbar.primary',
            toolbarWebFragmentLocationSecondary: 'bitbucket.pull-request.activity.diff.toolbar.secondary'
        });

        return {
            fileContent: fileContent,
            initPromise: initPromise
        };
    };

    PullRequestActivity.renderDiffs = function ($diffContainers, preloadData, commitRange) {
        var elAndDatas = [];

        // reads first
        _.each($diffContainers, function (el) {
            var activityId = Number(el.getAttribute('data-activityid'));
            elAndDatas.push({
                activityId: activityId,
                el: el,
                data: preloadData[activityId]
            });
        });

        //then writes
        return codeMirrorUtil.doInOperation(function () {
            return _.map(elAndDatas, function (elAndData) {
                return {
                    activityId: elAndData.activityId,
                    inlineInfo: PullRequestActivity.renderDiffForComment($(elAndData.el).find('.detail'), elAndData.data, commitRange)
                };
            });
        });
    };

    /**
     * Add breadcrumbs to file comment activity items and binds comment context
     * @param {jQuery} $fileCommentActivities - File comment activity jQuery elements
     * @param {Object} dataByActivityId - Preloaded activity data grouped by activity ID
     * @param {CommitRange} commitRange - Commit range of the pull request
     * @return commentContexts - Array of comment contexts created per file comment
     */
    PullRequestActivity.addBreadcrumbsAndBindFileComments = function ($fileCommentActivities, dataByActivityId, commitRange) {
        var commentContexts = [];

        $fileCommentActivities.each(function () {
            var $el = $(this);
            var activityId = $el.attr('data-activityid');
            var activityData = dataByActivityId[activityId];

            var path = new Path(activityData.commentAnchor.path);
            var isCurrent = activityData.commentAnchor ? activityData.commentAnchor.orphaned === false : true;
            var components = _.map(path.getComponents(), function (str) {
                return { text: str };
            });

            $el.find('.breadcrumbs').append(bitbucket.internal.widget.breadcrumbs.crumbs({
                pathComponents: components,
                primaryLink: isCurrent ? nav.currentPullRequest().diff().change(path).build() : undefined
            }));

            var fileChange = new FileChange({
                repository: pageState.getRepository(),
                commitRange: commitRange,
                path: path
            });

            var context = comments.bindContext($el, new comments.DiffAnchor(fileChange), {
                $toolbar: $el.find('.file-toolbar'),
                commentMode: comments.commentMode.REPLY_ONLY
            });
            commentContexts.push(context);
        });

        return commentContexts;
    };

    PullRequestActivity.prototype.addApprovalActivity = function (approved, user, date) {
        var $generalCommentForm = $("#pull-request-activity .comment-form-container").first();
        $(bitbucket.internal.feature.pullRequest.activityApprovalListItem({
            user: user.name ? user : user.toJSON(),
            action: approved ? 'APPROVED' : 'UNAPPROVED',
            activityDate: date
        })).hide().insertAfter($generalCommentForm).fadeIn('slow');
    };

    // TODO
    PullRequestActivity.prototype.handleErrors = $.noop;

    return PullRequestActivity;
});