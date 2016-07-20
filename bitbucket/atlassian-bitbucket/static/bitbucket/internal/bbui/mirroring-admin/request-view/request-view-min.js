define("bitbucket/internal/bbui/mirroring-admin/request-view/request-view","module exports aui aui/flag jquery lodash bitbucket/internal/impl/request ../../widget/widget ../nav-builder".split(" "),function(m,f,g,n,p,q,r,t,h){Object.defineProperty(f,"__esModule",{value:!0});var d=babelHelpers.interopRequireDefault(g),k=babelHelpers.interopRequireDefault(n),l=babelHelpers.interopRequireDefault(p),u=babelHelpers.interopRequireDefault(q),v=babelHelpers.interopRequireDefault(r);g=babelHelpers.interopRequireDefault(t);
var w=babelHelpers.interopRequireDefault(h);h=function(f){function e(c,a){babelHelpers.classCallCheck(this,e);var b=babelHelpers.possibleConstructorReturn(this,Object.getPrototypeOf(e).call(this,a));b.$el=(0,l.default)(c);b.$el.html(bitbucket.internal.component.mirroringAdmin.requestView.main(a));b.item=a.item;b.$el.find("#approve-mirror-button").on("click",b.approveMirrorButtonClicked);b.$el.find("#decline-mirror-button").on("click",b.declineMirrorButtonClicked);return b}babelHelpers.inherits(e,
f);babelHelpers.createClass(e,[{key:"destroy",value:function(){babelHelpers.get(Object.getPrototypeOf(e.prototype),"destroy",this).call(this);this.$el.empty();this.item=this.$el=null}},{key:"approveMirrorButtonClicked",value:function(c){c.preventDefault();this.resolveRequest("accept",this.$el.find("#all-projects-radio").is(":checked")?"all_projects":"selected_projects")}},{key:"confirmDeclineMirror",value:function(){var c=this,a=(0,l.default)(bitbucket.internal.component.mirroringAdmin.requestView.declineDialog({mirrorName:this.item.mirrorName}));
this.$el.append(a);var b=d.default.dialog2("#decline-mirror-request-dialog");b.on("hide",function(){a.remove()});a.find("#dialog-decline-button").click(function(){c.resolveRequest("reject");b.hide()});a.find("#dialog-cancel-button").click(function(){return b.hide()});b.show()}},{key:"declineMirrorButtonClicked",value:function(c){c.preventDefault();this.confirmDeclineMirror()}},{key:"resolveRequest",value:function(c,a){var b=this,d=this.item.id;this._showSpinner();v.default.rest({type:"POST",url:w.default.rest().mirroring().path("requests",
d,c).params(a?{mirroringMode:a}:null).build(),statusCode:{"*":!1}}).done(function(a){b._mirrorRequestActionSuccess(c);b.trigger("request-resolved",{id:d,type:"request",resolution:c,responseJSON:a})}).fail(function(a){var d=u.default.get(a,"responseJSON.errors");if(d)return b._mirrorRequestActionFailed(c,d);throw a;}).always(this._stopSpinner)}},{key:"_mirrorRequestActionFailed",value:function(c,a){var b=this.item.mirrorName;(0,k.default)({type:"error",title:"accept"===c?d.default.I18n.getText("bitbucket.component.mirroring.admin.request.view.flags.request.approve.failure",
b):d.default.I18n.getText("bitbucket.component.mirroring.admin.request.view.flags.request.reject.failure",b),body:a.map(function(a){return d.default.escapeHtml(a.message)}).join(",")})}},{key:"_mirrorRequestActionSuccess",value:function(c){var a=this.item.mirrorName;(0,k.default)({type:"success",title:"accept"===c?d.default.I18n.getText("bitbucket.component.mirroring.admin.request.view.flags.request.approve.success",a):d.default.I18n.getText("bitbucket.component.mirroring.admin.request.view.flags.request.reject.success",
a),persistent:!1,close:"auto",body:""})}},{key:"_showSpinner",value:function(){d.default.$("#mirror-action-button-spinner").spin()}},{key:"_stopSpinner",value:function(){d.default.$("#mirror-action-button-spinner").spinStop()}}]);return e}(g.default);f.default=h;m.exports=f["default"]});