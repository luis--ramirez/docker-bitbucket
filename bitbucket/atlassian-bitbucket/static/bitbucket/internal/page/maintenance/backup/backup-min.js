define("bitbucket/internal/page/maintenance/backup",["aui","bitbucket/util/navbuilder","bitbucket/internal/layout/maintenance","exports"],function(a,c,d,e){e.onReady=function(b){b={redirectUrl:b?c.admin().build():c.allProjects().build(),canceledHeader:a.I18n.getText("bitbucket.web.backup.canceled.title"),cancelingDescription:a.I18n.getText("bitbucket.web.backup.canceling.description"),cancelDialogTitle:a.I18n.getText("bitbucket.web.backup.dialog.title"),cancelDialogDescription:a.I18n.getText("bitbucket.web.backup.dialog.description"),
cancelDialogButtonText:a.I18n.getText("bitbucket.web.backup.dialog.cancel")};d.init(b)}});