(function(c){"object"==typeof exports&&"object"==typeof module?c(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],c):c(CodeMirror)})(function(c){c.defineMode("pascal",function(){function c(a,d){var b=a.next();if("#"==b&&d.startOfLine)return a.skipToEnd(),"meta";if('"'==b||"'"==b)return d.tokenize=h(b),d.tokenize(a,d);if("("==b&&a.eat("*"))return d.tokenize=e,e(a,d);if(/[\[\]{}\(\),;\:\.]/.test(b))return null;if(/\d/.test(b))return a.eatWhile(/[\w\.]/),
"number";if("/"==b&&a.eat("/"))return a.skipToEnd(),"comment";if(g.test(b))return a.eatWhile(g),"operator";a.eatWhile(/[\w\$_]/);b=a.current();return k.propertyIsEnumerable(b)?"keyword":l.propertyIsEnumerable(b)?"atom":"variable"}function h(a){return function(d,b){for(var c=!1,f,e=!1;null!=(f=d.next());){if(f==a&&!c){e=!0;break}c=!c&&"\\"==f}if(e||!c)b.tokenize=null;return"string"}}function e(a,d){for(var b=!1,c;c=a.next();){if(")"==c&&b){d.tokenize=null;break}b="*"==c}return"comment"}var k=function(a){var c=
{};a=a.split(" ");for(var b=0;b<a.length;++b)c[a[b]]=!0;return c}("and array begin case const div do downto else end file for forward integer boolean char function goto if in label mod nil not of or packed procedure program record repeat set string then to type until var while with"),l={"null":!0},g=/[+\-*&%=<>!?|\/]/;return{startState:function(){return{tokenize:null}},token:function(a,d){return a.eatSpace()?null:(d.tokenize||c)(a,d)},electricChars:"{}"}});c.defineMIME("text/x-pascal","pascal")});