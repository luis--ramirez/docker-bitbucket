define('bitbucket/internal/bbui/urls/urls', ['module', 'exports', '../javascript-errors/javascript-errors'], function (module, exports, _javascriptErrors) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _javascriptErrors2 = babelHelpers.interopRequireDefault(_javascriptErrors);

    var Urls = function () {
        function Urls() {
            babelHelpers.classCallCheck(this, Urls);
        }

        babelHelpers.createClass(Urls, [{
            key: 'fileChanges',
            value: function fileChanges(repository, commitRange) {
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }, {
            key: 'avatarUrl',
            value: function avatarUrl(person, size) {
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }, {
            key: 'user',
            value: function user(_user) {
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }, {
            key: 'pullRequest',
            value: function pullRequest(_pullRequest) {
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }, {
            key: 'createPullRequest',
            value: function createPullRequest(repository) {
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }, {
            key: 'allPullRequests',
            value: function allPullRequests(repository) {
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }, {
            key: 'help',
            value: function help(key) {
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }, {
            key: 'search',
            value: function search(query) {
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }, {
            key: 'project',
            value: function project(_project) {
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }, {
            key: 'repo',
            value: function repo(repository) {
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }, {
            key: 'remote',
            value: function remote(repository) {
                throw new _javascriptErrors2.default.NotImplementedError();
            }
        }]);
        return Urls;
    }();

    exports.default = Urls;
    module.exports = exports['default'];
});