'use strict';

define('bitbucket/internal/feature/user/user-and-group-multi-selector', ['aui', 'jquery', 'lodash', 'bitbucket/internal/feature/user/group-multi-selector', 'bitbucket/internal/feature/user/user-multi-selector', 'bitbucket/internal/util/promise', 'bitbucket/internal/widget/searchable-multi-selector'], function (AJS, $, _, GroupMultiSelector, UserMultiSelector, promiseUtil, SearchableMultiSelector) {

    var PagedDataSource = SearchableMultiSelector.PagedDataSource;

    var typeToSelectionTemplate = {
        user: UserMultiSelector.prototype.defaults.selectionTemplate,
        group: GroupMultiSelector.prototype.defaults.selectionTemplate
    };

    var typeToResultTemplate = {
        user: UserMultiSelector.prototype.defaults.resultTemplate,
        group: GroupMultiSelector.prototype.defaults.resultTemplate
    };

    var typeToGenerateId = {
        user: UserMultiSelector.prototype.defaults.generateId,
        group: GroupMultiSelector.prototype.defaults.generateId
    };

    var typeToGenerateText = {
        user: UserMultiSelector.prototype.defaults.generateText,
        group: GroupMultiSelector.prototype.defaults.generateText
    };

    function groupToItem(group) {
        return {
            type: 'group',
            entity: group
        };
    }

    function userToItem(user) {
        return {
            type: 'user',
            entity: user
        };
    }

    function toItemList(items) {
        items = items || {};
        return _.map(items.users || [], userToItem).concat(_.map(items.groups || [], groupToItem));
    }

    function UserAndGroupMultiSelector($field, options) {
        options = $.extend(true, {}, this.defaults, options);

        options.initialItems = toItemList(options.initialItems);
        options.excludedItems = toItemList(options.excludedItems);

        if (!options.dataSource) {
            options.dataSource = new UserAndGroupDataSource(new PagedDataSource(options.urls.user, options.urlParams.user), new PagedDataSource(options.urls.group, options.urlParams.group));
        }

        SearchableMultiSelector.call(this, $field, options);
    }

    $.extend(true, UserAndGroupMultiSelector.prototype, SearchableMultiSelector.prototype, {
        defaults: {
            initialItems: {
                user: [],
                group: []
            },
            excludedItems: {
                user: [],
                group: []
            },
            urls: {
                user: UserMultiSelector.prototype.defaults.url,
                group: GroupMultiSelector.prototype.defaults.url
            },
            urlParams: {
                user: UserMultiSelector.prototype.defaults.urlParams,
                group: GroupMultiSelector.prototype.defaults.urlParams
            },
            hasAvatar: true,
            selectionTemplate: function selectionTemplate(item) {
                return typeToSelectionTemplate[item.type](item.entity);
            },
            resultTemplate: function resultTemplate(item) {
                return typeToResultTemplate[item.type](item.entity);
            },
            inputTooShortTemplate: function inputTooShortTemplate() {
                return AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.user.and.group.multi.selector.help'));
            },
            noMatchesTemplate: function noMatchesTemplate() {
                return AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.user.and.group.multi.selector.no.match'));
            },
            generateId: function generateId(item) {
                return item.type + ':' + typeToGenerateId[item.type](item.entity);
            },
            generateText: function generateText(item) {
                return typeToGenerateText[item.type](item.entity);
            }
        },
        getSelectedItems: function getSelectedItems() {
            return _.reduce(SearchableMultiSelector.prototype.getSelectedItems.call(this), function (memo, item) {
                memo[item.type + 's'].push(item.entity);
                return memo;
            }, { users: [], groups: [] });
        },
        setSelectedItems: function setSelectedItems(items) {
            SearchableMultiSelector.prototype.setSelectedItems.call(this, toItemList(items));
        },
        clearSelectedItems: function clearSelectedItems() {
            return this.setSelectedItems({});
        }
    });

    var emptyPage = $.Deferred().resolve({
        isLastPage: true,
        values: []
    });

    function itemCompare(i1, i2) {
        var text1 = typeToGenerateText[i1.type](i1.entity);
        var text2 = typeToGenerateText[i2.type](i2.entity);
        return text1.toLowerCase().localeCompare(text2.toLowerCase());
    }

    function joinPages(itemPage1, itemPage2) {
        return {
            values: itemPage1.values.concat(itemPage2.values).sort(itemCompare),
            isLastPage: itemPage1.isLastPage && itemPage2.isLastPage
        };
    }

    function UserAndGroupDataSource(userDataSource, groupDataSource) {
        this._userDataSource = userDataSource;
        this._groupDataSource = groupDataSource;
    }

    UserAndGroupDataSource.prototype.clear = function () {
        this._userAtEnd = false;
        this._groupAtEnd = false;
        this._userDataSource.clear();
        this._groupDataSource.clear();
    };

    UserAndGroupDataSource.prototype.nextPage = function (filter) {
        var userPromise = this._userAtEnd ? emptyPage : this._userDataSource.nextPage(filter);
        userPromise = userPromise.then(_.bind(function (page) {
            this._userAtEnd = page.isLastPage;
            page.values = _.map(page.values, userToItem);
            return page;
        }, this)).promise(userPromise);

        var groupPromise = this._groupAtEnd ? emptyPage : this._groupDataSource.nextPage(filter);
        groupPromise = groupPromise.then(_.bind(function (page) {
            this._groupAtEnd = page.isLastPage;
            page.values = _.map(page.values, groupToItem);
            return page;
        }, this)).promise(groupPromise);

        var aggregatePromise = promiseUtil.reduce(userPromise, groupPromise);
        return aggregatePromise.then(joinPages).promise(aggregatePromise);
    };

    return UserAndGroupMultiSelector;
});