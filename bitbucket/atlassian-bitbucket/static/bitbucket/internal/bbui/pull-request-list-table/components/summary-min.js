define("bitbucket/internal/bbui/pull-request-list-table/components/summary","module exports react bitbucket/internal/impl/urls bitbucket/internal/util/time ../../aui-react/icon ../../ref-label/ref-label".split(" "),function(l,g,e,h,k,b,f){Object.defineProperty(g,"__esModule",{value:!0});var c=babelHelpers.interopRequireDefault(e),m=babelHelpers.interopRequireDefault(h),n=babelHelpers.interopRequireDefault(b),p=babelHelpers.interopRequireDefault(f);h={pullRequest:e.PropTypes.object.isRequired};var q=
{aMomentAgo:function(){return AJS.I18n.getText("bitbucket.pull.request.updated.date.format.a.moment.ago")},oneMinuteAgo:function(){return AJS.I18n.getText("bitbucket.pull.request.updated.date.format.one.minute.ago")},xMinutesAgo:function(d){return AJS.I18n.getText("bitbucket.pull.request.updated.date.format.x.minutes.ago",d)},oneHourAgo:function(){return AJS.I18n.getText("bitbucket.pull.request.updated.date.format.one.hour.ago")},xHoursAgo:function(d){return AJS.I18n.getText("bitbucket.pull.request.updated.date.format.x.hours.ago",
d)},oneDayAgo:function(){return AJS.I18n.getText("bitbucket.pull.request.updated.date.format.one.day.ago")},xDaysAgo:function(d){return AJS.I18n.getText("bitbucket.pull.request.updated.date.format.x.days.ago",d)},oneWeekAgo:function(){return AJS.I18n.getText("bitbucket.pull.request.updated.date.format.one.week.ago")},defaultType:function(d){return AJS.I18n.getText("bitbucket.pull.request.updated.date.format.absolute",d)}};b=function(d){function b(){babelHelpers.classCallCheck(this,b);return babelHelpers.possibleConstructorReturn(this,
Object.getPrototypeOf(b).apply(this,arguments))}babelHelpers.inherits(b,d);babelHelpers.createClass(b,[{key:"shouldComponentUpdate",value:function(a){return this.props.pullRequest.id!==a.pullRequest.id||this.props.pullRequest.title!==a.pullRequest.title||this.props.pullRequest.to_ref.id!==a.pullRequest.to_ref.id||this.props.pullRequest.updated_date!==a.pullRequest.updated_date}},{key:"render",value:function(){var a=this.props.pullRequest;return c.default.createElement("td",{className:"summary"},c.default.createElement("div",
{className:"title-and-target-branch"},c.default.createElement("a",{className:"pull-request-title",title:a.title,href:m.default.pullRequest(a)},a.title),c.default.createElement(n.default,{size:"small",icon:"devtools-arrow-right"}),c.default.createElement("span",{className:"pull-request-target-branch"},c.default.createElement(p.default,{scmRef:a.to_ref}))),c.default.createElement("div",{className:"pr-author-number-and-timestamp"},c.default.createElement("span",null,a.author.user.display_name," - #",
a.id,", "),c.default.createElement("time",{title:(0,k.format)(a.updated_date,"full"),dateTime:(0,k.format)(a.updated_date,"timestamp")},(0,k.format)(a.updated_date,"shortAge",q))))}}]);return b}(e.Component);f=function(b){return c.default.createElement("th",{className:"summary",scope:"col",colSpan:b.colSpan},AJS.I18n.getText("bitbucket.pull.request.table.title.summary"))};f.propTypes={colSpan:e.PropTypes.number};b.propTypes=h;b.Header=f;g.default=b;l.exports=g["default"]});