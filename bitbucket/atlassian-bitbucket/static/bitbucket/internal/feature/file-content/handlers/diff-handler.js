'use strict';

require('bitbucket/feature/files/file-handlers').register({
    weight: 5000,
    handle: function handle(options) {
        return require('bitbucket/internal/feature/file-content/handlers/diff-handler').handler.apply(this, arguments);
    }
});

//noinspection JSValidateTypes
/**
 * Register a handler of diff files that will request diff information and call out to the correct diff view for the response.
 * It may show a binary diff, a textual diff, or an error message.
 *
 * The register call is pulled out and made synchronous to avoid race conditions about when the require callback is called.
 */
define('bitbucket/internal/feature/file-content/handlers/diff-handler', ['jquery', 'lodash', 'bitbucket/feature/files/file-handlers', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/comments', 'bitbucket/internal/feature/file-content/binary-diff-view', 'bitbucket/internal/feature/file-content/binary-view', 'bitbucket/internal/feature/file-content/content-message', 'bitbucket/internal/feature/file-content/diff-view-options', 'bitbucket/internal/feature/file-content/diff-view-options-panel', 'bitbucket/internal/feature/file-content/handlers/diff-handler/diff-handler-internal', 'bitbucket/internal/feature/file-content/request-diff', 'bitbucket/internal/feature/file-content/side-by-side-diff-view', 'bitbucket/internal/feature/file-content/unified-diff-view', 'bitbucket/internal/model/file-change', 'bitbucket/internal/model/file-change-types', 'bitbucket/internal/model/file-content-modes', 'bitbucket/internal/model/path', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/function', 'bitbucket/internal/util/promise', 'exports'], function ($, _, fileHandlersApi, nav, comments, BinaryDiffView, binaryView, contentMessage, DiffViewOptions, DiffViewOptionsPanel, diffHandlerInternal, requestDiff, SideBySideDiffView, UnifiedDiffView, FileChange, FileChangeTypes, FileContentModes, Path, ajax, fn, promiseUtil, exports) {

    'use strict';

    /**
     * Return a comment context to display and interact with the given data.
     * Will return null if the commentMode is NONE.
     *
     * @param {Object} options - file handler options
     * @param {Object} data - diff REST data
     * @param {Object} commentData - comment REST data
     * @returns {?CommentContext}
     */

    function getBoundCommentContext(options, data, commentData) {
        var $container = options.$container;
        var fileChange = new FileChange(options.fileChange);
        if (options.commentMode !== comments.commentMode.NONE) {
            // collate our comments from the two sources
            var commentsByType = commentData ? _.groupBy(commentData.values, function (comment) {
                return comment.anchor.line ? 'line' : 'file';
            }) : {
                line: data.lineComments || [],
                file: data.fileComments || []
            };

            return comments.bindContext($container, new comments.DiffAnchor(fileChange), {
                lineComments: commentsByType.line,
                fileComments: commentsByType.file,
                commentMode: options.commentMode,
                relevantContextLines: options.relevantContextLines,
                diffViewOptions: options.diffViewOptions,
                $toolbar: options.$toolbar,
                urlBuilder: options.commentUrlBuilder
            });
        }
        return null;
    }

    /**
     * Return the main view that will be used to display content
     * @param {Object} options - file handler options
     * @param {Object} data - diff REST data
     * @param {CommentContext} [commentContext] - the comment context, if any
     * @param {boolean} shouldShowSideBySideDiff - whether a side-by-side or unified diff is preferred.
     * @returns {{extraClasses: string?, destroy: Function?}} - the view
     */
    function getMainView(options, data, commentContext, shouldShowSideBySideDiff) {
        var diff = data.diff;
        var handlerEnum = fileHandlersApi.builtInHandlers;
        var $container = options.$container;
        var fileChange = new FileChange(options.fileChange);
        if (diff && (diff.binary || binaryView.treatTextAsBinary(diff.destination && diff.destination.extension))) {
            var binaryDiffView = new BinaryDiffView(diff, options);
            binaryDiffView.handlerID = binaryDiffView.isDiffingImages() ? handlerEnum.DIFF_IMAGE : handlerEnum.DIFF_BINARY;
            return binaryDiffView;
        }

        if (!diff || !diff.hunks || !diff.hunks.length) {
            contentMessage.renderEmptyDiff($container, data, fileChange);
            return {
                handlerID: handlerEnum.DIFF_EMPTY,
                extraClasses: 'empty-diff message-content'
            };
        }

        if (diff.hunks[diff.hunks.length - 1].truncated) {
            contentMessage.renderTooLargeDiff($container, diff, fileChange, shouldShowSideBySideDiff);
            return {
                handlerID: handlerEnum.DIFF_TOO_LARGE,
                extraClasses: 'too-large-diff message-content'
            };
        }

        var DiffViewConstructor = shouldShowSideBySideDiff ? SideBySideDiffView : UnifiedDiffView;
        var diffView = new DiffViewConstructor(data, $.extend({ commentContext: commentContext }, options));

        if (commentContext) {
            commentContext.setDiffView(diffView);
        }

        // Deferred for backwards compatibility - web fragments in file-content must render before the view is initialized.
        _.defer(diffView.init.bind(diffView));

        diffView.handlerID = shouldShowSideBySideDiff ? handlerEnum.DIFF_TEXT_SIDE_BY_SIDE : handlerEnum.DIFF_TEXT_UNIFIED;

        return diffView;
    }

    exports.handler = function (options) {
        if (options.contentMode !== FileContentModes.DIFF) {
            return false;
        }

        var DEFAULT_RELEVANT_CONTEXT = 10; // if it is not available from the server for some reason
        var $container = options.$container;
        var $sideBySideDiffTypeItem = $('.diff-type-options .aui-dropdown2-radio[data-value="side-by-side"]');
        var fileChange = new FileChange(options.fileChange);
        var fileChangeType = fileChange.getType();
        var fileSupportsSideBySideView = !(fileChangeType === FileChangeTypes.ADD || fileChangeType === FileChangeTypes.DELETE || options.isExcerpt);
        // A function because fileSupportsSideBySideView can change after the data has returned
        function shouldShowSideBySideDiff() {
            return DiffViewOptions.get('diffType') === 'side-by-side' && fileSupportsSideBySideView;
        }

        options.withComments = options.commentMode !== comments.commentMode.NONE;

        // For Side By Side diff set some custom options
        if (shouldShowSideBySideDiff()) {
            // we want to show all the context
            options.contextLines = diffHandlerInternal.infiniteContext;
            // don't pull in comments so the request can be cached
            options.withComments = false;
        }

        /**
         * Get the anchored comments for a diff. It will make an AJAX request to fetch all comments for a given
         * file (based on options.fileChange) and call the appropriate comment-context methods.
         *
         * @param {Object} options
         * @returns {Promise}
         */
        function getAnchoredComments(options) {

            var fileChange = new FileChange(options.fileChange);
            var repo = fileChange.getRepository();
            var commitRange = fileChange.getCommitRange();

            var commentBuilder;
            var repoBuilder = nav.rest().project(repo.getProject().getKey()).repo(repo.getSlug());

            // If there is a commentUrlBuilder use that, otherwise:
            // Grab the pullrequest id or the commitrange
            if (options.commentUrlBuilder) {
                commentBuilder = options.commentUrlBuilder();
            } else if (commitRange.getPullRequest()) {
                commentBuilder = repoBuilder.pullRequest(commitRange.getPullRequest().getId()).comments();
            } else {
                commentBuilder = repoBuilder.commit(commitRange).comments();
            }

            var commentsUrl = commentBuilder.withParams({
                avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: options.avatarSize || 'medium' }),
                path: new Path(options.fileChange.path).toString(),
                markup: true
            }).build();

            var statusCode = options.statusCode || ajax.ignore404WithinRepository();
            $.extend(statusCode, {
                '401': function _() {
                    return $.Deferred().resolve({ start: 0, size: 0, values: [], isLastPage: true, filter: null }).promise();
                }
            });

            var xhr = ajax.rest({
                url: commentsUrl,
                statusCode: statusCode
            });

            var piped = xhr.then(function (data) {
                if (data.errors && data.errors.length) {
                    return $.Deferred().rejectWith(this, [this, null, null, data]);
                }

                return data;
            });

            return piped.promise(xhr);
        }

        // The comment getter can be a NOOP by default. For SBS it will point to a function that gets the comments.
        var requestComments = shouldShowSideBySideDiff() ? getAnchoredComments : $.noop;

        // Make the requests and wrap them in a promise
        var _requestPromises = _.compact([requestDiff(fileChange, options), requestComments(options)]);
        var requestPromise = promiseUtil.whenAbortable.apply(promiseUtil, _requestPromises);

        /**
         * Some side-by-side specific checks that modify the menu
         */
        function updateSideBySideMenu() {
            // If we can have a side-by-side view and it's not disabled, remove the
            // disabled class from the menu item
            if (fileSupportsSideBySideView) {
                $sideBySideDiffTypeItem.removeClass('aui-dropdown2-disabled').attr('aria-disabled', false);
                return;
            }

            if (!fileSupportsSideBySideView) {
                // If side-by-side is disabled for the current file, add a tooltip explaining why
                $sideBySideDiffTypeItem.tooltip({
                    gravity: 'e',
                    delayIn: 0,
                    title: 'data-file-type-compatibility'
                });
            }
        }

        /**
         * Success Callback.
         * Called when both the Diff and Comments are successfully fetched.
         *
         * @param {Object} data - Diff data
         * @param {Object} [commentData] - Comment data
         * @returns {*}
         */
        function requestSuccessCallback(data, commentData) {
            var diff = data.diff;

            if (!fileChange.getType() || fileChange.getType === FileChangeTypes.UNKNOWN) {
                fileChange.setType(FileChangeTypes.guessChangeTypeFromDiff(diff));
                options.fileChange = fileChange.toJSON();
            }

            // Should not support side-by-side diff if the source is empty, otherwise
            // when displaying on file view we don't know if the file is added/removed
            if (data.hunks && data.hunks.length && data.hunks[0].sourceSpan === 0) {
                fileSupportsSideBySideView = false;
            } else if (!fileChangeType) {
                fileSupportsSideBySideView = !diffHandlerInternal.isAddedOrRemoved(diff);
            }

            updateSideBySideMenu();

            var diffViewOptions = diffHandlerInternal.optionsOverride(DiffViewOptions, fileSupportsSideBySideView, options.isExcerpt);

            options.relevantContextLines = options.relevantContextLines || DEFAULT_RELEVANT_CONTEXT;
            options.diffViewOptions = diffViewOptions;

            if (fileChange.getConflict()) {
                contentMessage.renderConflict($container, fileChange);
            }

            var optionsPanel = new DiffViewOptionsPanel($(document), diffViewOptions);

            // Even if the diff is empty, we want to initialise file comments,
            // We won't be able to display existing file comments for unified diff view though, because we just don't have them
            // If we separate the diff request from the comments request for unified diff view,
            // we would be able to show them like we would for an empty side-by-side diff
            var commentContext = getBoundCommentContext(options, diff || {}, commentData);

            var mainView = getMainView(options, data, commentContext, shouldShowSideBySideDiff());

            return {
                handlerID: mainView.handlerID,
                extraClasses: mainView.extraClasses,
                destroy: function destroy() {
                    comments.unbindContext(options.$container);
                    _.chain([mainView, optionsPanel, diffViewOptions]).compact().filter(fn.dot('destroy')).invoke('destroy').value();
                }
            };
        }

        /**
         * Failure callback to execute when getting the diff or comments fails.
         * @param xhr
         * @param textStatus
         * @param errorThrown
         * @param data
         * @returns {Promise}
         */
        function requestFailureCallback(xhr, textStatus, errorThrown, data) {
            if (errorThrown === 'abort') {
                return $.Deferred().resolve();
            }
            contentMessage.renderErrors($container, data);
            return $.Deferred().resolve({ extraClasses: 'diff-error message-content' });
        }

        return requestPromise.thenAbortable(requestSuccessCallback, requestFailureCallback);
    };
});