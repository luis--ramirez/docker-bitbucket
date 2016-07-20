define("moment", [], function () {
    // Always set 'en' first, otherwise moment falls back to the last lang to be added, which can be 'zh-tw'
    moment.locale('en');
    // The lang attribute is set in DefaultInjectedDataFactory
    moment.locale(document.documentElement.getAttribute('lang'));
    return moment;
});
