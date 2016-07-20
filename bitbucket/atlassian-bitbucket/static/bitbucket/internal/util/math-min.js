define("bitbucket/internal/util/math",["lodash","exports"],function(h,c){function f(a){return function(b){return Math.min(a,b)}}function g(a){return function(b){return Math.max(a,b)}}function d(a,b){if(!(this instanceof d))return new d(a,b);this.x=a;this.y=b}function e(a,b){if(!(this instanceof e))return new e(a,b);this.width=a;this.height=b}c.add=function(a,b){return a+b};c.clamp=function(a,b){return h.compose(g(a),f(b))};c.greaterThan=function(a,b){return a>b};c.highPass=g;c.isNegative=function(a){return 0>
a};c.isPositive=function(a){return 0<a};c.lowPass=f;c.lessThan=function(a,b){return a<b};c.multiply=function(a,b){return a*b};c.Point=d;c.Size=e});