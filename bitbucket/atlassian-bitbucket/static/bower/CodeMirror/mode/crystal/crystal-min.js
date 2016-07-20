(function(g){"object"==typeof exports&&"object"==typeof module?g(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],g):g(CodeMirror)})(function(g){g.defineMode("crystal",function(g){function m(a,b){return new RegExp((b?"":"^")+"(?:"+a.join("|")+")"+(b?"$":"\\b"))}function h(a,b,c){c.tokenize.push(a);return a(b,c)}function r(a,b){if(a.eatSpace())return null;if("\\"!=b.lastToken&&a.match("{%",!1))return h(n("%","%"),a,b);if("\\"!=b.lastToken&&a.match("{{",
!1))return h(n("{","}"),a,b);if("#"==a.peek())return a.skipToEnd(),"comment";var c;if(a.match(k))return a.eat(/[?!]/),c=a.current(),a.eat(":")?"atom":"."==b.lastToken?"property":D.test(c)?("abstract"!=b.lastToken&&E.test(c)?"fun"==c&&0<=b.blocks.indexOf("lib")||(b.blocks.push(c),b.currentIndent+=1):x.test(c)&&(b.blocks.pop(),--b.currentIndent),y.hasOwnProperty(c)&&b.tokenize.push(y[c]),"keyword"):F.test(c)?"atom":"variable";if(a.eat("@")){if("["==a.peek())return h(q("[","]","meta"),a,b);a.eat("@");
a.match(k)||a.match(p);return"variable-2"}if(a.eat("$"))return a.eat(/[0-9]+|\?/)||a.match(k)||a.match(p),"variable-3";if(a.match(p))return"tag";if(a.eat(":")){if(a.eat('"'))return h(t('"',"atom",!1),a,b);if(a.match(k)||a.match(p)||a.match(u)||a.match(v)||a.match(z))return"atom";a.eat(":");return"operator"}if(a.eat('"'))return h(t('"',"string",!0),a,b);if("%"==a.peek()){c="string";var e=!0,d;if(a.match("%r"))c="string-2",d=a.next();else if(a.match("%w"))e=!1,d=a.next();else if(d=a.match(/^%([^\w\s=])/))d=
d[1];else return a.match(/^%[a-zA-Z0-9_\u009F-\uFFFF]*/)?"meta":"operator";w.hasOwnProperty(d)&&(d=w[d]);return h(t(d,c,e),a,b)}if(a.eat("'"))return a.match(/^(?:[^']|\\(?:[befnrtv0'"]|[0-7]{3}|u(?:[0-9a-fA-F]{4}|\{[0-9a-fA-F]{1,6}\})))/),a.eat("'"),"atom";if(a.eat("0"))return a.eat("x")?a.match(/^[0-9a-fA-F]+/):a.eat("o")?a.match(/^[0-7]+/):a.eat("b")&&a.match(/^[01]+/),"number";if(a.eat(/\d/))return a.match(/^\d*(?:\.\d+)?(?:[eE][+-]?\d+)?/),"number";if(a.match(u))return a.eat("\x3d"),"operator";
if(a.match(v)||a.match(G))return"operator";if(c=a.match(/[({[]/,!1))return c=c[0],h(q(c,w[c],null),a,b);if(a.eat("\\"))return a.next(),"meta";a.next();return null}function q(a,b,c,e){return function(d,f){if(!e&&d.match(a))return f.tokenize[f.tokenize.length-1]=q(a,b,c,!0),f.currentIndent+=1,c;var g=r(d,f);d.current()===b&&(f.tokenize.pop(),--f.currentIndent,g=c);return g}}function n(a,b,c){return function(e,d){return!c&&e.match("{"+a)?(d.currentIndent+=1,d.tokenize[d.tokenize.length-1]=n(a,b,!0),
"meta"):e.match(b+"}")?(--d.currentIndent,d.tokenize.pop(),"meta"):r(e,d)}}function A(a,b){if(a.eatSpace())return null;a.match(k)?a.eat(/[!?]/):a.match(u)||a.match(v)||a.match(z);b.tokenize.pop();return"def"}function l(a,b){if(a.eatSpace())return null;a.match(p);b.tokenize.pop();return"def"}function t(a,b,c){return function(e,d){for(var f=!1;e.peek();)if(f)e.next(),f=!1;else{if(e.match("{%",!1)){d.tokenize.push(n("%","%"));break}if(e.match("{{",!1)){d.tokenize.push(n("{","}"));break}if(c&&e.match("#{",
!1)){d.tokenize.push(q("#{","}","meta"));break}f=e.next();if(f==a){d.tokenize.pop();break}f="\\"==f}return b}}var u=/^(?:[-+/%|&^]|\*\*?|[<>]{2})/,v=/^(?:[=!]~|===|<=>|[<>=!]=?|[|&]{2}|~)/,z=/^(?:\[\][?=]?)/,G=/^(?:\.(?:\.{2})?|->|[?:])/,k=/^[a-z_\u009F-\uFFFF][a-zA-Z0-9_\u009F-\uFFFF]*/,p=/^[A-Z_\u009F-\uFFFF][a-zA-Z0-9_\u009F-\uFFFF]*/,D=m("abstract alias as asm begin break case class def do else elsif end ensure enum extend for fun if ifdef include instance_sizeof lib macro module next of out pointerof private protected rescue return require sizeof struct super then type typeof union unless until when while with yield __DIR__ __FILE__ __LINE__".split(" ")),
F=m(["true","false","nil","self"]),E=m("def fun macro class module struct lib enum union if unless case while until begin then do for ifdef".split(" ")),B=["end","else","elsif","rescue","ensure"],x=m(B),C=["\\)","\\}","\\]"],H=new RegExp("^(?:"+C.join("|")+")$"),y={def:A,fun:A,macro:function(a,b){if(a.eatSpace())return null;var c;if(c=a.match(k)){if("def"==c)return"keyword";a.eat(/[?!]/)}b.tokenize.pop();return"def"},"class":l,module:l,struct:l,lib:l,"enum":l,union:l},w={"[":"]","{":"}","(":")","\x3c":"\x3e"};
return{startState:function(){return{tokenize:[r],currentIndent:0,lastToken:null,blocks:[]}},token:function(a,b){var c=b.tokenize[b.tokenize.length-1](a,b),e=a.current();c&&"comment"!=c&&(b.lastToken=e);return c},indent:function(a,b){b=b.replace(/^\s*(?:\{%)?\s*|\s*(?:%\})?\s*$/g,"");return x.test(b)||H.test(b)?g.indentUnit*(a.currentIndent-1):g.indentUnit*a.currentIndent},fold:"indent",electricInput:m(C.concat(B),!0),lineComment:"#"}});g.defineMIME("text/x-crystal","crystal")});