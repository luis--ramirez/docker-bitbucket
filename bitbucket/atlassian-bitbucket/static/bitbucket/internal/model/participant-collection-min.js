define("bitbucket/internal/model/participant-collection",["backbone-brace","lodash","bitbucket/internal/model/participant"],function(d,e,f){var c={APPROVED:1,NEEDS_WORK:2,UNAPPROVED:3};return d.Collection.extend({model:f,comparator:function(a,b){return c[a.getStatus()]-c[b.getStatus()]||a.getUser().getDisplayName().localeCompare(b.getUser().getDisplayName())},findByUser:function(a){return e.find(this.models,function(b){return b.getUser().getName()===a.getName()})}})});