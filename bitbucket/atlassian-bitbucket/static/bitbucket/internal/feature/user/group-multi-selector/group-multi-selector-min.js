define("bitbucket/internal/feature/user/group-multi-selector",["aui","jquery","bitbucket/util/navbuilder","bitbucket/internal/widget/searchable-multi-selector"],function(b,f,g,d){function c(a){return"string"===typeof a?a:a.name}function e(a,b){d.call(this,a,b)}f.extend(!0,e.prototype,d.prototype,{defaults:{hasAvatar:!0,url:g.rest().groups().build(),selectionTemplate:function(a){return bitbucket.internal.widget.groupAvatarWithName({size:"xsmall",name:c(a)})},resultTemplate:function(a){return bitbucket.internal.widget.groupAvatarWithName({size:"small",
name:c(a)})},generateId:c,generateText:c,inputTooShortTemplate:function(){return b.escapeHtml(b.I18n.getText("bitbucket.web.group.multi.selector.help"))},noMatchesTemplate:function(){return b.escapeHtml(b.I18n.getText("bitbucket.web.group.multi.selector.no.match"))}}});return e});