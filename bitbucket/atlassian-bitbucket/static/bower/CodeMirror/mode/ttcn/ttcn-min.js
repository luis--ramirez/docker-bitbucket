(function(h){"object"==typeof exports&&"object"==typeof module?h(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],h):h(CodeMirror)})(function(h){function a(a){var d={};a=a.split(" ");for(var g=0;g<a.length;++g)d[a[g]]=!0;return d}h.defineMode("ttcn",function(a,d){function g(c,f){var b=c.next();if('"'==b||"'"==b)return f.tokenize=h(b),f.tokenize(c,f);if(/[\[\]{}\(\),;\\:\?\.]/.test(b))return e=b,"punctuation";if("#"==b)return c.skipToEnd(),"atom preprocessor";
if("%"==b)return c.eatWhile(/\b/),"atom ttcn3Macros";if(/\d/.test(b))return c.eatWhile(/[\w\.]/),"number";if("/"==b){if(c.eat("*"))return f.tokenize=k,k(c,f);if(c.eat("/"))return c.skipToEnd(),"comment"}if(p.test(b)){if("@"==b&&(c.match("try")||c.match("catch")||c.match("lazy")))return"keyword";c.eatWhile(p);return"operator"}c.eatWhile(/[\w\$_\xa1-\uffff]/);b=c.current();return r.propertyIsEnumerable(b)?"keyword":t.propertyIsEnumerable(b)?"builtin":u.propertyIsEnumerable(b)?"def timerOps":v.propertyIsEnumerable(b)?
"def configOps":w.propertyIsEnumerable(b)?"def verdictOps":x.propertyIsEnumerable(b)?"def portOps":y.propertyIsEnumerable(b)?"def sutOps":z.propertyIsEnumerable(b)?"def functionOps":A.propertyIsEnumerable(b)?"string verdictConsts":B.propertyIsEnumerable(b)?"string booleanConsts":C.propertyIsEnumerable(b)?"string otherConsts":D.propertyIsEnumerable(b)?"builtin types":E.propertyIsEnumerable(b)?"builtin visibilityModifiers":F.propertyIsEnumerable(b)?"atom templateMatch":"variable"}function h(c){return function(f,
b){for(var d=!1,a,e=!1;null!=(a=f.next());){if(a==c&&!d){if(a=f.peek())a=a.toLowerCase(),"b"!=a&&"h"!=a&&"o"!=a||f.next();e=!0;break}d=!d&&"\\"==a}if(e||!d&&!G)b.tokenize=null;return"string"}}function k(c,f){for(var b=!1,a;a=c.next();){if("/"==a&&b){f.tokenize=null;break}b="*"==a}return"comment"}function q(c,a,b,d,e){this.indented=c;this.column=a;this.type=b;this.align=d;this.prev=e}function m(c,a,b){var d=c.indented;c.context&&"statement"==c.context.type&&(d=c.context.indented);return c.context=
new q(d,a,b,null,c.context)}function l(c){var a=c.context.type;if(")"==a||"]"==a||"}"==a)c.indented=c.context.indented;return c.context=c.context.prev}var H=a.indentUnit,r=d.keywords||{},t=d.builtin||{},u=d.timerOps||{},x=d.portOps||{},v=d.configOps||{},w=d.verdictOps||{},y=d.sutOps||{},z=d.functionOps||{},A=d.verdictConsts||{},B=d.booleanConsts||{},C=d.otherConsts||{},D=d.types||{},E=d.visibilityModifiers||{},F=d.templateMatch||{},G=d.multiLineStrings,I=!1!==d.indentStatements,p=/[+\-*&@=<>!\/]/,
e;return{startState:function(c){return{tokenize:null,context:new q((c||0)-H,0,"top",!1),indented:0,startOfLine:!0}},token:function(c,a){var b=a.context;c.sol()&&(null==b.align&&(b.align=!1),a.indented=c.indentation(),a.startOfLine=!0);if(c.eatSpace())return null;e=null;var d=(a.tokenize||g)(c,a);if("comment"==d)return d;null==b.align&&(b.align=!0);if(";"!=e&&":"!=e&&","!=e||"statement"!=b.type)if("{"==e)m(a,c.column(),"}");else if("["==e)m(a,c.column(),"]");else if("("==e)m(a,c.column(),")");else if("}"==
e){for(;"statement"==b.type;)b=l(a);for("}"==b.type&&(b=l(a));"statement"==b.type;)b=l(a)}else e==b.type?l(a):I&&(("}"==b.type||"top"==b.type)&&";"!=e||"statement"==b.type&&"newstatement"==e)&&m(a,c.column(),"statement");else l(a);a.startOfLine=!1;return d},electricChars:"{}",blockCommentStart:"/*",blockCommentEnd:"*/",lineComment:"//",fold:"brace"}});(function(a,d){function g(a){if(a)for(var d in a)a.hasOwnProperty(d)&&n.push(d)}"string"==typeof a&&(a=[a]);var n=[];g(d.keywords);g(d.builtin);g(d.timerOps);
g(d.portOps);n.length&&(d.helperType=a[0],h.registerHelper("hintWords",a[0],n));for(var k=0;k<a.length;++k)h.defineMIME(a[k],d)})(["text/x-ttcn","text/x-ttcn3","text/x-ttcnpp"],{name:"ttcn",keywords:a("activate address alive all alt altstep and and4b any break case component const continue control deactivate display do else encode enumerated except exception execute extends extension external for from function goto group if import in infinity inout interleave label language length log match message mixed mod modifies module modulepar mtc noblock not not4b nowait of on optional or or4b out override param pattern port procedure record recursive rem repeat return runs select self sender set signature system template testcase to type union value valueof var variant while with xor xor4b"),
builtin:a("bit2hex bit2int bit2oct bit2str char2int char2oct encvalue decomp decvalue float2int float2str hex2bit hex2int hex2oct hex2str int2bit int2char int2float int2hex int2oct int2str int2unichar isbound ischosen ispresent isvalue lengthof log2str oct2bit oct2char oct2hex oct2int oct2str regexp replace rnd sizeof str2bit str2float str2hex str2int str2oct substr unichar2int unichar2char enum2int"),types:a("anytype bitstring boolean char charstring default float hexstring integer objid octetstring universal verdicttype timer"),
timerOps:a("read running start stop timeout"),portOps:a("call catch check clear getcall getreply halt raise receive reply send trigger"),configOps:a("create connect disconnect done kill killed map unmap"),verdictOps:a("getverdict setverdict"),sutOps:a("action"),functionOps:a("apply derefers refers"),verdictConsts:a("error fail inconc none pass"),booleanConsts:a("true false"),otherConsts:a("null NULL omit"),visibilityModifiers:a("private public friend"),templateMatch:a("complement ifpresent subset superset permutation"),
multiLineStrings:!0})});