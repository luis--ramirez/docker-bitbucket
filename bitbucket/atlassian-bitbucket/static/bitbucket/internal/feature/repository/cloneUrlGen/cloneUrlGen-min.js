define("bitbucket/internal/feature/repository/cloneUrlGen","jquery lodash unorm bitbucket/util/navbuilder bitbucket/internal/model/page-state exports".split(" "),function(e,f,b,k,g,c){function h(d){return b.nfkd(d).replace(/[^\x00-\x7F]+/g,"").replace(/[^a-zA-Z\-_0-9\\.]+/g,"-").toLowerCase()}c.bindUrlGeneration=function(d,a){var c=e(d),b={elementsToWatch:[],getProject:g.getProject.bind(g),getRepoName:f.constant("")};a=f.extend(b,a);a.elementsToWatch.reduce(function(a,c){return a.add(c)},e()).on("input change",
function(){var b=h(a.getRepoName());c.text(b&&k.project(a.getProject()).repo(b).clone("git").buildAbsolute())}).trigger("change")};c.slugify=h});