(function(){function m(a){return d.isArray(a)?d.reduce(a,function(b,a){b[a]=null;return b},{}):a}function k(a,b){if(!a||null==b)return b;if("string"===typeof a||a instanceof String){if(typeof b!==""+a)throw"The typeof "+b+" is "+typeof b+" but expected it to be "+a;return b}if(d.isArray(a)||a===Array){if(!d.has(b,"length")||b instanceof String||d.has({string:1,"function":1},typeof b)||b instanceof f.Collection)throw"Array type expected, but nonnull, non-Array value provided.";return a!==Array&&a[0]?
d.map(b,d.bind(k,null,a[0])):b}if("function"!==typeof a)throw"Invalid expected type "+a+". Should be falsy, String, Array, Backbone.Collection constructor, or function.";return b instanceof a?b:n(a)?new a(k([a.model],b)):new a(b)}function n(a,b){return a&&(a.__super__ instanceof(b||f.Collection)||a.__super__===(b||f.Collection).prototype||a===(b||f.Collection))}function r(a,b){var e={};d.each(a,function(a,d){if(!b[d]||p(a,b[d]))e[d]=a;else if(a&&!p(b[d],a))throw d+" has conflicted type descriptors.";
});return e}function p(a,b){return b&&b!==a?a&&"string"!==typeof a?a instanceof Array?b===Array||b instanceof Array&&p(a[0],b[0]):"function"!==typeof b?!1:n(b)?n(a,b):a.prototype instanceof b:!1:!0}function u(a){return d.isObject(a)?d.reduce(a,function(a,e,c){e&&d.isFunction(e.toJSON)?a[c]=e.toJSON():d.isArray(e)&&(a[c]=d.map(e,function(a){return a&&d.isFunction(a.toJSON)?a.toJSON():a}));return a},a):a}function v(a){return function(){var b=a.call(this);return u(b)}}function w(a){return function e(c,
t){var g,q=d.extend({},c),f;c&&c.mixins&&(f=c.mixins,delete q.mixins);g=a.call(this,q,t);this.prototype.namedEvents&&h.Mixins.applyMixin(g,{namedEvents:this.prototype.namedEvents});this.prototype.namedAttributes&&h.Mixins.applyMixin(g,{namedAttributes:this.prototype.namedAttributes});f&&d.each(c.mixins,function(a){h.Mixins.applyMixin(g,a)});g.prototype.namedEvents&&h.Mixins.applyMixin(g,h.EventsMixinCreator.create(g.prototype.namedEvents));g.prototype.namedAttributes&&(g.prototype.namedAttributes=
m(g.prototype.namedAttributes),h.Mixins.applyMixin(g,h.AttributesMixinCreator.create(g.prototype.namedAttributes)));g.prototype.toJSON&&(g.prototype.toJSON=v(g.prototype.toJSON));g.extend=e;return g}}function x(a,b){var e=a.prototype,c=b.prototype,h=e.set;c.set=function(a,b,e){var c,g=this.namedAttributes;if(!g||null==a)return h.apply(this,arguments);d.isObject(a)?(c=d.clone(a),e=b):(c={},c[a]=b);for(var f in c)if(d.has(c,f)){if(!d.has(g,f))throw"Attribute '"+f+"' does not exist";c[f]=k(g[f],c[f])}return h.call(this,
c,e)};var g=e.get;c.get=function(a){if(this.namedAttributes&&!d.has(this.namedAttributes,a))throw"Attribute '"+a+"' does not exist";return g.apply(this,arguments)}}function l(a){var b=a.extend();b.extend=w(a.extend);return b}var h;h="undefined"!==typeof exports?exports:this.Brace={};var d=this._;d||"undefined"===typeof require||(d=require("underscore"));var f=this.Backbone;f||"undefined"===typeof require||(f=require("backbone"));h.Mixins={createMethodName:function(a,b){return a+b.charAt(0).toUpperCase()+
b.substr(1)},applyMixin:function(a,b){d.forEach(d.keys(b),function(e){var c=a.prototype;if("initialize"===e){var h=c.initialize;c.initialize=function(){h&&h.apply(this,arguments);b.initialize.apply(this,arguments)}}else if("validate"===e){var g=c.validate;c.validate=function(){if(g){var a=g.apply(this,arguments);if(a)return a}return b.validate.apply(this,arguments)}}else if("defaults"===e){c=c.defaults||(c.defaults={});e=b[e];for(var f in e){if(c.hasOwnProperty(f))throw"Mixin error: class already has default '"+
f+"' defined";c[f]=e[f]}}else if("namedAttributes"===e)f=m(c.namedAttributes)||{},e=m(b[e]),c.namedAttributes=d.extend(f,r(e,f));else if("namedEvents"===e){if(!d.isArray(b[e]))throw"Expects events member on mixin to be an array";c.namedEvents||(c.namedEvents=[]);c.namedEvents=d.uniq(c.namedEvents.concat(b[e]))}else{if(c.hasOwnProperty(e))throw"Mixin error: class already has property '"+e+"' defined";c[e]=b[e]}},this)}};h.AttributesMixinCreator={create:function(a){var b={};a||(a={});d.has(a,"id")||
(a.id=null);d.each(a,function(a,c){var d=h.Mixins.createMethodName("set",c);b[d]=function(a,b){return this.set(c,a,b)};d=h.Mixins.createMethodName("get",c);b[d]=function(){return this.get(c)}});return b},ensureType:k};h.EventsMixinCreator={create:function(a){var b={};d.each(a,d.bind(function(a){var c=h.Mixins.createMethodName("on",a);b[c]=function(){return this.on.apply(this,[a].concat(d.toArray(arguments)))};c=h.Mixins.createMethodName("trigger",a);b[c]=function(){return this.trigger.apply(this,
[a].concat(d.toArray(arguments)))}},this));return b}};h.Model=function(a){var b=l(a);x(a,b);return b}(f.Model);h.Collection=l(f.Collection);h.View=l(f.View);h.Router=l(f.Router)})();