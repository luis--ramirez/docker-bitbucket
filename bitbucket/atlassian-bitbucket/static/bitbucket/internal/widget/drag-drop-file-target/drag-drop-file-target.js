'use strict';

define('bitbucket/internal/widget/drag-drop-file-target', ['jquery', 'lodash', 'bitbucket/internal/util/events'], function ($, _, events) {

    'use strict';

    function DragDropFileTarget(el, opts) {
        return this.init.apply(this, arguments);
    }

    DragDropFileTarget.prototype.getDefaults = function () {
        return {
            activeDropTargetClass: 'active-drop-target',
            uploadPrompt: 'Drag a file here to upload',
            clientFileHandler: null
        };
    };

    DragDropFileTarget.prototype.init = function (el, opts) {
        _.bindAll(this, 'onDragOver', 'onDragEnd', 'onDrop');

        this.$target = $(el);
        this.options = $.extend({}, this.getDefaults(), opts);

        this.$target.attr('data-upload-prompt', this.options.uploadPrompt);

        this._destroyables = [];
        //bind drag & drop events
        this._destroyables.push(events.chainWith(this.$target).on('dragover', this.onDragOver).on('dragleave', this.onDragEnd).on('dragend', this.onDragEnd).on('drop', this.onDrop));
    };

    DragDropFileTarget.prototype.onDragOver = function (e) {
        e.preventDefault();
        this.$target.addClass(this.options.activeDropTargetClass);
    };

    DragDropFileTarget.prototype.onDragEnd = function (e) {
        e.preventDefault();
        this.$target.removeClass(this.options.activeDropTargetClass);
    };

    DragDropFileTarget.prototype.onDrop = function (e) {
        e.preventDefault();
        e.originalEvent.preventDefault();

        this.$target.removeClass(this.options.activeDropTargetClass);

        if (this.options.clientFileHandler) {
            this.options.clientFileHandler.handleFiles(e.originalEvent.dataTransfer.files, e.originalEvent.target);
        }
    };

    DragDropFileTarget.prototype.destroy = function () {
        this.$target.removeAttr('data-upload-prompt');
        this.$target.removeClass(this.options.activeDropTargetClass);

        _.invoke(this._destroyables, 'destroy');
    };

    return DragDropFileTarget;
});