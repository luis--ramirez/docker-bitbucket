(function(c){"object"==typeof exports&&"object"==typeof module?c(require("../../lib/codemirror"),require("../../addon/mode/multiplex")):"function"==typeof define&&define.amd?define(["../../lib/codemirror","../../addon/mode/multiplex"],c):c(CodeMirror)})(function(c){c.defineMode("twig:inner",function(){function c(a,b){var d=a.peek();if(b.incomment)return a.skipTo("#}")?(a.eatWhile(/\#|}/),b.incomment=!1):a.skipToEnd(),"comment";if(b.intag){if(b.operator){b.operator=!1;if(a.match(f))return"atom";if(a.match(h))return"number"}if(b.sign){b.sign=
!1;if(a.match(f))return"atom";if(a.match(h))return"number"}if(b.instring)return d==b.instring&&(b.instring=!1),a.next(),"string";if("'"==d||'"'==d)return b.instring=d,a.next(),"string";if(a.match(b.intag+"}")||a.eat("-")&&a.match(b.intag+"}"))return b.intag=!1,"tag";if(a.match(g))return b.operator=!0,"operator";if(a.match(l))b.sign=!0;else if(a.eat(" ")||a.sol()){if(a.match(e))return"keyword";if(a.match(f))return"atom";if(a.match(h))return"number";a.sol()&&a.next()}else a.next();return"variable"}if(a.eat("{")){if(a.eat("#"))return b.incomment=
!0,a.skipTo("#}")?(a.eatWhile(/\#|}/),b.incomment=!1):a.skipToEnd(),"comment";if(d=a.eat(/\{|%/))return b.intag=d,"{"==d&&(b.intag="}"),a.eat("-"),"tag"}a.next()}var e="and as autoescape endautoescape block do endblock else elseif extends for endfor embed endembed filter endfilter flush from if endif in is include import not or set spaceless endspaceless with endwith trans endtrans blocktrans endblocktrans macro endmacro use verbatim endverbatim".split(" "),g=/^[+\-*&%=<>!?|~^]/,l=/^[:\[\(\{]/,f=
"true;false;null;empty;defined;divisibleby;divisible by;even;odd;iterable;sameas;same as".split(";"),h=/^(\d[+\-\*\/])?\d+(\.\d+)?/,e=new RegExp("(("+e.join(")|(")+"))\\b"),f=new RegExp("(("+f.join(")|(")+"))\\b");return{startState:function(){return{}},token:function(a,b){return c(a,b)}}});c.defineMode("twig",function(k,e){var g=c.getMode(k,"twig:inner");return e&&e.base?c.multiplexingMode(c.getMode(k,e.base),{open:/\{[{#%]/,close:/[}#%]\}/,mode:g,parseDelimiters:!0}):g});c.defineMIME("text/x-twig",
"twig")});