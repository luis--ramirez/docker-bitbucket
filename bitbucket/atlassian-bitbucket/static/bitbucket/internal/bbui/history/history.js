define('bitbucket/internal/bbui/history/history', ['module', 'exports', './HistoryManager'], function (module, exports, _HistoryManager) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _HistoryManager2 = babelHelpers.interopRequireDefault(_HistoryManager);

  exports.default = new _HistoryManager2.default();
  module.exports = exports['default'];
});