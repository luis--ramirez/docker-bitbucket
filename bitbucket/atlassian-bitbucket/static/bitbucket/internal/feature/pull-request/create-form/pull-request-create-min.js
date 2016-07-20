define("bitbucket/internal/feature/pull-request/pull-request-create","bacon jquery lodash bitbucket/util/navbuilder bitbucket/util/server bitbucket/internal/feature/pull-request/metadata-generator bitbucket/internal/feature/user/user-multi-selector bitbucket/internal/model/page-state bitbucket/internal/util/events bitbucket/internal/util/function bitbucket/internal/util/text bitbucket/internal/widget/markup-editor bitbucket/internal/widget/searchable-multi-selector exports".split(" "),function(w,
f,h,q,x,l,y,d,r,t,u,z,A,B){function C(b,e){var k=b.filter(function(a){return a.source&&a.target}),d=!1,c,g=function(a){d&&(d=!1,a=f(a.values).filter(":not(.merge)").find(".message-subject"),a=h.map(a,function(a){return f(a).attr("title")}),v(a))},m=function(a){a=h.filter(a.values,function(a){return 1===a.parents.length});a=h.map(a,t.dot("message"));v(a);c=null};r.on("bitbucket.internal.widget.commitsTable.contentAdded",g);var n=f("#pull-request-description").asEventStream("keydown").doAction(function(a){f(a.target).data("description-changed",
!0);c&&(c.abort(),c=null)}),p=w.combineAsArray(k,e).skipDuplicates(function(a,c){return a[0]===c[0]&&a[1]===c[1]}).takeUntil(n).slidingWindow(2,1).map(function(a){if(1===a.length)return a[0].push(!1),a[0];a[1].push(a[0][1]!==a[1][1]);return a[1]}).onValue(function(a){var b=a[0],e=a[1];(a=a[2])&&d||!a&&"commits"!==e?(d=!1,c&&(c.abort(),c=null),e=b.source,b=b.target,console.log("Rest for: "+e.getDisplayId()+" "+b.getDisplayId()),b=q.project(e.getRepository().getProject()).repo(e.getRepository()).commits().withParams({until:e.getLatestCommit(),
since:b.getLatestCommit(),secondaryRepositoryId:b.getRepository().getId(),start:0,limit:10}).build(),c=x.rest({type:"GET",url:b,statusCode:{"*":!1}}).done(m)):a||"commits"!==e||(d=!0)});return function(){r.off("bitbucket.internal.widget.commitsTable.contentAdded",g);p()}}function v(b){if(0!==b.length){var e=f("#title"),d=f("#pull-request-description"),h=!e.data("title-changed"),c=!d.data("description-changed");h&&1===b.length?(b=l.generateTitleAndDescriptionFromCommitMessage(b[0]),e.val(b.title),
c&&d.val(b.description).trigger("input")):c&&(e=l.generateDescriptionFromCommitMessages(b),d.val(e).trigger("input"))}}function D(b){d.extend("sourceRepository");d.extend("targetBranch");d.extend("sourceBranch");return b.onValue(function(b){d.setProject(b.targetRepo.getProject());d.setRepository(b.targetRepo);d.setSourceRepository(b.sourceRepo);d.setTargetBranch(b.target);d.setSourceBranch(b.source)})}B.init=function(b,e,k,l,c){var g=[];b=f(b);z.bindTo(b.find(".markup-editor"));var m=d.getCurrentUser(),
n={avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"xsmall"}),permission:"LICENSED_USER"},p=new A.PagedDataSource(q.rest().users().build(),n);new y(b.find("#reviewers"),{initialItems:e,excludedItems:m?[m.toJSON()]:[],dataSource:p});e=k.onValue(function(a){f.extend(n,{"permission.1":"REPO_READ","permission.1.repositoryId":a.targetRepo.id})});g.push({destroy:e});var a=b.find("#submit-form");c=c.onValue(function(b){a.enable(b).attr("aria-disabled",!b)});g.push({destroy:c});c=b.find("#title");
""===c.val()&&(b=c.asEventStream("keydown").doAction(function(a){f(a.target).data("title-changed",!0)}),c=k.map(h.compose(u.convertBranchNameToSentence.bind(u),t.dotX("source.getDisplayId"))).takeUntil(b).onValue(c.val.bind(c)),g.push({destroy:c}));""===f("#pull-request-description").val()&&g.push({destroy:C(k,l)});g.push({destroy:D(k)});return{destroy:function(){h.invoke(g,"destroy")}}}});