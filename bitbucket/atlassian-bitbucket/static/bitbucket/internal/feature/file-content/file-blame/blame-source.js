'use strict';

define('bitbucket/internal/feature/file-content/file-blame/blame-source', ['jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/util/server', 'bitbucket/internal/util/property'], function ($, _, nav, server, propertyUtil) {
    'use strict';

    function BlameSource(fileChange) {
        this._fileChange = fileChange;
        this._optionsPromise = $.Deferred();
        this._blamePromise = null;
    }

    BlameSource.prototype.get = function () {
        if (!this._blamePromise) {
            this._blamePromise = $.when(this._optionsPromise, propertyUtil.getFromProvider('display.max.source.lines')).then(this._requestBlame.bind(this));
        }

        return this._blamePromise;
    };

    BlameSource.prototype.initBlameOptions = function (options) {
        this._optionsPromise.resolve(options);
    };

    //Calculate the optimal blame window start for a given capacity,
    //such that the span of displayed lines are centred in the window.
    BlameSource.prototype._calculateBlameWindowStart = function (options, capacity) {
        return Math.max(0, Math.floor((options.firstLine + options.lastLine) / 2) - capacity / 2);
    };

    BlameSource.prototype._requestBlame = function (options, capacity) {
        return server.rest({
            url: nav.currentRepo().browse().path(this._fileChange.path).at(this._fileChange.commitRange.untilRevision.id).build(),
            data: {
                blame: true,
                noContent: true,
                start: options.haveWholeFile ? options.firstLine - 1 : this._calculateBlameWindowStart(options, capacity),
                limit: options.haveWholeFile ? options.lastLine - options.firstLine + 1 : capacity,
                avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' })
            }
        }).then(_.identity); //only care about the first param (result), allows handler to deal with variable length invocations easily.
    };

    return BlameSource;
});