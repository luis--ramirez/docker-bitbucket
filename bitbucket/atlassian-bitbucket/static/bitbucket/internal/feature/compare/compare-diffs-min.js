define("bitbucket/internal/feature/compare/compare-diffs","jquery bitbucket/util/navbuilder bitbucket/internal/feature/comments bitbucket/internal/feature/commit/tree-and-diff-view bitbucket/internal/layout/page-scrolling-manager bitbucket/internal/model/commit-range bitbucket/internal/model/revision bitbucket/internal/util/bacon".split(" "),function(m,f,n,k,p,q,g,h){function e(a,c,d){var b=a.toJSON?a.toJSON():a;a=b.untilRevision;b=b.sinceRevision;return f.rest().project(b.repository.project.key).repo(b.repository.slug).compare()[c](d).from(a.id).fromRepo(a.repository.id).to(b.id)}
function r(a,c,d){return e(d,"changes").withParams({start:a,limit:c})}function t(a){a=a.toJSON?a.toJSON():a;return e(a.commitRange,"diff",a)}function l(a){return new g({id:a.getLatestCommit(),repository:a.getRepository()})}return function(a,c){var d=h.events("bitbucket.internal.widget.keyboard-shortcuts.register-contexts");return function(b,e){var f=m(bitbucket.internal.feature.compare.diff({diffTreeHeaderWebItems:a}));e.append(f);k.init(new q({untilRevision:l(b.getSourceBranch()),sinceRevision:l(b.getTargetBranch())}),
{changesUrlBuilder:r,diffUrlBuilder:t,commentMode:n.commentMode.NONE,maxChanges:c,numberOfParents:0,toolbarWebFragmentLocationPrimary:"bitbucket.commit.diff.toolbar.primary",toolbarWebFragmentLocationSecondary:"bitbucket.commit.diff.toolbar.secondary"});var g=p.acceptScrollForwardingRequests(),h=d.onValue(function(a){a.enableContext("diff-view");a.enableContext("diff-tree")});return function(){h();k.reset();g()}}}});