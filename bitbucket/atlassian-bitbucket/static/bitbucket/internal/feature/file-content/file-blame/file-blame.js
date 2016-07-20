'use strict';

define('bitbucket/internal/feature/file-content/file-blame', ['jquery', 'lodash', 'bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/file-content/diff-view-segment-types', 'bitbucket/internal/feature/file-content/file-blame/blame-diff', 'bitbucket/internal/feature/file-content/file-blame/blame-gutter', 'bitbucket/internal/feature/file-content/file-blame/blame-source', 'bitbucket/internal/model/file-change-types', 'bitbucket/internal/model/file-content-modes', 'bitbucket/internal/util/analytics', 'bitbucket/internal/util/promise', 'bitbucket/internal/util/shortcuts', 'bitbucket/internal/widget/button-trigger', 'exports'], function ($, _, events, nav, DiffViewSegmentTypes, BlameDiff, BlameGutter, BlameSource, FileChangeTypes, FileContentModes, analytics, promise, shortcuts, ButtonTrigger, exports) {
    'use strict';

    function getDiffBlameOptions(fileChange, data) {
        var options;

        if (fileChange.type === FileChangeTypes.ADD || fileChange.type === FileChangeTypes.DELETE) {
            //Added or removed files have a simpler method to work out what lines are spanned.
            //There's only ever one hunk, and no context segments, so the destination or source span has all the info we need.
            var firstHunk = _.first(data.diff.hunks);
            options = {
                firstAddedLine: firstHunk.destinationLine,
                lastAddedLine: firstHunk.destinationSpan,
                firstRemovedLine: firstHunk.sourceLine,
                lastRemovedLine: firstHunk.sourceSpan
            };
        } else {
            //Discard context, combine all segment lines by type
            var groupedByType = _.chain(data.diff.hunks).map('segments').flatten().reject(_.matchesProperty('type', DiffViewSegmentTypes.CONTEXT)).groupBy('type').mapValues(function (segments) {
                return _.chain(segments).map('lines').flatten().value();
            }).value();

            var addedLines = groupedByType[DiffViewSegmentTypes.ADDED] || [];
            var removedLines = groupedByType[DiffViewSegmentTypes.REMOVED] || [];

            options = {
                firstAddedLine: addedLines.length && _.first(addedLines).destination,
                lastAddedLine: addedLines.length && _.last(addedLines).destination,
                firstRemovedLine: removedLines.length && _.first(removedLines).source,
                lastRemovedLine: removedLines.length && _.last(removedLines).source
            };
        }

        options.since = data.fromHash;
        options.until = data.toHash;

        return options;
    }

    function getSourceBlameOptions(fileChange, data) {
        return {
            firstLine: data.firstLine,
            lastLine: data.firstLine + data.linesAdded - 1,
            haveWholeFile: data.firstLine === 1 && data.isLastPage
        };
    }

    var locationMap = {
        '/browse': "source-view",
        '/diff': "diff-to-previous",
        '/commits/': "commit",
        '/compare': "compare-branch",
        '/pull-requests?create': "create-pullrequest", //Must be before '/pull-requests'
        '/pull-requests': "pullrequest"
    };

    exports.init = function () {
        events.on('bitbucket.internal.feature.fileContent.textViewInitializing', onTextView);

        function onTextView(textView, context) {
            var fileChange = context.fileChange;
            var $button = context.$toolbar.find('.file-blame');
            var requestBlame;
            var getBlameOptions;
            var viewLoadedEvent;

            var triggerAnalytics = _.once(function (contentMode) {
                var repoBase = nav.currentRepo().buildAbsolute();
                var pageName = _.find(locationMap, function (pageKey, path) {
                    if (_.startsWith(location.href, repoBase + path)) {
                        return pageKey;
                    }
                    return false;
                });

                analytics.add('blame.shown', {
                    type: contentMode,
                    source: pageName
                });
            });

            function setBlameOptions(data) {
                requestBlame.initBlameOptions(getBlameOptions(fileChange, data));
            }

            if ($button.length) {
                if (context.contentMode === FileContentModes.SOURCE) {
                    requestBlame = new BlameSource(fileChange);
                    viewLoadedEvent = 'bitbucket.internal.feature.fileContent.sourceViewContentLoaded';
                    getBlameOptions = getSourceBlameOptions;
                } else if (context.contentMode === FileContentModes.DIFF) {
                    requestBlame = new BlameDiff(fileChange);
                    viewLoadedEvent = 'bitbucket.internal.feature.fileContent.diffViewDataLoaded';
                    getBlameOptions = getDiffBlameOptions;
                } else {
                    return;
                }

                events.on(viewLoadedEvent, setBlameOptions);

                var blameGutter = new BlameGutter(textView, requestBlame);
                var $spinner = $('<div class="blame-spinner"></div>');
                var blameButton = new ButtonTrigger($button, {
                    stopEvent: false,
                    triggerHandler: function triggerHandler() {
                        this.setTriggerActive(!this.isTriggerActive());
                        promise.spinner($spinner.insertBefore($button), blameGutter.setEnabled(this.isTriggerActive()));
                        triggerAnalytics(context.contentMode);
                    }
                });

                var unbindShortcut = shortcuts.bind('showBlame', blameButton.triggerClicked.bind(blameButton));

                textView.on('destroy', function () {
                    unbindShortcut();
                    $spinner.remove();
                    events.off(viewLoadedEvent, setBlameOptions);
                    _.isFunction(blameGutter.destroy) && blameGutter.destroy();
                    blameGutter = null;
                    blameButton = null;
                    requestBlame = null;
                });
            }
        }

        return {
            destroy: function destroy() {
                events.off('bitbucket.internal.feature.fileContent.textViewInitializing', onTextView);
            }
        };
    };
});