define("bitbucket/internal/page/admin/mailServer",["aui","jquery","bitbucket/internal/util/notifications","bitbucket/internal/widget/confirm-dialog","exports"],function(c,a,g,l,f){f.onReady=function(f,m,n,p,b,q){g.showFlashes();var h=a(b);h.click(function(){var k=a(this),b=a("\x3cdiv class\x3d'spinner'\x3e\x3c/div\x3e");k.nextAll().remove();k.after(b);b.spin()});a(q).keypress(function(a){13===a.which&&(a.preventDefault(),h.click())});b=bitbucket.internal.widget.paragraph({text:c.I18n.getText("bitbucket.web.mailserver.delete.confirm")});
b=new l({id:"delete-mail-sever-config-dialog",titleText:c.I18n.getText("bitbucket.web.mailserver.delete.config"),titleClass:"warning-header",panelContent:b,submitText:c.I18n.getText("bitbucket.web.button.delete")},{type:"DELETE"});b.attachTo(p);b.addConfirmListener(function(a){a.done(function(a){g.addFlash(c.I18n.getText("bitbucket.web.config.mail.deleted"),{type:"info"});window.location.reload()})});a("#password").on("input",function(){a("#passwordChanged").val("true")});var d=a(n),e=a(m);a(f).on("change",
function(){"SMTP"===this.value?(e.prop({disabled:!1}),d.prop({disabled:!1})):(e.prop({checked:!0,disabled:!0}),d.prop({checked:!0,disabled:!0}))});e.on("change",function(){this.checked||d.prop({checked:!1})});d.on("change",function(){this.checked&&e.prop({checked:!0})})}});