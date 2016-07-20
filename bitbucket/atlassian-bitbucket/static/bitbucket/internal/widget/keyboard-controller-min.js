define("bitbucket/internal/widget/keyboard-controller",["aui","jquery"],function(r,f){function n(b,d){if(!(this instanceof n))return new n(b,d);var a=f(b),h;a.on("keydown",h=function(a){a.keyCode in d&&(d[a.keyCode](a)||a.preventDefault())});this.destroy=function(){a.off("keydown",h)};return this}function p(b,d){function a(a){a.focus().addClass(d.focusedClass)}d=f.extend({},p.defaults,d);var h={};h[r.keyCode.TAB]=function(h){var e,l,g,m=h.target;e=f("a:visible, :input:visible:enabled, :checkbox:visible:enabled, :radio:visible:enabled, [tabindex]",
b).not("[tabindex\x3d-1]").filter(function(){return"hidden"!==f(this).css("visibility")});g=e.last();l=e.first();e.removeClass(d.focusedClass);if(h.shiftKey&&m===l[0]){if(!d.wrapAround)return!0;a(g)}else if(h.shiftKey||m!==g[0])h.shiftKey?a(e.eq(e.index(m)-1)):a(e.eq(e.index(m)+1));else{if(!d.wrapAround)return!0;a(l)}};return new n(b,h)}function u(b,d,a){function h(c){do{var f=c.find("\x3e:first-child"),b=c.next();c=f.length?f:b.length?b:c.parentsUntil(l[0]).next().first()}while(c.length&&!c.is(a.itemSelector));
return c}function p(c){do{var b=c.prev();if(b.length){for(;(c=b.find("\x3e:last-child")).length;)b=c;c=b}else c=c.parent(),c[0]===l[0]&&(c=f())}while(c.length&&!c.is(a.itemSelector));return c}function e(c){return function x(b){var d=f(a.itemSelector,l),e=d.filter(function(){return f(this).hasClass(a.focusedClass)}),g=!1,k;if(e.length)k=a.adjacentItems?e[c](a.itemSelector):"next"===c?h(e):p(e);else if("next"===c)k=d.first();else if(a.wrapAround)k=d.last();else return;q=!0;if(!k.length){if("next"===
c&&a.requestMore&&!v){w?q=!1:(q=!1,(k=a.requestMore())?(w=!0,k.done(function(a){v=a;q||x(b)}).always(function(){q=w=!1})):(v=!0,x(b)));return}if(a.wrapAround)g=!0,k=d["next"===c?"first":"last"]();else{if(a.onFocusLastItem&&"next"===c)a.onFocusLastItem();return}}e.removeClass(a.focusedClass);k.addClass(a.focusedClass);d=k[c]();g=!g&&d.length?d:k;d=document.activeElement;a.focusIntoView&&d?(e=g.attr("tabindex"),g.attr("tabindex","0"),g.focus(),d.focus(),null==e?g.removeAttr("tabindex"):g.attr("tabindex",
e)):k[0].scrollIntoView(!1);m.fire(k,b)}}a=f.extend({},u.defaults,a);var l=f(d),g=f.Callbacks(),m=f.Callbacks();a.onSelect&&g.add(a.onSelect);a.onFocus&&m.add(a.onFocus);var v=!1,w=!1,q=!1,t={};d=t[r.keyCode.UP]=e("prev");var y=t[r.keyCode.DOWN]=e("next");t[r.keyCode.ENTER]=function(c){var b=f(a.itemSelector,l).filter(function(){return f(this).hasClass(a.focusedClass)});b.length&&g.fire(b,c)};b=new n(b,t);b.setListElement=function(a){l=f(a)};b.blur=function(){f(a.itemSelector,l).removeClass(a.focusedClass)};
b.focus=function(){m.add.apply(m,arguments);return this};b.select=function(){g.add.apply(g,arguments);return this};b.moveToNext=y;b.moveToPrev=d;return b}p.defaults={focusedClass:"item-focused",wrapAround:!0};u.defaults={itemSelector:"li",focusedClass:"item-focused",wrapAround:!1,adjacentItems:!0,requestMore:void 0,onFocus:void 0,onSelect:void 0};return{KeyboardController:n,TabKeyboardController:p,ListKeyboardController:u}});