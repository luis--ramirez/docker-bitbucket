(function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror"),require("../dialog/dialog")):"function"==typeof define&&define.amd?define(["../../lib/codemirror","../dialog/dialog"],e):e(CodeMirror)})(function(e){function g(a,d,b,c,e){a.openDialog?a.openDialog(d,e,{value:c,selectValueOnOpen:!0}):e(prompt(b,c))}function f(a,d){var b=Number(d);return/^[-+]/.test(d)?a.getCursor().line+b:b-1}e.commands.jumpToLine=function(a){var d=a.getCursor();g(a,'Jump to line: \x3cinput type\x3d"text" style\x3d"width: 10em" class\x3d"CodeMirror-search-field"/\x3e \x3cspan style\x3d"color: #888" class\x3d"CodeMirror-search-hint"\x3e(Use line:column or scroll% syntax)\x3c/span\x3e',
"Jump to line:",d.line+1+":"+d.ch,function(b){if(b){var c;(c=/^\s*([\+\-]?\d+)\s*\:\s*(\d+)\s*$/.exec(b))?a.setCursor(f(a,c[1]),Number(c[2])):(c=/^\s*([\+\-]?\d+(\.\d+)?)\%\s*/.exec(b))?(b=Math.round(a.lineCount()*Number(c[1])/100),/^[-+]/.test(c[1])&&(b=d.line+b+1),a.setCursor(b-1,d.ch)):(c=/^\s*\:?\s*([\+\-]?\d+)\s*/.exec(b))&&a.setCursor(f(a,c[1]),d.ch)}})};e.keyMap["default"]["Alt-G"]="jumpToLine"});