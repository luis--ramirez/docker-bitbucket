define('bitbucket/internal/bbui/list-and-detail-view/list-and-detail-view', ['module', 'exports', 'jquery', 'lodash', '../widget/widget'], function (module, exports, _jquery, _lodash, _widget) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _widget2 = babelHelpers.interopRequireDefault(_widget);

    var ListAndDetailView = function (_Widget) {
        babelHelpers.inherits(ListAndDetailView, _Widget);


        /**
         * @callback selectionCallback
         * @param {jQuery} $listItem - the element that was invoked
         * @param {jQuery} $listView - the control's list view
         * @param {jQuery} $detailView - the control's detail view
         * @param {Event} e - the click event object
         */

        /**
         * @param {HTMLElement|jQuery} el - The element to use as a container for this ListAndDetailView
         * @param {object} options - options for this ListAndDetailView
         * @param {selectionCallback?} options.selectHandler - invoked when an item in the list is clicked
         * @param {string?} options.selectedClass - CSS class name that is applied to selected list items
         * @param {boolean?} options.selectFirstOnInit - select the first item in the list on init
         * @param {string?} options.detailContent - HTML string that is injected into the detail/content view
         * @param {string?} options.listContent - HTML string that is is injected into the list view
         */

        function ListAndDetailView(el, options) {
            babelHelpers.classCallCheck(this, ListAndDetailView);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(ListAndDetailView).call(this, options));

            _this.keycodes = {
                j: 74,
                k: 75
            };

            _this.$el = (0, _jquery2.default)(el);
            _this.$el.html(bitbucket.internal.component.listAndDetailView.main({
                listContent: options.listContent || '',
                detailContent: options.detailContent || ''
            }));
            _this.$listView = _this.$el.find('.list-view');
            _this.$detailView = _this.$el.find('.detail-view');
            _this.selectHandler = options.selectHandler;

            _this.bindShortcuts();
            _this.$listView.on('click', _this.options.listItemTag, _this._itemClickHandler);
            _this._maybeSelectFirst();
            return _this;
        }

        babelHelpers.createClass(ListAndDetailView, [{
            key: 'destroy',
            value: function destroy() {
                babelHelpers.get(Object.getPrototypeOf(ListAndDetailView.prototype), 'destroy', this).call(this);
                this.unbindShortcuts();
                this.$el.empty();
            }
        }, {
            key: '_itemClickHandler',
            value: function _itemClickHandler(e) {
                var selectedClass = this.options.selectedClass;
                this.$listView.find('li.' + selectedClass).removeClass(selectedClass);
                var $listItem = (0, _jquery2.default)(e.currentTarget).addClass(selectedClass);
                this.selectHandler($listItem, this.$listView, this.$detailView, e);
            }
        }, {
            key: '_maybeSelectFirst',
            value: function _maybeSelectFirst() {
                if (this.options.selectFirstOnInit) {
                    this.$listView.find(this.options.listItemTag + ':first').click();
                }
            }
        }, {
            key: '_shortcutHandler',
            value: function _shortcutHandler(e) {
                var $selected = this.$listView.find(this.options.listItemTag + '.' + this.options.selectedClass);
                var $target = void 0;
                if (e.which === this.keycodes.j) {
                    $target = $selected.next(this.options.listItemTag);
                } else if (e.which === this.keycodes.k) {
                    $target = $selected.prev(this.options.listItemTag);
                } else {
                    return;
                }

                $target.click().find('a').focus().blur(); // Scroll into view if necessary. Will only scroll if there is an <a>
            }
        }, {
            key: 'bindShortcuts',
            value: function bindShortcuts() {
                (0, _jquery2.default)(document).on('keydown', this._shortcutHandler);
            }
        }, {
            key: 'unbindShortcuts',
            value: function unbindShortcuts() {
                (0, _jquery2.default)(document).off('keydown', this._shortcutHandler);
            }
        }, {
            key: 'removeItem',
            value: function removeItem($item, selector) {
                var deferred = _jquery2.default.Deferred();

                function _removeItem() {
                    $item.remove();
                    deferred.resolve();
                }

                $item.addClass('offScreen').one('transitionend', _removeItem);

                if ($item.next(selector).length) {
                    $item.next(selector).click();
                } else if ($item.prev(selector).length) {
                    $item.prev(selector).click();
                } else {
                    // No more items in the list.
                    this.$detailView.empty();
                }
                return deferred.promise();
            }
        }, {
            key: 'addItem',
            value: function addItem($item, $beforeElement, select) {
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
            }
        }]);
        return ListAndDetailView;
    }(_widget2.default);

    exports.default = ListAndDetailView;


    ListAndDetailView.defaults = {
        selectedClass: 'selected-item',
        selectFirstOnInit: false,
        listItemTag: 'li',
        selectHandler: _lodash2.default.noop
    };
    module.exports = exports['default'];
});