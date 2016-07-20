'use strict';

define('bitbucket/internal/widget/client-file-handlers/client-file-uploader', ['jquery', 'lodash', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/feature-detect', 'bitbucket/internal/widget/client-file-handlers/client-file-handler'], function ($, _, Ajax, featureDetect, ClientFileHandler) {

    'use strict';

    /**
     * A ClientFileHandler for uploading files to the server
     *
     * @extends {ClientFileHandler}
     * @param {object} opts
     * @constructor ClientFileUploader
     */

    function ClientFileUploader(opts) {
        if (!ClientFileUploader.isSupported()) {
            throw new Error("ClientFileUploader requires FormData support");
        }

        this.init.apply(this, arguments);
    }

    ClientFileUploader.isSupported = featureDetect.formData;
    ClientFileUploader.typeFilters = ClientFileHandler.typeFilters;

    $.extend(ClientFileUploader.prototype, ClientFileHandler.prototype);

    ClientFileUploader.prototype.defaults = $.extend({}, ClientFileHandler.prototype.defaults, {
        url: undefined,
        fieldName: 'file',
        fileSizeLimit: undefined //TODO: This should use the attachment.upload.max.size property - STASHDEV-6729
    });

    /**
     * Initialise the ClientFileHandler
     * @param {object} opts
     */
    ClientFileUploader.prototype.init = function (opts) {
        _.bindAll(this, 'uploadFiles');

        ClientFileHandler.prototype.init.call(this, opts);

        this.uploads = [];
        this.on('validFiles', this.uploadFiles);
    };

    /**
     * For each file, start an upload to the server that reports its progress via the xhr promise
     * and trigger the uploadStarted event with the promise and file handle
     *
     * @param {Array<File>} files
     */
    ClientFileUploader.prototype.uploadFiles = function (files) {
        var self = this;

        _.forEach(files, function (file) {
            var formData = new FormData();
            var deferred = $.Deferred();

            formData.append(self.options.fieldName, file, file.name);

            var xhr = Ajax.ajax({
                url: _.isFunction(self.options.url) ? self.options.url() : self.options.url,
                type: "POST",
                data: formData,
                xhr: function xhr() {
                    //We need to attach the progress event handler to the XHR directly,
                    var plainXhr = $.ajaxSettings.xhr();
                    var progressObj = plainXhr.upload ? plainXhr.upload : plainXhr;

                    progressObj.addEventListener('progress', function (e) {
                        if (e.lengthComputable) {
                            deferred.notify(Math.max(0, Math.min(100, 100 * e.loaded / e.total)));
                        }
                    });

                    return plainXhr;
                },
                statusCode: {
                    500: false
                    //Stash returns a 500 for uploads that don't conform to our restrictions (file size/type)
                    //Let the calling component handle it via xhr.fail instead of showing the generic error dialog
                },
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function () {
                deferred.notify(100); //100% complete
                deferred.resolveWith(this, arguments);
            }).fail(function () {
                deferred.rejectWith(this, arguments);
            }).always(function () {
                self.uploads = _.without(self.uploads, xhr);
            });

            deferred.promise(xhr);
            self.uploads.push(xhr);

            self.trigger('uploadStarted', xhr, file);
        });
    };

    /**
     * Destroy the instance
     */
    ClientFileUploader.prototype.destroy = function () {
        //Cancel any pending uploads
        _.invoke(this.uploads, 'abort');
        this.uploads = [];
    };

    return ClientFileUploader;
});