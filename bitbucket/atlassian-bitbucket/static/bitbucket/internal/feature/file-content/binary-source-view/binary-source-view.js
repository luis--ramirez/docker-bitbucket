'use strict';

define('bitbucket/internal/feature/file-content/binary-source-view', ['jquery', 'bitbucket/internal/feature/file-content/binary-view', 'bitbucket/internal/util/events'], function ($, binaryView, events) {

    'use strict';

    /**
     * Display a binary file
     *
     * @param {Object} options - An object representing options, as provided by the FileHandlers API.
     * @param {JSON.FileChangeJSON} options.fileChange - The FileChange to represent in this view.
     * @param {jQuery} options.$container - Where to place this BinarySourceView.
     * @constructor BinarySourceView
     */

    function BinarySourceView(options) {
        this._init(options);
    }

    /**
     * Adds a binary display to the provided $container.
     * @param {Object} options see constructor
     * @private
     */
    BinarySourceView.prototype._init = function (options) {
        var path = options.fileChange.path;
        var commit = options.fileChange.commitRange.untilRevision;

        this._$container = $(bitbucket.internal.feature.fileContent.binaryView.container()).appendTo(options.$container);

        var result = binaryView.getRenderedBinary(path, commit && commit.id);
        _renderBinarySource(result, this._$container);

        events.trigger('bitbucket.internal.feature.fileContent.binaryShown', null, {
            containerEl: this._$container.get(0),
            path: path,
            type: result && result.type,
            revision: commit
        });
    };

    /**
     * Render the binary view into the DOM
     * @private
     * @param {Object} result - result from a getRenderedBinary call
     * @param {jQuery} $container - where to put the content
     */
    function _renderBinarySource(result, $container) {
        $(bitbucket.internal.feature.fileContent.binaryView.cell({})).append(result.$elem).appendTo($container);
    }

    /**
     * Destroy this instance. Cannot be used again once destroyed.
     */
    BinarySourceView.prototype.destroy = function () {
        if (this._$container) {
            this._$container.remove();
            this._$container = null;
        }
    };

    return BinarySourceView;
});