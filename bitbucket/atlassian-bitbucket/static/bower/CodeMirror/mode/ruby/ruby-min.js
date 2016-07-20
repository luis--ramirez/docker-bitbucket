(function(f){"object"==typeof exports&&"object"==typeof module?f(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],f):f(CodeMirror)})(function(f){f.defineMode("ruby",function(f){function n(a){for(var c={},b=0,d=a.length;b<d;++b)c[a[b]]=!0;return c}function k(a,c,b){b.tokenize.push(a);return a(c,b)}function m(a,c){if(a.sol()&&a.match("\x3dbegin")&&a.eol())return c.tokenize.push(r),"comment";if(a.eatSpace())return null;var b=a.next(),d;if("`"==b||
"'"==b||'"'==b)return k(l(b,"string",'"'==b||"`"==b),a,c);if("/"==b){d=a.current().length;if(a.skipTo("/")){var h=a.current().length;a.backUp(a.current().length-d);for(var e=0;a.current().length<h;){var f=a.next();"("==f?e+=1:")"==f&&--e;if(0>e)break}a.backUp(a.current().length-d);if(0==e)return k(l(b,"string-2",!0),a,c)}return"operator"}if("%"==b){b="string";d=!0;a.eat("s")?b="atom":a.eat(/[WQ]/)?b="string":a.eat(/[r]/)?b="string-2":a.eat(/[wxq]/)&&(b="string",d=!1);h=a.eat(/[^\w\s=]/);if(!h)return"operator";
p.propertyIsEnumerable(h)&&(h=p[h]);return k(l(h,b,d,!0),a,c)}if("#"==b)return a.skipToEnd(),"comment";if("\x3c"==b&&(d=a.match(/^<-?[\`\"\']?([a-zA-Z_?]\w*)[\`\"\']?(?:;|$)/)))return k(t(d[1]),a,c);if("0"==b)return a.eat("x")?a.eatWhile(/[\da-fA-F]/):a.eat("b")?a.eatWhile(/[01]/):a.eatWhile(/[0-7]/),"number";if(/\d/.test(b))return a.match(/^[\d_]*(?:\.[\d_]+)?(?:[eE][+\-]?[\d_]+)?/),"number";if("?"==b){for(;a.match(/^\\[CM]-/););a.eat("\\")?a.eatWhile(/\w/):a.next();return"string"}if(":"==b)return a.eat("'")?
k(l("'","atom",!1),a,c):a.eat('"')?k(l('"',"atom",!0),a,c):a.eat(/[\<\>]/)?(a.eat(/[\<\>]/),"atom"):a.eat(/[\+\-\*\/\&\|\:\!]/)?"atom":a.eat(/[a-zA-Z$@_\xa1-\uffff]/)?(a.eatWhile(/[\w$\xa1-\uffff]/),a.eat(/[\?\!\=]/),"atom"):"operator";if("@"==b&&a.match(/^@?[a-zA-Z_\xa1-\uffff]/))return a.eat("@"),a.eatWhile(/[\w\xa1-\uffff]/),"variable-2";if("$"==b)return a.eat(/[a-zA-Z_]/)?a.eatWhile(/[\w]/):a.eat(/\d/)?a.eat(/\d/):a.next(),"variable-3";if(/[a-zA-Z_\xa1-\uffff]/.test(b))return a.eatWhile(/[\w\xa1-\uffff]/),
a.eat(/[\?\!]/),a.eat(":")?"atom":"ident";if("|"!=b||!c.varList&&"{"!=c.lastTok&&"do"!=c.lastTok)return/[\(\)\[\]{}\\;]/.test(b)?(g=b,null):"-"==b&&a.eat("\x3e")?"arrow":/[=+\-\/*:\.^%<>~|]/.test(b)?(d=a.eatWhile(/[=+\-\/*:\.^%<>~|]/),"."!=b||d||(g="."),"operator"):null;g="|";return null}function q(a){a||(a=1);return function(c,b){if("}"==c.peek()){if(1==a)return b.tokenize.pop(),b.tokenize[b.tokenize.length-1](c,b);b.tokenize[b.tokenize.length-1]=q(a-1)}else"{"==c.peek()&&(b.tokenize[b.tokenize.length-
1]=q(a+1));return m(c,b)}}function u(){var a=!1;return function(c,b){if(a)return b.tokenize.pop(),b.tokenize[b.tokenize.length-1](c,b);a=!0;return m(c,b)}}function l(a,c,b,d){return function(h,e){var f=!1,g;"read-quoted-paused"===e.context.type&&(e.context=e.context.prev,h.eat("}"));for(;null!=(g=h.next());){if(g==a&&(d||!f)){e.tokenize.pop();break}if(b&&"#"==g&&!f)if(h.eat("{")){"}"==a&&(e.context={prev:e.context,type:"read-quoted-paused"});e.tokenize.push(q());break}else if(/[@\$]/.test(h.peek())){e.tokenize.push(u());
break}f=!f&&"\\"==g}return c}}function t(a){return function(c,b){c.match(a)?b.tokenize.pop():c.skipToEnd();return"string"}}function r(a,c){a.sol()&&a.match("\x3dend")&&a.eol()&&c.tokenize.pop();a.skipToEnd();return"comment"}var v=n("alias and BEGIN begin break case class def defined? do else elsif END end ensure false for if in module next not or redo rescue retry return self super then true undef unless until when while yield nil raise throw catch fail loop callcc caller lambda proc public protected private require load require_relative extend autoload __END__ __FILE__ __LINE__ __dir__".split(" ")),
w=n("def class case for while until module then catch loop proc begin".split(" ")),x=n(["end","until"]),p={"[":"]","{":"}","(":")"},g;return{startState:function(){return{tokenize:[m],indented:0,context:{type:"top",indented:-f.indentUnit},continuedLine:!1,lastTok:null,varList:!1}},token:function(a,c){g=null;a.sol()&&(c.indented=a.indentation());var b=c.tokenize[c.tokenize.length-1](a,c),d,f=g;if("ident"==b){var e=a.current(),b="."==c.lastTok?"property":v.propertyIsEnumerable(a.current())?"keyword":
/^[A-Z]/.test(e)?"tag":"def"==c.lastTok||"class"==c.lastTok||c.varList?"def":"variable";"keyword"==b&&(f=e,w.propertyIsEnumerable(e)?d="indent":x.propertyIsEnumerable(e)?d="dedent":"if"!=e&&"unless"!=e||a.column()!=a.indentation()?"do"==e&&c.context.indented<c.indented&&(d="indent"):d="indent")}if(g||b&&"comment"!=b)c.lastTok=f;"|"==g&&(c.varList=!c.varList);"indent"==d||/[\(\[\{]/.test(g)?c.context={prev:c.context,type:g||b,indented:c.indented}:("dedent"==d||/[\)\]\}]/.test(g))&&c.context.prev&&
(c.context=c.context.prev);a.eol()&&(c.continuedLine="\\"==g||"operator"==b);return b},indent:function(a,c){if(a.tokenize[a.tokenize.length-1]!=m)return 0;var b=c&&c.charAt(0),d=a.context,b=d.type==p[b]||"keyword"==d.type&&/^(?:end|until|else|elsif|when|rescue)\b/.test(c);return d.indented+(b?0:f.indentUnit)+(a.continuedLine?f.indentUnit:0)},electricInput:/^\s*(?:end|rescue|\})$/,lineComment:"#"}});f.defineMIME("text/x-ruby","ruby")});