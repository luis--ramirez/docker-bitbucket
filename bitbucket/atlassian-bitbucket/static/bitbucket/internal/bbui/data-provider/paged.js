define('bitbucket/internal/bbui/data-provider/paged', ['module', 'exports', 'jquery', 'bitbucket/internal/impl/data-provider/data-provider', '../javascript-errors/javascript-errors', '../json-validation/json-validation'], function (module, exports, _jquery, _dataProvider, _javascriptErrors, _jsonValidation) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _dataProvider2 = babelHelpers.interopRequireDefault(_dataProvider);

    var _javascriptErrors2 = babelHelpers.interopRequireDefault(_javascriptErrors);

    var _jsonValidation2 = babelHelpers.interopRequireDefault(_jsonValidation);

    var PagedDataProvider = function (_DataProvider) {
        babelHelpers.inherits(PagedDataProvider, _DataProvider);


        /**
         * @param {Object?} options - The options for the Data Provider
         * @param {Object?} options.filter - a set of parameters to filter the DataProvider
         * @param {?Object} initialData - The initial data for this provider
         */

        function PagedDataProvider() {
            var _Object$getPrototypeO;

            var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
            babelHelpers.classCallCheck(this, PagedDataProvider);

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            var _this = babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(PagedDataProvider)).call.apply(_Object$getPrototypeO, [this, options].concat(args)));

            // the untransformed last response fetched.
            _this._lastPageData = null;

            if (options.filterDescriptor) {
                _this._validateFilter = (0, _jsonValidation2.default)(options.filterDescriptor);
            }

            _this.filter = options.filter || {};
            _this._validateFilter(_this.filter);
            return _this;
        }

        /**
         * @type {boolean}
         * Whether the data provider has fetched the last page of data yet. Returns false before any data has been fetched.
         */


        babelHelpers.createClass(PagedDataProvider, [{
            key: '_validateFilter',
            value: function _validateFilter(f) {
                if (Object.keys(f).length) {
                    throw new Error('No filter is expected on this data-provider.');
                }
            }
        }, {
            key: 'setFilter',
            value: function setFilter(key, val) {
                if (this.filter) {
                    this.filter[key] = val;
                }
                if (this._validateFilter) {
                    this._validateFilter(this.filter);
                }
            }
        }, {
            key: 'fetchNext',
            value: function fetchNext() {
                var _this2 = this;

                if (this.reachedEnd) {
                    throw new Error('Nothing left to fetch.');
                }

                // If a fetch is attempted before the previous fetch has returned,
                // then abort the previous fetch and continue with the new request.
                this.abort();

                // If there is initial data, upgrade the currentData to initialData
                if (this.initialData) {
                    this._lastPageData = this.initialData;
                    this.currentData = this.transform(this.initialData);
                    // initialData is single use, delete it after it has been consumed
                    delete this.initialData;
                    return _jquery2.default.Deferred().resolve(this.currentData);
                }

                this.trigger('data-requested');

                this._requestPromise = this._fetchNext(this._lastPageData);
                if (!this._requestPromise.abort) {
                    throw new Error('no abort method on PagedDataProvider#_requestPromise.');
                }

                this._requestPromise.then(function (page) {
                    _this2._lastPageData = page;
                });
                return this._requestPromise.then(this.transform, function () {
                    return _jquery2.default.Deferred().reject(_this2.errorTransform.apply(_this2, arguments));
                }).done(function (transformedData) {
                    _this2.trigger('data-loaded', transformedData);
                    _this2.currentData = transformedData;
                }).fail(function (error) {
                    _this2.trigger('data-request-failed', error);
                }).always(function () {
                    _this2._requestPromise = null;
                });
            }
        }, {
            key: 'reset',
            value: function reset() {
                this._lastPageData = null;
                babelHelpers.get(Object.getPrototypeOf(PagedDataProvider.prototype), 'reset', this).call(this);
            }
        }, {
            key: '_fetchNext',
            value: function _fetchNext(lastPageData) {
                // eslint-disable-line no-unused-vars
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }, {
            key: '_reachedEnd',
            value: function _reachedEnd(lastPageData) {
                // eslint-disable-line no-unused-vars
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }, {
            key: 'reachedEnd',
            get: function get() {
                return this._lastPageData ? this._reachedEnd(this._lastPageData) : false;
            }
        }]);
        return PagedDataProvider;
    }(_dataProvider2.default);

    exports.default = PagedDataProvider;
    module.exports = exports['default'];
});