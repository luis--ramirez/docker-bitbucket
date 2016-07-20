'use strict';

define('bitbucket/internal/feature/comments/comment-collection', ['backbone', 'bitbucket/internal/feature/comments/comment-model'], function (Backbone, Comment) {

    'use strict';

    return Backbone.Collection.extend({
        initialize: function initialize(models, options) {
            options = options || {};
            this.urlBuilder = options.urlBuilder || function () {
                return options.anchor.urlBuilder();
            };
        },
        model: Comment,
        url: function url() {
            return this.urlBuilder().build();
        }
    });
});