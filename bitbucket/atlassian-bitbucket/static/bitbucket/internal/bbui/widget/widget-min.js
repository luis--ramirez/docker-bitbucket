define("bitbucket/internal/bbui/widget/widget",["module","exports","lodash"],function(k,g,f){function h(d,a){var e=Object.getOwnPropertyNames(d).filter(function(a){if(-1!==l.indexOf(a))return!1;a=Object.getOwnPropertyDescriptor(d,a);return c.default.isFunction(a.value)}),b=Object.getPrototypeOf(d);return b.isPrototypeOf(a)?e:c.default.uniq(e.concat(h(b,a)))}Object.defineProperty(g,"__esModule",{value:!0});var c=babelHelpers.interopRequireDefault(f);f=function(){function d(a){babelHelpers.classCallCheck(this,
d);c.default.bindAll(this,h(this,d));a&&(this.options=c.default.extend({},this.constructor.defaults,a))}babelHelpers.createClass(d,[{key:"_getListeners",value:function(a){this._listeners||(this._listeners={});this._listeners[a]||(this._listeners[a]=[]);return this._listeners[a]}},{key:"on",value:function(a,e){var b=this._getListeners(a);c.default.contains(b,e)||b.push(e);return this}},{key:"off",value:function(a,e){for(var b=this._getListeners(a),c=b.length;c--;)b[c]!==e&&b[c]._handler!==e||b.splice(c,
1);return this}},{key:"once",value:function(a,c){var b=this.off.bind(this,a,c);b._handler=c;this.on(a,c);this.on(a,b);return this}},{key:"trigger",value:function(a){for(var e=this,b=arguments.length,d=Array(1<b?b-1:0),f=1;f<b;f++)d[f-1]=arguments[f];this._getListeners(a).slice().forEach(function(a){try{a.apply(e,d)}catch(b){c.default.defer(function(){throw b;})}});return this}},{key:"_addDestroyable",value:function(a){this._destroyables||(this._destroyables=[]);c.default.isFunction(a)&&(a={destroy:a});
if(!c.default.isFunction(a.destroy))throw Error("Argument is not destroyable");this._destroyables.push(a);return this}},{key:"destroy",value:function(){this._destroyables&&(c.default.invoke(this._destroyables,"destroy"),this._destroyables=null);this.trigger("destroy");this._listeners&&(this._listeners=null)}},{key:"options",get:function(){return this._options},set:function(a){this._options=a}}]);return d}();Object.defineProperty(f.prototype,"__nonEnumerable",{enumerable:!0,get:function(){throw Error("BitbucketWidget is not enumerable. Inherit using Object.create().");
}});var l=["constructor","__nonEnumerable"];g.default=f;k.exports=g["default"]});