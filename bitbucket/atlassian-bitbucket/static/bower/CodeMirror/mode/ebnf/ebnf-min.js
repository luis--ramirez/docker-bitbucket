(function(c){"object"==typeof exports&&"object"==typeof module?c(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],c):c(CodeMirror)})(function(c){c.defineMode("ebnf",function(e){var f=null;e.bracesMode&&(f=c.getMode(e,e.bracesMode));return{startState:function(){return{stringType:null,commentType:null,braced:0,lhs:!0,localState:null,stack:[],inDefinition:!1}},token:function(a,b){if(a){0===b.stack.length&&('"'==a.peek()||"'"==a.peek()?(b.stringType=
a.peek(),a.next(),b.stack.unshift(1)):a.match(/^\/\*/)?(b.stack.unshift(0),b.commentType=0):a.match(/^\(\*/)&&(b.stack.unshift(0),b.commentType=1));switch(b.stack[0]){case 1:for(;1===b.stack[0]&&!a.eol();)a.peek()===b.stringType?(a.next(),b.stack.shift()):"\\"===a.peek()?(a.next(),a.next()):a.match(/^.[^\\\"\']*/);return b.lhs?"property string":"string";case 0:for(;0===b.stack[0]&&!a.eol();)0===b.commentType&&a.match(/\*\//)?(b.stack.shift(),b.commentType=null):1===b.commentType&&a.match(/\*\)/)?
(b.stack.shift(),b.commentType=null):a.match(/^.[^\*]*/);return"comment";case 2:for(;2===b.stack[0]&&!a.eol();)a.match(/^[^\]\\]+/)||a.match(/^\\./)||b.stack.shift();return"operator"}var d=a.peek();if(null!==f&&(b.braced||"{"===d)){null===b.localState&&(b.localState=c.startState(f));var d=f.token(a,b.localState),e=a.current();if(!d)for(var g=0;g<e.length;g++)"{"===e[g]?(0===b.braced&&(d="matchingbracket"),b.braced++):"}"===e[g]&&(b.braced--,0===b.braced&&(d="matchingbracket"));return d}switch(d){case "[":return a.next(),
b.stack.unshift(2),"bracket";case ":":case "|":case ";":return a.next(),"operator";case "%":if(a.match("%%"))return"header";if(a.match(/[%][A-Za-z]+/))return"keyword";if(a.match(/[%][}]/))return"matchingbracket";break;case "/":if(a.match(/[\/][A-Za-z]+/))return"keyword";case "\\":if(a.match(/[\][a-z]+/))return"string-2";case ".":if(a.match("."))return"atom";case "*":case "-":case "+":case "^":if(a.match(d))return"atom";case "$":if(a.match("$$"))return"builtin";if(a.match(/[$][0-9]+/))return"variable-3";
case "\x3c":if(a.match(/<<[a-zA-Z_]+>>/))return"builtin"}if(a.match(/^\/\//))return a.skipToEnd(),"comment";if(a.match(/return/))return"operator";if(a.match(/^[a-zA-Z_][a-zA-Z0-9_]*/))return a.match(/(?=[\(.])/)?"variable":a.match(/(?=[\s\n]*[:=])/)?"def":"variable-2";if(-1!=["[","]","(",")"].indexOf(a.peek()))return a.next(),"bracket";a.eatSpace()||a.next();return null}}}});c.defineMIME("text/x-ebnf","ebnf")});