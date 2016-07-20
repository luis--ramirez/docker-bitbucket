'use strict';

define('bitbucket/internal/widget/list-and-detail-view', ['jquery', 'lodash', 'bitbucket/internal/util/feature-detect'], function ($, _, feature) {

    'use strict';

    var keycodes = {
        j: 74,
        k: 75
    };

    function ListAndDetailView($listAndDetailView, selectHandler, options) {
        this.options = $.extend({}, ListAndDetailView.prototype.defaults, options);
        this.$listView = $listAndDetailView.find('.list-view');
        this.$detailView = $listAndDetailView.find('.detail-view');
        this.selectHandler = selectHandler;
        _.bindAll(this, '_itemClickHandler', '_shortcutHandler');
        this.init();
    }

    ListAndDetailView.prototype.defaults = {
        selectedClass: 'selectedItem'
    };

    ListAndDetailView.prototype.init = function () {
        this.bindShortcuts();
        this.$listView.on('click', 'li', this._itemClickHandler);
        this._maybeSelectFirst();
    };

    ListAndDetailView.prototype._itemClickHandler = function (e) {
        var selectedClass = this.options.selectedClass;
        this.$listView.find('li.' + selectedClass).removeClass(selectedClass);
        var $listItem = $(e.currentTarget).addClass(selectedClass);
        this.selectHandler($listItem, this.$listView, this.$detailView, e);
    };

    ListAndDetailView.prototype._maybeSelectFirst = function () {
        if (this.options.selectFirstOnInit) {
            this.$listView.find('li:first').click();
        }
    };

    ListAndDetailView.prototype.destroy = function () {
        this.unbindShortcuts();
    };

    ListAndDetailView.prototype._shortcutHandler = function (e) {
        var nextPrev;
        if (e.which === keycodes.j) {
            nextPrev = 'next';
        } else if (e.which === keycodes.k) {
            nextPrev = 'prev';
        } else {
            return;
        }

        var $selected = this.$listView.find('li.' + this.options.selectedClass);
        var $target = $selected[nextPrev]('li');
        $target.click().find('a').focus().blur(); // Scroll into view if necessary. Will only scroll if there is an <a>
    };

    ListAndDetailView.prototype.bindShortcuts = function () {
        $(document).on('keydown', this._shortcutHandler);
    };

    ListAndDetailView.prototype.unbindShortcuts = function () {
        $(document).off('keydown', this._shortcutHandler);
    };

    /**
     * Transitions and removes the specified item from the listView.
     * @param {jQuery} $item to remove
     * @param {string} jQuery selector of next/prev item to click
     * @return {Promise} a promise that completes when the item has been removed
     */
    ListAndDetailView.prototype.removeItem = function ($item, selector) {
        var deferred = $.Deferred();
        $item.addClass('offScreen').one(feature.transitionEndEventName(), function (e) {
            $item.remove();
            deferred.resolve();
        });
        if ($item.next(selector).length) {
            $item.next(selector).click();
        } else if ($item.prev(selector).length) {
            $item.prev(selector).click();
        } else {
            // No more items in the list.
            this.$detailView.empty();
        }
        return deferred.promise();
    };

    /**
     * Transitions and adds the specified item to the listView.
     * @param {jQuery} $item to be added
     * @param {jQuery} $beforeElement (optional) element before which to insert the specified $item.
     *                 If not supplied, the element will be appended to $listView.
     * @param {boolean} (optional) true, if the added item should be selected, false otherwise
     */
    ListAndDetailView.prototype.addItem = function ($item, $beforeElement, select) {
        $item.addClass('offScreen');
        if ($beforeElement) {
            $item.insertBefore($beforeElement);
        } else {
            $item.appendTo(this.$listView);
        }
        $item.offset(); // Ensure the browser paints the item before the transition.
        $item.removeClass('offScreen');
        if (select) {
            $item.click();
        }
    };

    return ListAndDetailView;
});