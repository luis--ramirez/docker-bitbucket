(function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)})(function(e){e.defineMode("yacas",function(h,t){function f(a,b){var c;c=a.next();if('"'===c)return b.tokenize=k,b.tokenize(a,b);if("/"===c){if(a.eat("*"))return b.tokenize=l,b.tokenize(a,b);if(a.eat("/"))return a.skipToEnd(),"comment"}a.backUp(1);var d=a.match(/^(\w+)\s*\(/,!1);null!==d&&m.hasOwnProperty(d[1])&&b.scopes.push("bodied");
d=g(b);"bodied"===d&&"["===c&&b.scopes.pop();"["!==c&&"{"!==c&&"("!==c||b.scopes.push(c);d=g(b);("["===d&&"]"===c||"{"===d&&"}"===c||"("===d&&")"===c)&&b.scopes.pop();if(";"===c)for(;"bodied"===d;)b.scopes.pop(),d=g(b);return a.match(/\d+ *#/,!0,!1)?"qualifier":a.match(n,!0,!1)?"number":a.match(p,!0,!1)?"variable-3":a.match(/(?:\[|\]|{|}|\(|\))/,!0,!1)?"bracket":a.match(q,!0,!1)?(a.backUp(1),"variable"):a.match(r,!0,!1)?"variable-2":a.match(/(?:\\|\+|\-|\*|\/|,|;|\.|:|@|~|=|>|<|&|\||_|`|'|\^|\?|!|%)/,
!0,!1)?"operator":"error"}function k(a,b){for(var c,d=!1,e=!1;null!=(c=a.next());){if('"'===c&&!e){d=!0;break}e=!e&&"\\"===c}d&&!e&&(b.tokenize=f);return"string"}function l(a,b){for(var c,d;null!=(d=a.next());){if("*"===c&&"/"===d){b.tokenize=f;break}c=d}return"comment"}function g(a){var b=null;0<a.scopes.length&&(b=a.scopes[a.scopes.length-1]);return b}var m=function(a){var b={};a=a.split(" ");for(var c=0;c<a.length;++c)b[a[c]]=!0;return b}("Assert BackQuote D Defun Deriv For ForEach FromFile FromString Function Integrate InverseTaylor Limit LocalSymbols Macro MacroRule MacroRulePattern NIntegrate Rule RulePattern Subst TD TExplicitSum TSum Taylor Taylor1 Taylor2 Taylor3 ToFile ToStdout ToString TraceRule Until While"),
n=/(?:(?:\.\d+|\d+\.\d*|\d+)(?:[eE][+-]?\d+)?)/,r=/(?:[a-zA-Z\$'][a-zA-Z0-9\$']*)/,p=/(?:[a-zA-Z\$'][a-zA-Z0-9\$']*)?_(?:[a-zA-Z\$'][a-zA-Z0-9\$']*)/,q=/(?:[a-zA-Z\$'][a-zA-Z0-9\$']*)\s*\(/;return{startState:function(){return{tokenize:f,scopes:[]}},token:function(a,b){return a.eatSpace()?null:b.tokenize(a,b)},indent:function(a,b){if(a.tokenize!==f&&null!==a.tokenize)return e.Pass;var c=0;if("]"===b||"];"===b||"}"===b||"};"===b||");"===b)c=-1;return(a.scopes.length+c)*h.indentUnit},electricChars:"{}[]();",
blockCommentStart:"/*",blockCommentEnd:"*/",lineComment:"//"}});e.defineMIME("text/x-yacas",{name:"yacas"})});