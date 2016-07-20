'use strict';

(function () {
    'use strict';

    //This forces a synchronous load of 'history'. We need to do this to ensure that it is initialised before
    //the browser fires the 'loaded' event.

    require('bitbucket/internal/util/history');
})();