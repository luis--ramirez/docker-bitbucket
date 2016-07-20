'use strict';

define('bitbucket/internal/widget/markup-editor', ['aui', 'jquery', 'lodash', 'bitbucket/internal/util/async-element-resize-helper', 'bitbucket/internal/util/events', 'bitbucket/internal/widget/markup-attachments', 'bitbucket/internal/widget/markup-preview', 'bitbucket/internal/widget/mentionable-textarea'], function (AJS, $, _, asyncElementResizeHelper, events, MarkupAttachments, MarkupPreview, MentionableTextarea) {

    'use strict';

    var editorExtensions = [];

    /**
     * A top level component to simplify initialisation and destruction of markup editing sub-components
     *
     * @param {HTMLElement|jQuery} editor
     * @constructor MarkupEditor
     */
    function MarkupEditor(editor) {
        this.init.apply(this, arguments);
    }

    MarkupEditor._dataKey = 'markup-editor';

    /**
     * Convenience method for initialising a MarkupEditor and storing a reference to it in the jQuery data for the editor element
     *
     * @param {HTMLElement|jQuery} editor
     * @returns {MarkupEditor}
     */
    MarkupEditor.bindTo = function (editor) {
        var $editor = MarkupEditor.unbindFrom(editor);

        var markupEditor = new MarkupEditor($editor);

        $editor.data(MarkupEditor._dataKey, markupEditor);

        return markupEditor;
    };

    /**
     * Destroy the MarkupEditor instance associated with the supplied editor element
     *
     * @param {HTMLElement|jQuery} editor
     * @returns {jQuery}
     */
    MarkupEditor.unbindFrom = function (editor) {
        var $editor = $(editor);
        $editor = $editor.is('.markup-editor') ? $editor : $editor.find('.markup-editor');
        var markupEditor = $editor.data(MarkupEditor._dataKey);

        markupEditor && markupEditor.destroy();

        return $editor;
    };

    /**
     * @typedef {Object} EditorExtension
     * @property {Function} init - Function to call when the editor is initialised (is passed the $editor)
     * @property {Function} destroy - Function to call when the editor is destroyed
     */

    /**
     * Register an editor extension. All new editor instances will have the extension
     * @param {EditorExtension} extension
     */
    MarkupEditor.registerExtension = function (extension) {
        if (!_.contains(editorExtensions, extension)) {
            editorExtensions.push(extension);
        }
    };

    /**
     * Remove an editor extension.
     * New instance will not have the extension,
     * but existing instances will still destroy any previously initialised extensions
     * @param {EditorExtension} extension
     */
    MarkupEditor.deregisterExtension = function (extension) {
        editorExtensions = _.without(editorExtensions, extension);
    };

    events.addLocalEventMixin(MarkupEditor.prototype);

    /**
     * Initialise the editor
     *
     * @param {HTMLElement|jQuery} editor
     */
    MarkupEditor.prototype.init = function (editor) {
        var $editor = $(editor);
        this.$editor = $editor.is('.markup-editor') ? $editor : $editor.find('.markup-editor');
        this._destroyables = [];
        var $textarea = this.$editor.find('textarea');

        if ($textarea.is(document.activeElement)) {
            //expandingTextarea removes $textarea from the DOM to insert it into its new container.
            //This preserves focus
            _.defer($textarea.focus.bind($textarea));
        }
        var $expandingTextarea = this.$editor.find('textarea.expanding').expandingTextarea();
        this._destroyables.push(events.chainWith($expandingTextarea).on('resize.expanding', this.onComponentResize.bind(this, false)));
        this._destroyables.push({ destroy: $expandingTextarea.expandingTextarea.bind($expandingTextarea, 'destroy') });

        var markupPreview = new MarkupPreview(this.$editor);
        this._destroyables.push(events.chainWith(markupPreview).on('resize', this.onComponentResize.bind(this, true)));
        this._destroyables.push(markupPreview);

        this._destroyables.push(new MentionableTextarea({ $container: this.$editor }));

        var disableAttachmentsButton = function (message) {
            this.$editor.find('.markup-attachments-button').addClass('disabled').prop('disabled', 'disabled').attr('aria-disabled', true).attr('title', message);
        }.bind(this);

        if (MarkupAttachments.isEnabled()) {
            if (MarkupAttachments.isSupported()) {
                this._destroyables.push(new MarkupAttachments(this.$editor));
            } else {
                //IE9
                disableAttachmentsButton(AJS.I18n.getText('bitbucket.web.markup.attachments.unsupported'));
            }
        } else {
            //Disabled on server
            disableAttachmentsButton(AJS.I18n.getText('bitbucket.web.markup.attachments.disabled'));
        }

        editorExtensions.forEach(function (extension) {
            extension.init(this.$editor);
            _.isFunction(extension.destroy) && this._destroyables.push({
                destroy: _.partial(extension.destroy, this.$editor)
            });
        }.bind(this));

        // init tooltip for help icon button and preview link
        this.$editor.find('.markup-preview-help').tooltip({
            gravity: $.fn.tipsy.autoNS
        });
    };

    /**
     * Trigger an editor resize event whenever any of the components resize
     * @param {boolean} shouldUpdatePosition - A flag to say whether the component resize changes the focal point for the editor
     */
    MarkupEditor.prototype.onComponentResize = function (shouldUpdatePosition) {
        var _this = this;

        // To avoid triggering a layout we request the next animation frame where we can safely read the size of the
        // editor to determine whether it has actually changed size
        asyncElementResizeHelper(this.$editor[0], function () {
            _this.$editor.triggerHandler('resize'); //Let any components listening for editor resizes know, but don't bubble
            _this.trigger('resize', shouldUpdatePosition);
        });
    };

    /**
     * Destroy the instance
     */
    MarkupEditor.prototype.destroy = function () {
        _.invoke(this._destroyables, 'destroy');

        this.$editor.data(MarkupEditor._dataKey, null);
        this.$editor = null;
        this.off();
    };

    return MarkupEditor;
});