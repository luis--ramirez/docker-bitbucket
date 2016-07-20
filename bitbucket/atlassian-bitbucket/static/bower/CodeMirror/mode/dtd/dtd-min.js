(function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)})(function(e){e.defineMode("dtd",function(e){function f(c,b){d=b;return c}function g(c,b){var a=c.next();if("\x3c"==a&&c.eat("!")){if(c.eatWhile(/[\-]/))return b.tokenize=h,h(c,b);if(c.eatWhile(/[\w]/))return f("keyword","doindent")}else{if("\x3c"==a&&c.eat("?"))return b.tokenize=k("meta","?\x3e"),f("meta",a);if("#"==
a&&c.eatWhile(/[\w]/))return f("atom","tag");if("|"==a)return f("keyword","seperator");if(a.match(/[\(\)\[\]\-\.,\+\?>]/))return f(null,a);if(a.match(/[\[\]]/))return f("rule",a);if('"'==a||"'"==a)return b.tokenize=l(a),b.tokenize(c,b);if(c.eatWhile(/[a-zA-Z\?\+\d]/))return a=c.current(),null!==a.substr(a.length-1,a.length).match(/\?|\+/)&&c.backUp(1),f("tag","tag");if("%"==a||"*"==a)return f("number","number");c.eatWhile(/[\w\\\-_%.{,]/);return f(null,null)}}function h(c,b){for(var a=0,d;null!=(d=
c.next());){if(2<=a&&"\x3e"==d){b.tokenize=g;break}a="-"==d?a+1:0}return f("comment","comment")}function l(c){return function(b,a){for(var d=!1,e;null!=(e=b.next());){if(e==c&&!d){a.tokenize=g;break}d=!d&&"\\"==e}return f("string","tag")}}function k(c,b){return function(a,d){for(;!a.eol();){if(a.match(b)){d.tokenize=g;break}a.next()}return c}}var m=e.indentUnit,d;return{startState:function(c){return{tokenize:g,baseIndent:c||0,stack:[]}},token:function(c,b){if(c.eatSpace())return null;var a=b.tokenize(c,
b),e=b.stack[b.stack.length-1];"["==c.current()||"doindent"===d||"["==d?b.stack.push("rule"):"endtag"===d?b.stack[b.stack.length-1]="endtag":"]"==c.current()||"]"==d||"\x3e"==d&&"rule"==e?b.stack.pop():"["==d&&b.stack.push("[");return a},indent:function(c,b){var a=c.stack.length;if(b.match(/\]\s+|\]/))--a;else if("\x3e"===b.substr(b.length-1,b.length)){if("\x3c"!==b.substr(0,1)&&!("doindent"==d&&1<b.length))if("doindent"==d)a--;else if(!("\x3e"==d&&1<b.length||"tag"==d&&"\x3e"!==b))if("tag"==d&&"rule"==
c.stack[c.stack.length-1])a--;else if("tag"==d)a++;else if("\x3e"===b&&"rule"==c.stack[c.stack.length-1]&&"\x3e"===d)a--;else if("\x3e"!==b||"rule"!=c.stack[c.stack.length-1])"\x3c"!==b.substr(0,1)&&"\x3e"===b.substr(0,1)?--a:"\x3e"!==b&&--a;null!=d&&"]"!=d||a--}return c.baseIndent+a*m},electricChars:"]\x3e"}});e.defineMIME("application/xml-dtd","dtd")});