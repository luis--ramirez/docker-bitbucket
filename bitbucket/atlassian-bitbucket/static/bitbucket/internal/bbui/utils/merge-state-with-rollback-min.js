define("bitbucket/internal/bbui/utils/merge-state-with-rollback",["module","exports"],function(e,b){Object.defineProperty(b,"__esModule",{value:!0});b.default=function(c,d,a){var b=a.forward,e=a.back;a=a.commit;if(d.hasOwnProperty("meta")){if(!d.meta.isPending&&d.payload&&d.payload.error)return babelHelpers.extends({},c,e());if(d.meta.isPending)return babelHelpers.extends({},c,b())}else return c;return a?babelHelpers.extends({},c,a()):c};e.exports=b["default"]});