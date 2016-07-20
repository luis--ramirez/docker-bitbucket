require("bitbucket/feature/files/file-handlers").register({weight:5E3,handle:function(f){return require("bitbucket/internal/feature/file-content/handlers/diff-handler").handler.apply(this,arguments)}});
define("bitbucket/internal/feature/file-content/handlers/diff-handler","jquery lodash bitbucket/feature/files/file-handlers bitbucket/util/navbuilder bitbucket/internal/feature/comments bitbucket/internal/feature/file-content/binary-diff-view bitbucket/internal/feature/file-content/binary-view bitbucket/internal/feature/file-content/content-message bitbucket/internal/feature/file-content/diff-view-options bitbucket/internal/feature/file-content/diff-view-options-panel bitbucket/internal/feature/file-content/handlers/diff-handler/diff-handler-internal bitbucket/internal/feature/file-content/request-diff bitbucket/internal/feature/file-content/side-by-side-diff-view bitbucket/internal/feature/file-content/unified-diff-view bitbucket/internal/model/file-change bitbucket/internal/model/file-change-types bitbucket/internal/model/file-content-modes bitbucket/internal/model/path bitbucket/internal/util/ajax bitbucket/internal/util/function bitbucket/internal/util/promise exports".split(" "),function(f,
q,A,B,m,C,D,r,x,E,u,F,G,H,h,t,I,J,y,K,z,L){function M(a,e,d){var f=a.$container,c=new h(a.fileChange);return a.commentMode!==m.commentMode.NONE?(e=d?q.groupBy(d.values,function(a){return a.anchor.line?"line":"file"}):{line:e.lineComments||[],file:e.fileComments||[]},m.bindContext(f,new m.DiffAnchor(c),{lineComments:e.line,fileComments:e.file,commentMode:a.commentMode,relevantContextLines:a.relevantContextLines,diffViewOptions:a.diffViewOptions,$toolbar:a.$toolbar,urlBuilder:a.commentUrlBuilder})):
null}function N(a,e,d,k){var c=e.diff,b=A.builtInHandlers,l=a.$container,g=new h(a.fileChange);if(c&&(c.binary||D.treatTextAsBinary(c.destination&&c.destination.extension)))return d=new C(c,a),d.handlerID=d.isDiffingImages()?b.DIFF_IMAGE:b.DIFF_BINARY,d;if(!c||!c.hunks||!c.hunks.length)return r.renderEmptyDiff(l,e,g),{handlerID:b.DIFF_EMPTY,extraClasses:"empty-diff message-content"};if(c.hunks[c.hunks.length-1].truncated)return r.renderTooLargeDiff(l,c,g,k),{handlerID:b.DIFF_TOO_LARGE,extraClasses:"too-large-diff message-content"};
a=new (k?G:H)(e,f.extend({commentContext:d},a));d&&d.setDiffView(a);q.defer(a.init.bind(a));a.handlerID=k?b.DIFF_TEXT_SIDE_BY_SIDE:b.DIFF_TEXT_UNIFIED;return a}L.handler=function(a){function e(){return"side-by-side"===x.get("diffType")&&g}function d(a){var c=new h(a.fileChange),b=c.getRepository(),c=c.getCommitRange(),b=B.rest().project(b.getProject().getKey()).repo(b.getSlug()),b=(a.commentUrlBuilder?a.commentUrlBuilder():c.getPullRequest()?b.pullRequest(c.getPullRequest().getId()).comments():b.commit(c).comments()).withParams({avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:a.avatarSize||
"medium"}),path:(new J(a.fileChange.path)).toString(),markup:!0}).build();a=a.statusCode||y.ignore404WithinRepository();f.extend(a,{401:function(){return f.Deferred().resolve({start:0,size:0,values:[],isLastPage:!0,filter:null}).promise()}});a=y.rest({url:b,statusCode:a});return a.then(function(a){return a.errors&&a.errors.length?f.Deferred().rejectWith(this,[this,null,null,a]):a}).promise(a)}if(a.contentMode!==I.DIFF)return!1;var k=a.$container,c=f('.diff-type-options .aui-dropdown2-radio[data-value\x3d"side-by-side"]'),
b=new h(a.fileChange),l=b.getType(),g=!(l===t.ADD||l===t.DELETE||a.isExcerpt);a.withComments=a.commentMode!==m.commentMode.NONE;e()&&(a.contextLines=u.infiniteContext,a.withComments=!1);var p=e()?d:f.noop,p=q.compact([F(b,a),p(a)]);return z.whenAbortable.apply(z,p).thenAbortable(function(d,h){var n=d.diff;b.getType()&&b.getType!==t.UNKNOWN||(b.setType(t.guessChangeTypeFromDiff(n)),a.fileChange=b.toJSON());d.hunks&&d.hunks.length&&0===d.hunks[0].sourceSpan?g=!1:l||(g=!u.isAddedOrRemoved(n));g?c.removeClass("aui-dropdown2-disabled").attr("aria-disabled",
!1):g||c.tooltip({gravity:"e",delayIn:0,title:"data-file-type-compatibility"});var v=u.optionsOverride(x,g,a.isExcerpt);a.relevantContextLines=a.relevantContextLines||10;a.diffViewOptions=v;b.getConflict()&&r.renderConflict(k,b);var p=new E(f(document),v),n=M(a,n||{},h),w=N(a,d,n,e());return{handlerID:w.handlerID,extraClasses:w.extraClasses,destroy:function(){m.unbindContext(a.$container);q.chain([w,p,v]).compact().filter(K.dot("destroy")).invoke("destroy").value()}}},function(a,c,b,d){if("abort"===
b)return f.Deferred().resolve();r.renderErrors(k,d);return f.Deferred().resolve({extraClasses:"diff-error message-content"})})}});