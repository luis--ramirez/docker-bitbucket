'use strict';

define('bitbucket/internal/widget/inline-error-dialog', ['aui', 'jquery', 'lodash', 'bitbucket/internal/util/events'], function (AJS, $, _, events) {

    'use strict';

    /**
     * Very simple inline dialog wrapper for showing a list of errors with a title
     * @param {HTMLElement|jQuery} trigger - the element to anchor the inline dialog to visually, but showing the dialog won't be bound to it.
     * @param {object} opts
     * @param {boolean} opts.persistent - Should the inline dialog be persistent or close on outside click?
     * @constructor InlineErrorDialog
     */

    function InlineErrorDialog(trigger, opts) {
        this.init.apply(this, arguments);
    }

    /**
     * Initialise the InlineErrorDialog
     * @param {HTMLElement|jQuery} trigger - the element to anchor the inline dialog to visually, but showing the dialog won't be bound to it.
     * @param {object} opts
     * @param {boolean} opts.persistent - Should the inline dialog be persistent or close on outside click?
     */
    InlineErrorDialog.prototype.init = function (trigger, opts) {
        this.errors = [];
        this.options = $.extend({ persistent: true }, opts);
        this._destroyables = [];

        _.bindAll(this, '_renderDialogContents', 'hide', 'show', 'refresh', 'add', 'reset', 'destroy');

        var dialogOptions = {
            noBind: true,
            persistent: this.options.persistent,
            addActiveClass: false,
            fadeTime: 0 //Prevents race condition with rapid hide and show
        };

        this._$inlineDialog = AJS.InlineDialog($(trigger), _.uniqueId('inline-error-dialog-'), this._renderDialogContents, dialogOptions);

        if (this.options.persistent) {
            this._destroyables.push(events.chainWith(this._$inlineDialog).on('click', '.dismiss-button', this.hide));
        }
    };

    /**
     * Render the contents of the inline dialog
     * @param {jQuery} $content - the content element of the inline dialog
     * @param {HTMLElement} trigger - the trigger element
     * @param {Function} showPopup - Function which will show the inline dialog
     * @private
     */
    InlineErrorDialog.prototype._renderDialogContents = function ($content, trigger, showPopup) {
        $content.html(bitbucket.internal.widget.inlineErrorDialog.contents({
            title: _.isFunction(this.options.title) ? this.options.title(this.errors) : this.options.title,
            subtitle: _.isFunction(this.options.subtitle) ? this.options.subtitle(this.errors) : this.options.subtitle,
            errors: this.errors,
            persistent: this.options.persistent
        })).addClass('inline-error-contents');
        showPopup();
    };

    /**
     * Hide the InlineErrorDialog
     */
    InlineErrorDialog.prototype.hide = function () {
        this._$inlineDialog.hide();
        this.reset();
    };

    /**
     * Rerender the contents and show the inline dialog, recalculating the size and position
     */
    InlineErrorDialog.prototype.show = function () {
        this._$inlineDialog.show();
        //Need to refresh after show, because show doesn't recalculate position if it was already visible
        this.refresh();
    };

    /**
     * Refresh the InlineErrorDialog (reattach to trigger position)
     */
    InlineErrorDialog.prototype.refresh = function () {
        this._$inlineDialog.refresh();
    };

    /**
     * Add an error to the InlineErrorDialog and refresh
     * @param error
     */
    InlineErrorDialog.prototype.add = function (error) {
        this.errors.push(error);
    };

    /**
     * Remove all the errors from the inline dialog and refresh
     */
    InlineErrorDialog.prototype.reset = function () {
        this.errors.length = 0;
    };

    /**
     * Destroy the instance
     */
    InlineErrorDialog.prototype.destroy = function () {
        this.errors.length = 0;
        _.invoke(this._destroyables, 'destroy');
        this._$inlineDialog.remove();
    };

    return InlineErrorDialog;
});