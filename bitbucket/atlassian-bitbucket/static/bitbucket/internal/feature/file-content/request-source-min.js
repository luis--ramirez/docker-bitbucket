define("bitbucket/internal/feature/file-content/request-source",["jquery","lodash","bitbucket/util/navbuilder","bitbucket/internal/util/ajax","bitbucket/internal/util/property"],function(g,k,l,h,m){function n(d,a){var b=g.extend({},{start:a.start||0,limit:a.limit||e,blame:a.includeBlame?!0:void 0});return l.rest().currentRepo().browse().path(d.path).at(d.commitRange.untilRevision.displayId).withParams(b).build()}var e=5E3;m.getFromProvider("page.max.source.lines").done(function(b){e=b});var b={};
return function(d,a){a=a||{};var f=d.toJSON?d.toJSON():d,c=n(f,a);if(b.hasOwnProperty(c)&&"rejected"!==b[c].state())return b[c];var f=h.rest({url:c,statusCode:a.statusCode||h.ignore404WithinRepository()}),e=f.then(function(a){if(a.errors&&a.errors.length)return g.Deferred().rejectWith(this,[this,null,null,a]);k.defer(function(){delete b[c]});return a});b[c]=e.promise(f);return b[c]}});