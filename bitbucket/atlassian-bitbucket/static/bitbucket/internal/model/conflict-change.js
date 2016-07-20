'use strict';

define('bitbucket/internal/model/conflict-change', ['backbone-brace', 'bitbucket/internal/model/file-change-types', 'bitbucket/internal/model/path'], function (Brace, ChangeType, Path) {

    'use strict';

    var ConflictChange = Brace.Model.extend({
        namedAttributes: {
            "srcPath": Path,
            "path": Path,
            "type": null
        },
        initialize: function initialize() {
            this.setType(ConflictChange._mapChangeType(this.getType(), this.getSrcPath(), this.getPath()));
        }
    }, {
        _mapChangeType: function _mapChangeType(modState, srcPath, path) {
            return modState === ChangeType.MOVE && srcPath && srcPath.isSameDirectory(path) ? ChangeType.RENAME : ChangeType.changeTypeFromId(modState);
        }
    });

    return ConflictChange;
});