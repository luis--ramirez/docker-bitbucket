(function(c){delete define.amd;var e=require,d=!1;require=function(a,b){"string"===typeof a&&"function"===typeof b&&(d||(d=!0,console.log("WARN: require(string, function) has been deprecated in 2.11 and will throw an error in 4.0. Use an array of dependencies - require(Array\x3cstring\x3e function). (requiring "+a+")")),a=[a]);if(b&&"function"!==typeof b)throw Error("Callback was not a function");return e.call(c,a,b)};c.requireLite=require;c.defineLite=define})(window||this);