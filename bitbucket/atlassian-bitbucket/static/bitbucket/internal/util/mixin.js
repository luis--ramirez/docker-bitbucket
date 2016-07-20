'use strict';

define('bitbucket/internal/util/mixin', ['lodash'], function (_) {
    'use strict';

    function mix() /* ...mixins */{
        var mixins = [].slice.call(arguments);
        return {
            into: function into(target) {
                return _.extend.apply(_, [target].concat(mixins));
            }
        };
    }

    return mix;
});