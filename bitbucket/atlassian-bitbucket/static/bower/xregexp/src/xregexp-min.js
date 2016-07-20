var XRegExp=function(n){function C(a,b,d,c,e){var g;a.xregexp={captureNames:b};if(e)return a;if(a.__proto__)a.__proto__=f.prototype;else for(g in f.prototype)a[g]=f.prototype[g];a.xregexp.source=d;a.xregexp.flags=c?c.split("").sort().join(""):c;return a}function y(a){return k.replace.call(a,/([\s\S])(?=[\s\S]*\1)/g,"")}function u(a,b){if(!f.isRegExp(a))throw new TypeError("Type RegExp expected");var d=a.xregexp||{},c=K?a.flags:k.exec.call(/\/([a-z]*)$/i,RegExp.prototype.toString.call(a))[1],e="",
g="",h=null,l=null;b=b||{};b.removeG&&(g+="g");b.removeY&&(g+="y");g&&(c=k.replace.call(c,new RegExp("["+g+"]+","g"),""));b.addG&&(e+="g");b.addY&&(e+="y");e&&(c=y(c+e));b.isInternalOnly||(void 0!==d.source&&(h=d.source),null!=d.flags&&(l=e?y(d.flags+e):d.flags));return a=C(new RegExp(a.source,c),a.xregexp&&a.xregexp.captureNames?d.captureNames.slice(0):null,h,l,b.isInternalOnly)}function v(a,b){var d=a.length,c;for(c=0;c<d;++c)if(a[c]===b)return c;return-1}function w(a,b){return D.call(a)==="[object "+
b+"]"}function E(a,b,d){return k.test.call(-1<d.indexOf("x")?/^(?:\s+|#.*|\(\?#[^)]*\))*(?:[?*+]|{\d+(?:,\d*)?})/:/^(?:\(\?#[^)]*\))*(?:[?*+]|{\d+(?:,\d*)?})/,a.slice(b))}function L(a,b){var d;if(y(b)!==b)throw new SyntaxError("Invalid duplicate regex flag "+b);a=k.replace.call(a,/^\(\?([\w$]+)\)/,function(a,d){if(k.test.call(/[gy]/,d))throw new SyntaxError("Cannot use flag g or y in mode modifier "+a);b=y(b+d);return""});for(d=0;d<b.length;++d)if(!F[b.charAt(d)])throw new SyntaxError("Unknown regex flag "+
b.charAt(d));return{pattern:a,flags:b}}function G(a){var b={};return w(a,"String")?(f.forEach(a,/[^\s,]+/,function(a){b[a]=!0}),b):a}function H(a){if(!/^[\w$]$/.test(a))throw Error("Flag must be a single character A-Za-z0-9_$");F[a]=!0}function I(a){RegExp.prototype.exec=(a?m:k).exec;RegExp.prototype.test=(a?m:k).test;String.prototype.match=(a?m:k).match;String.prototype.replace=(a?m:k).replace;String.prototype.split=(a?m:k).split;q.natives=a}function x(a){if(null==a)throw new TypeError("Cannot convert null or undefined to object");
return a}var f,q={astral:!1,natives:!1},k={exec:RegExp.prototype.exec,test:RegExp.prototype.test,match:String.prototype.match,replace:String.prototype.replace,split:String.prototype.split},m={},t={},z={},A=[],M={"default":/\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\d*|x[\dA-Fa-f]{2}|u(?:[\dA-Fa-f]{4}|{[\dA-Fa-f]+})|c[A-Za-z]|[\s\S])|\(\?[:=!]|[?*+]\?|{\d+(?:,\d*)?}\??|[\s\S]/,"class":/\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\dA-Fa-f]{2}|u(?:[\dA-Fa-f]{4}|{[\dA-Fa-f]+})|c[A-Za-z]|[\s\S])|[\s\S]/},N=/\$(?:{([\w$]+)}|(\d\d?|[\s\S]))/g,
O=void 0===k.exec.call(/()??/,"")[1],J=function(){var a=!0;try{RegExp("","u")}catch(b){a=!1}return a}(),B=function(){var a=!0;try{RegExp("","y")}catch(b){a=!1}return a}(),K=void 0!==/a/.flags,F={g:!0,i:!0,m:!0,u:J,y:B},D={}.toString;f=function(a,b){var d={hasNamedCapture:!1,captureNames:[]},c="default",e="",g=0,h,l,m;if(f.isRegExp(a)){if(void 0!==b)throw new TypeError("Cannot supply flags when copying a RegExp");return u(a)}a=void 0===a?"":String(a);b=void 0===b?"":String(b);f.isInstalled("astral")&&
-1===b.indexOf("A")&&(b+="A");z[a]||(z[a]={});if(!z[a][b]){h=L(a,b);l=h.pattern;for(m=h.flags;g<l.length;){do{h=l;for(var p=m,n=g,q=c,x=d,t=A.length,y=h.charAt(n),v=null,w=void 0,r=void 0;t--;)if(r=A[t],!(r.leadChar&&r.leadChar!==y||r.scope!==q&&"all"!==r.scope||r.flag&&-1===p.indexOf(r.flag))&&(w=f.exec(h,r.regex,n,"sticky"))){v={matchLength:w[0].length,output:r.handler.call(x,w,q,p),reparse:r.reparse};break}(h=v)&&h.reparse&&(l=l.slice(0,g)+h.output+l.slice(g+h.matchLength))}while(h&&h.reparse);
h?(e+=h.output,g+=h.matchLength||1):(h=f.exec(l,M[c],g,"sticky")[0],e+=h,g+=h.length,"["===h&&"default"===c?c="class":"]"===h&&"class"===c&&(c="default"))}z[a][b]={pattern:k.replace.call(e,/\(\?:\)(?=\(\?:\))|^\(\?:\)|\(\?:\)$/g,""),flags:k.replace.call(m,/[^gimuy]+/g,""),captures:d.hasNamedCapture?d.captureNames:null}}d=z[a][b];return C(new RegExp(d.pattern,d.flags),d.captures,a,b)};f.prototype=RegExp();f.version="3.0.0";f.addToken=function(a,b,d){d=d||{};var c=d.optionalFlags,e;d.flag&&H(d.flag);
if(c)for(c=k.split.call(c,""),e=0;e<c.length;++e)H(c[e]);A.push({regex:u(a,{addG:!0,addY:B,isInternalOnly:!0}),handler:b,scope:d.scope||"default",flag:d.flag,reparse:d.reparse,leadChar:d.leadChar});f.cache.flush("patterns")};f.cache=function(a,b){t[a]||(t[a]={});return t[a][b]||(t[a][b]=f(a,b))};f.cache.flush=function(a){"patterns"===a?z={}:t={}};f.escape=function(a){return k.replace.call(x(a),/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$\x26")};f.exec=function(a,b,d,c){var e="g",f=!1;(f=B&&!!(c||b.sticky&&!1!==
c))&&(e+="y");b.xregexp=b.xregexp||{};e=b.xregexp[e]||(b.xregexp[e]=u(b,{addG:!0,addY:f,removeY:!1===c,isInternalOnly:!0}));e.lastIndex=d=d||0;a=m.exec.call(e,a);c&&a&&a.index!==d&&(a=null);b.global&&(b.lastIndex=a?e.lastIndex:0);return a};f.forEach=function(a,b,d){for(var c=0,e=-1;c=f.exec(a,b,c);)d(c,++e,a,b),c=c.index+(c[0].length||1)};f.globalize=function(a){return u(a,{addG:!0})};f.install=function(a){a=G(a);!q.astral&&a.astral&&(q.astral=!0);!q.natives&&a.natives&&I(!0)};f.isInstalled=function(a){return!!q[a]};
f.isRegExp=function(a){return"[object RegExp]"===D.call(a)};f.match=function(a,b,d){var c=b.global&&"one"!==d||"all"===d,e=(c?"g":"")+(b.sticky?"y":"")||"noGY";b.xregexp=b.xregexp||{};e=b.xregexp[e]||(b.xregexp[e]=u(b,{addG:!!c,addY:!!b.sticky,removeG:"one"===d,isInternalOnly:!0}));a=k.match.call(x(a),e);b.global&&(b.lastIndex="one"===d&&a?a.index+a[0].length:0);return c?a||[]:a&&a[0]};f.matchChain=function(a,b){return function c(a,g){var h=b[g].regex?b[g]:{regex:b[g]},l=[],k=function(a){if(h.backref){if(!(a.hasOwnProperty(h.backref)||
+h.backref<a.length))throw new ReferenceError("Backreference to undefined group: "+h.backref);l.push(a[h.backref]||"")}else l.push(a[0])},p;for(p=0;p<a.length;++p)f.forEach(a[p],h.regex,k);return g!==b.length-1&&l.length?c(l,g+1):l}([a],0)};f.replace=function(a,b,d,c){var e=f.isRegExp(b),g=b.global&&"one"!==c||"all"===c,h=(g?"g":"")+(b.sticky?"y":"")||"noGY",l=b;e?(b.xregexp=b.xregexp||{},l=b.xregexp[h]||(b.xregexp[h]=u(b,{addG:!!g,addY:!!b.sticky,removeG:"one"===c,isInternalOnly:!0}))):g&&(l=new RegExp(f.escape(String(b)),
"g"));a=m.replace.call(x(a),l,d);e&&b.global&&(b.lastIndex=0);return a};f.replaceEach=function(a,b){var d,c;for(d=0;d<b.length;++d)c=b[d],a=f.replace(a,c[0],c[1],c[2]);return a};f.split=function(a,b,d){return m.split.call(x(a),b,d)};f.test=function(a,b,d,c){return!!f.exec(a,b,d,c)};f.uninstall=function(a){a=G(a);q.astral&&a.astral&&(q.astral=!1);q.natives&&a.natives&&I(!1)};f.union=function(a,b){var d=/(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*]/g,c=[],e=0,g,h,l,m=function(a,b,d){var c=
h[e-g];if(b){if(++e,c)return"(?\x3c"+c+"\x3e"}else if(d)return"\\"+(+d+g);return a},p;if(!w(a,"Array")||!a.length)throw new TypeError("Must provide a nonempty array of patterns to merge");for(p=0;p<a.length;++p)l=a[p],f.isRegExp(l)?(g=e,h=l.xregexp&&l.xregexp.captureNames||[],c.push(k.replace.call(f(l.source).source,d,m))):c.push(f.escape(l));return f(c.join("|"),b)};m.exec=function(a){var b=this.lastIndex,d=k.exec.apply(this,arguments),c,e;if(d){!O&&1<d.length&&-1<v(d,"")&&(c=u(this,{removeG:!0,
isInternalOnly:!0}),k.replace.call(String(a).slice(d.index),c,function(){var a=arguments.length,b;for(b=1;b<a-2;++b)void 0===arguments[b]&&(d[b]=void 0)}));if(this.xregexp&&this.xregexp.captureNames)for(e=1;e<d.length;++e)(c=this.xregexp.captureNames[e-1])&&(d[c]=d[e]);this.global&&!d[0].length&&this.lastIndex>d.index&&(this.lastIndex=d.index)}this.global||(this.lastIndex=b);return d};m.test=function(a){return!!m.exec.call(this,a)};m.match=function(a){var b;if(!f.isRegExp(a))a=new RegExp(a);else if(a.global)return b=
k.match.apply(this,arguments),a.lastIndex=0,b;return m.exec.call(a,x(this))};m.replace=function(a,b){var d=f.isRegExp(a),c,e,g;d?(a.xregexp&&(e=a.xregexp.captureNames),c=a.lastIndex):a+="";g=w(b,"Function")?k.replace.call(String(this),a,function(){var c=arguments,f;if(e)for(c[0]=new String(c[0]),f=0;f<e.length;++f)e[f]&&(c[0][e[f]]=c[f+1]);d&&a.global&&(a.lastIndex=c[c.length-2]+c[0].length);return b.apply(void 0,c)}):k.replace.call(null==this?this:String(this),a,function(){var a=arguments;return k.replace.call(String(b),
N,function(b,d,c){if(d){c=+d;if(c<=a.length-3)return a[c]||"";c=e?v(e,d):-1;if(0>c)throw new SyntaxError("Backreference to undefined group "+b);return a[c+1]||""}if("$"===c)return"$";if("\x26"===c||0===+c)return a[0];if("`"===c)return a[a.length-1].slice(0,a[a.length-2]);if("'"===c)return a[a.length-1].slice(a[a.length-2]+a[0].length);c=+c;if(!isNaN(c)){if(c>a.length-3)throw new SyntaxError("Backreference to undefined group "+b);return a[c]||""}throw new SyntaxError("Invalid token "+b);})});d&&(a.lastIndex=
a.global?0:c);return g};m.split=function(a,b){if(!f.isRegExp(a))return k.split.apply(this,arguments);var d=String(this),c=[],e=a.lastIndex,g=0,h;b=(void 0===b?-1:b)>>>0;f.forEach(d,a,function(a){a.index+a[0].length>g&&(c.push(d.slice(g,a.index)),1<a.length&&a.index<d.length&&Array.prototype.push.apply(c,a.slice(1)),h=a[0].length,g=a.index+h)});g===d.length?k.test.call(a,"")&&!h||c.push(""):c.push(d.slice(g));a.lastIndex=e;return c.length>b?c.slice(0,b):c};n=f.addToken;n(/\\([ABCE-RTUVXYZaeg-mopqyz]|c(?![A-Za-z])|u(?![\dA-Fa-f]{4}|{[\dA-Fa-f]+})|x(?![\dA-Fa-f]{2}))/,
function(a,b){if("B"===a[1]&&"default"===b)return a[0];throw new SyntaxError("Invalid escape "+a[0]);},{scope:"all",leadChar:"\\"});n(/\\u{([\dA-Fa-f]+)}/,function(a,b,d){b=parseInt(a[1],16);if(1114111<b)throw new SyntaxError("Invalid Unicode code point "+a[0]);if(65535>=b){for(a=parseInt(b,10).toString(16);4>a.length;)a="0"+a;return"\\u"+a}if(J&&-1<d.indexOf("u"))return a[0];throw new SyntaxError("Cannot use Unicode code point above \\u{FFFF} without flag u");},{scope:"all",leadChar:"\\"});n(/\[(\^?)]/,
function(a){return a[1]?"[\\s\\S]":"\\b\\B"},{leadChar:"["});n(/\(\?#[^)]*\)/,function(a,b,d){return E(a.input,a.index+a[0].length,d)?"":"(?:)"},{leadChar:"("});n(/\s+|#.*/,function(a,b,d){return E(a.input,a.index+a[0].length,d)?"":"(?:)"},{flag:"x"});n(/\./,function(){return"[\\s\\S]"},{flag:"s",leadChar:"."});n(/\\k<([\w$]+)>/,function(a){var b=isNaN(a[1])?v(this.captureNames,a[1])+1:+a[1],d=a.index+a[0].length;if(!b||b>this.captureNames.length)throw new SyntaxError("Backreference to undefined group "+
a[0]);return"\\"+b+(d===a.input.length||isNaN(a.input.charAt(d))?"":"(?:)")},{leadChar:"\\"});n(/\\(\d+)/,function(a,b){if(!("default"===b&&/^[1-9]/.test(a[1])&&+a[1]<=this.captureNames.length)&&"0"!==a[1])throw new SyntaxError("Cannot use octal escape or backreference to undefined group "+a[0]);return a[0]},{scope:"all",leadChar:"\\"});n(/\(\?P?<([\w$]+)>/,function(a){if(!isNaN(a[1]))throw new SyntaxError("Cannot use integer as capture name "+a[0]);if("length"===a[1]||"__proto__"===a[1])throw new SyntaxError("Cannot use reserved word as capture name "+
a[0]);if(-1<v(this.captureNames,a[1]))throw new SyntaxError("Cannot use same name for multiple groups "+a[0]);this.captureNames.push(a[1]);this.hasNamedCapture=!0;return"("},{leadChar:"("});n(/\((?!\?)/,function(a,b,d){if(-1<d.indexOf("n"))return"(?:";this.captureNames.push(null);return"("},{optionalFlags:"n",leadChar:"("});return f}();