define('bitbucket/internal/bbui/data-provider/ref', ['module', 'exports', 'bitbucket/internal/impl/data-provider/paged', '../json-validation/json-validation', '../models/models'], function (module, exports, _paged, _jsonValidation, _models) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _paged2 = babelHelpers.interopRequireDefault(_paged);

    var _jsonValidation2 = babelHelpers.interopRequireDefault(_jsonValidation);

    var _models2 = babelHelpers.interopRequireDefault(_models);

    var RefDataProvider = function (_PagedDataProvider) {
        babelHelpers.inherits(RefDataProvider, _PagedDataProvider);

        function RefDataProvider(options) {
            var _Object$getPrototypeO;

            babelHelpers.classCallCheck(this, RefDataProvider);

            options.jsonDescriptor = [_models2.default.ref];
            options.filterDescriptor = {
                term: 'string?',
                repository: _models2.default.repository,
                type: _jsonValidation2.default.asEnum('RefType', _models2.default.RefType)
            };

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(RefDataProvider)).call.apply(_Object$getPrototypeO, [this, options].concat(args)));
        }

        return RefDataProvider;
    }(_paged2.default);

    exports.default = RefDataProvider;
    module.exports = exports['default'];
});