define('bitbucket/internal/bbui/data-provider/pull-request-list', ['module', 'exports', 'bitbucket/internal/impl/data-provider/paged', '../json-validation/json-validation', '../models/models'], function (module, exports, _paged, _jsonValidation, _models) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _paged2 = babelHelpers.interopRequireDefault(_paged);

  var _jsonValidation2 = babelHelpers.interopRequireDefault(_jsonValidation);

  var _models2 = babelHelpers.interopRequireDefault(_models);

  var PullRequestListDataProvider = function (_PagedDataProvider) {
    babelHelpers.inherits(PullRequestListDataProvider, _PagedDataProvider);

    function PullRequestListDataProvider() {
      var _Object$getPrototypeO;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      babelHelpers.classCallCheck(this, PullRequestListDataProvider);


      /**
       * We extend the pull_request model with commentCount and taskCount
       */
      options.jsonDescriptor = [_models2.default.pull_request];

      /**
       * @type {Object}
       * @property {string?} author_id - the author's username
       * @property {string?} target_ref_id - the ref string, e.g. refs/heads/
       * @property {string?} reviewer_id - the reviewer's username
       * @property {string?} query - title / description substring search
       * @property {models.PullRequestState?} state
       */
      options.filterDescriptor = {
        author_id: 'string?',
        query: 'string?',
        target_ref_id: 'string?',
        reviewer_id: 'string?',
        state: _jsonValidation2.default.asEnum('PullRequestState', _models2.default.PullRequestState)
      };

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(PullRequestListDataProvider)).call.apply(_Object$getPrototypeO, [this, options].concat(args)));
    }

    return PullRequestListDataProvider;
  }(_paged2.default);

  exports.default = PullRequestListDataProvider;
  module.exports = exports['default'];
});