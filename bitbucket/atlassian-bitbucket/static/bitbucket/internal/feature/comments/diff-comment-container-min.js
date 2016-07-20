define("bitbucket/internal/feature/comments/diff-comment-container","jquery lodash bitbucket/internal/feature/comments/comment-container bitbucket/internal/util/events bitbucket/internal/util/function bitbucket/internal/util/time-i18n-mappings".split(" "),function(b,f,d,e,g,h){e.on("bitbucket.internal.history.changestate",function(){});return d.extend({rootCommentListSelector:".comment-list",initialize:function(){f.bindAll(this,"onResize","onWebPanelResize");this.$el.is(".comment-container")||this.setElement(b(bitbucket.internal.feature.comments(b.extend({extraClasses:"comment-box",
comments:this.options.collection&&this.options.collection.toJSON(),customMapping:h.commentEditedAge},this.options.anchor.toJSON())))[0]);!this.isFileCommentContainer()&&this.options.context.diffView&&(this.toggleComment(this.options.showComments),this.options.context.diffView.addLineClass(this.options.lineHandle,"wrap","commented"));this.on("change",this.onResize);this.on("comment.saved",this.scrollIntoView);e.on("bitbucket.internal.webpanel.resize",this.onWebPanelResize);d.prototype.initialize.apply(this,
arguments)},closeCommentForm:function(a,c){if(!c||!c.doNotDestroy){var b=a.parent().parent();if(b.is(this.rootCommentListSelector)&&0===b.children(".comment").length)return this.deleteDraftComment(this.getDraftCommentFromForm(a)),this._unbindMarkupEditor(a),this.destroy()}return d.prototype.closeCommentForm.apply(this,arguments)},destroyIfEmpty:function(){var a=this.$(this.rootCommentListSelector);0!==a.children(".comment").length||a.find("textarea").val()||this.destroy()},destroy:function(a){d.prototype.destroy.apply(this,
arguments);this._widget&&(this._widget.clear(),this._widget=null);this.off("change",this.onResize);this.options.lineHandle&&this.options.context.diffView.removeLineClass(this.options.lineHandle,"wrap","commented");e.trigger("bitbucket.internal.comment.commentContainerDestroyed",null,this.$el);this.context.destroy(this,a)},focusCommentForm:g.lazyDefer(function(a){this.scrollToComment(a);a=a.find("textarea");this.isFileCommentContainer()?setTimeout(a.focus.bind(a),100):a.focus()}),onCommentDeleted:function(){this.destroyIfEmpty()},
onCommentEditorResize:function(){this.onResize()},onWebPanelResize:function(a){if("bitbucket.comments.extra"===a.location&&b.contains(this.$el.get(0),a.el))this.onResize()},onResize:function(){this._widget&&this._widget.changed();this.trigger("resize")},isFileCommentContainer:function(){return!!this.$el.closest(".file-comments").length},isActivityCommentContainer:function(){return!!this.$el.closest(".activity-item").length},scrollToComment:function(a){if(!this.isActivityCommentContainer()){var c=
a.offset().top-this.$el.offset().top;this.isFileCommentContainer()?this.options.context.diffView&&this.options.context.diffView.scrollToFileComments(c,a.height()):this.options.context.diffView.scrollToWidgetOffset(this.options.lineHandle,c,a.height())}},toggleComment:function(a){this.isFileCommentContainer()?this.options.context.trigger("fileCommentsResized"):a&&!this._widget?(this._widget=this.options.context.diffView.addLineWidget(this.options.lineHandle,this.el,{noHScroll:!0,coverGutter:!0,insertAt:0}),
a=f.throttle(function(){var a=this.getHeight();this._previousHeight!==a&&(this.changed(),this._previousHeight=a)},200),this._widget.onRedraw(a.bind(this._widget))):!a&&this._widget&&(this._widget.clear(),this._widget=null,this.el.parentElement.removeChild(this.el))}})});