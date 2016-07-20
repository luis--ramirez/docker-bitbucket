define("bitbucket/internal/bbui/mirroring-admin/mirror-view/mirror-view","module exports aui aui/flag jquery lodash bitbucket/internal/impl/request ../../widget/widget ../nav-builder".split(" "),function(q,f,h,r,t,u,v,w,k){Object.defineProperty(f,"__esModule",{value:!0});var g=babelHelpers.interopRequireDefault(h),l=babelHelpers.interopRequireDefault(r),e=babelHelpers.interopRequireDefault(t),m=babelHelpers.interopRequireDefault(u),n=babelHelpers.interopRequireDefault(v);h=babelHelpers.interopRequireDefault(w);
var p=babelHelpers.interopRequireDefault(k);k=function(f){function d(a,c){babelHelpers.classCallCheck(this,d);var b=babelHelpers.possibleConstructorReturn(this,Object.getPrototypeOf(d).call(this,c));b.$el=(0,e.default)(a);b.$el.html(bitbucket.internal.component.mirroringAdmin.mirrorView.main(c));b.$panel=b.$el.find("#mirror-details-panel");b.mirror=b.options.item;b.init();return b}babelHelpers.inherits(d,f);babelHelpers.createClass(d,[{key:"destroy",value:function(){babelHelpers.get(Object.getPrototypeOf(d.prototype),
"destroy",this).call(this);this.loadingPanelRequest&&(this.loadingPanelRequest.abort(),delete this.loadingPanelRequest);this._cancelLoadingTimer();this.$el.empty();delete this.$el}},{key:"init",value:function(){var a=this;(0,e.default)("#mirror-remove-button").on("click",this.showRemoveMirrorDialog);this.$panel.on("click","#mirror-reload",function(c){c.preventDefault();a.showMirrorPanel()});this.showMirrorPanel()}},{key:"showRemoveMirrorDialog",value:function(){var a=this,c=(0,e.default)(bitbucket.internal.component.mirroringAdmin.mirrorView.deleteDialog({mirrorName:this.mirror.name}));
this.$el.append(c);var b=g.default.dialog2("#delete-mirror-dialog");b.on("hide",function(){c.remove()});c.find("#dialog-delete-button").click(function(){a.removeMirror();b.hide()});c.find("#dialog-cancel-button").click(function(){return b.hide()});b.show()}},{key:"showMirrorPanel",value:function(){var a=this;this._delayShowLoadingSpinner();this.loadingPanelRequest=n.default.rest({type:"GET",dataType:"html",url:p.default.rest().mirroring().panel(this.mirror.id).build(),statusCode:{"*":!1}}).always(function(){a._hideLoadingSpinner();
delete a.loadingPanelRequest}).done(function(c){a.$panel.html(c)}).fail(function(c,b){"abort"!==b&&a._renderErrorView()})}},{key:"removeMirror",value:function(){var a=this;d._showRemoveSpinner();n.default.rest({type:"DELETE",url:p.default.rest().mirroring().path("mirrorServers",this.mirror.id).build(),statusCode:{409:!1}}).done(function(c){a._removeMirrorSuccessful();a.trigger("mirror-removed",{id:a.mirror.id,type:"mirror",responseJSON:c})}).fail(function(c){var b=m.default.get(c,"responseJSON.errors");
if(b)return a._removeMirrorFailed(b);throw c;}).always(d._stopRemoveSpinner)}},{key:"_removeMirrorFailed",value:function(a){(0,l.default)({type:"error",title:g.default.I18n.getText("bitbucket.component.mirroring.admin.mirror.remove.failure",this.mirror.name),body:a.map(function(a){return g.default.escapeHtml(a.message)}).join(",")})}},{key:"_removeMirrorSuccessful",value:function(){(0,l.default)({type:"success",title:g.default.I18n.getText("bitbucket.component.mirroring.admin.mirror.remove.success",
this.mirror.name),persistent:!1,close:"auto",body:""})}},{key:"_renderErrorView",value:function(){this.$panel.html(bitbucket.internal.component.mirroringAdmin.mirrorView.mirrorConnectionError())}},{key:"_delayShowLoadingSpinner",value:function(){var a=this;this.loadingSpinnerTimer=window.setTimeout(function(){a.$panel.html(bitbucket.internal.component.mirroringAdmin.mirrorView.loading());a.$panel.find("#mirror-loading").spin("large");delete a.loadingSpinnerTimer},500)}},{key:"_hideLoadingSpinner",
value:function(){this.$panel.find("#mirror-loading").spinStop();this._cancelLoadingTimer()}},{key:"_cancelLoadingTimer",value:function(){m.default.isNumber(this.loadingSpinnerTimer)&&(window.clearTimeout(this.loadingSpinnerTimer),delete this.loadingSpinnerTimer)}}],[{key:"_showRemoveSpinner",value:function(){(0,e.default)("#mirror-remove-button").addClass("hidden");(0,e.default)("#mirror-remove-button-spinner").removeClass("hidden").spin()}},{key:"_stopRemoveSpinner",value:function(){(0,e.default)("#mirror-remove-button").removeClass("hidden");
(0,e.default)("#mirror-remove-button-spinner").addClass("hidden").spinStop()}}]);return d}(h.default);f.default=k;q.exports=f["default"]});