define('bitbucket/internal/bbui/data-provider/user', ['module', 'exports', 'bitbucket/internal/impl/data-provider/paged', '../json-validation/json-validation', '../models/models'], function (module, exports, _paged, _jsonValidation, _models) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _paged2 = babelHelpers.interopRequireDefault(_paged);

    var _jsonValidation2 = babelHelpers.interopRequireDefault(_jsonValidation);

    var _models2 = babelHelpers.interopRequireDefault(_models);

    var UserDataProvider = function (_PagedDataProvider) {
        babelHelpers.inherits(UserDataProvider, _PagedDataProvider);

        function UserDataProvider(options) {
            var _Object$getPrototypeO;

            babelHelpers.classCallCheck(this, UserDataProvider);

            options.jsonDescriptor = [_models2.default.user];
            options.filterDescriptor = {
                term: 'string?',
                permissions: _jsonValidation2.default.nullable([_models2.default.permission])
            };

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(UserDataProvider)).call.apply(_Object$getPrototypeO, [this, options].concat(args)));
        }

        return UserDataProvider;
    }(_paged2.default);

    exports.default = UserDataProvider;
    module.exports = exports['default'];
});