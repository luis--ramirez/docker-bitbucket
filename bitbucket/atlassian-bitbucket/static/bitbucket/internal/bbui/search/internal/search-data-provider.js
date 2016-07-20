define("bitbucket/internal/bbui/search/internal/search-data-provider", ["module", "exports", "bitbucket/internal/impl/data-provider/paged", "../../search-common/search-entities", "../../search-common/search-request", "../../search-common/transformer"], function (module, exports, _paged, _searchEntities, _searchRequest, _transformer) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _paged2 = babelHelpers.interopRequireDefault(_paged);

    var _searchEntities2 = babelHelpers.interopRequireDefault(_searchEntities);

    var SearchDataProvider = function (_PagedDataProviderSPI) {
        babelHelpers.inherits(SearchDataProvider, _PagedDataProviderSPI);

        function SearchDataProvider(options, initialData) {
            babelHelpers.classCallCheck(this, SearchDataProvider);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(SearchDataProvider).call(this, options, initialData));
        }

        babelHelpers.createClass(SearchDataProvider, [{
            key: "_fetch",
            value: function _fetch(searchRequest) {
                return this.options.search(searchRequest);
            }
        }, {
            key: "_transform",
            value: function _transform(result) {
                var _this2 = this;

                return result[this.options.type].values.map(function (value) {
                    if (_this2.options.type === _searchEntities2.default.CODE) {
                        return (0, _transformer.transformCodeResult)(value);
                    }
                    console.warn("Unknown result type " + _this2.options.type + " in dataProvider transform");
                });
            }
        }, {
            key: "_validate",
            value: function _validate() {
                return true;
            }
        }, {
            key: "_fetchNext",
            value: function _fetchNext(lastResponseData) {
                var searchRequest = void 0;

                if (lastResponseData) {
                    searchRequest = (0, _searchRequest.nextSearchFor)(this.options.query, this.options.type, this.options.limits, lastResponseData);
                } else {
                    searchRequest = (0, _searchRequest.searchFor)(this.options.query, this.options.limits);
                }
                return this._fetch(searchRequest);
            }
        }, {
            key: "_reachedEnd",
            value: function _reachedEnd(lastResponseData) {
                return lastResponseData[this.options.type].isLastPage;
            }
        }]);
        return SearchDataProvider;
    }(_paged2.default);

    exports.default = SearchDataProvider;
    module.exports = exports["default"];
});