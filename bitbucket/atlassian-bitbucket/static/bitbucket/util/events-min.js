define("bitbucket/util/events",["eve"],function(c){return{trigger:function(a,b){return c.apply(this,arguments)},on:function(a,b){return c.on(a,b)},off:function(a,b){return c.off(a,b)},once:function(a,b){return c.once(a,b)},listeners:function(a){return c.listeners(a)},name:function(a){return c.nt(a)},chain:function(){return this.chainWith(this)},chainWith:function(a){var b=[];return{on:function(e,c){var d=arguments;a.on.apply(a,d);b.push(function(){a.off.apply(a,d)});return this},once:function(e,c){var d=
function f(){a.off(e,f);return c.apply(this,arguments)};a.on(e,d);b.push(function(){a.off(e,d)});return this},destroy:function(){for(var a=0;a<b.length;a++)b[a]();b=[]}}}}});