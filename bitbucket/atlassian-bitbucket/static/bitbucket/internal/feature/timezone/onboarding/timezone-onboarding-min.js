define("bitbucket/internal/feature/timezone/onboarding","aui aui/flag jquery bitbucket/util/navbuilder bitbucket/internal/model/page-state bitbucket/internal/util/ajax bitbucket/internal/util/client-storage bitbucket/internal/util/events bitbucket/internal/util/feature-enabled exports".split(" "),function(n,p,c,b,g,h,d,q,r,e){function f(a){q.trigger("bitbucket.internal.ui.time.zone.onboarding."+a)}function t(){f("changed");k().done(function(){e.navigate(b.newBuilder("account").build())})}function u(){var a=
d.getItem("bitbucket_known_time_zone_offset");return a?String(a):null}function v(){var a=g.getCurrentUser();return a?h.rest({url:b.rest().users(a.getSlug()).addPathComponents("settings").build(),type:"GET",statusCode:{"*":!1}}).then(function(a){a=a.USER_BROWSER_TIME_ZONE_OFFSET;d.setItem("bitbucket_known_time_zone_offset",a);return void 0!==a&&null!==a?String(a):null}):c.Deferred().reject().promise()}function l(a){return a!==String((new Date).getTimezoneOffset())}function k(){var a={};a.USER_BROWSER_TIME_ZONE_OFFSET=
String((new Date).getTimezoneOffset());return h.rest({url:b.rest().users(g.getCurrentUser().getSlug()).addPathComponents("settings").build(),type:"POST",data:a,statusCode:{"*":!1}}).done(function(){d.setItem("bitbucket_known_time_zone_offset",a.USER_BROWSER_TIME_ZONE_OFFSET)})}var m;r.getFromProvider("user.time.zone.onboarding").done(function(a){m=a});e.navigate=function(a){window.location.href=a};e.onReady=function(){if(m&&Number((new Date).getTimezoneOffset())!==Number(c("#content").attr("data-timezone"))&&
l(u()))return v().done(function(a){if(l(a)){f("shown");var b=p({type:"info",close:"manual",title:n.I18n.getText("bitbucket.web.timezone.onboarding.title"),body:bitbucket.internal.feature.timezone.onboarding.flagBody()});c("#time-zone-onboarding-change").one("click",t);c("#time-zone-onboarding-dismiss").one("click",function(){f("dismissed");k().always(function(){b.close()})})}})}});