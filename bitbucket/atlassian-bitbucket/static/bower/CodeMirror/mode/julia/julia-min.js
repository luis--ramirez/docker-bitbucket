(function(f){"object"==typeof exports&&"object"==typeof module?f(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],f):f(CodeMirror)})(function(f){f.defineMode("julia",function(f,l){function g(b,a){"undefined"===typeof a&&(a="\\b");return new RegExp("^(("+b.join(")|(")+"))"+a)}function h(b){return 0==b.scopes.length?null:b.scopes[b.scopes.length-1]}function k(b,a){if(b.match(/^#=/,!1))return a.tokenize=q,a.tokenize(b,a);var d=a.leavingExpr;b.sol()&&
(d=!1);a.leavingExpr=!1;if(d&&b.match(/^'+/)||b.match(/^\.{2,3}/))return"operator";if(b.eatSpace())return null;var c=b.peek();if("#"===c)return b.skipToEnd(),"comment";"["===c&&a.scopes.push("[");"("===c&&a.scopes.push("(");var e=h(a);"["==e&&"]"===c&&(a.scopes.pop(),a.leavingExpr=!0);"("==e&&")"===c&&(a.scopes.pop(),a.leavingExpr=!0);var f;"["!=h(a)&&(f=b.match(r,!1))&&a.scopes.push(f);"["!=h(a)&&b.match(t,!1)&&a.scopes.pop();if("["==h(a)){if("end"==a.lastToken&&b.match(/^:/))return"operator";if(b.match(/^end/))return"number"}if(b.match(/^=>/))return"operator";
if(b.match(/^[0-9\.]/,!1)&&(c=RegExp(/^im\b/),e=!1,b.match(/^\d*\.(?!\.)\d*([Eef][\+\-]?\d+)?/i)&&(e=!0),b.match(/^\d+\.(?!\.)\d*/)&&(e=!0),b.match(/^\.\d+/)&&(e=!0),b.match(/^0x\.[0-9a-f]+p[\+\-]?\d+/i)&&(e=!0),b.match(/^0x[0-9a-f]+/i)&&(e=!0),b.match(/^0b[01]+/i)&&(e=!0),b.match(/^0o[0-7]+/i)&&(e=!0),b.match(/^[1-9]\d*(e[\+\-]?\d+)?/)&&(e=!0),b.match(/^0(?![\dx])/i)&&(e=!0),e))return b.match(c),a.leavingExpr=!0,"number";if(b.match(/^<:/))return"operator";if(b.match(u)||!d&&b.match(v)||b.match(/:\./)||
b.match(/^{[^}]*}(?=\()/))return"builtin";if(b.match(w))return"operator";if(b.match(/^'/))return a.tokenize=x,a.tokenize(b,a);if(b.match(y))return a.tokenize=z(b.current()),a.tokenize(b,a);if(b.match(m))return"meta";if(b.match(A))return null;if(b.match(B))return"keyword";if(b.match(C))return"builtin";d=a.isDefinition||"function"==a.lastToken||"macro"==a.lastToken||"type"==a.lastToken||"immutable"==a.lastToken;if(b.match(n)){if(d){if("."===b.peek())return a.isDefinition=!0,"variable";a.isDefinition=
!1;return"def"}if(b.match(/^({[^}]*})*\(/,!1))return p(b,a);a.leavingExpr=!0;return"variable"}b.next();return"error"}function p(b,a){var d=b.match(/^(\(\s*)/);d&&(0>a.firstParenPos&&(a.firstParenPos=a.scopes.length),a.scopes.push("("),a.charsAdvanced+=d[1].length);if("("==h(a)&&b.match(/^\)/)&&(a.scopes.pop(),a.charsAdvanced+=1,a.scopes.length<=a.firstParenPos))return d=b.match(/^\s*?=(?!=)/,!1),b.backUp(a.charsAdvanced),a.firstParenPos=-1,a.charsAdvanced=0,d?"def":"builtin";if(b.match(/^$/g,!1)){for(b.backUp(a.charsAdvanced);a.scopes.length>
a.firstParenPos;)a.scopes.pop();a.firstParenPos=-1;a.charsAdvanced=0;return"builtin"}a.charsAdvanced+=b.match(/^([^()]*)/)[1].length;return p(b,a)}function q(b,a){b.match(/^#=/)&&a.weakScopes++;b.match(/.*?(?=(#=|=#))/)||b.skipToEnd();b.match(/^=#/)&&(a.weakScopes--,0==a.weakScopes&&(a.tokenize=k));return"comment"}function x(b,a){var d=!1,c;if(b.match(D))d=!0;else if(c=b.match(/\\u([a-f0-9]{1,4})(?=')/i)){if(c=parseInt(c[1],16),55295>=c||57344<=c)d=!0,b.next()}else if(c=b.match(/\\U([A-Fa-f0-9]{5,8})(?=')/))c=
parseInt(c[1],16),1114111>=c&&(d=!0,b.next());if(d)return a.leavingExpr=!0,a.tokenize=k,"string";b.match(/^[^']+(?=')/)||b.skipToEnd();b.match(/^'/)&&(a.tokenize=k);return"error"}function z(b){function a(a,c){for(;!a.eol();)if(a.eatWhile(/[^"\\]/),a.eat("\\"))a.next();else if(a.match(b)){c.tokenize=k;c.leavingExpr=!0;break}else a.eat(/["]/);return"string"}for(;0<="bruv".indexOf(b.charAt(0).toLowerCase());)b=b.substr(1);a.isString=!0;return a}var w=l.operators||/^\.?[|&^\\%*+\-<>!=\/]=?|\?|~|:|\$|\.[<>]|<<=?|>>>?=?|\.[<>=]=|->?|\/\/|\bin\b(?!\()|[\u2208\u2209](?!\()/,
A=l.delimiters||/^[;,()[\]{}]/,n=l.identifiers||/^[_A-Za-z\u00A1-\uFFFF][\w\u00A1-\uFFFF]*!*/,y=/^(`|"{3}|([brv]?"))/,D=g(["\\\\[0-7]{1,3}","\\\\x[A-Fa-f0-9]{1,2}","\\\\[abfnrtv0%?'\"\\\\]","([^\\u0027\\u005C\\uD800-\\uDFFF]|[\\uD800-\\uDFFF][\\uDC00-\\uDFFF])"],"'"),B=g("if else elseif while for begin let end do try catch finally return break continue global local const export import importall using function macro module baremodule type immutable quote typealias abstract bitstype".split(" ")),C=
g(["true","false","nothing","NaN","Inf"]),r=g("begin function type immutable let macro for while quote if else elseif try finally catch do".split(" ")),t=g(["end","else","elseif","catch","finally"]),m=/^@[_A-Za-z][\w]*/,v=/^:[_A-Za-z\u00A1-\uFFFF][\w\u00A1-\uFFFF]*!*/,u=/^::[^,;"{()=$\s]+({[^}]*}+)*/;return{startState:function(){return{tokenize:k,scopes:[],weakScopes:0,lastToken:null,leavingExpr:!1,isDefinition:!1,charsAdvanced:0,firstParenPos:-1}},token:function(b,a){var d=a.tokenize(b,a),c=b.current();
c&&d&&(a.lastToken=c);"."===c&&(d=b.match(n,!1)||b.match(m,!1)||b.match(/\(/,!1)?"operator":"error");return d},indent:function(b,a){var d=0;if("]"==a||")"==a||"end"==a||"else"==a||"elseif"==a||"catch"==a||"finally"==a)d=-1;return(b.scopes.length+d)*f.indentUnit},electricInput:/(end|else(if)?|catch|finally)$/,lineComment:"#",fold:"indent"}});f.defineMIME("text/x-julia","julia")});