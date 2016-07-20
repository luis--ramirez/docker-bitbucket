define("bitbucket/internal/feature/comments/comment-context","backbone jquery lodash bitbucket/internal/feature/comments/comment-container bitbucket/internal/util/client-storage bitbucket/internal/util/events".split(" "),function(f,g,c,h,e,d){return f.View.extend({initialize:function(){this._containers={};this.checkForNewContainers();var a=this;d.on("bitbucket.internal.feature.comments.commentAdded",this._commentAddedHandler=function(b,c){a.$el.find(c).length&&1===a.$el.find(".comment").length&&d.trigger("bitbucket.internal.feature.comments.firstCommentAdded",
null,a.$el)});var b=this.getDrafts()||[];this.unrestoredDrafts=this.drafts=c.isArray(b)?b:[b];this.restoreDrafts()},includesContainer:function(a){return c.has(this._containers,a)},registerContainer:function(a,b){var c=b.getId();this.includesContainer(c)||this._registerContainer(c,a,b)},_registerContainer:function(a,b,c){this._containers[a]=new h({name:a,context:this,el:b,anchor:c});return this._containers[a]},checkForNewContainers:function(){var a=this;c.forEach(this.findContainerElements(),function(b){a.registerContainer(b,
a.getAnchor(b))})},findContainerElements:function(){return this.$(".comment-container")},getAnchor:function(){return this.options.anchor},clarifyAmbiguousDraftProps:function(a){return c.omit(a,"text")},deleteDraftComment:function(a,b){b=c.isBoolean(b)?b:!0;var d=c.isEqual.bind(c,this.clarifyAmbiguousDraftProps(a));this.drafts=c.reject(this.drafts,c.compose(d,this.clarifyAmbiguousDraftProps.bind(this)));b&&this.saveDraftComments()},getDrafts:function(){return e.getSessionItem(this.getDraftsKey())},
getDraftsKey:function(){return e.buildKey(["draft-comment",this.options.anchor.getId()],"user")},restoreDrafts:g.noop,saveDraftComment:function(a){this.deleteDraftComment(a,!1);a.text&&this.drafts.push(a);this.saveDraftComments()},saveDraftComments:function(){e.setSessionItem(this.getDraftsKey(),this.drafts)},destroy:function(a,b){a?(a.remove(),delete this._containers[a.options.name],this.$el.has(".comment").length||b||d.trigger("bitbucket.internal.feature.comments.lastCommentDeleted",null,this.$el)):
(c.invoke(this._containers,"destroy",!0),this._containers=null,this._commentAddedHandler&&(d.off("bitbucket.internal.feature.comments.commentAdded",this._commentAddedHandler),delete this._commentAddedHandler))}})});