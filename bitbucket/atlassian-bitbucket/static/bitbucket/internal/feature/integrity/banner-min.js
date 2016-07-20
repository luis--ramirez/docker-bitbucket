define("bitbucket/internal/feature/integrity/banner",["exports","aui","jquery","bitbucket/util/navbuilder","bitbucket/internal/util/ajax"],function(f,l,m,n,p){Object.defineProperty(f,"__esModule",{value:!0});f.init=function(f,g){var c=void 0,b=void 0;switch(g[0]){case "acknowledged":return;case "started":b=h.INFO;c=d.STARTED;break;case "inconsistency":if("started"===g[1])b=h.WARN,c=d.INCONSISTENT;else return;break;case "completed":"inconsistency"===g[1]?(b=h.WARN,c=d.INCONSISTENT_COMPLETED):(b=h.INFO,
c=d.COMPLETED);break;default:console.warn("Could not identify integrity checks state.",g);return}a.default.messages[b]("#"+f,c);var k=!1;(0,q.default)(document).on("aui-message-close",function(a,b){b[0]&&b[0].id===e&&c===d.COMPLETED&&!k&&(k=!0,r.default.rest({url:t.default.newBuilder("admin").addPathComponents("integrity-check","acknowledge").build(),type:"POST"}))})};var a=babelHelpers.interopRequireDefault(l),q=babelHelpers.interopRequireDefault(m),t=babelHelpers.interopRequireDefault(n),r=babelHelpers.interopRequireDefault(p),
e="integrity-check-message",h={INFO:"info",WARN:"warning"},d={STARTED:{id:e,closeable:!1,title:a.default.I18n.getText("bitbucket.web.admin.integrity.check.started.banner.title"),body:a.default.I18n.getText("bitbucket.web.admin.integrity.check.started.banner.text")},INCONSISTENT:{id:e,closeable:!1,title:a.default.I18n.getText("bitbucket.web.admin.integrity.check.inconsistent.banner.title"),body:a.default.I18n.getText("bitbucket.web.admin.integrity.check.inconsistent.banner.text")},COMPLETED:{id:e,
title:a.default.I18n.getText("bitbucket.web.admin.integrity.check.completed.banner.title"),body:a.default.I18n.getText("bitbucket.web.admin.integrity.check.completed.banner.text")},INCONSISTENT_COMPLETED:{id:e,title:a.default.I18n.getText("bitbucket.web.admin.integrity.check.inconsistent.completed.banner.title"),body:a.default.I18n.getText("bitbucket.web.admin.integrity.check.inconsistent.completed.banner.text")}}});