'use strict';

define('bitbucket/internal/model/file-change', ['backbone-brace', 'bitbucket/internal/model/commit-range', 'bitbucket/internal/model/conflict', 'bitbucket/internal/model/file-change-types', 'bitbucket/internal/model/path', 'bitbucket/internal/model/repository'], function (Brace, CommitRange, Conflict, ChangeType, Path, Repository) {

    'use strict';

    var FileChange = Brace.Model.extend({
        namedAttributes: {
            "repository": Repository,
            "commitRange": CommitRange,
            "srcPath": Path,
            "path": Path,
            "line": null,
            "search": null,
            "type": null,
            "nodeType": null,
            "conflict": Conflict,
            "diff": null,
            "srcExecutable": null,
            "executable": null
        },
        initialize: function initialize() {
            this.setType(FileChange._mapChangeType(this.getType(), this.getSrcPath(), this.getPath()));
        }
    }, {
        fromDiff: function fromDiff(diffJson, commitRange, repository) {
            return new FileChange({
                repository: repository,
                commitRange: commitRange,
                srcPath: diffJson.source,
                path: diffJson.destination,
                diff: diffJson,
                type: ChangeType.guessChangeTypeFromDiff(diffJson)
            });
        },
        _mapChangeType: function _mapChangeType(modState, srcPath, path) {
            return modState === ChangeType.MOVE && srcPath && srcPath.isSameDirectory(path) ? ChangeType.RENAME : ChangeType.changeTypeFromId(modState);
        }
    });

    return FileChange;
});