define("bitbucket/internal/page/admin/db/migrate",["aui","jquery","exports"],function(d,a,f){function e(b){var c=a("#cancel");a("\x3cdiv class\x3d'next-text'\x3e\x3c/div\x3e").text(b).insertAfter(c);b=a("\x3cdiv class\x3d'next-spinner' /\x3e");b.insertAfter(c);b.spin("small");c.hide()}f.onReady=function(){a("#test").click(function(){e(d.I18n.getText("bitbucket.web.admin.database.migration.test"))});a("#submit").click(function(){e(d.I18n.getText("bitbucket.web.admin.database.migration.migrate"))})}});