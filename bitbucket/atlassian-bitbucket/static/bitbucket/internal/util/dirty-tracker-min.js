define("bitbucket/internal/util/dirty-tracker",["aui","jquery","lodash","exports"],function(f,b,e,g){function d(a,c){var k=[f.keyCode.BACKSPACE,f.keyCode.DELETE];if(!c||!c.synthetic)if(b(a.target).is("input[type\x3dtext], textarea")||"change"===a.type)"keydown"===a.type&&-1===e.indexOf(k,a.keyCode)||b(this).attr("data-dirty",!0).off("change input keypress keydown cut paste",d)}var h=document.body;g.track=function(a){a=a||{};if(a.elements)b(a.elements).on("change input keypress keydown cut paste",
d);if(a.selector||a.container||!a.elements){var c=b(a.container||h);a=a.selector||"input, textarea";a=e.map(a.split(","),function(a){return a.replace(/\s*$/,":not([data-dirty])")}).join(",");c.on("change input keypress keydown cut paste",a,d)}};g.untrack=function(a){a=a||{};a.elements&&b(a.elements).off("change input keypress keydown cut paste",d);if(a.selector||a.container||!a.elements){var c=b(a.container||h);a=a.selector||"input, textarea";a=e.map(a.split(","),function(a){return a.replace(/\s+$/,
"")+":not([data-dirty])"}).join(",");c.off("change input keypress keydown cut paste",a,d)}}});