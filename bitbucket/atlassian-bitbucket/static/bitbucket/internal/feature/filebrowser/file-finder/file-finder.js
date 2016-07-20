'use strict';

define('bitbucket/internal/feature/filebrowser/file-finder', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/model/path', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/util/property', 'bitbucket/internal/util/regexp', 'bitbucket/internal/widget/keyboard-controller', 'bitbucket/internal/widget/paged-scrollable', 'exports'], function (AJS, $, _, nav, Path, ajax, events, fn, propertyUtil, regexp, keyboardController, PagedScrollable, exports) {
    var ListKeyboardController = keyboardController.ListKeyboardController;

    var maxDirectoryChildren = 100000;
    propertyUtil.getFromProvider('page.max.directory.recursive.children').done(function (val) {
        maxDirectoryChildren = val;
    });

    function getRestFileFinderUrl(revision) {
        return nav.rest().currentRepo().files().at(revision.getId()).withParams({ limit: maxDirectoryChildren }).build();
    }

    function getFileUrl(path, revision) {
        var browse = nav.currentRepo().browse().path(path);

        if (!revision.isDefault()) {
            browse = browse.at(revision.getDisplayId());
        }

        return browse.build();
    }

    function lowerToCaseInsensitive(chr) {
        return chr !== chr.toUpperCase() ? '[' + regexp.escape(chr.toUpperCase() + chr) + ']' : regexp.escape(chr);
    }

    // Trim leading, trailing and multiple spaces.
    function trimSpaces(s) {
        return s.replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    function getPattern(filter) {
        if (filter) {

            var patternStr = '';
            var splitFilter = trimSpaces(filter).split(/\*|\s|(?=[A-Z0-9]|\/|\.|-|_)/g);

            //Remove empty strings
            splitFilter = _.filter(splitFilter, fn.not(_.isEmpty));

            var splitLength = splitFilter.length;
            if (splitLength) {
                patternStr = _.map(splitFilter, function (termPart) {
                    return '(' + _.map(termPart.split(''), lowerToCaseInsensitive).join('') + ')';
                }).join('.*?');
                return new RegExp('(' + patternStr + ')', 'g');
            }
        }
        return null;
    }

    function highlightMatches(pattern, str) {
        //TODO: port this to use util/highlight-text in the future
        str = AJS.escapeHtml(str);
        return pattern ? str.replace(pattern, '<mark>$1</mark>') : str;
    }

    function FileFinder(container, revisionRef) {
        var self = this;
        this._isLoaded = false;
        this.fileTableSelector = container;
        this.currentRevisionRef = revisionRef;
        this.resultSetId = 0;
        this.$fileFinderInput = $('.file-finder-input');
        this.$textInput = $('input.filter-files');
        this.$fileFinderTip = $('.file-finder-tip');
        this.$spinner = $("<div class='spinner'/>").hide().insertAfter(this.fileTableSelector);

        events.on('bitbucket.internal.page.filebrowser.revisionRefChanged', function (revisionRef) {
            self.currentRevisionRef = revisionRef;
            self.files = undefined; //Clear cache as the revision has changed, we need to re-request
        });
    }

    // Not final yet, needs more thought
    FileFinder.prototype.tips = [AJS.I18n.getText('bitbucket.web.file.finder.tip.1'), AJS.I18n.getText('bitbucket.web.file.finder.tip.2'), AJS.I18n.getText('bitbucket.web.file.finder.tip.3'), AJS.I18n.getText('bitbucket.web.file.finder.tip.4'), AJS.I18n.getText('bitbucket.web.file.finder.tip.5')];

    FileFinder.prototype._bindKeyboardNavigation = function () {
        this._filesKeyboardController = new ListKeyboardController(this.$textInput, $(this.fileTableSelector), {
            wrapAround: false,
            focusedClass: 'focused-file',
            itemSelector: 'tr.file-row',
            onSelect: function onSelect($focused) {
                window.location.href = $focused.find('a').attr('href');
            },
            requestMore: function requestMore() {
                var promise = $.Deferred();
                window.scrollTo(0, document.documentElement.scrollHeight);
                setTimeout(function () {
                    promise.resolve();
                });
                return promise;
            }
        });
    };

    FileFinder.prototype._showSpinner = function () {
        $('.filebrowser-banner').empty();
        $(this.fileTableSelector).empty();
        this.$spinner.show().spin('large');
    };

    FileFinder.prototype._hideSpinner = function () {
        this.$spinner.spinStop().hide();
    };

    FileFinder.prototype.isLoaded = function () {
        return this._isLoaded;
    };

    FileFinder.prototype.unloadFinder = function () {
        $('.breadcrumbs').removeClass('file-finder-mode');
        this.$textInput.blur().hide().val('');
        this.$fileFinderInput.removeClass('visible');
        this.$fileFinderTip.removeClass('visible');
        this._isLoaded = false;
        if (this._filesKeyboardController) {
            this._filesKeyboardController.destroy();
            this._filesKeyboardController = null;
        }
        this.tableView && this.tableView.reset();
        events.trigger('bitbucket.internal.feature.filefinder.unloaded');
    };

    FileFinder.prototype.loadFinder = function () {
        $('.filebrowser-banner').empty();
        $('.breadcrumbs').addClass('file-finder-mode');
        this.$textInput.focus();
        if (!this._isLoaded) {
            this.requestFiles();
            this._isLoaded = true;
        }
        events.trigger('bitbucket.internal.feature.filefinder.loaded');
    };

    FileFinder.prototype.requestFiles = function () {
        var self = this;

        this._showSpinner();
        if (this.files) {
            // Files have already been loaded
            this.onFilesLoaded();

            // slightly hacky since we don't do a request but it triggers a re-layout fixing an overlap in IE in narrow res
            this._hideSpinner();
        } else {
            ajax.rest({
                url: getRestFileFinderUrl(self.currentRevisionRef)
            }).done(function (data) {
                var files = data.values;
                if (!data.isLastPage) {
                    self.showLimitWarning();
                }
                self.files = [];
                for (var i = 0; i < files.length; i++) {
                    self.files.push({
                        name: files[i]
                    });
                }
                self.onFilesLoaded();
            }).always(function () {
                self._hideSpinner();
            });
        }
    };

    FileFinder.prototype.onFilesLoaded = function () {
        var self = this;
        var randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
        var currentTip = AJS.I18n.getText('bitbucket.web.file.finder.tip.label') + ' ' + randomTip;
        this.$fileFinderInput.addClass('visible');
        this.$fileFinderTip.addClass('visible');
        this.$textInput.show();
        this.showFiles();
        this._bindKeyboardNavigation();
        this._filesKeyboardController.moveToNext();

        this.$fileFinderTip.tooltip({
            gravity: 'w',
            html: true,
            title: fn.constant(currentTip)
        });

        var $input = this.$textInput;
        var inputVal = $input.val();

        function filterAndSelect(filter) {
            self.showFiles(filter);
            self._filesKeyboardController.setListElement($(self.fileTableSelector));
            self._filesKeyboardController.moveToNext();
        }

        //Unbind first in case the input has remained visible across multiple directory visits
        this.$textInput.unbind('keyup').on('keyup', function (e) {
            if (e.keyCode === 27) {
                events.trigger('bitbucket.internal.feature.filetable.hideFind', self);
            }
        }).on('keyup', _.debounce(function (e) {
            if (e.keyCode !== 27 && inputVal !== (inputVal = $input.val())) {
                filterAndSelect($(this).val());
            }
        }, 200)).focus();

        //Filter and select if there was
        if (inputVal) {
            filterAndSelect(inputVal);
        }
    };

    FileFinder.prototype.showFiles = function (filter) {
        this.filteredFiles = this.files;

        var pattern = getPattern(filter);

        if (this.tableView) {
            //kill the old table view - ensuring it unbinds document listeners
            this.tableView.reset();
        }
        //Filter files upfront since all files are pre-fetched anyway
        if (pattern && this.files.length > 0) {
            this.filteredFiles = _.filter(this.files, function (f) {
                pattern.lastIndex = 0;
                return pattern.test(f.name);
            });
            pattern.lastIndex = 0;

            //matches the filter pattern but only where there are no following /
            var filenamePattern = new RegExp(pattern.source + "(?!.*/)");
            var exactMatches = function exactMatches(file) {
                /*jshint boss:true */
                if (file.exactMatches) {
                    return file.exactMatches;
                }
                return file.exactMatches = file.name.indexOf(filter) >= 0;
            };
            var filenameMatches = function filenameMatches(file) {
                /*jshint boss:true */
                if (file.matches) {
                    return file.matches;
                }
                return file.matches = filenamePattern.test(file.name);
            };

            this.filteredFiles.sort(function (f1, f2) {
                var f1ExactMatch = exactMatches(f1);
                var f2ExactMatch = exactMatches(f2);

                if (f1ExactMatch !== f2ExactMatch) {
                    return f1ExactMatch ? -1 : 1;
                }

                var f1FilenameMatches = filenameMatches(f1);
                var f2FilenameMatches = filenameMatches(f2);

                if (f1FilenameMatches === f2FilenameMatches) {
                    return f1.name.localeCompare(f2.name);
                }

                return f1FilenameMatches ? -1 : 1;
            });
        } else {
            _.forEach(this.files, function (f) {
                f.highlightedName = null;
                f.matches = null;
                f.exactMatches = null;
            });
        }

        this._makeFileFinderView(pattern);
    };

    FileFinder.prototype.showLimitWarning = function () {
        var $warning = $(bitbucket.internal.feature.filefinder.tableLimitedWarning({
            limit: maxDirectoryChildren
        }));
        $(this.fileTableSelector).parent().append($warning);
    };

    FileFinder.prototype._makeFileFinderView = function (pattern) {
        this.tableView = new FileFinderTableView(this.filteredFiles, pattern, this.fileTableSelector, this.currentRevisionRef, this.resultSetId++);
        //Load the first 50 elements
        this.tableView.init();
    };

    function FileFinderTableView(files, pattern, fileTableSelector, revisionRef, resultSetId) {
        PagedScrollable.call(this, null, {
            pageSize: 50,
            paginationContext: 'file-finder'
        });
        this.pattern = pattern;
        this.fileTableSelector = fileTableSelector;
        this.filteredFiles = files;
        this.currentRevisionRef = revisionRef;
        this.resultSetId = resultSetId;
    }

    $.extend(FileFinderTableView.prototype, PagedScrollable.prototype);

    FileFinderTableView.prototype.requestData = function (start, limit) {
        var self = this;
        var slice = this.filteredFiles.slice(start, start + limit);

        _.forEach(slice, function (f) {
            if (!f.url) {
                f.url = getFileUrl(new Path(f.name), self.currentRevisionRef);
            }
            f.highlightedName = highlightMatches(self.pattern, f.name);
        });
        return $.Deferred().resolve({
            values: slice,
            size: slice.length,
            isLastPage: start + limit >= this.filteredFiles.length
        });
    };

    FileFinderTableView.prototype.attachNewContent = function (data, attachmentMethod) {
        var $tableContainer = $(this.fileTableSelector);
        if (attachmentMethod === 'html') {
            var $html = $(bitbucket.internal.feature.filefinder.fileFinderTable({
                files: data.values,
                resultSetId: this.resultSetId
            }));
            $tableContainer.replaceWith($html);
        } else {
            var append = attachmentMethod === 'append';
            var $tbody = $($tableContainer, 'table > tbody');

            _.each(data.values, function (file) {
                var $row = $(bitbucket.internal.feature.filefinder.fileFinderRow($.extend({}, file, { name: file.highlightedName })));
                if (append) {
                    $tbody.append($row);
                } else {
                    $tbody.prepend($row);
                }
            });
        }
    };

    exports.FileFinder = FileFinder;

    // Visible for testing
    FileFinder.highlightMatches = highlightMatches;
    FileFinder.getPattern = getPattern;
});