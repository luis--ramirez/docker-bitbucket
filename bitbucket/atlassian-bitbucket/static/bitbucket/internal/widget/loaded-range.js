'use strict';

define('bitbucket/internal/widget/loaded-range', function () {

    'use strict';

    /**
     * A widget for tracking which pages of items have been loaded.
     */

    function LoadedRange(capacity) {
        //assumption: only a contiguous range of lines will ever be loaded.
        this.start = undefined;
        this.nextPageStart = undefined;
        this._reachedStart = false;
        this._reachedEnd = false;
        this._reachedCapacity = false;
        this._capacity = capacity || Infinity;
    }

    LoadedRange.prototype.isEmpty = function () {
        return this.start === undefined;
    };

    LoadedRange.prototype.isBeforeStart = function (item) {
        return item < this.start;
    };

    LoadedRange.prototype.isAfterNextPageStart = function (item) {
        return item > this.nextPageStart;
    };

    LoadedRange.prototype.isLoaded = function (item) {
        return !(this.isEmpty() || this.isBeforeStart(item) || this.isAfterNextPageStart(item));
    };

    LoadedRange.prototype.getAttachmentMethod = function (start, size) {
        return this.isEmpty() ? 'html' : this.isBeforeStart(start) ? 'prepend' : 'append';
    };

    LoadedRange.prototype.add = function (start, size, isLastPage, nextPageStart) {
        var isEmpty = this.isEmpty();
        nextPageStart = nextPageStart || start + size;
        if (isEmpty || this.isBeforeStart(start)) {
            this.start = start;
        }
        if (isEmpty || this.isAfterNextPageStart(nextPageStart)) {
            this.nextPageStart = nextPageStart;
        }

        this._reachedStart = this._reachedStart || start <= 0;
        var reachedEnd = this._reachedEnd = this._reachedEnd || isLastPage;
        if (!reachedEnd && this.nextPageStart >= this._capacity) {
            this._reachedCapacity = this._reachedEnd = true;
        }

        return this;
    };

    LoadedRange.prototype.reachedStart = function () {
        return this._reachedStart;
    };
    LoadedRange.prototype.reachedEnd = function () {
        return this._reachedEnd;
    };
    LoadedRange.prototype.reachedCapacity = function () {
        return this._reachedCapacity;
    };

    LoadedRange.prototype.pageBefore = function (pageSize) {
        if (this.reachedStart()) {
            return null;
        }

        var start = Math.max(0, this.start - pageSize);
        return {
            start: start,
            limit: this.start - start
        };
    };

    LoadedRange.prototype.pageAfter = function (pageSize) {
        if (this.reachedEnd()) {
            return null;
        }

        return {
            start: this.nextPageStart,
            limit: pageSize
        };
    };

    return LoadedRange;
});