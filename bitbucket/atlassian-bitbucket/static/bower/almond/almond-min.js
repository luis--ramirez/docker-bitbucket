/*
 almond 0.3.0 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 Available via the MIT or new BSD license.
 see: http://github.com/jrburke/almond for details
*/
var requirejs,require,define;
(function(k){function u(a,b){var c,q,f,h,e,d,m,n,k,r=b&&b.split("/"),g=l.map,p=g&&g["*"]||{};if(a&&"."===a.charAt(0))if(b){r=r.slice(0,r.length-1);a=a.split("/");e=a.length-1;l.nodeIdCompat&&z.test(a[e])&&(a[e]=a[e].replace(z,""));a=r.concat(a);for(e=0;e<a.length;e+=1)if(c=a[e],"."===c)a.splice(e,1),--e;else if(".."===c)if(1!==e||".."!==a[2]&&".."!==a[0])0<e&&(a.splice(e-1,2),e-=2);else break;a=a.join("/")}else 0===a.indexOf("./")&&(a=a.substring(2));if((r||p)&&g){c=a.split("/");for(e=c.length;0<
e;--e){q=c.slice(0,e).join("/");if(r)for(k=r.length;0<k;--k)if(f=g[r.slice(0,k).join("/")])if(f=f[q]){h=f;d=e;break}if(h)break;!m&&p&&p[q]&&(m=p[q],n=e)}!h&&m&&(h=m,d=n);h&&(c.splice(0,d,h),a=c.join("/"))}return a}function A(a,b){return function(){var c=C.call(arguments,0);"string"!==typeof c[0]&&1===c.length&&c.push(null);return g.apply(k,c.concat([a,b]))}}function D(a){return function(b){return u(b,a)}}function E(a){return function(b){d[a]=b}}function v(a){if(n.call(p,a)){var b=p[a];delete p[a];
x[a]=!0;w.apply(k,b)}if(!n.call(d,a)&&!n.call(x,a))throw Error("No "+a);return d[a]}function B(a){var b,c=a?a.indexOf("!"):-1;-1<c&&(b=a.substring(0,c),a=a.substring(c+1,a.length));return[b,a]}function F(a){return function(){return l&&l.config&&l.config[a]||{}}}var w,g,y,t,d={},p={},l={},x={},n=Object.prototype.hasOwnProperty,C=[].slice,z=/\.js$/;y=function(a,b){var c,d=B(a),f=d[0];a=d[1];f&&(f=u(f,b),c=v(f));f?a=c&&c.normalize?c.normalize(a,D(b)):u(a,b):(a=u(a,b),d=B(a),f=d[0],a=d[1],f&&(c=v(f)));
return{f:f?f+"!"+a:a,n:a,pr:f,p:c}};t={require:function(a){return A(a)},exports:function(a){var b=d[a];return"undefined"!==typeof b?b:d[a]={}},module:function(a){return{id:a,uri:"",exports:d[a],config:F(a)}}};w=function(a,b,c,q){var f,h,e,g,m=[];h=typeof c;var l;q=q||a;if("undefined"===h||"function"===h){b=!b.length&&c.length?["require","exports","module"]:b;for(g=0;g<b.length;g+=1)if(e=y(b[g],q),h=e.f,"require"===h)m[g]=t.require(a);else if("exports"===h)m[g]=t.exports(a),l=!0;else if("module"===
h)f=m[g]=t.module(a);else if(n.call(d,h)||n.call(p,h)||n.call(x,h))m[g]=v(h);else if(e.p)e.p.load(e.n,A(q,!0),E(h),{}),m[g]=d[h];else throw Error(a+" missing "+h);b=c?c.apply(d[a],m):void 0;a&&(f&&f.exports!==k&&f.exports!==d[a]?d[a]=f.exports:b===k&&l||(d[a]=b))}else a&&(d[a]=c)};requirejs=require=g=function(a,b,c,d,f){if("string"===typeof a)return t[a]?t[a](b):v(y(a,b).f);if(!a.splice){l=a;l.deps&&g(l.deps,l.callback);if(!b)return;b.splice?(a=b,b=c,c=null):a=k}b=b||function(){};"function"===typeof c&&
(c=d,d=f);d?w(k,a,b,c):setTimeout(function(){w(k,a,b,c)},4);return g};g.config=function(a){return g(a)};requirejs._defined=d;define=function(a,b,c){b.splice||(c=b,b=[]);n.call(d,a)||n.call(p,a)||(p[a]=[a,b,c])};define.amd={jQuery:!0}})();