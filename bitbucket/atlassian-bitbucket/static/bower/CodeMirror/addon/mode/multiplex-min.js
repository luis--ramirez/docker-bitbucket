(function(f){"object"==typeof exports&&"object"==typeof module?f(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],f):f(CodeMirror)})(function(f){f.multiplexingMode=function(g){function m(a,c,b,d){return"string"==typeof c?(b=a.indexOf(c,b),d&&-1<b?b+c.length:b):(c=c.exec(b?a.slice(b):a))?c.index+b+(d?c[0].length:0):-1}var l=Array.prototype.slice.call(arguments,1);return{startState:function(){return{outer:f.startState(g),innerActive:null,inner:null}},
copyState:function(a){return{outer:f.copyState(g,a.outer),innerActive:a.innerActive,inner:a.innerActive&&f.copyState(a.innerActive.mode,a.inner)}},token:function(a,c){if(c.innerActive){var b=c.innerActive,d=a.string;if(!b.close&&a.sol())return c.innerActive=c.inner=null,this.token(a,c);e=b.close?m(d,b.close,a.pos,b.parseDelimiters):-1;if(e==a.pos&&!b.parseDelimiters)return a.match(b.close),c.innerActive=c.inner=null,b.delimStyle&&b.delimStyle+" "+b.delimStyle+"-close";-1<e&&(a.string=d.slice(0,e));
var h=b.mode.token(a,c.inner);-1<e&&(a.string=d);e==a.pos&&b.parseDelimiters&&(c.innerActive=c.inner=null);b.innerStyle&&(h=h?h+" "+b.innerStyle:b.innerStyle);return h}for(var b=Infinity,d=a.string,h=0;h<l.length;++h){var k=l[h],e=m(d,k.open,a.pos);if(e==a.pos)return k.parseDelimiters||a.match(k.open),c.innerActive=k,c.inner=f.startState(k.mode,g.indent?g.indent(c.outer,""):0),k.delimStyle&&k.delimStyle+" "+k.delimStyle+"-open";-1!=e&&e<b&&(b=e)}Infinity!=b&&(a.string=d.slice(0,b));e=g.token(a,c.outer);
Infinity!=b&&(a.string=d);return e},indent:function(a,c){var b=a.innerActive?a.innerActive.mode:g;return b.indent?b.indent(a.innerActive?a.inner:a.outer,c):f.Pass},blankLine:function(a){var c=a.innerActive?a.innerActive.mode:g;c.blankLine&&c.blankLine(a.innerActive?a.inner:a.outer);if(a.innerActive)"\n"===a.innerActive.close&&(a.innerActive=a.inner=null);else for(var b=0;b<l.length;++b){var d=l[b];"\n"===d.open&&(a.innerActive=d,a.inner=f.startState(d.mode,c.indent?c.indent(a.outer,""):0))}},electricChars:g.electricChars,
innerMode:function(a){return a.inner?{state:a.inner,mode:a.innerActive.mode}:{state:a.outer,mode:g}}}}});