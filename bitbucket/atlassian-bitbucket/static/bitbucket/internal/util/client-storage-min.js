define("bitbucket/internal/util/client-storage",["jquery","lodash","bitbucket/internal/model/page-state","bitbucket/internal/util/feature-detect","exports"],function(v,g,f,p,b){function k(a,d){var c,q;c=p.localStorage()?window[(d||e.LOCAL)+"Storage"].getItem(a):g.has(h,a)?h[a]:null;try{q=JSON.parse(c)}catch(b){q=c}return q}function r(a,d){var c=k(a,d);return v.isPlainObject(c)&&g.has(c,"data")?c.data:c}function l(a,d,c){if(p.localStorage())try{window[(c||e.LOCAL)+"Storage"].setItem(a,JSON.stringify(d))}catch(b){if(22===
b.code||1014===b.code)console.warn("WARN: Ran out of space in localStorage"),m()&&l(a,d,c);else throw b;}else h[a]=JSON.stringify(d)}function t(a,d,c,b){d=g.extend({},c,{timestamp:(new Date).getTime(),data:d});l(a,d,b);b&&b!==e.LOCAL||g.defer(w)}function n(a,d){p.localStorage()?window[(d||e.LOCAL)+"Storage"].removeItem(a):delete h[a]}function u(a){n("_flash."+a,e.SESSION)}function w(){if(!k("hasCheckedCleanUp",e.SESSION)){var a=k("lastCleanup");(!a||24192E5<(new Date).getTime()-a)&&m();l("hasCheckedCleanUp",
!0,e.SESSION)}}function m(a){a=a||24192E5;var d=(new Date).getTime(),b=Object.keys(localStorage).length;Object.keys(localStorage).forEach(function(b){if("lastCleanup"!==b){var c=k(b);c&&c.timestamp&&!c.noCleanup&&d-c.timestamp>a&&n(b)}});l("lastCleanup",(new Date).getTime());b-=Object.keys(localStorage).length;return!b&&6048E5<=a-6048E5?m(a-6048E5):b}var e={SESSION:"session",LOCAL:"local"},h={};b._resetDummy=function(){h={}};b._doCleanup=m;b.LOCAL=e.LOCAL;b.SESSION=e.SESSION;b.buildKey=function(a,
b){g.isString(a)&&(a=[a]);if(!g.isArray(a))throw Error("keyBuilder requires an array of components");if(b)switch(a.push(b),b){case "pull-request":a.push(f.getPullRequest()&&f.getPullRequest().getId());case "repo":a.push(f.getRepository()&&f.getRepository().getSlug());case "project":a.push(f.getProject()&&f.getProject().getKey());case "user":a.push(f.getCurrentUser()&&f.getCurrentUser().getName())}return a.join("_")};b.getItem=r;b.getFlashItem=function(a){var b=r("_flash."+a,e.SESSION);u(a);return b};
b.getSessionItem=function(a){return r(a,e.SESSION)};b.setItem=t;b.setFlashItem=function(a,b,c){t.call(this,"_flash."+a,b,c,e.SESSION)};b.setSessionItem=function(a,b,c){t.call(this,a,b,c,e.SESSION)};b.removeItem=n;b.removeFlashItem=u;b.removeSessionItem=function(a){n(a,e.SESSION)}});