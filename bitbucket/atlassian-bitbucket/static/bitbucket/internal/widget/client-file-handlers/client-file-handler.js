'use strict';

define('bitbucket/internal/widget/client-file-handlers/client-file-handler', ['jquery', 'lodash', 'bitbucket/internal/util/events'], function ($, _, events) {

    'use strict';

    function ClientFileHandler(opts) {
        return this.init(opts);
    }

    events.addLocalEventMixin(ClientFileHandler.prototype);

    ClientFileHandler.typeFilters = {
        all: /.*/,
        application: /^application\/.*/i,
        audio: /^audio\/.*/i,
        image: /^image\/.*/i,
        imageWeb: /^image\/(jpeg|png|gif)$/i,
        text: /^text\/.*/i,
        video: /^video\/.*/i
    };

    ClientFileHandler.prototype.defaults = {
        fileTypeFilter: ClientFileHandler.typeFilters.all, //specify a regex or use one of the built in typeFilters
        fileCountLimit: Infinity, //How many files can a user upload at once? This will limit it to the first n files,
        fileSizeLimit: 10 * 1024 * 1024, //Maximum file size in bytes (10MB per file),
        onSuccess: $.noop,
        onError: $.noop
    };

    ClientFileHandler.prototype.init = function (opts) {
        this.options = $.extend({}, this.defaults, opts);

        if (opts && !opts.fileSizeLimit) {
            this.options.fileSizeLimit = this.defaults.fileSizeLimit;
        }
        if (opts && !opts.fileCountLimit) {
            this.options.fileCountLimit = this.defaults.fileCountLimit;
        }

        _.bindAll(this, 'handleFiles', 'filterFiles');

        return this;
    };

    /**
     * Takes in an array of files, processes them, and fires the onSuccess handler if any are valid, or the onError handler
     * otherwise. These handlers can be specified on the options object passed to the constructor.
     * @param fileList array of objects like { size:Number, type:String }
     */
    ClientFileHandler.prototype.handleFiles = function (fileList) {
        this.trigger('filesSelected', fileList);

        //Assumes any number of files > 0 is a success, else it's an error
        var filteredFiles = this.filterFiles(fileList);

        if (filteredFiles.valid.length > 0) {
            //There was at least one valid file
            _.isFunction(this.options.onSuccess) && this.options.onSuccess(filteredFiles.valid);
            this.trigger('validFiles', filteredFiles.valid);
        } else {
            //there were no valid files added
            _.isFunction(this.options.onError) && this.options.onError(filteredFiles.invalid);
        }

        if (_.keys(filteredFiles.invalid).length) {
            this.trigger('invalidFiles', filteredFiles.invalid);
        }
    };

    ClientFileHandler.prototype.filterFiles = function (fileList) {
        var fileTypeFilter = _.isRegExp(this.options.fileTypeFilter) ? this.options.fileTypeFilter : this.defaults.fileTypeFilter;
        var fileSizeLimit = this.options.fileSizeLimit;

        var sortedFiles = _.reduce(fileList, function (sorted, file) {
            if (!fileTypeFilter.test(file.type)) {
                sorted.invalid.byType = sorted.invalid.byType ? sorted.invalid.byType.concat(file) : [file];
            } else if (file.size > fileSizeLimit) {
                sorted.invalid.bySize = sorted.invalid.bySize ? sorted.invalid.bySize.concat(file) : [file];
            } else {
                sorted.valid.push(file);
            }
            return sorted;
        }, { valid: [], invalid: {} });

        if (sortedFiles.valid.length > this.options.fileCountLimit) {
            sortedFiles.invalid.byCount = sortedFiles.valid.slice(this.options.fileCountLimit);
            sortedFiles.valid = sortedFiles.valid.slice(0, this.options.fileCountLimit);
        }

        return sortedFiles;
    };

    return ClientFileHandler;
});