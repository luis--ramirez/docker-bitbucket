'use strict';

define('bitbucket/internal/widget/faux-upload-field', ['jquery', 'lodash', 'bitbucket/internal/util/dom-event', 'bitbucket/internal/util/events', 'bitbucket/internal/util/navigator', 'bitbucket/internal/widget/client-file-handlers/client-file-handler', 'bitbucket/internal/widget/upload-interceptor'], function ($, _, domEvent, events, navigatorUtil, ClientFileHandler, UploadInterceptor) {

    'use strict';

    /**
     * An upload field that can be styled and triggers interaction with an actual file input
     * @param {HTMLElement|jQuery} el - The fake upload field (preferably a `<label>`)
     * @param {object} opts
     * @constructor FauxUploadField
     */

    function FauxUploadField(el, opts) {
        this.init.apply(this, arguments);
    }

    /**
     * @default
     * @property {ClientFileHandler} clientFileHandler -
     * @property {?string|Regexp} accept - The file types to accept. https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input#attr-accept
     *                                    Either a ClientFileHandler.typeFilters which is converted to a string, or a string
     * @property {boolean} allowMultiple - Whether to allow the selection of multiple files.
     */
    FauxUploadField.prototype.defaults = {
        clientFileHandler: null,
        accept: null,
        allowMultiple: false
    };

    /**
     * Create the upload field and link it to the el.
     *
     * @param {HTMLElement|jQuery} el - The fake upload field (preferably a `<label>`)
     * @param {object} opts
     */
    FauxUploadField.prototype.init = function (el, opts) {
        this.$el = $(el);
        this._destroyables = [];

        //Map ClientFileHandler.typeFilters to an `accept` string
        switch (opts.accept) {
            case ClientFileHandler.typeFilters.audio:
                opts.accept = 'audio/*';
                break;
            case ClientFileHandler.typeFilters.image:
                opts.accept = 'image/*';
                break;
            case ClientFileHandler.typeFilters.imageWeb:
                opts.accept = 'image/jpeg, image/gif, image/png';
                break;
            case ClientFileHandler.typeFilters.video:
                opts.accept = 'video/*';
                break;
        }

        this.options = $.extend({}, this.defaults, opts);

        var fieldId = _.uniqueId('faux-upload-field-');

        var $uploadField = $(bitbucket.internal.widget.fauxUploadField.uploadField({
            id: fieldId,
            accept: this.options.accept,
            allowMultiple: this.options.allowMultiple
        })).hide().insertAfter(this.$el);

        this.$el.tooltip({
            gravity: $.fn.tipsy.autoNS
        });

        if (this.$el.is('label')) {
            //Using a label as the FauxUploadField element is the most reliable
            this.$el.attr('for', fieldId);
        } else if (navigatorUtil.isIE()) {
            // IE marks a file input as compromised if has a click triggered programmatically
            // and this prevents you from later submitting it's form via Javascript.
            // If the $el isn't a label, the only thing you can do is show the native upload field instead
            this.$el.hide();
            $uploadField.show();
        } else {
            // In browsers other than IE you can trigger the clicks programmatically
            this._destroyables.push(events.chainWith(this.$el).on('click', domEvent.preventDefault($uploadField.click.bind($uploadField))));
        }

        if (this.options.clientFileHandler) {
            //If we have a clientFileHandler, intercept the file selection and process it with the clientFileHandler
            this._destroyables.push(new UploadInterceptor($uploadField, this.options.clientFileHandler));
        }
    };

    /**
     * Destroy the instance
     */
    FauxUploadField.prototype.destroy = function () {
        _.invoke(this._destroyables, 'destroy');
    };

    return FauxUploadField;
});