define("bitbucket/internal/page/branches","aui jquery bitbucket/util/navbuilder bitbucket/internal/feature/repository/branch-table bitbucket/internal/model/revision-reference bitbucket/internal/page/branches/branches-page-analytics bitbucket/internal/util/ajax bitbucket/internal/util/events bitbucket/internal/util/history bitbucket/internal/widget/error-dialog exports".split(" "),function(g,h,l,m,n,p,q,d,k,r,t){function e(b){return l.currentRepo().branches(b).build()}function u(b){var a=g.I18n.getText("bitbucket.web.unknownerror");
b.errors.length&&(a=b.errors[0]&&b.errors[0].message);b=new r({panelContent:bitbucket.internal.widget.paragraph({text:a}),titleText:g.I18n.getText("bitbucket.web.branch.list.notfound")});c||(b.dialogOptions.okButtonText=g.I18n.getText("bitbucket.web.branch.list.back"));b.addOkListener(function(a){c?k.pushState(c,null,e(c)):window.location=e()});b.show();return h.Deferred()}function v(b){d.on("bitbucket.internal.page.branches.revisionRefRemoved",function(a){b.isCurrentBase(a)?window.location=e():b.remove(a)});
d.on("bitbucket.internal.layout.branch.revisionRefChanged",function(a){a=a.toJSON();k.pushState(a,null,e(a))});d.on("bitbucket.internal.history.changestate",function(a){if(a=a.state)c=b._baseRef,b.update(a),d.trigger("bitbucket.internal.page.branches.revisionRefChanged",null,new n(a))})}function w(b){b.initShortcuts();d.on("bitbucket.internal.widget.keyboard-shortcuts.register-contexts",function(a){a.enableContext("branch-list")})}var c,f;t.onReady=function(b,a,d,c){h(b).append(bitbucket.internal.feature.repository.branchTable({repository:d,
baseRef:c,id:a,filterable:!1}));f=new m({target:"#branch-list",filter:'input[data-for\x3d"branch-list"]',statusCode:q.ignore404WithinRepository(u)},c);f.init().then(p.bindAnalyticsEvents);v(f);w(f)}});