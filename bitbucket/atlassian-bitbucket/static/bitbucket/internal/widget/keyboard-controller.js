'use strict';

define('bitbucket/internal/widget/keyboard-controller', ['aui', 'jquery'], function (AJS, $) {

    'use strict';

    /**
     *
     * @param eventTarget
     * @param handlers
     * @return {KeyboardController}
     * @constructor
     */

    function KeyboardController(eventTarget, handlers) {
        if (!(this instanceof KeyboardController)) {
            return new KeyboardController(eventTarget, handlers);
        }

        var $eventTarget = $(eventTarget);
        var rawHandler;
        $eventTarget.on('keydown', rawHandler = function rawHandler(e) {
            if (e.keyCode in handlers) {
                if (!handlers[e.keyCode](e)) {
                    e.preventDefault();
                }
            }
        });

        this.destroy = function () {
            $eventTarget.off('keydown', rawHandler);
        };

        return this;
    }

    /**
     * TabKeyboardController overrides native browser tabbing for two reasons:
     * 1. to force Safari to tab to anchors just like all our other browsers.
     * 2. to allow us to force tabbing to cycle between focusable elements within a given context (such as a dialog).
     *
     * This is currently only used in the Branch Selector.
     *
     * NOTE: the selector used in this component is rather aggressive.  Please be aware that a large number of descendant
     * elements will cause this control to perform poorly.
     *
     * @param context {Object} an element within which to control tabbing.
     * @param options {Object} an object matching the shape of TabKeyboardController.defaults
     * @return {KeyboardController}
     * @constructor
     */
    function TabKeyboardController(context, options) {
        options = $.extend({}, TabKeyboardController.defaults, options);

        function doFocus($el) {
            $el.focus().addClass(options.focusedClass);
        }

        var handlers = {};
        handlers[AJS.keyCode.TAB] = function (e) {
            var $selectable;
            var $first_selectable;
            var $last_selectable;
            var target = e.target;

            $selectable = $("a:visible, :input:visible:enabled, :checkbox:visible:enabled, :radio:visible:enabled, [tabindex]", context).not("[tabindex=-1]").filter(function () {
                return $(this).css('visibility') !== 'hidden';
            });

            $last_selectable = $selectable.last();
            $first_selectable = $selectable.first();

            $selectable.removeClass(options.focusedClass);

            if (e.shiftKey && target === $first_selectable[0]) {
                if (!options.wrapAround) {
                    return true; // let it go natively outside the context
                }
                doFocus($last_selectable);
            } else if (!e.shiftKey && target === $last_selectable[0]) {
                if (!options.wrapAround) {
                    return true; // let it go natively outside the context
                }
                doFocus($first_selectable);
            } else if (e.shiftKey) {
                doFocus($selectable.eq($selectable.index(target) - 1));
            } else {
                doFocus($selectable.eq($selectable.index(target) + 1));
            }
        };

        return new KeyboardController(context, handlers);
    }
    TabKeyboardController.defaults = {
        focusedClass: 'item-focused', // necessary for IE which doesn't allow :focus styles.
        wrapAround: true
    };

    /**
     * @param eventTarget {Element} the element to listen for events on
     * @param listElement {Element} the list element to traverse items within
     * @param options {Object} an object in the shape of ListKeyboardController.default
     * @return {KeyboardController}
     * @constructor
     */
    function ListKeyboardController(eventTarget, listElement, options) {
        options = $.extend({}, ListKeyboardController.defaults, options);

        var $listEl = $(listElement);
        var selectCallbacks = $.Callbacks();
        var focusCallbacks = $.Callbacks();

        if (options.onSelect) {
            selectCallbacks.add(options.onSelect);
        }
        if (options.onFocus) {
            focusCallbacks.add(options.onFocus);
        }

        var reachedEnd = false;
        var awaitingMore = false;
        var waitingInterrupted = false;

        function traverseForwards($current) {
            do {
                var $firstChild = $current.find('>:first-child');
                var $nextSibling = $current.next();

                if ($firstChild.length) {
                    // Attempt to traverse children first
                    $current = $firstChild;
                } else if ($nextSibling.length) {
                    // Otherwise go for the next sibling
                    $current = $nextSibling;
                } else {
                    // Otherwise find the next sibling of the closest parent that has a sibling
                    $current = $current.parentsUntil($listEl[0]).next().first();
                }
            } while ($current.length && !$current.is(options.itemSelector));
            return $current;
        }

        function traverseBackwards($current) {
            do {
                var $previous = $current.prev();

                if ($previous.length) {
                    var $lastChild;
                    // Work down the tree of last-children until a node with no children is reached
                    while (($lastChild = $previous.find('>:last-child')).length) {
                        $previous = $lastChild;
                    }
                    $current = $previous;
                } else {
                    // If there are none before the current element, move to the parent
                    $current = $current.parent();
                    // Unless it's the containing element
                    if ($current[0] === $listEl[0]) {
                        $current = $();
                    }
                }
            } while ($current.length && !$current.is(options.itemSelector));
            return $current;
        }

        function getPrevNextFunc(nextPrev) {
            return function prevNextFunc(e) {
                var $items = $(options.itemSelector, $listEl);
                var $focusedItem = $items.filter(function () {
                    return $(this).hasClass(options.focusedClass);
                });

                var cycled = false;
                var movingDown = nextPrev === 'next';

                var $next;
                if ($focusedItem.length) {
                    if (options.adjacentItems) {
                        $next = $focusedItem[nextPrev](options.itemSelector);
                    } else {
                        if (nextPrev === 'next') {
                            $next = traverseForwards($focusedItem);
                        } else {
                            $next = traverseBackwards($focusedItem);
                        }
                    }
                } else if (nextPrev === 'next') {
                    $next = $items.first();
                } else if (options.wrapAround) {
                    $next = $items.last();
                } else {
                    return;
                }

                //ignore any waiting requests since we have a newer one
                waitingInterrupted = true;

                if (!$next.length) {

                    // if we reached the bottom, check if we need to load more
                    if (nextPrev === 'next' && options.requestMore && !reachedEnd) {
                        if (!awaitingMore) {
                            waitingInterrupted = false;

                            var promise = options.requestMore();
                            if (promise) {
                                awaitingMore = true;
                                promise.done(function (didReachEnd) {
                                    reachedEnd = didReachEnd;
                                    if (!waitingInterrupted) {
                                        prevNextFunc(e);
                                    }
                                }).always(function () {
                                    awaitingMore = false;
                                    waitingInterrupted = false;
                                });
                                return;
                            } else {
                                reachedEnd = true;
                                prevNextFunc(e);
                                return;
                            }
                        } else {
                            waitingInterrupted = false;
                            return;
                        }
                    } else if (options.wrapAround) {
                        //cycle from last to first/first to last when then press down/up.
                        cycled = true;
                        movingDown = !movingDown;

                        $next = $items[nextPrev === 'next' ? 'first' : 'last']();
                    } else if (options.onFocusLastItem && nextPrev === 'next') {
                        // used in commit-selector to show "No more commits" message
                        options.onFocusLastItem();
                        return;
                    } else {
                        return;
                    }
                }

                $focusedItem.removeClass(options.focusedClass);
                $next.addClass(options.focusedClass);

                var $nextNext = $next[nextPrev]();
                var $toScrollTo = !cycled && $nextNext.length ? $nextNext : $next;

                var activeEl = document.activeElement;
                if (options.focusIntoView && activeEl) {
                    // A hack for scrolling the virtually focused item into view - Used by the branch-selector
                    var oldTabindex = $toScrollTo.attr('tabindex');
                    $toScrollTo.attr('tabindex', '0');
                    $toScrollTo.focus();
                    activeEl.focus();
                    if (oldTabindex == null) {
                        $toScrollTo.removeAttr('tabindex');
                    } else {
                        $toScrollTo.attr('tabindex', oldTabindex);
                    }
                } else {
                    $next[0].scrollIntoView(false);
                }

                focusCallbacks.fire($next, e);
            };
        }

        var handlers = {};

        var prevHandler = handlers[AJS.keyCode.UP] = getPrevNextFunc('prev');
        var nextHandler = handlers[AJS.keyCode.DOWN] = getPrevNextFunc('next');

        handlers[AJS.keyCode.ENTER] = function (e) {
            var $items = $(options.itemSelector, $listEl);
            var $focusedItem = $items.filter(function () {
                return $(this).hasClass(options.focusedClass);
            });
            if ($focusedItem.length) {
                selectCallbacks.fire($focusedItem, e);
            }
        };

        var controller = new KeyboardController(eventTarget, handlers);

        controller.setListElement = function (listEl) {
            $listEl = $(listEl);
        };

        controller.blur = function () {
            $(options.itemSelector, $listEl).removeClass(options.focusedClass);
        };

        controller.focus = function () {
            focusCallbacks.add.apply(focusCallbacks, arguments);
            return this;
        };

        controller.select = function () {
            selectCallbacks.add.apply(selectCallbacks, arguments);
            return this;
        };

        controller.moveToNext = nextHandler;
        controller.moveToPrev = prevHandler;

        return controller;
    }

    ListKeyboardController.defaults = {
        itemSelector: 'li',
        focusedClass: 'item-focused',
        wrapAround: false,
        adjacentItems: true,
        requestMore: undefined,
        onFocus: undefined,
        onSelect: undefined
    };

    return {
        KeyboardController: KeyboardController,
        TabKeyboardController: TabKeyboardController,
        ListKeyboardController: ListKeyboardController
    };
});