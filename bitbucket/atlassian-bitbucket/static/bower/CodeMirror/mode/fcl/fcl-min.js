(function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)})(function(e){e.defineMode("fcl",function(e){function f(b,c){var a=b.next();if(/[\d\.]/.test(a))return"."==a?b.match(/^[0-9]+([eE][\-+]?[0-9]+)?/):"0"==a?b.match(/^[xX][0-9a-fA-F]+/)||b.match(/^0[0-7]+/):b.match(/^[0-9]*\.?[0-9]*([eE][\-+]?[0-9]+)?/),"number";if("/"==a||"("==a){if(b.eat("*"))return c.tokenize=h,h(b,
c);if(b.eat("/"))return b.skipToEnd(),"comment"}if(k.test(a))return b.eatWhile(k),"operator";b.eatWhile(/[\w\$_\xa1-\uffff]/);a=b.current().toLowerCase();return p.propertyIsEnumerable(a)||l.propertyIsEnumerable(a)||g.propertyIsEnumerable(a)?"keyword":q.propertyIsEnumerable(a)?"atom":"variable"}function h(b,c){for(var a=!1,d;d=b.next();){if(("/"==d||")"==d)&&a){c.tokenize=f;break}a="*"==d}return"comment"}function m(b,c,a,d,e){this.indented=b;this.column=c;this.type=a;this.align=d;this.prev=e}var n=
e.indentUnit,p={term:!0,method:!0,accu:!0,rule:!0,then:!0,is:!0,and:!0,or:!0,"if":!0,"default":!0},l={var_input:!0,var_output:!0,fuzzify:!0,defuzzify:!0,function_block:!0,ruleblock:!0},g={end_ruleblock:!0,end_defuzzify:!0,end_function_block:!0,end_fuzzify:!0,end_var:!0},q={"true":!0,"false":!0,nan:!0,real:!0,min:!0,max:!0,cog:!0,cogs:!0},k=/[+\-*&^%:=<>!|\/]/;return{startState:function(b){return{tokenize:null,context:new m((b||0)-n,0,"top",!1),indented:0,startOfLine:!0}},token:function(b,c){var a=
c.context;b.sol()&&(null==a.align&&(a.align=!1),c.indented=b.indentation(),c.startOfLine=!0);if(b.eatSpace())return null;var d=(c.tokenize||f)(b,c);if("comment"==d)return d;null==a.align&&(a.align=!0);a=b.current().toLowerCase();l.propertyIsEnumerable(a)?(a=b.column(),c.context=new m(c.indented,a,"end_block",null,c.context)):g.propertyIsEnumerable(a)&&c.context.prev&&("end_block"==c.context.type&&(c.indented=c.context.indented),c.context=c.context.prev);c.startOfLine=!1;return d},indent:function(b,
c){if(b.tokenize!=f&&null!=b.tokenize)return 0;var a=b.context,d=g.propertyIsEnumerable(c);return a.align?a.column+(d?0:1):a.indented+(d?0:n)},electricChars:"ryk",fold:"brace",blockCommentStart:"(*",blockCommentEnd:"*)",lineComment:"//"}});e.defineMIME("text/x-fcl","fcl")});