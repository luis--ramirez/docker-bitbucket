'use strict';

define('bitbucket/internal/feature/file-content/binary-diff-view', ['jquery', 'bitbucket/internal/bbui/image-differ/image-differ', 'bitbucket/internal/feature/file-content/binary-view', 'bitbucket/internal/model/file-change', 'bitbucket/internal/util/events'], function ($, imageDiffer, binaryView, FileChange, events) {

    'use strict';

    /**
     * Display a diff between two binary files at different revisions in this repository.
     *
     * @param {Object} diff JSON representing a single diff, as found within the Stash /diff REST resource (as a single item in the returned array).
     * @param {Object} options An object representing options, as provided by the FileHandlers API.
     * @param {FileChange} options.fileChange The FileChange to represent in this view.
     * @param {jQuery} options.$container Where to place this BinaryDiffView.
     * @constructor BinaryDiffView
     */

    function BinaryDiffView(diff, options) {
        this._init(diff, options);
    }

    BinaryDiffView.prototype.isDiffingImages = function () {
        return this._isDiffingImages;
    };

    /**
     * Adds binary displays to the provided $container. If the binary files are both images, adds image-diffing controls
     * into the $container as well.
     * @param {Object} diff see constructor
     * @param {Object} options see constructor
     * @private
     */
    BinaryDiffView.prototype._init = function (diff, options) {
        var commitRange = new FileChange(options.fileChange).getCommitRange();
        var untilRevision = commitRange.getUntilRevision();
        var sinceRevision = commitRange.getSinceRevision();

        this._$container = $(bitbucket.internal.feature.fileContent.binaryView.container()).appendTo(options.$container);

        var sinceInfo = getBinaryInfo(diff.source, sinceRevision);
        var untilInfo = getBinaryInfo(diff.destination, untilRevision);

        this._renderBinaryDiff(sinceInfo, untilInfo).done(function () {
            options.$container.addClass('fully-loaded');
        });

        var eventData = {
            containerEl: this._$container.get(0),
            sourcePath: diff.source,
            sourceType: sinceInfo && sinceInfo.type,
            sinceRevision: sinceRevision && sinceRevision.toJSON(),
            destinationPath: diff.destination,
            destinationType: untilInfo && untilInfo.type,
            untilRevision: untilRevision && untilRevision.toJSON()
        };

        events.trigger('bitbucket.internal.feature.fileContent.binaryDiffShown', null, eventData);
    };

    /**
     * Determine display information about the file at the revision - how it will be displayed and obtain an HTML representation of it.
     * @param {string} path - path of the binary
     * @param {Revision} revision - commit at which to view binary
     * @private
     */
    function getBinaryInfo(path, revision) {
        if (path && revision) {
            return binaryView.getRenderedBinary(path, revision.getId());
        }
    }

    /**
     * Render the binary diff into the DOM, along with image-diffing controls if the two versions of the file are both images.
     * @private
     */
    BinaryDiffView.prototype._renderBinaryDiff = function (sinceInfo, untilInfo) {
        var self = this;
        if (sinceInfo) {
            $(bitbucket.internal.feature.fileContent.binaryView.old({})).append(sinceInfo.$elem).appendTo(this._$container);
        }

        if (untilInfo) {
            $(bitbucket.internal.feature.fileContent.binaryView.new({})).append(untilInfo.$elem).appendTo(this._$container);
        }

        var diffingImages = this._isDiffingImages = sinceInfo && untilInfo && sinceInfo.type === untilInfo.type && sinceInfo.type === 'image';

        if (diffingImages) {
            return imageDiffer.init(this._$container).done(function (imageDiff) {
                self.imageDiff = imageDiff;
            });
        }
        return $.Deferred().resolve();
    };

    /**
     * Destroy this instance. Cannot be used again once destroyed.
     */
    BinaryDiffView.prototype.destroy = function () {
        if (this.imageDiff) {
            this.imageDiff.destroy();
            this.imageDiff = null;
        }
        if (this._$container) {
            this._$container.remove();
            this._$container = null;
        }
    };

    return BinaryDiffView;
});