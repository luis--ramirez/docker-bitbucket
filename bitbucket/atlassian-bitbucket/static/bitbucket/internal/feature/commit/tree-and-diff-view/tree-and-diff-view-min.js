define("bitbucket/internal/feature/commit/tree-and-diff-view","aui jquery lodash bitbucket/util/state bitbucket/internal/feature/commit/difftree bitbucket/internal/feature/file-content bitbucket/internal/model/conflict bitbucket/internal/model/file-change bitbucket/internal/model/file-content-modes bitbucket/internal/model/page-state bitbucket/internal/model/path-and-line bitbucket/internal/util/dom-event bitbucket/internal/util/events bitbucket/internal/util/feature-detect bitbucket/internal/util/shortcuts exports".split(" "),
function(U,c,l,V,W,E,X,Y,Z,F,t,G,d,aa,z,g){function H(a){var c=new t(a.data("path")),b;b=a.data("srcPath")&&new t(a.data("srcPath"));var d=a.data("changeType"),e=a.data("nodeType"),k;k=a.data("conflict")&&new X(a.data("conflict"));var g=a.data("executable");a=a.data("srcExecutable");return new Y({repository:F.getRepository(),commitRange:f,srcPath:b&&b.path,path:c.path,type:d,nodeType:e,line:c.line,search:A,conflict:k,srcExecutable:a,executable:g})}function B(a,b){h||(h=new E(m,"commit-file-content"));
b||(b=a.getLine());w=a;e=new t(a.getPath(),a.getLine());F.setFilePath(a.getPath());m.height(m.height());var d=n.scrollTop();return h.init(a,c.extend(u,{anchor:b})).done(function(){p=c("#commit-file-content");if(0!==p.length){p.find(".file-toolbar");p.find(".content-view");var a=d,b=p.offset();d=b?Math.min(a,b.top):a;n.scrollTop(d)}})}function I(){var a=c.Deferred();w=e=null;h&&(h.destroy(),h=null);c("#commit-file-content").remove();return a.resolve()}function J(){var a=K=n.height();c(".file-tree-container").children(":not(.file-tree-wrapper)").each(function(){a-=
c(this).outerHeight(!0)});return a}function L(){x=J();y.css({"max-height":x+"px","border-bottom-width":0})}function M(){C=!0;var a=D();if((Boolean(a)^Boolean(e)||a&&a.path.toString()!==e.path.toString())&&b){if(b.selectFile(a.path.getComponents()),N(),a.line)d.once("bitbucket.internal.feature.fileContent.diffViewContentChanged",function(){d.trigger("bitbucket.internal.feature.diffView.lineChange",null,a.line)})}else a.toString()!==e.toString()&&(d.trigger("bitbucket.internal.feature.diffView.lineChange",
null,a.line),e=a);C=!1}function N(){var a=b.getSelectedFile();a&&0<a.length?B(H(a)):w&&B(w)}function ba(a){q||(q=c('\x3cdiv class\x3d"spinner"/\x3e'));y.siblings(".file-tree-header").replaceWith(bitbucket.internal.feature.fileTreeHeader({commit:u.linkToCommit?f.getUntilRevision().toJSON():null,repository:V.getRepository()}));m.addClass("loading-diff-tree");q.appendTo("#content .file-tree-wrapper").spin("large",{zIndex:10});return b.init(a).always(function(){m.removeClass("loading-diff-tree");q&&(q.spinStop().remove(),
q=null)}).done(function(){c(".file-tree");x=J();y.css("max-height",x)})}function D(){return new t(decodeURI(window.location.hash.substring(1)))}function O(){function a(){d.trigger("bitbucket.internal.feature.commit.difftree.collapseAnimationFinished",null,g)}var b=c(".collapse-file-tree"),e=c(".commit-files"),f=c(".file-tree-container"),g,l,h=!1,m=function(b){var c=e.hasClass("collapsed");"undefined"===typeof b&&(b=!c);e.toggleClass("collapsed",b).toggleClass("quick-reveal-mode",h);g=e.hasClass("collapsed");
g!==c&&(d.trigger("bitbucket.internal.feature.commit.difftree.toggleCollapse",null,g),aa.cssTransition()||a())};r=function(a){a=h?!1:a;"object"===("undefined"===typeof a?"undefined":babelHelpers.typeof(a))&&(a=void 0);h=!1;clearTimeout(l);m(a)};k.push(d.chainWith(b).on("click",G.preventDefault(r)));k.push(d.chainWith(f).on("mouseleave",function(){clearTimeout(l);h&&(h=!1,r(!0))}).on("transitionend",G.filterByTarget(f,a)));k.push(d.chainWith(f.find(".file-tree-wrapper, .commit-selector-button")).on("mouseenter",
function(){clearTimeout(l);e.hasClass("collapsed")&&(l=setTimeout(function(){h=!0;m(!1)},200))}));k.push(d.chainWith(f.find(".diff-tree-toolbar")).on("focus","input",function(){r(!1)}))}function P(){c(".no-changes-placeholder").remove();var a=e?e:D();return ba(a.path.getComponents()).then(function(b){return(b=b.getSelectedFile())&&b.length?B(H(b),a.line):I().done(function(){c(".commit-files").append(c('\x3cdiv class\x3d"message no-changes-placeholder"\x3e\x3c/div\x3e').text(U.I18n.getText("bitbucket.web.no.changes.to.show")))})})}
function Q(a){return new ca(".file-tree-wrapper",".diff-tree-toolbar .aui-toolbar2-primary",f,{maxChanges:a.maxChanges,hasOtherParents:1<a.numberOfParents,urlBuilder:a.changesUrlBuilder,searchUrlBuilder:a.diffUrlBuilder})}function R(a,b){C||b||(window.location.hash=a?encodeURI((new t(a.data("path"))).toString()):"")}var ca=W.DiffTree,u,f,w,e,A,C=!1,k=[],b,v={},h,n=c(window),S,m,q,K,x,p,T,y;d.on("bitbucket.internal.feature.fileContent.optionsChanged",function(a){l.contains(["hideComments","hideEdiff"],
a.key)||N()});d.on("bitbucket.internal.feature.diffView.highlightSearch",function(a){A=a});var r;g.updateCommitRange=function(a){a.getId()!==f.getId()&&(f=a,b.reset(),Object.prototype.hasOwnProperty.call(v,f.getId())?b=v[f.getId()]:(b=Q(u),v[f.getId()]=b),P())};g.init=function(a,h){u=c.extend({},g.defaults,h);c("#footer");S=c("#content");m=S.find(".commit-files");T=c(".file-tree-container");y=T.children(".file-tree-wrapper");K=n.height();p=c("#commit-file-content");f=a;b=Q(u);v[f.getId()]=b;e=D();
n.on("hashchange",M);O();P();k.push(d.chain().on("window.resize",L).on("bitbucket.internal.feature.fileContent.diffViewExpanded",L).on("bitbucket.internal.feature.commit.difftree.selectedNodeChanged",R));k.push({destroy:z.bind("requestToggleDiffTreeHandler",l.ary(r,0))});k.push({destroy:z.bind("requestMoveToNextHandler",l.ary(b.openNextFile.bind(b),0))});k.push({destroy:z.bind("requestMoveToPreviousHandler",l.ary(b.openPrevFile.bind(b),0))});k.push(d.chainWith(b).on("search-focus",l.partial(r,!1)))};
g._initDiffTreeToggle=O;g.reset=function(){b&&b.reset();b=f=void 0;v={};A=e=void 0;n.off("hashchange",M);l.invoke(k,"destroy");return I()};g._onSelectedNodeChanged=R;g.defaults={breadcrumbs:!0,changeTypeLozenge:!0,changeModeLozenge:!0,contentMode:Z.DIFF,linkToCommit:!1,sourceLink:!0,toolbarWebFragmentLocationPrimary:null,toolbarWebFragmentLocationSecondary:null};g.commentMode=E.commentMode});