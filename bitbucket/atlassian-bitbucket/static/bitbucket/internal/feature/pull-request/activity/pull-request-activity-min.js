define("bitbucket/internal/feature/pull-request/pull-request-activity","aui jquery lodash bitbucket/util/navbuilder bitbucket/internal/feature/comments bitbucket/internal/feature/file-content bitbucket/internal/model/commit-range bitbucket/internal/model/file-change bitbucket/internal/model/file-content-modes bitbucket/internal/model/page-state bitbucket/internal/model/path bitbucket/internal/model/path-and-line bitbucket/internal/util/ajax bitbucket/internal/util/client-storage bitbucket/internal/util/codemirror bitbucket/internal/util/events bitbucket/internal/util/scroll bitbucket/internal/util/syntax-highlight bitbucket/internal/util/time-i18n-mappings bitbucket/internal/widget/paged-scrollable".split(" "),
function(n,g,h,q,p,x,y,z,F,r,G,v,A,w,H,k,B,I,J,t){function C(a){(this.execute?this:n.whenIType(a)).execute(function(){var a=g(".general-comment-form");B.scrollTo(a);a.find("textarea").focus()})}function D(a){a.closest(".diff-comment-activity, .file-comment-activity").remove()}function e(a,c,d,b,f){this._$container=g(a);this.pullRequest=c;this.pullRequestPathComponents={projectKey:r.getProject().getKey(),repoSlug:r.getRepository().getSlug(),pullRequestId:this.pullRequest.getId()};this.fromType=d;this.fromId=
b;this.dataLoadedEvent="bitbucket.internal.feature.pullRequestActivity.dataLoaded";this._$spinner=g('\x3cdiv class\x3d"spinner"/\x3e').insertAfter(this._$container);t.call(this,f.scrollableElement||a,{pageSize:25,dataLoadedEvent:this.dataLoadedEvent,autoLoad:"next",paginationContext:"pull-request-activity"})}g.extend(e.prototype,t.prototype);e.prototype.init=function(a){this.renderedDiffFileContents=[];t.prototype.init.call(this,a);this._inited=!0;this.loadedRange.isEmpty()||(this.renderedDiffFileContents=
this.renderedDiffFileContents.concat(e.renderDiffs(this._$container.children(".diff-comment-activity"),a.diffCommentData,new y({pullRequest:this.pullRequest}))));p.bindContext(this._$container,new p.PullRequestAnchor(this.pullRequestPathComponents));var c=this;this._approvalHandler=function(a){c.addApprovalActivity(a.approved,a.user,new Date)};k.on("bitbucket.internal.widget.approve-button.added",this._approvalHandler);k.on("bitbucket.internal.widget.approve-button.removed",this._approvalHandler);
k.on("bitbucket.internal.feature.comments.lastCommentDeleted",D);k.on("bitbucket.internal.keyboard.shortcuts.pullrequest.addCommentHandler",C)};e.prototype.reset=function(){k.off("bitbucket.internal.widget.approve-button.added",this._approvalHandler);k.off("bitbucket.internal.widget.approve-button.removed",this._approvalHandler);k.off("bitbucket.internal.feature.comments.lastCommentDeleted",D);k.off("bitbucket.internal.keyboard.shortcuts.pullrequest.addCommentHandler",C);h.chain(this.renderedDiffFileContents).pluck("inlineInfo").pluck("fileContent").invoke("destroy").value();
delete this.renderedDiffFileContents;h.invoke(this.fileCommentContexts,"destroy");delete this.fileCommentContexts;p.unbindContext(this._$container);t.prototype.reset.call(this);this.currentTime=void 0;this._inited=!1};e.prototype.checkCommentIsNew=function(a){a.isUnread=a.updatedDate>this.lastViewed&&(!r.getCurrentUser()||a.author.name!==r.getCurrentUser().getName());a.comments.length&&h.each(a.comments,h.bind(this.checkCommentIsNew,this))};e.prototype.checkCommentActivitiesAreNew=function(a){var c=
this;h.each(a,function(a){"COMMENTED"===a.action&&c.checkCommentIsNew(a.comment)})};e.prototype.requestData=function(a,c){var d=this,b=0!==a||h.isUndefined(this.fromType)||h.isUndefined(this.fromId)?{}:{fromType:this.fromType,fromId:this.fromId};this._$spinner.spin("large");return A.rest({url:q.rest().project(this.pullRequestPathComponents.projectKey).repo(this.pullRequestPathComponents.repoSlug).pullRequest(this.pullRequestPathComponents.pullRequestId).activities().withParams(g.extend(b,{start:a,
limit:c,avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"medium"}),markup:!0})).build(),statusCode:{404:function(a,b,c,m,e){a="activity"===d.fromType?n.I18n.getText("bitbucket.web.pullrequest.activity.notfound.title"):n.I18n.getText("bitbucket.web.pullrequest.comment.notfound.title");b="activity"===d.fromType?n.I18n.getText("bitbucket.web.pullrequest.activity.notfound.message"):n.I18n.getText("bitbucket.web.pullrequest.comment.notfound.message");return g.extend({},e,{title:a,titleClass:"confirm-header",
message:b,fallbackTitle:n.I18n.getText("bitbucket.web.pullrequest.activity.notfound.fallback.title"),fallbackUrl:q.project(d.pullRequestPathComponents.projectKey).repo(d.pullRequestPathComponents.repoSlug).pullRequest(d.pullRequestPathComponents.pullRequestId).overview().build(),canClose:!1,shouldReload:!1})}}}).done(function(a,b,c){d.currentTime||(b=(new Date(c.getResponseHeader("Date"))).getTime(),c=w.buildKey("last-viewed","pull-request"),d.currentTime=isNaN(b)?(new Date).getTime():b,d.lastViewed=
w.getItem(c)||d.currentTime,w.setItem(c,d.currentTime));d.checkCommentActivitiesAreNew(a.values)}).fail(function(){d._$spinner.spinStop()})};e.prototype.attachContent=function(a,c){this._$container["html"===a?"append":a](c)};e.prototype.decorateForFocus=function(a){var c;if("activity"===this.fromType){var d=parseInt(this.fromId,10);h.some(a.values,function(a,b){return a.id===d?(a.isFocused=!0,c=d,!0):!1})}else{var b=parseInt(this.fromId,10),f=function u(a){return a.id===b?a.isFocused=!0:a.comments?
h.some(a.comments,function(a){return u(a)}):!1};h.some(a.values,function(a,b){return a.comment&&f(a.comment)?(c=a.id,!0):!1})}return c};e.prototype.onAttachFirstPermalinkPage=function(a,c){function d(){l.hide();e.spin("large");var a=b.loadedRange.pageBefore(b.options.pageSize);A.rest({url:q.rest().project(b.pullRequestPathComponents.projectKey).repo(b.pullRequestPathComponents.repoSlug).pullRequest(b.pullRequestPathComponents.pullRequestId).activities().withParams(g.extend(a,{avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"medium"}),
markup:!0})).build()}).done(function(a,c,d){b.loadedRange.add(a.start,a.size,a.isLastPage,a.nextPageStart);var g;h.any(a.values,function(a,b){if(a.id===E)return g=b,!0});c=a.values.slice(0,g);b.checkCommentActivitiesAreNew(c);b.attachActivities(c,function(a){f.after(a)});a.isFirstPage||b.loadedRange.reachedStart()?(l.unbind("click"),f.remove(),e.remove()):(E=m,m=a.previousPageStartId);k.trigger(b.dataLoadedEvent,b,a.start,a.limit,a)}).always(function(){e.spinStop();l.show()})}var b=this,f=g(bitbucket.internal.feature.pullRequest.loadPreviousActivities());
this.attachContent(c,f);var l=f.find("a"),e=f.append(g('\x3cdiv class\x3d"spinner"/\x3e')),m=a.previousPageStartId,E=a.values[0].id;l.click(function(a){a.preventDefault();d()})};e.prototype.attachActivities=function(a,c){var d=this,b=0,f=new y({pullRequest:this.pullRequest}),l=g(h.map(a,function(a){a=bitbucket.internal.feature.pullRequest.activityListItem({activity:a,pullRequest:d.pullRequest.toJSON(),commitRange:f.toJSON(),customMapping:J.commentEditedAge,isNew:!1});b++;return a}).join(""));I.container(l);
var u=h.reduce(a,function(a,b){a[b.id]=b;return a},{});c(l);this.fileCommentContexts=e.addBreadcrumbsAndBindFileComments(l.filter(".file-comment-activity"),u,f);l=e.renderDiffs(l.filter(".diff-comment-activity"),u,f);this.renderedDiffFileContents=this.renderedDiffFileContents.concat(l);this._$container.find(".pull-request-diff-outdated-lozenge").tooltip({gravity:"ne"});this._$container.find(".reviewers-updated-activity .aui-avatar img").tooltip({gravity:"n"});return l};e.prototype.attachNewContent=
function(a,c){function d(a){if(b._inited)if(a=e?g(".comment.focused",a):g(".activity-item.focused",a),a.length)B.scrollTo(a,{waitForImages:!0,cancelIfScrolled:!0,duration:400}),k.trigger("bitbucket.internal.feature.pullRequestActivity.focused",null,a);else if(e)k.once("bitbucket.internal.feature.comments.commentContainerAdded",d)}var b=this,f=g("#pull-request-activity \x3e li.comment-form-container"),l=!h.isUndefined(this.fromId)&&!h.isUndefined(this.fromType),e="comment"===this.fromType,f=0===f.siblings().length,
m;l&&f&&(m=this.decorateForFocus(a));if(l&&!a.isFirstPage&&f)this.onAttachFirstPermalinkPage(a,c);l=this.attachActivities(a.values,function(a){b.attachContent(c,a)});this._$spinner.spinStop();a.isLastPage&&this._$spinner.remove();null!=m&&((m=h.findWhere(l,{activityId:m}))?m.inlineInfo.initPromise.done(d.bind(null,null)):d())};e.renderDiffForComment=function(a,c,d){a=new x(a);var b=d.getPullRequest().getToRef().getRepository();d=z.fromDiff(c.diff,d,b);var b=d.getPath(),f=d.getDiff().hunks[0],b=f?
0!==f.sourceLine?new v(b,f.sourceLine,"FROM"):new v(b,f.destinationLine,"TO"):new v(b);c=a.init(d,{commentMode:x.commentMode.REPLY_ONLY,lineComments:[c.comment],asyncDiffModifications:!1,attachScroll:!1,autoResizing:!0,scrollStyle:"inline",isExcerpt:!0,contentMode:F.DIFF,changeTypeLozenge:!1,changeModeLozenge:!1,fileIcon:!0,breadcrumbs:!0,scrollPaneSelector:"self",pullRequestDiffLink:!0,pullRequestDiffCurrent:c.commentAnchor?!1===c.commentAnchor.orphaned:!0,pullRequestDiffLinkUrl:q.currentPullRequest().diff().change(b.toString()).build(),
toolbarWebFragmentLocationPrimary:"bitbucket.pull-request.activity.diff.toolbar.primary",toolbarWebFragmentLocationSecondary:"bitbucket.pull-request.activity.diff.toolbar.secondary"});return{fileContent:a,initPromise:c}};e.renderDiffs=function(a,c,d){var b=[];h.each(a,function(a){var d=Number(a.getAttribute("data-activityid"));b.push({activityId:d,el:a,data:c[d]})});return H.doInOperation(function(){return h.map(b,function(a){return{activityId:a.activityId,inlineInfo:e.renderDiffForComment(g(a.el).find(".detail"),
a.data,d)}})})};e.addBreadcrumbsAndBindFileComments=function(a,c,d){var b=[];a.each(function(){var a=g(this),e=a.attr("data-activityid"),k=c[e],e=new G(k.commentAnchor.path),k=k.commentAnchor?!1===k.commentAnchor.orphaned:!0,m=h.map(e.getComponents(),function(a){return{text:a}});a.find(".breadcrumbs").append(bitbucket.internal.widget.breadcrumbs.crumbs({pathComponents:m,primaryLink:k?q.currentPullRequest().diff().change(e).build():void 0}));e=new z({repository:r.getRepository(),commitRange:d,path:e});
a=p.bindContext(a,new p.DiffAnchor(e),{$toolbar:a.find(".file-toolbar"),commentMode:p.commentMode.REPLY_ONLY});b.push(a)});return b};e.prototype.addApprovalActivity=function(a,c,d){var b=g("#pull-request-activity .comment-form-container").first();g(bitbucket.internal.feature.pullRequest.activityApprovalListItem({user:c.name?c:c.toJSON(),action:a?"APPROVED":"UNAPPROVED",activityDate:d})).hide().insertAfter(b).fadeIn("slow")};e.prototype.handleErrors=g.noop;return e});