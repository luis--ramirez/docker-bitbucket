var _PageDataPlugin=function(){function k(){e.each(f,function(a,d){e.each(d,function(b,c){c.reject(h[a]?Error("Provider "+a+" not included with context "+b):Error("Provider "+a+" not included on page."))})})}var l=Object.prototype.hasOwnProperty,e=jQuery,h={},f={};e(document).ready(k);return{load:function(a,d){for(var b in d)if(l.call(d,b)){var c=f[b]||(f[b]={}),c=c[a]||(c[a]=e.Deferred()),g=h[b]||(h[b]={});g[a]=d[b];if("pending"!==c.state())throw Error("Attempt to set context "+a+" for plugin key "+
b+" multiple times.");c.resolve(g[a])}},data:h,ready:function(a,d){var b=Array.prototype.slice.call(arguments,2),c=f[a]||(f[a]={}),g=c[d]||(c[d]=e.Deferred());b.forEach(function(a){g.done(a)});return g},_domReady:k}}();