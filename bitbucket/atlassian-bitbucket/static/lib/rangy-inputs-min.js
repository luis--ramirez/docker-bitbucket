/*
 Rangy Text Inputs, a cross-browser textarea and text input library plug-in for jQuery.

 Part of Rangy, a cross-browser JavaScript range and selection library
 http://code.google.com/p/rangy/

 Depends on jQuery 1.0 or later.

 Copyright 2010, Tim Down
 Licensed under the MIT license.
 Version: 0.1.205
 Build date: 5 November 2010

 Modified by Atlassian
*/
(function(p){function q(e,d){var f=typeof e[d];return"function"===f||!("object"!=f||!e[d])||"unknown"==f}function r(e,d){return!("object"!=typeof e[d]||!e[d])}function t(e,d,f){0>d&&(d+=e.value.length);"undefined"==typeof f&&(f=d);0>f&&(f+=e.value.length);return{start:d,end:f}}function l(){return r(document,"body")?document.body:document.getElementsByTagName("body")[0]}var h,g,u,m,v,w,x,y,n;p(document).ready(function(){function e(c,a){return function(){var b=this.jquery?this[0]:this,k=b.nodeName.toLowerCase();
if(1==b.nodeType&&("textarea"==k||"input"==k&&"text"==b.type)&&(b=[b].concat(Array.prototype.slice.call(arguments)),b=c.apply(this,b),!a))return b;if(a)return this}}var d=document.createElement("textarea");l().appendChild(d);if("undefined"!=typeof d.selectionStart&&"undefined"!=typeof d.selectionEnd)h=function(c){var a=c.selectionStart,b=c.selectionEnd;return{start:a,end:b,length:b-a,text:c.value.slice(a,b)}},g=function(c,a,b){a=t(c,a,b);c.selectionStart=a.start;c.selectionEnd=a.end},n=function(c,
a){a?c.selectionEnd=c.selectionStart:c.selectionStart=c.selectionEnd};else if(q(d,"createTextRange")&&r(document,"selection")&&q(document.selection,"createRange")){h=function(c){var a=0,b=0,k,e,d;(d=document.selection.createRange())&&d.parentElement()==c&&(k=c.value.replace(/\r\n/g,"\n"),e=k.length,b=c.createTextRange(),b.moveToBookmark(d.getBookmark()),d=c.createTextRange(),d.collapse(!1),-1<b.compareEndPoints("StartToEnd",d)?a=b=e:(a=-b.moveStart("character",-e),a+=k.slice(0,a).split("\n").length-
1,-1<b.compareEndPoints("EndToEnd",d)?b=e:(b=-b.moveEnd("character",-e),b+=k.slice(0,b).split("\n").length-1)));return{start:a,end:b,length:b-a,text:c.value.slice(a,b)}};var f=function(c,a){return a-(c.value.slice(0,a).split("\r\n").length-1)};g=function(c,a,b){a=t(c,a,b);b=c.createTextRange();var d=f(c,a.start);b.collapse(!0);a.start==a.end?b.move("character",d):(b.moveEnd("character",f(c,a.end)),b.moveStart("character",d));b.select()};n=function(c,a){var b=document.selection.createRange();b.collapse(a);
b.select()}}else{l().removeChild(d);window.console&&window.console.log&&window.console.log("TextInputs module for Rangy not supported in your browser. Reason: No means of finding text input caret position");return}l().removeChild(d);m=function(c,a,b,d){var e;a!=b&&(e=c.value,c.value=e.slice(0,a)+e.slice(b));d&&g(c,a,a)};u=function(c){var a=h(c);m(c,a.start,a.end,!0)};y=function(c){var a=h(c),b;a.start!=a.end&&(b=c.value,c.value=b.slice(0,a.start)+b.slice(a.end));g(c,a.start,a.start);return a.text};
v=function(c,a,b,d){var e=c.value;c.value=e.slice(0,b)+a+e.slice(b);d&&(a=b+a.length,g(c,a,a))};w=function(c,a){var b=h(c),d=c.value;c.value=d.slice(0,b.start)+a+d.slice(b.end);b=b.start+a.length;g(c,b,b)};x=function(c,a,b){var d=h(c),e=c.value;c.value=e.slice(0,d.start)+a+d.text+b+e.slice(d.end);a=d.start+a.length;g(c,a,a+d.length)};p.fn.extend({getSelection:e(h,!1),setSelection:e(g,!0),collapseSelection:e(n,!0),deleteSelectedText:e(u,!0),deleteText:e(m,!0),extractSelectedText:e(y,!1),insertText:e(v,
!0),replaceSelectedText:e(w,!0),surroundSelectedText:e(x,!0)})})})(jQuery);