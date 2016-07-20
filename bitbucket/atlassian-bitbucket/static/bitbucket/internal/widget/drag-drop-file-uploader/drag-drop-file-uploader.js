'use strict';

define('bitbucket/internal/widget/drag-drop-file-uploader', ['jquery', 'lodash', 'bitbucket/internal/util/events', 'bitbucket/internal/widget/client-file-handlers/client-file-uploader', 'bitbucket/internal/widget/drag-drop-file-target', 'bitbucket/internal/widget/faux-upload-field', 'bitbucket/internal/widget/paste-image-target'], function ($, _, events, ClientFileUploader, DragDropFileTarget, FauxUploadField, PasteImageTarget) {

    'use strict';

    /**
     * Allow users to drag and drop a file onto a target element and have it uploaded to the server
     * Also optionally allows users to browse to select a file to upload or paste image data into the target to upload
     *
     * @param {HTMLElement|jQuery} target
     * @param {Object} opts
     * @constructor DragDropFileUploader
     */

    function DragDropFileUploader(target, opts) {
        if (!DragDropFileUploader.isSupported()) {
            throw new Error("DragDropUploader requires ClientFileUploader support");
        }

        this.init.apply(this, arguments);
    }

    DragDropFileUploader.typeFilters = ClientFileUploader.typeFilters;
    DragDropFileUploader.isSupported = ClientFileUploader.isSupported;

    events.addLocalEventMixin(DragDropFileUploader.prototype);

    /**
     * Default options.
     *
     * @param {string|function}     url                     The url to upload the files to, or a function that returns it. Must be supplied
     * @param {string}              fieldName               The name of the POST param expected when uploading. Defaults to `file`
     * @param {function}            uploadHandler           Receives a promise for the upload with updating `progress` (http://api.jquery.com/deferred.progress/)
     * @param {function}            uploadButton
     * @param {regExp}              fileTypeFilter          The filter to use for incoming file types.
     *                                                      Can be a regex or one of the predefined ClientFileHandler.typeFilters. Uses ClientFileHandler default of `all`
     * @param {number}              fileCountLimit          The number of files that can be selected for upload at once.  Uses ClientFileHandler default of `infinity` (no limit)
     * @param {number}              fileSizeLimit           The maximum size an individual can be. Uses ClientFileHandler default of 10MB
     * @param {boolean}             pasteUpload             Whether a user can paste image data into the target to upload
     */
    DragDropFileUploader.prototype.defaults = {
        url: null,
        fieldName: 'file',
        uploadButton: undefined,
        fileTypeFilter: undefined,
        fileCountLimit: undefined,
        fileSizeLimit: undefined,
        pasteUpload: true
    };

    /**
     * Initialise the DragDropFileUploader
     * @param {HTMLElement|jQuery} target
     * @param opts
     */
    DragDropFileUploader.prototype.init = function (target, opts) {
        this.$target = $(target);
        //Pull up the limit options from the clientFileUploaders defaults so that other modules can access them
        var clientFileHandlerLimitDefaults = _.pick(ClientFileUploader.prototype.defaults, 'fileTypeFilter', 'fileCountLimit', 'fileSizeLimit');
        this.options = $.extend({}, this.defaults, clientFileHandlerLimitDefaults, opts);
        this._destroyables = [];

        var clientFileUploader = new ClientFileUploader({
            url: this.options.url,
            fieldName: this.options.fieldName
        });

        this._destroyables.push(this.retriggerFrom(clientFileUploader, 'filesSelected', 'validFiles', 'invalidFiles', 'uploadStarted'));
        this._destroyables.push(clientFileUploader);

        this._destroyables.push(new DragDropFileTarget(this.$target, {
            clientFileHandler: clientFileUploader
        }));

        if (this.options.uploadButton) {
            this._destroyables.push(new FauxUploadField($(this.options.uploadButton), {
                clientFileHandler: clientFileUploader,
                allowMultiple: this.options.fileCountLimit > 1
            }));
        }

        if (this.options.pasteUpload) {
            this._destroyables.push(new PasteImageTarget(this.$target, clientFileUploader));
        }
    };

    /**
     * Destroy the instance
     */
    DragDropFileUploader.prototype.destroy = function () {
        _.invoke(this._destroyables, 'destroy');
    };

    return DragDropFileUploader;
});