'use strict';

define('bitbucket/internal/impl/request', ['bitbucket/util/server'], function (server) {

    'use strict';

    // It seems a bit weird to take an API module (`bitbucket/util/server`) and export it
    // as something internal - but this gives it a "known common" name which Cloud will also
    // provide to be used by shared components.  It just happens that the API we want is pretty much
    // what Server already does.

    return {
        rest: server.rest
    };
});