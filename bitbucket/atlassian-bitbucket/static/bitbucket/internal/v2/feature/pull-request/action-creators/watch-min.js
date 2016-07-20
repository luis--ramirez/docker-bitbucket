define("bitbucket/internal/v2/feature/pull-request/action-creators/watch","aui jquery lodash bitbucket/util/navbuilder bitbucket/util/server bitbucket/internal/bbui/actions/pull-request bitbucket/internal/model/page-state bitbucket/internal/util/events".split(" "),function(c,d,e,f,h,k,l,m){var n={stateOnly:!1};return function(a){var b;a=e.assign({},n,a);a.stateOnly?b=d.Deferred().resolve():(b=f.rest().currentPullRequest().watch().build(),b=h.rest({url:b,type:a.watchState?"POST":"DELETE",statusCode:{401:function(a,
b,d,f,g){return e.assign({},g,{title:c.I18n.getText("bitbucket.web.watch.default.error.401.title"),message:c.I18n.getText("bitbucket.web.watch.default.error.401.message"),fallbackUrl:!1,shouldReload:!0})},409:function(a,b,d,f,g){return e.assign({},g,{title:c.I18n.getText("bitbucket.web.watch.default.error.409.title"),fallbackUrl:!1,shouldReload:!0})}}}));b.done(function(){l.setIsWatching(a.watchState);m.trigger(a.watchState?"bitbucket.internal.web.watch-button.added":"bitbucket.internal.web.watch-button.removed",
null,a)});return{type:k.PR_WATCH,payload:a.watchState,meta:{promise:b}}}});