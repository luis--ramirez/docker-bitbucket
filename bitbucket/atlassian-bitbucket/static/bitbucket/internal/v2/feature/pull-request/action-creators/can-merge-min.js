define("bitbucket/internal/v2/feature/pull-request/action-creators/can-merge",["bitbucket/util/events","bitbucket/util/navbuilder","bitbucket/util/server","bitbucket/internal/bbui/actions/pull-request","bitbucket/internal/model/page-state"],function(c,d,e,f,g){return function(b){b=b||g.getPullRequest();var h=e.rest({url:d.rest().currentRepo().pullRequest(b.getId()).merge().build(),type:"GET"});return{type:f.PR_CHECK_MERGEABILITY,payload:null,meta:{promise:h.then(function(a){c.trigger(a.canMerge?"bitbucket.internal.pull-request.can.merge":
"bitbucket.internal.pull-request.cant.merge",null,b,a.conflicted,a.vetoes,a.properties);return a})}}}});