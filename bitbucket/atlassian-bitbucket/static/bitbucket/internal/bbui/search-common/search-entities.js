define('bitbucket/internal/bbui/search-common/search-entities', ['module', 'exports'], function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  /**
   * Enum for available search entities
   * @readonly
   * @enum {string}
   */
  var SearchEntities = {
    CODE: 'code',
    REPOSITORIES: 'repositories'
  };

  exports.default = SearchEntities;
  module.exports = exports['default'];
});