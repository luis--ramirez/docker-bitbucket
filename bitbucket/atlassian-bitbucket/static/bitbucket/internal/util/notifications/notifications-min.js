define("bitbucket/internal/util/notifications",["aui/flag","jquery","lodash","bitbucket/internal/util/client-storage","exports"],function(g,h,k,d,b){function l(){var a=d.getFlashItem("page-load-notifications");d.removeFlashItem("page-load-notifications");return a}function m(a,e){a.body+=bitbucket.internal.util.notifications.closePollingFlag();var c=g(a);h(c).find(".close").on("click",function(){c.close();a.closed=!0;d.setItem(e,a)})}b.addFlash=function(a,e){var c=l()||[];e=e||{};c.push({title:a,body:e.body,
type:e.type||"success",close:e.close||"auto"});c&&c.length?d.setFlashItem("page-load-notifications",c):d.removeFlashItem("page-load-notifications")};b.showOnReady=function(a){(a.title||a.body)&&h(document).ready(function(){g(a)})};b.showFlashes=function(){k.each(b._drainNotifications(),function(a){g(a)})};var f=Array.isArray(d.getItem("page-load-notifications-polling-names"))&&d.getItem("page-load-notifications-polling-names")||[];b._clearPollingNotifications=function(a){a.forEach(function(a){d.removeItem("page-load-notifications-polling-"+
a)})};setTimeout(function(){b._clearPollingNotifications(f)},5E3);b.polling=function(a,e){var c=f.indexOf(a);0>c?(f.push(a),d.setItem("page-load-notifications-polling-names",f)):f.splice(c,1);var c="page-load-notifications-polling-"+a,b=d.getItem(c);b||(b=k.extend(e,{closed:!1}),d.setItem(c,b));b.closed||m(b,c)};b._drainNotifications=function(){return l()}});