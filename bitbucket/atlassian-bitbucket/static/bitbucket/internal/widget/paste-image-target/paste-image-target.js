'use strict';

define('bitbucket/internal/widget/paste-image-target', ['jquery', 'lodash', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/widget/client-file-handlers/client-file-handler'], function ($, _, events, fn, ClientFileHandler) {

    'use strict';

    /**
     * Capture image data pastes in the target element and pass them off to a ClientFileHandler
     *
     * @param {HTMLElement|jQuery} el
     * @param {ClientFileHandler} clientFileHandler
     * @constructor PasteImageTarget
     */

    function PasteImageTarget(el, clientFileHandler) {
        this.init.apply(this, arguments);
    }

    /**
     * Initialise the PasteImageTarget
     *
     * @param {HTMLElement|jQuery} el
     * @param {ClientFileHandler} clientFileHandler
     */
    PasteImageTarget.prototype.init = function (el, clientFileHandler) {
        _.bindAll(this, 'handlePaste', 'processClipboardItem');

        this.$el = $(el);
        this.clientFileHandler = clientFileHandler;
        this._destroyables = [];
        this._destroyables.push(events.chainWith(this.$el).on('paste', this.handlePaste));
    };

    /**
     * Filter out non-image-data pastes and pass valid pastes on to processClipboardItem
     *
     * @param {jQuery.Event} e
     */
    PasteImageTarget.prototype.handlePaste = function (e) {
        var imageFilter = ClientFileHandler.typeFilters.image;
        var originalEvent = e.originalEvent;
        var clipboardItems = originalEvent.clipboardData && originalEvent.clipboardData.items;

        if (this.clientFileHandler && clipboardItems && clipboardItems.length === 1) {
            //Heuristic to try and weed out pastes of copied files (from the file system) instead of image data from the clipboard
            //Pasted files have 2 items, 1 for the file name and one for the icon
            _.toArray(clipboardItems).filter(_.compose(imageFilter.test.bind(imageFilter), fn.dot('type'))).forEach(this.processClipboardItem);
        }
    };

    /**
     * Convert the paste to a File with a name (upload.*) and pass it off to the ClientFileHandler
     * @param {DataTransferItem} item
     */
    PasteImageTarget.prototype.processClipboardItem = function (item) {
        var file = item.getAsFile();
        file.name = 'upload.' + _.last(file.type.split('/'));
        this.clientFileHandler.handleFiles([file], this.$el);
    };

    /**
     * Destroy the instance
     */
    PasteImageTarget.prototype.destroy = function () {
        _.invoke(this._destroyables, 'destroy');
    };

    return PasteImageTarget;
});