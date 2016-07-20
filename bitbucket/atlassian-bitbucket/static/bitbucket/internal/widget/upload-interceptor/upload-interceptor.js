'use strict';

define('bitbucket/internal/widget/upload-interceptor', ['jquery', 'lodash', 'bitbucket/internal/util/events'], function ($, _, events) {

    'use strict';

    /**
     * Intercept the file selection in a file input and pass it on to a ClientFileHandler
     *
     * @param {HTMLElement|jQuery} el
     * @param {ClientFileHandler} clientFileHandler
     * @constructor UploadInterceptor
     */

    function UploadInterceptor(el, clientFileHandler) {
        this.init.apply(this, arguments);
    }

    /**
     * Initialise the UploadInterceptor
     *
     * @param {HTMLElement|jQuery} el
     * @param {ClientFileHandler} clientFileHandler
     */
    UploadInterceptor.prototype.init = function (el, clientFileHandler) {
        _.bindAll(this, 'onSelectFile');

        this.$el = $(el);
        this.clientFileHandler = clientFileHandler;
        this._destroyables = [];
        this._destroyables.push(events.chainWith(this.$el).on('change', this.onSelectFile));
    };

    /**
     * Handle the selected file(s) with the ClientFileHandler
     * @param {jQuery.event} e - the change event
     */
    UploadInterceptor.prototype.onSelectFile = function (e) {
        var el = e.target;
        if (el.files && el.files.length && this.clientFileHandler) {
            this.clientFileHandler.handleFiles(el.files, el);

            //Reset the upload field by wrapping it in a form element and calling reset on it
            $(el).wrap('<form>').parent('form').trigger('reset').end().unwrap();
        }
    };

    /**
     * Destroy the instance
     */
    UploadInterceptor.prototype.destroy = function () {
        _.invoke(this._destroyables, 'destroy');
    };

    return UploadInterceptor;
});