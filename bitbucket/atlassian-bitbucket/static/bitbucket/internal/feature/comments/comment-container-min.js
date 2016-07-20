define("bitbucket/internal/feature/comments/comment-container","aui backbone jquery lib/jsuri lodash bitbucket/internal/feature/comments/comment-collection bitbucket/internal/feature/comments/comment-model bitbucket/internal/feature/comments/comment-tips bitbucket/internal/model/page-state bitbucket/internal/util/dom-event bitbucket/internal/util/events bitbucket/internal/util/function bitbucket/internal/util/history bitbucket/internal/util/syntax-highlight bitbucket/internal/util/time-i18n-mappings bitbucket/internal/widget/aui/form bitbucket/internal/widget/confirm-dialog bitbucket/internal/widget/markup-editor".split(" "),
function(g,u,e,v,k,w,n,p,h,x,f,q,y,r,z,m,A,t){return u.View.extend({initialize:function(){k.bindAll(this,"onCommentEditorResize","onCommentFocused");this.anchor=this.anchor||this.options.anchor;this.rootCommentListSelector=this.rootCommentListSelector||this.options.rootCommentListSelector;this.context=this.options.context;this.pullRequest=this.options.pullRequest||h.getPullRequest();this.urlBuilder=this.options.urlBuilder;this.collection||(this.collection=new w([],{anchor:this.anchor,urlBuilder:this.urlBuilder}));
this.initDeleteButtons();this.$el.imagesLoaded(this.onImagesLoaded.bind(this));f.trigger("bitbucket.internal.feature.comments.commentContainerAdded",null,this.$el);this.updateDraftComment=k.debounce(this.updateDraftComment,300);this.deleteDraftComment=k.debounce(this.deleteDraftComment,300);this.on("comment.saved",r.container.bind(null,this.$el));r.container(this.$el);f.once("bitbucket.internal.feature.pullRequestActivity.focused",this.onCommentFocused)},events:{"submit form":"onFormSubmit","click a.times":"onDateClicked",
"click .cancel":"onCancelClicked","click .reply":"onReplyClicked","click .edit":"onEditClicked","click .task-create":"onCreateTaskClicked","keydown form":"onFormKeydown","input textarea":"onTextareaInput","comment-child-added .comment ":"onChildrenChanged","comment-child-removed .comment ":"onChildrenChanged"},initDeleteButtons:function(a){this.createDeleteDialog().attachTo(".delete",null,this.el)},createDeleteDialog:function(){var a=this,b=new A({id:"delete-repository-dialog",titleText:g.I18n.getText("bitbucket.web.comment.delete.title"),
titleClass:"warning-header",panelContent:"\x3cp\x3e"+g.I18n.getText("bitbucket.web.comment.delete.confirm")+"\x3c/p\x3e",submitText:g.I18n.getText("bitbucket.web.button.delete"),submitToHref:!1});b.addConfirmListener(function(b,c,e){e();a.deleteComment(c.closest(".comment"))});return b},sendOverviewAnalyticsEvent:function(a,b,d){e(a).closest("#pull-request-activity")&&f.trigger("bitbucket.internal.feature.pullRequest."+b,null,d)},onFormSubmit:function(a){a.preventDefault();a.stopPropagation();this.submitCommentForm(e(a.target))},
onDateClicked:function(a){a.preventDefault();a.stopPropagation();e(".comment.focused").removeClass("focused");a=e(a.target).closest("a");a.closest(".comment").addClass("focused");y.pushState(null,null,a.prop("href"))},onCancelClicked:function(a){a.preventDefault();a.stopPropagation();this.cancelCommentForm(e(a.target).closest("form"))},onReplyClicked:function(a){a.originalEvent instanceof MouseEvent&&this.sendOverviewAnalyticsEvent(a.target,"overview.comment.reply.clicked");a.preventDefault();a.stopPropagation();
this.openReplyForm(e(a.target).closest(".comment"))},onEditClicked:function(a){this.sendOverviewAnalyticsEvent(a.target,"overview.comment.edit.clicked");a.preventDefault();a.stopPropagation();this.openEditForm(e(a.target).closest(".comment"))},onCreateTaskClicked:function(a){this.sendOverviewAnalyticsEvent(a.target,"overview.comment.task.clicked");a.preventDefault();a.stopPropagation();a=e(a.target).closest(".comment");f.trigger("bitbucket.internal.feature.tasks.createTask",null,a)},onImagesLoaded:function(a){this.trigger("change")},
onFormKeydown:function(a){x.isCtrlish(a)&&a.which===g.keyCode.ENTER&&(a.preventDefault(),a.stopPropagation(),e(a.target).closest("form").submit())},onTextareaInput:function(a){e(a.target).closest(".comment-container").is(this.el)&&this.updateDraftComment(a.target)},onChildrenChanged:function(a){if(a.target!==a.currentTarget){a.stopPropagation();a=e(a.currentTarget);var b=a.find("\x3e .content .task-list-row, \x3e .replies \x3e .comment").not(".pending-delete").length;a.find("\x3e .content \x3e .actions \x3e li \x3e .delete").parent().toggleClass("hidden",
!!b)}},onCommentFocused:function(a){var b=(new v(window.location)).getQueryParamValue("action"),d={"comment.id":this.getCommentJSON(a.closest(".comment")).id};"reply"===b?(a.find(".reply").first().click(),this.sendOverviewAnalyticsEvent(a,"comment.actions.reply",d)):"view"===b&&this.sendOverviewAnalyticsEvent(a,"comment.actions.view",d)},updateDraftComment:function(a){a=this.getDraftCommentFromForm(e(a).closest("form"));this.context&&this.context.saveDraftComment(a)},getDraftCommentFromForm:function(a){a=
this.getCommentFormJSON(a);a.anchor&&delete a.anchor.commitRange;return e.extend({},a)},deleteDraftComment:function(a){this.context&&this.context.deleteDraftComment(a)},getRootCommentList:function(){var a=this.$(this.rootCommentListSelector);a.length||(a=this.$el);return a},render:function(){var a=bitbucket.internal.feature.comments(e.extend({comments:this.collection.toJSON(),customMapping:z.commentEditedAge},this.anchor.toJSON()));this.$el.replaceWith(a);this.setElement(a[0])},_toJSON:function(a,
b){var d=parseInt(a.parent().closest(".comment").attr("data-id"),10),c=parseInt(a.attr("data-id"),10),e=parseInt(a.attr("data-version"),10),f=this.anchor.toJSON();this.pullRequest&&f&&(f.pullRequest=this.pullRequest.toJSON());return{id:isNaN(c)?void 0:c,version:isNaN(e)?void 0:e,text:b,anchor:f,parent:isNaN(d)?void 0:{id:d}}},getCommentJSON:function(a){return this._toJSON(a,a.find("\x3e .content \x3e .message").attr("data-text"))},getCommentFormJSON:function(a){var b=a.parent().is(".comment")?a.parent():
a;return this._toJSON(b,a.find("textarea").val())},renderContentUpdate:function(a,b){a.children(".content").replaceWith(bitbucket.internal.feature.commentContent({pullRequest:this.pullRequest&&this.pullRequest.toJSON(),comment:b,hideDelete:!!a.find("\x3e .replies \x3e .comment").length}));a.attr("data-version",b.version).data("version",b.version);this.$el.imagesLoaded(this.onImagesLoaded.bind(this));this.scrollToComment(a);this.trigger("change");f.trigger("bitbucket.internal.feature.comments.commentEdited",
null,b,a)},insertCommentIntoList:function(a,b,d){for(var c=b.children(".comment:first");c.length&&!(parseInt(c.data("id"),10)>d.id);)c=c.next(".comment");c=c.length?c:b.children(".comment-form-container:last");c.length?a.insertBefore(c):b.append(a)},renderComment:function(a,b,d){var c;if(d&&(c=e('.comment[data-id\x3d"'+a.id+'"]')).length)return this.renderContentUpdate(c,a);a=e.extend({isNew:!0},a);b=(c=b&&this.$("[data-id\x3d"+b+"]"))?c.children(".replies"):this.getRootCommentList();c=e(bitbucket.internal.feature.comment({pullRequest:this.pullRequest&&
this.pullRequest.toJSON(),numOfAncestors:b.parents(".comment").length,extraClasses:this.getExtraCommentClasses(),comment:a}));this.insertCommentIntoList(c,b,a);setTimeout(k.bind(c.removeClass,c,"new"),5E3);this.scrollToComment(c);c.hide().fadeIn("slow");this.$el.imagesLoaded(this.onImagesLoaded.bind(this));this.trigger("change");f.trigger("bitbucket.internal.feature.comments.commentAdded",null,a,c);c.trigger("comment-child-added")},getExtraCommentClasses:function(){return""},showErrorMessage:function(a,
b){var d=this.find(".error");d.length||(d=e('\x3cdiv class\x3d"error"\x3e\x3c/div\x3e'),this.find(".comment-form-footer").before(d));d.text(b)},cancelCommentForm:function(a){this.closeCommentForm(a)},submitCommentForm:function(a){if(!m.isSubmissionPrevented(a)){var b=this,d=a.find(".comment-submit-spinner"),c=this.getCommentFormJSON(a),f=null!=c.id,g=f&&this.collection.get(c.id),h=c.parent&&c.parent.id,l=g?this.collection.get(c.id):new n;l.on("invalid",this.showErrorMessage,a);l.set(e.extend(c,{avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"medium"})}),
{validate:!0})&&(g||this.collection.push(l),a.addClass("submitting"),d.spin("medium"),m.preventSubmission(a),l.save().done(function(c){c.createdDate=Math.min(c.createdDate,(new Date).getTime());c.updatedDate=Math.min(c.updatedDate,(new Date).getTime());b.closeCommentForm(a,{doNotDestroy:!0});b.renderComment(c,h,f);b.trigger("comment.saved")}).fail(function(){g||f||b.collection.remove(c.id)}).always(function(){d.spinStop();a.removeClass("submitting");m.allowSubmission(a)}));l.off("invalid",this.showErrorMessage)}},
deleteComment:function(a){var b=this.getCommentJSON(a),d;this.collection.get(b)?d=this.collection.get(b.id):(d=new n(b),this.collection.push(d));var c=a.find("\x3e .content .delete"),e=c.height(),h=c.width();c.height(e).width(h).css("vertical-align","middle").empty().spin("small");var k=this;d.destroy({wait:!0}).always(function(){c.spinStop()}).done(function(){a.addClass("pending-delete").fadeOut(function(){a.trigger("comment-child-removed").remove();k.onCommentDeleted();k.trigger("change");f.trigger("bitbucket.internal.feature.comments.commentDeleted",
null,b)})}).fail(function(){c.css("height","").css("width","").css("vertical-align","").text(g.I18n.getText("bitbucket.web.comment.delete"))})},onCommentDeleted:function(){},onCommentEditorResize:e.noop,openEditForm:function(a){var b=this.getCommentJSON(a),b=e(bitbucket.internal.feature.commentForm(e.extend({tips:450<this.$el.width()?p.tips:[],currentUser:h.getCurrentUser()&&h.getCurrentUser().toJSON()},b))),d=a.find("\x3e .user-avatar, \x3e .content");d.detach();a.prepend(b).addClass("comment-form-container");
b.data("originalContent",d);this._bindMarkupEditor(b);this.focusCommentForm(b);this.trigger("change");f.trigger("bitbucket.internal.feature.comments.commentFormShown",null,b);return b},openReplyForm:function(a){a=a.children(".replies");return this.openCommentForm(a,{location:"top"})},openNewCommentForm:function(){return this.openCommentForm(this.getRootCommentList(),{location:"bottom"})},openCommentForm:function(a,b){var d=b&&"top"===b.location?"prependTo":"appendTo",c=a.children(".comment-form-container").not(".comment");
c.length||(c=e(bitbucket.internal.feature.commentFormListItem({tips:450<this.$el.width()?p.tips:[],currentUser:h.getCurrentUser()&&h.getCurrentUser().toJSON()}))[d](a),this._bindMarkupEditor(c.find("form")));d=c.find("form");this.focusCommentForm(d);this.trigger("change");f.trigger("bitbucket.internal.feature.comments.commentFormShown",null,d);return d},closeCommentForm:function(a){a.find(".error").remove();this.deleteDraftComment(this.getDraftCommentFromForm(a));this._unbindMarkupEditor(a);var b=
a.data("originalContent"),d=a.parent();b?(d.removeClass("comment-form-container"),a.replaceWith(b)):d.remove();this.trigger("change");f.trigger("bitbucket.internal.feature.comments.commentFormHidden",null,a)},focusCommentForm:q.lazyDefer(function(a){this.scrollToComment(a);a.find("textarea").focus()}),scrollToComment:e.noop,populateCommentFormFromDraft:function(a,b){e(a).find("textarea").val(b.text).addClass("restored").attr("title",g.I18n.getText("bitbucket.web.comment.restored.draft.title")).trigger("input").one("click input",
function(){e(this).removeClass("restored").removeAttr("title")})},getCommentElById:function(a){return this.$(".comment[data-id\x3d"+a+"]")},restoreDraftComment:function(a){var b;if(a.id){var d=this.getCommentElById(a.id);if(d.length){if(parseInt(a.version,10)<parseInt(d.attr("data-version"),10))return this.context.deleteDraftComment(a),!0;b=this.openEditForm(d)}}else a.parent?(d=this.getCommentElById(a.parent.id),d.length&&(b=this.openReplyForm(d))):b=this.openNewCommentForm();b&&this.populateCommentFormFromDraft(b,
a);return!!b},_bindMarkupEditor:function(a){t.bindTo(a).on("resize",this.onCommentEditorResize)},_unbindMarkupEditor:function(a){t.unbindFrom(a)},destroy:function(){this.$("form").each(q.thisToParam(this._unbindMarkupEditor.bind(this)))}})});