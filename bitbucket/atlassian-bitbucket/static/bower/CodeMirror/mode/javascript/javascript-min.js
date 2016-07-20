(function(q){"object"==typeof exports&&"object"==typeof module?q(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],q):q(CodeMirror)})(function(q){function ca(q,r,p){return/^(?:operator|sof|keyword c|case|new|[\[{}\(,;:]|=>)$/.test(r.lastType)||"quasi"==r.lastType&&/\{\s*$/.test(q.string.slice(0,q.pos-(p||0)))}q.defineMode("javascript",function(ta,r){function p(a,e,b){C=a;J=b;return e}function x(a,e){var b=a.next();if('"'==b||"'"==b)return e.tokenize=
ua(b),e.tokenize(a,e);if("."==b&&a.match(/^\d+(?:[eE][+\-]?\d+)?/))return p("number","number");if("."==b&&a.match(".."))return p("spread","meta");if(/[\[\]{}\(\),;\:\.]/.test(b))return p(b);if("\x3d"==b&&a.eat("\x3e"))return p("\x3d\x3e","operator");if("0"==b&&a.eat(/x/i))return a.eatWhile(/[\da-f]/i),p("number","number");if("0"==b&&a.eat(/o/i))return a.eatWhile(/[0-7]/i),p("number","number");if("0"==b&&a.eat(/b/i))return a.eatWhile(/[01]/i),p("number","number");if(/\d/.test(b))return a.match(/^\d*(?:\.\d*)?(?:[eE][+\-]?\d+)?/),
p("number","number");if("/"==b){if(a.eat("*"))return e.tokenize=K,K(a,e);if(a.eat("/"))return a.skipToEnd(),p("comment","comment");if(ca(a,e,1)){a:for(var b=!1,c,d=!1;null!=(c=a.next());){if(!b){if("/"==c&&!d)break a;"["==c?d=!0:d&&"]"==c&&(d=!1)}b=!b&&"\\"==c}a.match(/^\b(([gimyu])(?![gimyu]*\2))+\b/);return p("regexp","string-2")}a.eatWhile(L);return p("operator","operator",a.current())}if("`"==b)return e.tokenize=S,S(a,e);if("#"==b)return a.skipToEnd(),p("error","error");if(L.test(b))return a.eatWhile(L),
p("operator","operator",a.current());if(T.test(b))return a.eatWhile(T),b=a.current(),(c=ea.propertyIsEnumerable(b)&&ea[b])&&"."!=e.lastType?p(c.type,c.style,b):p("variable","variable",b)}function ua(a){return function(e,b){var c=!1,d;if(M&&"@"==e.peek()&&e.match(va))return b.tokenize=x,p("jsonld-keyword","meta");for(;null!=(d=e.next())&&(d!=a||c);)c=!c&&"\\"==d;c||(b.tokenize=x);return p("string","string")}}function K(a,b){for(var g=!1,c;c=a.next();){if("/"==c&&g){b.tokenize=x;break}g="*"==c}return p("comment",
"comment")}function S(a,b){for(var g=!1,c;null!=(c=a.next());){if(!g&&("`"==c||"$"==c&&a.eat("{"))){b.tokenize=x;break}g=!g&&"\\"==c}return p("quasi","string-2",a.current())}function U(a,b){b.fatArrowAt&&(b.fatArrowAt=null);var g=a.string.indexOf("\x3d\x3e",a.start);if(!(0>g)){for(var c=0,d=!1,g=g-1;0<=g;--g){var h=a.string.charAt(g),f="([{}])".indexOf(h);if(0<=f&&3>f){if(!c){++g;break}if(0==--c)break}else if(3<=f&&6>f)++c;else if(T.test(h))d=!0;else{if(/["'\/]/.test(h))return;if(d&&!c){++g;break}}}d&&
!c&&(b.fatArrowAt=g)}}function fa(a,b,d,c,f,h){this.indented=a;this.column=b;this.type=d;this.prev=f;this.info=h;null!=c&&(this.align=c)}function f(){for(var a=arguments.length-1;0<=a;a--)d.cc.push(arguments[a])}function b(){f.apply(null,arguments);return!0}function D(a){function b(e){for(;e;e=e.next)if(e.name==a)return!0;return!1}var g=d.state;d.marked="def";g.context?b(g.localVars)||(g.localVars={name:a,next:g.localVars}):!b(g.globalVars)&&r.globalVars&&(g.globalVars={name:a,next:g.globalVars})}
function E(){d.state.context={prev:d.state.context,vars:d.state.localVars};d.state.localVars=wa}function F(){d.state.localVars=d.state.context.vars;d.state.context=d.state.context.prev}function m(a,b){var g=function(){var c=d.state,g=c.indented;if("stat"==c.lexical.type)g=c.lexical.indented;else for(var h=c.lexical;h&&")"==h.type&&h.align;h=h.prev)g=h.indented;c.lexical=new fa(g,d.stream.column(),a,null,c.lexical,b)};g.lex=!0;return g}function k(){var a=d.state;a.lexical.prev&&(")"==a.lexical.type&&
(a.indented=a.lexical.indented),a.lexical=a.lexical.prev)}function n(a){function e(d){return d==a?b():";"==a?f():b(e)}return e}function t(a,e){return"var"==a?b(m("vardef",e.length),V,n(";"),k):"keyword a"==a?b(m("form"),l,t,k):"keyword b"==a?b(m("form"),t,k):"{"==a?b(m("}"),N,k):";"==a?b():"if"==a?("else"==d.state.lexical.info&&d.state.cc[d.state.cc.length-1]==k&&d.state.cc.pop()(),b(m("form"),l,t,k,ga)):"function"==a?b(w):"for"==a?b(m("form"),ha,t,k):"variable"==a?b(m("stat"),xa):"switch"==a?b(m("form"),
l,m("}","switch"),n("{"),N,k,k):"case"==a?b(l,n(":")):"default"==a?b(n(":")):"catch"==a?b(m("form"),E,n("("),W,n(")"),t,k,F):"class"==a?b(m("form"),ya,k):"export"==a?b(m("stat"),za,k):"import"==a?b(m("stat"),Aa,k):"module"==a?b(m("form"),v,m("}"),n("{"),N,k,k):"async"==a?b(t):f(m("stat"),l,n(";"),k)}function l(a){return ia(a,!1)}function u(a){return ia(a,!0)}function ia(a,e){if(d.state.fatArrowAt==d.stream.start){var g=e?ja:ka;if("("==a)return b(E,m(")"),y(v,")"),k,n("\x3d\x3e"),g,F);if("variable"==
a)return f(E,v,n("\x3d\x3e"),g,F)}g=e?O:G;return Ba.hasOwnProperty(a)?b(g):"function"==a?b(w,g):"keyword c"==a?b(e?la:X):"("==a?b(m(")"),X,P,n(")"),k,g):"operator"==a||"spread"==a?b(e?u:l):"["==a?b(m("]"),Ca,k,g):"{"==a?H(ma,"}",null,g):"quasi"==a?f(Q,g):"new"==a?b(Da(e)):b()}function X(a){return a.match(/[;\}\)\],]/)?f():f(l)}function la(a){return a.match(/[;\}\)\],]/)?f():f(u)}function G(a,e){return","==a?b(l):O(a,e,!1)}function O(a,e,d){var c=0==d?G:O,da=0==d?l:u;if("\x3d\x3e"==a)return b(E,d?
ja:ka,F);if("operator"==a)return/\+\+|--/.test(e)?b(c):"?"==e?b(l,n(":"),da):b(da);if("quasi"==a)return f(Q,c);if(";"!=a){if("("==a)return H(u,")","call",c);if("."==a)return b(Ea,c);if("["==a)return b(m("]"),X,n("]"),k,c)}}function Q(a,e){return"quasi"!=a?f():"${"!=e.slice(e.length-2)?b(Q):b(l,Fa)}function Fa(a){if("}"==a)return d.marked="string-2",d.state.tokenize=S,b(Q)}function ka(a){U(d.stream,d.state);return f("{"==a?t:l)}function ja(a){U(d.stream,d.state);return f("{"==a?t:u)}function Da(a){return function(e){return"."==
e?b(a?Ga:Ha):f(a?u:l)}}function Ha(a,e){if("target"==e)return d.marked="keyword",b(G)}function Ga(a,e){if("target"==e)return d.marked="keyword",b(O)}function xa(a){return":"==a?b(k,t):f(G,n(";"),k)}function Ea(a){if("variable"==a)return d.marked="property",b()}function ma(a,e){if("variable"==a||"keyword"==d.style)return d.marked="property","get"==e||"set"==e?b(Ia):b(I);if("number"==a||"string"==a)return d.marked=M?"property":d.style+" property",b(I);if("jsonld-keyword"==a)return b(I);if("modifier"==
a)return b(ma);if("["==a)return b(l,n("]"),I);if("spread"==a)return b(l)}function Ia(a){if("variable"!=a)return f(I);d.marked="property";return b(w)}function I(a){if(":"==a)return b(u);if("("==a)return f(w)}function y(a,e){function g(c,f){if(","==c){var h=d.state.lexical;"call"==h.info&&(h.pos=(h.pos||0)+1);return b(a,g)}return c==e||f==e?b():b(n(e))}return function(c,d){return c==e||d==e?b():f(a,g)}}function H(a,e,g){for(var c=3;c<arguments.length;c++)d.cc.push(arguments[c]);return b(m(e,g),y(a,
e),k)}function N(a){return"}"==a?b():f(t,N)}function Y(a){if(na&&":"==a)return b(oa)}function Ja(a,e){if("\x3d"==e)return b(u)}function oa(a){if("variable"==a)return d.marked="variable-3",b(Z)}function Z(a,e){if("\x3c"==e)return b(y(oa,"\x3e"),Z);if("["==a)return b(n("]"),Z)}function V(){return f(v,Y,aa,Ka)}function v(a,e){if("modifier"==a)return b(v);if("variable"==a)return D(e),b();if("spread"==a)return b(v);if("["==a)return H(v,"]");if("{"==a)return H(La,"}")}function La(a,e){if("variable"==a&&
!d.stream.match(/^\s*:/,!1))return D(e),b(aa);"variable"==a&&(d.marked="property");return"spread"==a?b(v):"}"==a?f():b(n(":"),v,aa)}function aa(a,e){if("\x3d"==e)return b(u)}function Ka(a){if(","==a)return b(V)}function ga(a,e){if("keyword b"==a&&"else"==e)return b(m("form","else"),t,k)}function ha(a){if("("==a)return b(m(")"),Ma,n(")"),k)}function Ma(a){return"var"==a?b(V,n(";"),R):";"==a?b(R):"variable"==a?b(Na):f(l,n(";"),R)}function Na(a,e){return"in"==e||"of"==e?(d.marked="keyword",b(l)):b(G,
R)}function R(a,e){return";"==a?b(pa):"in"==e||"of"==e?(d.marked="keyword",b(l)):f(l,n(";"),pa)}function pa(a){")"!=a&&b(l)}function w(a,e){if("*"==e)return d.marked="keyword",b(w);if("variable"==a)return D(e),b(w);if("("==a)return b(E,m(")"),y(W,")"),k,Y,t,F)}function W(a){return"spread"==a?b(W):f(v,Y,Ja)}function ya(a,e){if("variable"==a)return D(e),b(qa)}function qa(a,e){if("extends"==e)return b(l,qa);if("{"==a)return b(m("}"),z,k)}function z(a,e){if("variable"==a||"keyword"==d.style){if("static"==
e)return d.marked="keyword",b(z);d.marked="property";return"get"==e||"set"==e?b(Oa,w,z):b(w,z)}if("*"==e)return d.marked="keyword",b(z);if(";"==a)return b(z);if("}"==a)return b()}function Oa(a){if("variable"!=a)return f();d.marked="property";return b()}function za(a,e){return"*"==e?(d.marked="keyword",b(ra,n(";"))):"default"==e?(d.marked="keyword",b(l,n(";"))):f(t)}function Aa(a){return"string"==a?b():f(ba,ra)}function ba(a,e){if("{"==a)return H(ba,"}");"variable"==a&&D(e);"*"==e&&(d.marked="keyword");
return b(Pa)}function Pa(a,e){if("as"==e)return d.marked="keyword",b(ba)}function ra(a,e){if("from"==e)return d.marked="keyword",b(l)}function Ca(a){return"]"==a?b():f(u,Qa)}function Qa(a){return"for"==a?f(P,n("]")):","==a?b(y(la,"]")):f(y(u,"]"))}function P(a){if("for"==a)return b(ha,P);if("if"==a)return b(l,P)}var A=ta.indentUnit,sa=r.statementIndent,M=r.jsonld,B=r.json||M,na=r.typescript,T=r.wordCharacters||/[\w$\xa1-\uffff]/,ea=function(){function a(a){return{type:a,style:"keyword"}}var b=a("keyword a"),
d=a("keyword b"),c=a("keyword c"),f=a("operator"),h={type:"atom",style:"atom"},b={"if":a("if"),"while":b,"with":b,"else":d,"do":d,"try":d,"finally":d,"return":c,"break":c,"continue":c,"new":a("new"),"delete":c,"throw":c,"debugger":c,"var":a("var"),"const":a("var"),let:a("var"),"function":a("function"),"catch":a("catch"),"for":a("for"),"switch":a("switch"),"case":a("case"),"default":a("default"),"in":f,"typeof":f,"instanceof":f,"true":h,"false":h,"null":h,undefined:h,NaN:h,Infinity:h,"this":a("this"),
"class":a("class"),"super":a("atom"),yield:c,"export":a("export"),"import":a("import"),"extends":c,await:c,async:a("async")};if(na){var d={type:"variable",style:"variable-3"},c={"interface":a("class"),"implements":c,namespace:c,module:a("module"),"enum":a("module"),"public":a("modifier"),"private":a("modifier"),"protected":a("modifier"),"abstract":a("modifier"),as:f,string:d,number:d,"boolean":d,any:d},k;for(k in c)b[k]=c[k]}return b}(),L=/[+\-*&%=<>!?|~^]/,va=/^@(context|id|value|language|type|container|list|set|reverse|index|base|vocab|graph)"/,
C,J,Ba={atom:!0,number:!0,variable:!0,string:!0,regexp:!0,"this":!0,"jsonld-keyword":!0},d={state:null,column:null,marked:null,cc:null},wa={name:"this",next:{name:"arguments"}};k.lex=!0;return{startState:function(a){a={tokenize:x,lastType:"sof",cc:[],lexical:new fa((a||0)-A,0,"block",!1),localVars:r.localVars,context:r.localVars&&{vars:r.localVars},indented:a||0};r.globalVars&&"object"==typeof r.globalVars&&(a.globalVars=r.globalVars);return a},token:function(a,b){a.sol()&&(b.lexical.hasOwnProperty("align")||
(b.lexical.align=!1),b.indented=a.indentation(),U(a,b));if(b.tokenize!=K&&a.eatSpace())return null;var g=b.tokenize(a,b);if("comment"==C)return g;b.lastType="operator"!=C||"++"!=J&&"--"!=J?C:"incdec";a:{var c=C,f=J,h=b.cc;d.state=b;d.stream=a;d.marked=null;d.cc=h;d.style=g;b.lexical.hasOwnProperty("align")||(b.lexical.align=!0);for(;;)if((h.length?h.pop():B?l:t)(c,f)){for(;h.length&&h[h.length-1].lex;)h.pop()();if(d.marked){g=d.marked;break a}if(c="variable"==c)b:{for(c=b.localVars;c;c=c.next)if(c.name==
f){c=!0;break b}for(h=b.context;h;h=h.prev)for(c=h.vars;c;c=c.next)if(c.name==f){c=!0;break b}c=void 0}if(c){g="variable-2";break a}break a}}return g},indent:function(a,b){if(a.tokenize==K)return q.Pass;if(a.tokenize!=x)return 0;var d=b&&b.charAt(0),c=a.lexical;if(!/^\s*else\b/.test(b))for(var f=a.cc.length-1;0<=f;--f){var h=a.cc[f];if(h==k)c=c.prev;else if(h!=ga)break}"stat"==c.type&&"}"==d&&(c=c.prev);sa&&")"==c.type&&"stat"==c.prev.type&&(c=c.prev);f=c.type;h=d==f;return"vardef"==f?c.indented+
("operator"==a.lastType||","==a.lastType?c.info+1:0):"form"==f&&"{"==d?c.indented:"form"==f?c.indented+A:"stat"==f?(d=c.indented,c="operator"==a.lastType||","==a.lastType||L.test(b.charAt(0))||/[,.]/.test(b.charAt(0)),d+(c?sa||A:0)):"switch"!=c.info||h||0==r.doubleIndentSwitch?c.align?c.column+(h?0:1):c.indented+(h?0:A):c.indented+(/^(?:case|default)\b/.test(b)?A:2*A)},electricInput:/^\s*(?:case .*?:|default:|\{|\})$/,blockCommentStart:B?null:"/*",blockCommentEnd:B?null:"*/",lineComment:B?null:"//",
fold:"brace",closeBrackets:"()[]{}''\"\"``",helperType:B?"json":"javascript",jsonldMode:M,jsonMode:B,expressionAllowed:ca,skipExpression:function(a){var b=a.cc[a.cc.length-1];b!=l&&b!=u||a.cc.pop()}}});q.registerHelper("wordChars","javascript",/[\w$]/);q.defineMIME("text/javascript","javascript");q.defineMIME("text/ecmascript","javascript");q.defineMIME("application/javascript","javascript");q.defineMIME("application/x-javascript","javascript");q.defineMIME("application/ecmascript","javascript");
q.defineMIME("application/json",{name:"javascript",json:!0});q.defineMIME("application/x-json",{name:"javascript",json:!0});q.defineMIME("application/ld+json",{name:"javascript",jsonld:!0});q.defineMIME("text/typescript",{name:"javascript",typescript:!0});q.defineMIME("application/typescript",{name:"javascript",typescript:!0})});