define("bitbucket/internal/page/admin/usersList",["aui","bitbucket/internal/feature/user/user-table","bitbucket/internal/util/notifications","bitbucket/internal/widget/delete-dialog","exports"],function(b,d,c,e,a){a.onReady=function(a,f){c.showFlashes();(new d({target:a})).init();e.bind(f,b.I18n.getText("bitbucket.web.user.delete"),b.I18n.getText("bitbucket.web.user.delete.success"),b.I18n.getText("bitbucket.web.user.delete.fail"),function(a){c.addFlash(b.I18n.getText("bitbucket.web.user.delete.success",
a));location.reload()})}});