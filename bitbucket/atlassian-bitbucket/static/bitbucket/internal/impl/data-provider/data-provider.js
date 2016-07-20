'use strict';

define('bitbucket/internal/impl/data-provider/data-provider', ['bitbucket/util/server', 'bitbucket/internal/bbui/data-provider/data-provider', 'bitbucket/internal/util/object'], function (server, DataProviderSPI, obj) {
    'use strict';

    function DataProvider() {
        DataProviderSPI.apply(this, arguments);
    }
    obj.inherits(DataProvider, DataProviderSPI);

    DataProvider.prototype._fetch = function (url) {
        return server.rest({
            method: 'GET',
            url: url
        });
    };

    DataProvider.prototype._errorTransform = function (data) {
        return data && data.errors || data;
    };

    return DataProvider;
});