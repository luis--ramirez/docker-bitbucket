define("bitbucket/internal/feature/watch","aui jquery lodash bitbucket/internal/model/page-state bitbucket/internal/util/ajax bitbucket/internal/util/events".split(" "),function(e,f,h,c,k,l){function a(a,d,m){var b=this;this.url=d;this.$watch=a;this.isWatching=c.getIsWatching();this.watchableType=m;this.$watch.on("click",function(a,g){a.preventDefault();var d=!b.isWatching;b.toggleTrigger(d);return k.rest({url:b.url,type:b.isWatching?"DELETE":"POST",statusCode:{401:function(a,b,g,d,c){return f.extend({},
c,{title:e.I18n.getText("bitbucket.web.watch.default.error.401.title"),message:e.I18n.getText("bitbucket.web.watch.default.error.401.message"),fallbackUrl:!1,shouldReload:!0})},409:function(a,b,g,d,c){return f.extend({},c,{title:e.I18n.getText("bitbucket.web.watch.default.error.409.title"),fallbackUrl:!1,shouldReload:!0})}}}).done(function(){b.isWatching=d;c.setIsWatching(d);var a=b.isWatching?"bitbucket.internal.web.watch-button.added":"bitbucket.internal.web.watch-button.removed",e=f.extend({watched:b.isWatching},
g);l.trigger(a,b,e)}).fail(function(){b.toggleTrigger(b.isWatching)})});h.bindAll(this,"toggleWatch","toggleUnwatch","toggleTrigger")}a.prototype.setIsWatching=function(a){this.toggleTrigger(a);this.isWatching=a;c.getIsWatching()!==a&&c.setIsWatching(a)};a.prototype.toggleWatch=function(){this.toggleTrigger(!0)};a.prototype.toggleUnwatch=function(){this.toggleTrigger(!1)};a.prototype.toggleTrigger=function(c){var d;switch(this.watchableType){case a.type.COMMIT:d=bitbucket.internal.feature.watch.commitLabel({isWatching:c});
break;case a.type.PULL_REQUEST:d=bitbucket.internal.feature.watch.pullRequestLabel({isWatching:c})}this.$watch.fadeOut(200,function(){f(this).html(d).fadeIn(200)})};a.prototype.destroy=function(){this.isWatching=this.$watch=this.url=null};a.type={COMMIT:"commit",PULL_REQUEST:"pull-request"};return a});