define("bitbucket/internal/feature/admin/db/editDbConfig",["aui","jquery","lodash","exports"],function(b,g,l,d){function n(b,c){var h=c.defaults;l.forEach(b.defaults,function(b,a){var e=g("#"+a);e.val()===b&&e.val(h[a]||"")})}d.onReady=function(d){var c=g("#type"),h={};l.forEach(d,function(a){h[a.key]=a});var m=h[c.val()];c.on("change",function(){var a=h[g(this).val()],e=g("#database").closest(".field-group"),f=e.children("label"),c=f.children(),e=e.children(".description"),d,k;a.usesSid?(d=b.I18n.getText("bitbucket.web.admin.db.service.label"),
k=b.I18n.getText("bitbucket.web.admin.db.service.description")):(d=b.I18n.getText("bitbucket.web.admin.db.database.label"),k=b.I18n.getText("bitbucket.web.admin.db.database.description"));f.text(d).append(c);e.text(k);n(m,a);f=g("#type").closest(".field-group");c=f.parent();f.find(".help-url").attr("href",a.helpUrl);f.find(".driver-unavailable").toggleClass("hidden",a.driverAvailable||!a.dcSupported);f.find(".not-clusterable").toggleClass("hidden",a.dcSupported).find(".not-clusterable-database").text(a.displayName);
c.find("input").add(g("#test,#submit")).toggleClass("disabled",!(a.dcSupported&&a.driverAvailable)).prop("disabled",!(a.dcSupported&&a.driverAvailable));m=a})}});