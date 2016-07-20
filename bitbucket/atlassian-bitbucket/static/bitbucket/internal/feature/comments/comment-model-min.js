define("bitbucket/internal/feature/comments/comment-model",["aui","backbone","backbone-brace","lodash","bitbucket/util/navbuilder"],function(d,h,c,g,k){var f=c.Model.extend({namedAttributes:{anchor:null,attributes:null,author:null,avatarSize:null,comments:null,tasks:null,createdDate:"number",html:"string",id:"number",isFocused:"boolean",isUnread:"boolean",parent:null,permittedOperations:null,properties:null,pullRequest:"object",text:"string",updatedDate:"number",version:"number"},validate:function(b){if(!b.text||
!/\S/.test(b.text))return d.I18n.getText("bitbucket.web.comment.empty")},url:function(){var b={version:this.get("version"),avatarSize:this.get("avatarSize"),markup:!0},a=this.get("anchor");a&&a.commitRange&&a.commitRange.sinceRevision&&(b.since=a.commitRange.sinceRevision.id);if(this.collection&&this.collection.urlBuilder)return a=this.collection.urlBuilder().withParams(b),this.isNew()||(a=a.addPathComponents(this.get("id"))),a.build();var d=k.parse(c.Model.prototype.url.apply(this,arguments));Object.keys(b).forEach(function(a){return d.addQueryParam(a,
b[a])});return d.toString()},forEachCommentInThread:function(b){b(this);g.each(this.get("comments"),function(a){a.forEachCommentInThread(b)})},sync:function(b,a,c){return h.sync(b,a,g.extend(c,{statusCode:{404:function(c,f,g,e,h){if((c=e&&e.errors&&e.errors.length&&e.errors[0])&&c.message&&/comment/i.test(c.message)){if("create"===b&&null!=a.get("parent"))return{title:d.I18n.getText("bitbucket.web.comment.notfound"),message:d.I18n.getText("bitbucket.web.comment.reply.parent.notfound.message"),shouldReload:!0,
fallbackUrl:void 0};if("update"===b)return{title:d.I18n.getText("bitbucket.web.comment.notfound"),message:d.I18n.getText("bitbucket.web.comment.update.notfound.message"),shouldReload:!0,fallbackUrl:void 0}}}}}))}});c.Mixins.applyMixin(f,{namedAttributes:{comments:[f]}});return f});