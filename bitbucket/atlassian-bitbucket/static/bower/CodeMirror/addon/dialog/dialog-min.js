(function(b){"object"==typeof exports&&"object"==typeof module?b(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],b):b(CodeMirror)})(function(b){function l(c,b,a){c=c.getWrapperElement().appendChild(document.createElement("div"));c.className=a?"CodeMirror-dialog CodeMirror-dialog-bottom":"CodeMirror-dialog CodeMirror-dialog-top";"string"==typeof b?c.innerHTML=b:c.appendChild(b);return c}function m(b,g){b.state.currentNotificationClose&&b.state.currentNotificationClose();
b.state.currentNotificationClose=g}b.defineExtension("openDialog",function(c,g,a){function e(b){if("string"==typeof b)d.value=b;else if(!h&&(h=!0,f.parentNode.removeChild(f),k.focus(),a.onClose))a.onClose(f)}a||(a={});m(this,null);var f=l(this,c,a.bottom),h=!1,k=this,d=f.getElementsByTagName("input")[0];if(d){d.focus();a.value&&(d.value=a.value,!1!==a.selectValueOnOpen&&d.select());if(a.onInput)b.on(d,"input",function(b){a.onInput(b,d.value,e)});if(a.onKeyUp)b.on(d,"keyup",function(b){a.onKeyUp(b,
d.value,e)});b.on(d,"keydown",function(c){if(!(a&&a.onKeyDown&&a.onKeyDown(c,d.value,e))){if(27==c.keyCode||!1!==a.closeOnEnter&&13==c.keyCode)d.blur(),b.e_stop(c),e();13==c.keyCode&&g(d.value,c)}});if(!1!==a.closeOnBlur)b.on(d,"blur",e)}else if(c=f.getElementsByTagName("button")[0]){b.on(c,"click",function(){e();k.focus()});if(!1!==a.closeOnBlur)b.on(c,"blur",e);c.focus()}return e});b.defineExtension("openConfirm",function(c,g,a){function e(){h||(h=!0,f.parentNode.removeChild(f),k.focus())}m(this,
null);var f=l(this,c,a&&a.bottom);c=f.getElementsByTagName("button");var h=!1,k=this,d=1;c[0].focus();for(a=0;a<c.length;++a){var n=c[a];(function(a){b.on(n,"click",function(c){b.e_preventDefault(c);e();a&&a(k)})})(g[a]);b.on(n,"blur",function(){--d;setTimeout(function(){0>=d&&e()},200)});b.on(n,"focus",function(){++d})}});b.defineExtension("openNotification",function(c,g){function a(){f||(f=!0,clearTimeout(h),e.parentNode.removeChild(e))}m(this,a);var e=l(this,c,g&&g.bottom),f=!1,h,k=g&&"undefined"!==
typeof g.duration?g.duration:5E3;b.on(e,"click",function(c){b.e_preventDefault(c);a()});k&&(h=setTimeout(a,k));return a})});