define("bitbucket/internal/util/handler-registry",["jquery","lodash"],function(g,d){function b(){this.handlers=[]}b.prototype.register=function(a){if(!d.isFunction(a.handle))throw Error("Handler must have a handle function");a.weight="number"!==typeof a.weight||isNaN(a.weight)?1E3:a.weight;this.handlers.push(a);this.handlers=d.sortBy(this.handlers,function(a){return a.weight});var e=this;return function(){var c=e.handlers.indexOf(a);0<=c&&e.handlers.splice(c,1)}};b.prototype._handle=function(a){function e(h){if(b)return c.reject(Error("Handling aborted."));
if(h<d.length)return f=d[h].handle(a)||g.Deferred().reject(),g.when(f).done(function(a){c.resolve(a||{},k)}).fail(function(a){a&&k.push(a);e(h+1)});c.reject(Error("No registered handlers were able to handle file"))}var c=g.Deferred(),b,f,d=this.handlers,k=[];e(0);return c.promise({abort:function(){!b&&f&&f.abort&&f.abort();b=!0}})};b.prototype._clear=function(){this.handlers=[]};return b});