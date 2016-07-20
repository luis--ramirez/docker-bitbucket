define('bitbucket/internal/bbui/data-provider/data-provider', ['module', 'exports', 'jquery', '../javascript-errors/javascript-errors', '../json-validation/json-validation', '../widget/widget'], function (module, exports, _jquery, _javascriptErrors, _jsonValidation, _widget) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _jsonValidation2 = babelHelpers.interopRequireDefault(_jsonValidation);

    var _widget2 = babelHelpers.interopRequireDefault(_widget);

    var DataProvider = function (_Widget) {
        babelHelpers.inherits(DataProvider, _Widget);


        /**
         * @param {Object} options - The options for the Data Provider
         * @param {Object?} options.jsonDescriptor - If provided, transformed data will be validated against this shape.
         *                                           See the rules in declarative-validation.js and reference the unit tests.
                                                     If not provided, _validate must be implemented in a subclass.
         * @param {Object?} initialData - The initial data for this provider
         */

        function DataProvider() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
            var initialData = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
            babelHelpers.classCallCheck(this, DataProvider);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(DataProvider).call(this, options));

            _this.initialData = initialData;

            if (_this.options.jsonDescriptor) {
                _this._validate = (0, _jsonValidation2.default)(_this.options.jsonDescriptor);
            }
            return _this;
        }

        /**
         * If the data provider is currently fetching data with an XHR request, this will return true.
         *
         * Checks for the presence of the DataProvider#_requestPromise
         *
         * @returns {boolean}
         */


        babelHelpers.createClass(DataProvider, [{
            key: 'reset',
            value: function reset() {
                this.abort();
                this.currentData = null;
                delete this.initialData;
                this.trigger('reset');
            }
        }, {
            key: 'abort',
            value: function abort() {
                if (this._requestPromise) {
                    this._requestPromise.abort();
                    this._requestPromise = null;
                    this.trigger('abort');
                }
            }
        }, {
            key: 'fetch',
            value: function fetch() {
                var _this2 = this;

                var url = arguments.length <= 0 || arguments[0] === undefined ? this.url : arguments[0];


                // If a fetch is attempted before the previous fetch has returned,
                // then abort the previous fetch and continue with the new request.
                this.abort();

                // If there is initial data, upgrade the currentData to initialData
                if (this.initialData) {
                    this.currentData = this.transform(this.initialData);
                    // initialData is single use, delete it after it has been consumed
                    delete this.initialData;
                }

                // If there is a set of currentData then return it.
                if (this.currentData) {
                    return _jquery2.default.Deferred().resolve(this.currentData);
                }

                this.trigger('data-requested');

                this._requestPromise = this._fetch(url);

                // The promise from _fetch must be abortable.
                if (!this._requestPromise.abort) {
                    throw new Error('no abort method on DataProvider#_requestPromise.');
                }

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
            key: '_fetch',
            value: function _fetch() {
                throw new _javascriptErrors.NotImplementedError();
            }
        }, {
            key: 'transform',
            value: function transform() {
                var out = this._transform.apply(this, arguments);
                this._validate(out);
                return out;
            }
        }, {
            key: '_transform',
            value: function _transform() {
                throw new _javascriptErrors.NotImplementedError();
            }
        }, {
            key: '_validate',
            value: function _validate(data) {
                // eslint-disable-line no-unused-vars
                throw new _javascriptErrors.NotImplementedError();
            }
        }, {
            key: 'errorTransform',
            value: function errorTransform() {
                return this._errorTransform.apply(this, arguments);
            }
        }, {
            key: '_errorTransform',
            value: function _errorTransform() {
                throw new _javascriptErrors.NotImplementedError();
            }
        }, {
            key: 'isFetching',
            get: function get() {
                return !!this._requestPromise;
            }
        }]);
        return DataProvider;
    }(_widget2.default);

    exports.default = DataProvider;
    module.exports = exports['default'];
});