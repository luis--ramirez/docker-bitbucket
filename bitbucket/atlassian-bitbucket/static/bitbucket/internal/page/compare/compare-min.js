define("bitbucket/internal/page/compare",["jquery","bitbucket/internal/feature/compare","exports"],function(c,d,a){a.onReady=function(b,a,e){b={targetRepositoryJson:b,sourceRepositoryJson:a,tabs:e};return d.onReady(c("#branch-compare"),b)}});