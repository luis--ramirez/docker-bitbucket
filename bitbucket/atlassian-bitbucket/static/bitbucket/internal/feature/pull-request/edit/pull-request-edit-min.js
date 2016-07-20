define("bitbucket/internal/feature/pull-request-edit","aui jquery lodash bitbucket/util/navbuilder bitbucket/internal/feature/repository/branch-selector bitbucket/internal/feature/user/user-multi-selector bitbucket/internal/model/revision-reference bitbucket/internal/util/ajax bitbucket/internal/util/client-storage bitbucket/internal/util/dom-event bitbucket/internal/util/events bitbucket/internal/util/focus-snapshot bitbucket/internal/util/function bitbucket/internal/util/warn-before-unload bitbucket/internal/widget/markup-editor".split(" "),
function(d,g,c,t,u,v,w,x,l,y,m,r,z,A,n){function b(a,e){var f={width:800,height:350,id:"edit-pull-request-dialog",closeOnOutsideClick:!1,focusSelector:"#pull-request-description",keypressListener:c.bind(this.keypressListener,this)};this._pullRequest=a;this._currentReviewerUsers=this._pullRequest.getReviewers();this._opts=g.extend({},f,e);this._dialog=new d.Dialog(this._opts);this._dialogEl=g("#"+this._opts.id);this._isDisabled=!1;this._draftKey=l.buildKey("draft-description","pull-request");this.initDialog()}
function B(a){return{user:a}}function p(a){var e=c.pick(a,["title","description"]);c.has(a,"reviewers")&&(e.reviewers=c.chain(a.reviewers).map(z.dot("user.name")).sort().map(function(a){return{user:{name:a}}}).value());c.has(a,"toRef")&&(e.toRef={id:a.toRef.id});return e}b.prototype.keypressListener=function(a){a.stopImmediatePropagation();y.isCtrlish(a)&&a.which===d.keyCode.ENTER&&(a.preventDefault(),g(".button-panel-submit-button",this._dialogEl).click());27===a.keyCode&&this._dialogEl.is(":visible")&&
!this._isDisabled&&(n.unbindFrom(this._dialog.getCurrentPanel().body),this.hide())};b.prototype.initDialog=function(){this._$buttonPanel=this._dialog.addHeader(d.I18n.getText("bitbucket.web.pullrequest.edit.header")).addPanel(d.I18n.getText("bitbucket.web.pullrequest.edit.header")).addSubmit(d.I18n.getText("bitbucket.web.button.save"),c.bind(this.save,this)).addCancel(d.I18n.getText("bitbucket.web.button.cancel"),c.bind(this.cancel,this)).getPage(0).buttonpanel;this._$spinner=g('\x3cdiv class\x3d"spinner"\x3e\x3c/div\x3e').prependTo(this._$buttonPanel);
this.triggerPanelResize=c.bind(this.triggerPanelResize,this);this._dialogEl.on("input","textarea#pull-request-description",this.updateDraftDescription.bind(this))};b.prototype.updateDraftDescription=c.debounce(function(a){(a=a.target.value)?l.setSessionItem(this._draftKey,a):this.deleteDraftDescription()},300);b.prototype.deleteDraftDescription=function(){l.removeSessionItem(this._draftKey)};b.prototype.populatePanelFromPullRequest=function(){var a=l.getSessionItem(this._draftKey);this.updatePanel({title:this._pullRequest.getTitle(),
description:a||this._pullRequest.getDescription(),toRef:c.extend({type:w.type.BRANCH},this._pullRequest.getToRef().toJSON()),reviewers:this._currentReviewerUsers.map(function(a){return a.getUser().toJSON()})},!!a)};b.prototype.triggerPanelResize=function(){var a=this._dialog.isMaximised(),e=this._dialog.getCurrentPanel().body,e=e.innerHeight()>=e.get(0).scrollHeight;a&&!e||c.defer(c.bind(function(){this.isVisible()&&(r.save(),this._dialog.updateHeight(),r.restore())},this))};b.prototype.updatePanel=
function(a,e){var f=this._dialog.getCurrentPanel().body;a.reviewers.length&&a.reviewers[0].user&&(a.reviewers=c.pluck(a.reviewers,"user"));f.empty().append(bitbucket.internal.feature.pullRequest.edit(a));if(e)f.find("textarea#pull-request-description").addClass("restored").attr("title",d.I18n.getText("bitbucket.web.pullrequest.edit.description.restored")).one("click keydown input",function(a){g(a.target).removeClass("restored").removeAttr("title")});this.userSelect=new v(f.find("#reviewers"),{initialItems:a.reviewers,
excludedItems:[this._pullRequest.getAuthor().getUser().toJSON()],urlParams:{"permission.1":"LICENSED_USER","permission.2":"REPO_READ","permission.2.repositoryId":this._pullRequest.getToRef().getRepository().getId()}});var b=f.find("#toRef");this.branchSelector=new u(b,{id:"toRef-dialog",repository:this._pullRequest.getToRef().getRepository(),field:b.next("input")});n.bindTo(f).on("resize",this.triggerPanelResize.bind(this));this.triggerPanelResize()};b.prototype.getPullRequestUpdateFromForm=function(a){return{title:a.find("#title").val(),
description:a.find("#pull-request-description").val(),reviewers:c.map(this.userSelect.getSelectedItems(),B),toRef:this.branchSelector.getSelectedItem().toJSON(),version:this._pullRequest.getVersion()}};b.prototype.mergePullRequestUpdate=function(a,e,f){var b=e.version;a=p(a);e=p(e);f=p(f);var d=c.reduce(c.keys(f),function(b,d){if(!b)return null;var g=e[d],k=f[d];if(c.isEqual(g,k))return b;var h=a[d];return c.isEqual(h,k)?b:c.isEqual(h,g)?(b[d]=k,b):null},c.merge({},e));d&&(d.version=b);return d};
b.prototype.save=function(a,e){if(!this._isDisabled){var b=this.getPullRequestUpdateFromForm(e.getCurrentPanel().body.find("form"));if(b.title)return this._$spinner.show().spin("small"),this.toggleDisabled(!0),this._doSave(b);var c=d.I18n.getText("bitbucket.web.pullrequest.edit.no.title");this.updatePanel(g.extend({fieldErrors:{title:[c]}},b))}};b.prototype._doSave=function(a){var b=this,f=x.rest({url:t.rest().currentPullRequest().withParams({avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"xsmall"})}).build(),
type:"PUT",data:a,statusCode:{400:!1,409:!1}});A(f,d.I18n.getText("bitbucket.web.pullrequest.pending.request",bitbucket.internal.util.productName()));f.done(function(a){b.deleteDraftDescription();window.location.reload()});f.fail(function(f,l,n,q,p){var k=[],h={},m;if(1===q.errors.length&&"com.atlassian.bitbucket.pull.PullRequestOutOfDateException"===q.errors[0].exceptionName&&(f=b.mergePullRequestUpdate(b._pullRequest.toJSON(),q.errors[0].pullRequest,a))){b._doSave(f);return}c.each(q.errors,function(a){a.context?
(Object.prototype.hasOwnProperty.call(h,a.context)||(h[a.context]=[]),"reviewers"===a.context?(h[a.context]=c.pluck(a.reviewerErrors,"message"),k.push(a),m=a.validReviewers):h[a.context].push(a.message)):("com.atlassian.bitbucket.pull.PullRequestOutOfDateException"===a.exceptionName&&(a.messageContent=d.escapeHtml(a.message)+" \x3ca href\x3d'"+window.location.href.split("#")[0]+"'\x3e"+d.escapeHtml(d.I18n.getText("bitbucket.web.reload"))+"\x3c/a\x3e."),k.push(a))});b.updatePanel(g.extend({errors:k,
fieldErrors:h},a,{reviewers:m}));b._$spinner.spinStop().hide();b.toggleDisabled(!1)})};b.prototype.toggleDisabled=function(a){void 0===("undefined"===typeof a?"undefined":babelHelpers.typeof(a))&&(a=!this._isDisabled);this._$buttonPanel.toggleClass("disabled",a);this._$buttonPanel.find("button")[a?"attr":"removeAttr"]("disabled","disabled");this._dialog[a?"disable":"enable"]();this._isDisabled=a};b.prototype.cancel=function(){this._isDisabled||(n.unbindFrom(this._dialog.getCurrentPanel().body),this.deleteDraftDescription(),
this.hide())};b.prototype.isVisible=function(){return this._dialogEl.is(":visible")};b.prototype.show=function(){this.populatePanelFromPullRequest();this._dialog.show();m.on("window.resize.debounced",this.triggerPanelResize)};b.prototype.hide=function(){document.activeElement.blur();this._dialog.hide();m.off("window.resize.debounced",this.triggerPanelResize)};b.prototype.bind=function(a){var b=this;g(document).on("click",a,function(a){a.preventDefault();b.show()})};return b});