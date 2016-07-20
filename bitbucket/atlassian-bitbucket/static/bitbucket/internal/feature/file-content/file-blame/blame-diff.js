'use strict';

define('bitbucket/internal/feature/file-content/file-blame/blame-diff', ['jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/util/server', 'bitbucket/internal/model/file-change-types', 'bitbucket/internal/util/property'], function ($, _, nav, server, FileChangeTypes, propertyUtil) {
    'use strict';

    function BlameDiff(fileChange) {
        this._fileChange = fileChange;
        this._optionsPromise = $.Deferred();
        this._blamePromise = null;
    }

    BlameDiff.prototype.get = function () {
        if (!this._blamePromise) {
            this._blamePromise = $.when(this._optionsPromise, propertyUtil.getFromProvider('display.max.source.lines')).then(this._requestBlame.bind(this));
        }

        return this._blamePromise;
    };

    BlameDiff.prototype.initBlameOptions = function (options) {
        this._optionsPromise.resolve(options);
    };

    //Calculate the optimal blame window start for a given capacity,
    //such that the span of modified lines are centred in the window.
    BlameDiff.prototype._calculateBlameWindowStart = function (options, capacity) {
        var firstLine = _.chain([options.firstAddedLine, options.firstRemovedLine]).compact() //remove line 0s
        .min().value() - 1; //to zero index

        var lastLine = Math.max(options.lastAddedLine, options.lastRemovedLine) - 1;

        return Math.max(0, Math.floor((firstLine + lastLine) / 2) - capacity / 2);
    };

    BlameDiff.prototype._requestBlame = function (options, capacity) {
        var blamePromises = [];
        var modifyNoAdd = this._fileChange.type === FileChangeTypes.MODIFY && !options.firstAddedLine;
        var modifyNoRemove = this._fileChange.type === FileChangeTypes.MODIFY && !options.firstRemovedLine;

        if (this._fileChange.type !== FileChangeTypes.DELETE && !modifyNoAdd) {
            //Don't request "until" blame if it's a deleted file or a modified file with no added lines
            blamePromises.push(server.rest({
                url: nav.currentRepo().browse().path(this._fileChange.path).at(options.until).build(),
                data: {
                    blame: true,
                    noContent: true,
                    //For modified files with no removed lines, request the context on this request, instead of the "since" blame
                    //Otherwise request just enough "until" blame to cover the added lines in the diff
                    start: modifyNoRemove ? this._calculateBlameWindowStart(options, capacity) : options.firstAddedLine - 1,
                    limit: modifyNoRemove ? capacity : options.lastAddedLine - options.firstAddedLine + 1,
                    avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' })
                }
            }).then(_.identity)); //only care about the first param (result), stops $.when passing an array of arguments to the handler
        } else {
                blamePromises.push($.Deferred().resolve());
            }

        if (this._fileChange.type !== FileChangeTypes.ADD && !modifyNoRemove) {
            //Don't request "since" blame if it's an added file or a modified file with no removed lines
            blamePromises.push(server.rest({
                url: nav.currentRepo().browse().path(this._fileChange.srcPath || this._fileChange.path).at(options.since).build(),
                data: {
                    blame: true,
                    noContent: true,
                    //For deleted files, we don't need to request any additional blame lines beyond the removed lines in the diff
                    //For other files, we request as much context as possible surrounding the modified lines
                    start: this._fileChange.type === FileChangeTypes.DELETE ? options.firstRemovedLine - 1 : this._calculateBlameWindowStart(options, capacity),
                    limit: this._fileChange.type === FileChangeTypes.DELETE ? options.lastRemovedLine - options.firstRemovedLine + 1 : capacity,
                    avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' })
                }
            }).then(_.identity)); //only care about the first param (result), stops $.when passing an array of arguments to the handler
        } else {
                blamePromises.push($.Deferred().resolve());
            }

        return $.when.apply($, blamePromises);
    };

    return BlameDiff;
});