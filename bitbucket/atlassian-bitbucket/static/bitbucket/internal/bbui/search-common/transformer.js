define('bitbucket/internal/bbui/search-common/transformer', ['exports', 'lodash', 'bitbucket/internal/impl/search-urls'], function (exports, _lodash, _searchUrls) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.transformCodeResult = exports.transformRepositoryResult = undefined;

    var _searchUrls2 = babelHelpers.interopRequireDefault(_searchUrls);

    var RE_MATCH = /<\/?em>/;

    var transformRepositoryResult = exports.transformRepositoryResult = function transformRepositoryResult(value) {
        if ((0, _lodash.has)(value, 'avatarUrl')) {
            value.avatar_url = value.avatarUrl;
        }

        if ((0, _lodash.has)(value, 'project.avatarUrl')) {
            value.project.avatar_url = value.project.avatarUrl;
        }

        return value;
    };

    var transformCodeResult = exports.transformCodeResult = function transformCodeResult(value) {
        value.fileParts = value.file.split('/');
        value.filename = value.fileParts.slice(-1);
        // the first line number of the first hitContext
        value.firstLineNumber = (0, _lodash.get)(value, 'hitContexts.0.0', -1);

        // for every hitContext, filter lines with matches, and return the line numbers as a flattened array
        var linesWithMatches = (0, _lodash.flatten)(value.hitContexts.map(function (hitContext) {
            return hitContext.filter(function (line) {
                return line.line !== 0 && RE_MATCH.test(line.text);
            }).map(function (line) {
                return line.line;
            });
        }));

        var groupedLines = linesWithMatches.reduce(function (_ref, line) {
            var _ref2 = babelHelpers.slicedToArray(_ref, 2);

            var lastLine = _ref2[0];
            var data = _ref2[1];

            if (line === lastLine + 1) {
                if (Array.isArray(data[data.length - 1])) {
                    data[data.length - 1].push(line);
                } else {
                    data.pop();
                    data.push([lastLine, line]);
                }
            } else {
                data.push(line);
            }
            return [line, data];
        }, [-1, []])[1];

        var lineHash = groupedLines.map(function (item) {
            return Array.isArray(item) ? item[0] + '-' + item[item.length - 1] : item;
        }).join(',');

        value.fileUrl = _searchUrls2.default.fileUrl(value.repository, value.file, lineHash);

        value.repository = transformRepositoryResult(value.repository);

        return value;
    };
});