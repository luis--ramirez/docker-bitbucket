define('bitbucket/internal/bbui/search/internal/search-results-table', ['module', 'exports', 'jquery', 'lodash', '../../paged-table/legacy', './analytics', '../../avatars/avatars'], function (module, exports, _jquery, _lodash, _legacy, _analytics) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _legacy2 = babelHelpers.interopRequireDefault(_legacy);

    var _analytics2 = babelHelpers.interopRequireDefault(_analytics);

    // if this is changed the value needs to be changed in index.less to match
    var MAX_LINES_SHOWN = 10;

    var SearchResultsTable = function (_PagedTable) {
        babelHelpers.inherits(SearchResultsTable, _PagedTable);


        /**
         * @param {Element|jQuery} el - The container element for this SearchResultsTable
         * @param {Object} options - The options for this table
         * @param {Object|null} options.scope.project - Optional project scope for this SearchResultsTable
         * @param {Object|null} options.scope.repository - Optional repository scope for this SearchResultsTable
         */

        function SearchResultsTable(el, options) {
            babelHelpers.classCallCheck(this, SearchResultsTable);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(SearchResultsTable).call(this, _lodash2.default.extend({
                tableEl: el,
                autoLoad: 'next',
                tableMessageClass: 'message',
                rowSelector: '.search-result',
                allFetchedMessageHtml: function allFetchedMessageHtml() {
                    return bitbucket.internal.component.search.allResults({
                        loaded: _this.$table.find(_this.options.rowSelector).length
                    });
                },
                getNoneFoundMessageHtml: function getNoneFoundMessageHtml() {
                    return bitbucket.internal.component.search.noResults({
                        query: options.dataProvider.options.query,
                        includeAdvancedHelp: true
                    });
                },
                spinnerSize: 'medium'
            }, options)));

            _this._addDestroyable(_analytics2.default.bindTableAnalytics((0, _jquery2.default)(el), options.scope.project, options.scope.repository));

            _this.$table.on('click', '.context-toggler', function (event) {
                event.preventDefault();
                var $toggler = (0, _jquery2.default)(event.currentTarget);
                var $hitContext = $toggler.closest(_this.options.rowSelector);
                var expand = $hitContext.hasClass('truncated');

                $hitContext.toggleClass('truncated', !expand).toggleClass('expanded', expand);

                if (!expand) {
                    (0, _jquery2.default)(window).scrollTop($hitContext.offset().top);
                }
            });

            return _this;
        }

        babelHelpers.createClass(SearchResultsTable, [{
            key: 'handleNewRows',
            value: function handleNewRows(data, attachmentMethod) {
                // eslint-disable-line no-unused-vars
                // TODO handle this based on the result type
                var rows = data.map(function (result) {
                    // number of "lines" in this file - a hit context break counts as a line for these purposes
                    var lines = result.hitContexts.length - 1 + result.hitContexts.reduce(function (count, context) {
                        return count + context.length;
                    }, 0);

                    return bitbucket.internal.component.search.codeResult({
                        result: result,
                        isTruncated: lines > MAX_LINES_SHOWN
                    });
                });
                this.$table.append(rows);
                // One off scroll of the match into view
                this.$table.find('.new-result').each(function (idx, elem) {
                    var $result = (0, _jquery2.default)(elem);
                    var $em = $result.find('code em').first();
                    if ($em.length === 1) {
                        var $code = $em.closest('code');
                        $code.scrollLeft($em.offset().left - Math.floor($code.width() / 2));
                    }
                }).removeClass('new-result');
                (0, _jquery2.default)('.code-search-filename', this.$table).tooltip({
                    gravity: 'nw'
                });
            }
        }, {
            key: 'handleErrors',
            value: function handleErrors(errors) {
                // TODO implement :)
                console.error(errors);
            }
        }]);
        return SearchResultsTable;
    }(_legacy2.default);

    exports.default = SearchResultsTable;
    module.exports = exports['default'];
});