define("bitbucket/internal/feature/inbox","aui jquery lodash bitbucket/util/events bitbucket/util/navbuilder bitbucket/util/server bitbucket/util/state exports".split(" "),function(e,d,g,b,n,p,h,q){function r(a){require("bitbucket/internal/feature/inbox-dialog").onReady(a[0])}var f,c,k=function(a){a.keyCode===d.ui.keyCode.ESCAPE&&(f.hide(),a.preventDefault())},l=function(){f.hide()},u=function(a,c,b){b();d(document).on("keyup",k);e.dialog2.on("show",l);d(".aui-dropdown2-active").trigger("aui-button-invoke");
t(a,g.partial(r,a))},t=g.once(function(a,c){var b=d('\x3cdiv class\x3d"loading-resource-spinner"\x3e\x3c/div\x3e');a.empty().append(b);b.show().spin("medium");WRM.require("wrc!bitbucket.pullRequest.inbox").done(function(){b.spinStop().remove();c()}).always(function(){b.spinStop().remove()})}),v=function(){d(document).off("keyup",k);e.dialog2.off("show",l);d(document.activeElement).closest("#inline-dialog-inbox-pull-requests-content").length&&document.activeElement.blur()},m=function(){p.rest({url:n.rest().addPathComponents("inbox",
"pull-requests","count").build(),type:"GET",statusCode:{"*":!1}}).done(function(a){if(0<a.count){var b=d(aui.badges.badge({text:a.count}));c.html(bitbucket.internal.inbox.triggerIcon({isEmpty:!1})).append(b);setTimeout(function(){b.addClass("visible")},0)}else c.find(".aui-badge").removeClass("visible"),setTimeout(function(){c.html(bitbucket.internal.inbox.triggerIcon({isEmpty:!0}))},500);c.attr("data-countLoaded",!0)})};q.onReady=function(){c=d("#inbox-trigger");if(c.length&&h.getCurrentUser()){c.html(bitbucket.internal.inbox.triggerIcon({isEmpty:!0}));
f=e.InlineDialog(c,"inbox-pull-requests-content",u,{width:800,closeOnTriggerClick:!0,hideCallback:v});m();var a=function(a){a.user.name===h.getCurrentUser().name&&m()};b.on("bitbucket.internal.widget.approve-button.added",a);b.on("bitbucket.internal.widget.approve-button.removed",a);b.on("bitbucket.internal.widget.needs-work.added",a);b.on("bitbucket.internal.widget.needs-work.removed",a);b.on("bitbucket.internal.feature.pullRequest.self.added",a);b.on("bitbucket.internal.feature.pullRequest.self.removed",
a)}}});jQuery(document).ready(function(){require("bitbucket/internal/feature/inbox").onReady()});