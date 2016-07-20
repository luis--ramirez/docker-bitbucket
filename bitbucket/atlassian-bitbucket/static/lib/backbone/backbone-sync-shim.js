require([
    'aui',
    'backbone',
    'lodash',
    'bitbucket/internal/util/ajax'
], function (
    AJS,
    Backbone,
    _,
    ajaxUtil
) {

    var CRUDmap = {
        create : 'POST',
        read : 'GET',
        update : 'PUT',
        'delete' : 'DELETE'
    };

    Backbone.sync = function(method, model, opts) {
        var options = _.extend({
            url :_.isFunction(model.url) ? model.url() : model.url,
            type : CRUDmap[method],
            data : model.toJSON()
        }, opts);

        // RestfulTable expects 400
        if (AJS.hasOwnProperty('RestfulTable') && model instanceof AJS.RestfulTable.EntryModel) {
            options = _.extend({
                statusCode : {
                    400 : false
                }
            }, options);
        }

        return ajaxUtil.rest(options);
    };
});
