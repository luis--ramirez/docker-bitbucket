define("bitbucket/internal/page/setup/mirror",["aui","jquery","exports"],function(f,a,g){var e=a("#submit"),c=a("#mirror");g.onReady=function(){c.submit(function(){var b=f.I18n.getText("bitbucket.web.setup.mirror.status");a("\x3cdiv class\x3d'next-text'\x3e\x3c/div\x3e").text(b).insertAfter(e);b=a("\x3cdiv class\x3d'next-spinner'\x3e\x3c/div\x3e");b.insertAfter(e);b.spin("small")});var d=c.find("input[type\x3dtext][data-aui-notification-error]");d.length||(d=c.find("input[type\x3dtext]"));d.first().focus()}});