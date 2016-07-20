'use strict';

define('bitbucket/internal/widget/overflowing-list', ['jquery'], function ($) {

    'use strict';

    function OverflowingList(listSelector, items, opts) {
        this._$container = $(listSelector);
        this._opts = $.extend({
            overflowMenuId: this._$container.attr('data-overflow-menu-id')
        }, OverflowingList.defaults, opts);
        this._items = Array.prototype.slice.call(items);
    }
    OverflowingList.defaults = {
        maxOpen: 5,
        itemSelector: undefined,
        overflowMenuClass: 'aui-style-default aui-dropdown2-tailed',
        getItemHtml: function getItemHtml(data, isOverflowed) {
            return '<span>' + (typeof data === 'string' ? data : JSON.stringify(data)) + '</span>';
        },
        compareFn: function compareFn(a, b) {
            return -1;
        }
    };

    function setOverflowCount($container, count) {
        $container.find('> .aui-dropdown2-trigger .aui-badge').text(count);
    }

    function get$OverflowList($container, overflowMenuId) {
        return overflowMenuId ? $('#' + overflowMenuId + ' > ul') : $container.children('.aui-dropdown2:last > ul');
    }

    function create$OverflowList($container, overflowMenuClass, overflowMenuId) {
        var $trigger = $(aui.dropdown2.trigger({
            menu: { id: overflowMenuId },
            content: '<div class="extras-dropdown-trigger">' + aui.badges.badge({ 'text': '?' }) + '</div>'
        }).appendTo($container));
        var $menu = $(aui.dropdown2.contents({
            id: overflowMenuId,
            extraClasses: overflowMenuClass,
            content: '<ul class="aui-list-truncate"></ul>'
        })).appendTo($container);
        return $menu.children('ul');
    }

    OverflowingList.prototype.addItem = function (item) {

        var maxOpen = this._opts.maxOpen;
        var compareFn = this._opts.compareFn;
        var getItemHtml = this._opts.getItemHtml;
        var overflowMenuClass = this._opts.overflowMenuClass;
        var overflowMenuId = this._opts.overflowMenuId;

        var $item;
        var $container = this._$container;
        var $overflowList = get$OverflowList($container, overflowMenuId);
        var $overflowItems = $overflowList.find('li').children(this._opts.itemSelector);
        var $items = $container.children(this._opts.itemSelector).not('.aui-dropdown2-trigger, .aui-dropdown2').add($overflowItems);

        var inserted = false;
        var i;
        var len = this._items.length;
        for (i = 0; i < len; i++) {
            // figure out where to put the item (sort using the compareFn)
            if (compareFn(item, this._items[i]) < 0) {
                if (i >= maxOpen) {
                    // goes in the overflow section
                    $item = $(getItemHtml(item, true));
                    $item.wrap('<li/>').parent().insertBefore($items.eq(i).parent());
                    setOverflowCount($container, this._items.length + 1 - maxOpen);
                } else {
                    // goes in the visible section
                    $item = $(getItemHtml(item, false));
                    $item.insertBefore($items.eq(i)).hide().fadeIn('fast');
                    if (this._items.length >= maxOpen) {
                        // we pushed another item over the limit into the overflow.
                        $items.eq(maxOpen - 1).remove();
                        ($overflowList.length ? $overflowList : create$OverflowList($container, overflowMenuClass, overflowMenuId)).prepend($('<li/>').append(getItemHtml(this._items[maxOpen - 1], true)));
                        setOverflowCount($container, this._items.length + 1 - maxOpen);
                    }
                }
                this._items.splice(i, 0, item);
                inserted = true;
                break;
            }
        }

        if (!inserted) {
            // it goes at the end
            if (this._items.length >= maxOpen) {
                ($overflowList.length ? $overflowList : create$OverflowList($container, overflowMenuClass, overflowMenuId)).append($(getItemHtml(item, true)).wrap('<li/>').parent());
                setOverflowCount($container, this._items.length + 1 - maxOpen);
            } else {
                $item = $(getItemHtml(item, false));
                $item.appendTo($container).hide().fadeIn('fast');
            }
            this._items.push(item);
        }
    };

    return OverflowingList;
});