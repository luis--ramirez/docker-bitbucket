(function(a){"function"===typeof define&&define.amd?define(["jquery"],a):a(jQuery)})(function(a){function d(){a(this).closest(".expandingText").find("div").text(this.value.replace(/\r\n/g,"\n")+" ");a(this).trigger("resize.expanding")}a.expandingTextarea=a.extend({autoInitialize:!0,initialSelector:"textarea.expanding",opts:{resize:function(){}}},a.expandingTextarea||{});var g="lineHeight textDecoration letterSpacing fontSize fontFamily fontStyle fontWeight textTransform textAlign direction wordSpacing fontSizeAdjust wordWrap word-break borderLeftWidth borderRightWidth borderTopWidth borderBottomWidth paddingLeft paddingRight paddingTop paddingBottom marginLeft marginRight marginTop marginBottom boxSizing webkitBoxSizing mozBoxSizing msBoxSizing".split(" "),
h={position:"absolute",height:"100%",resize:"none"},k={visibility:"hidden",border:"0 solid",whiteSpace:"pre-wrap"},l={position:"relative"};a.fn.expandingTextarea=function(c){var f=a.extend({},a.expandingTextarea.opts,c);if("resize"===c)return this.trigger("input.expanding");if("destroy"===c)return this.filter(".expanding-init").each(function(){var b=a(this).removeClass("expanding-init");b.closest(".expandingText").before(b).remove();b.attr("style",b.data("expanding-styles")||"").removeData("expanding-styles")}),
this;this.filter("textarea").not(".expanding-init").addClass("expanding-init").each(function(){var b=a(this);b.wrap("\x3cdiv class\x3d'expandingText'\x3e\x3c/div\x3e");b.after("\x3cpre class\x3d'textareaClone'\x3e\x3cdiv\x3e\x3c/div\x3e\x3c/pre\x3e");var c=b.parent().css(l).find("pre").css(k);b.data("expanding-styles",b.attr("style"));b.css(h);a.each(g,function(a,e){var d=b.css(e);c.css(e)!==d&&c.css(e,d)});b.bind("input.expanding propertychange.expanding keyup.expanding",d);d.apply(this);f.resize&&
b.bind("resize.expanding",f.resize)});return this};a(function(){a.expandingTextarea.autoInitialize&&a(a.expandingTextarea.initialSelector).expandingTextarea()})});