define("bitbucket/internal/page/upgrade-onboarding",["aui","lib/jsuri","lodash","exports"],function(b,c,d,a){a.onReady=function(){var a=d.endsWith(c(document.referrer).path(),"/login");b.trigger("analyticsEvent",{name:"stash.page.upgradeonboarding.visited",data:{origin:a?"login redirect":"direct link"}})}});