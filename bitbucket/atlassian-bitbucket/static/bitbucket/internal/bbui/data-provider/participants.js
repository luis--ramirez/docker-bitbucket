define('bitbucket/internal/bbui/data-provider/participants', ['module', 'exports', 'bitbucket/internal/impl/data-provider/paged', '../models/models'], function (module, exports, _paged, _models) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _paged2 = babelHelpers.interopRequireDefault(_paged);

    var _models2 = babelHelpers.interopRequireDefault(_models);

    var ParticipantsDataProvider = function (_PagedDataProvider) {
        babelHelpers.inherits(ParticipantsDataProvider, _PagedDataProvider);

        function ParticipantsDataProvider(options) {
            var _Object$getPrototypeO;

            babelHelpers.classCallCheck(this, ParticipantsDataProvider);

            options.jsonDescriptor = [_models2.default.user];
            options.filterDescriptor = {
                term: 'string?',
                role: 'string?'
            };

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(ParticipantsDataProvider)).call.apply(_Object$getPrototypeO, [this, options].concat(args)));
        }

        return ParticipantsDataProvider;
    }(_paged2.default);

    exports.default = ParticipantsDataProvider;
    module.exports = exports['default'];
});