'use strict';

define('bitbucket/internal/feature/commit/difftree/difftree-search-input', ['aui', 'bacon', 'jquery', 'lodash', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function'], function (AJS, Bacon, $, _, events, fn) {

    'use strict';

    Bacon; // TODO: Remove this once we have an annotation for checkstyle to ignore a file or specific dependencies
    function SearchInput(opts) {
        this.$el = $(bitbucket.internal.feature.difftree.searchInput(opts));

        this._destroyables = [];

        var $input = this.$el.find('input');
        var $deleteButton = this.$el.find('.delete-button');
        this._destroyables.push(events.chainWith($deleteButton).on('click', function (e) {
            e.preventDefault();
            $input.val('').trigger('input');
        }));
        this._destroyables.push(events.chainWith($input).on('input', function (e) {
            $deleteButton.toggle(!!this.value);
        }));
    }

    /**
     * @returns {Bacon<string>} a stream of text inputs, where blank indicates the user wants to clear the search
     */
    SearchInput.prototype.getInputs = function () {
        var clearEvents = this.$el.find('.delete-button').asEventStream('click');
        var keyup = this.$el.find('input').asEventStream('keyup');
        var keyCodeEq = fn.dotEq.bind(null, 'keyCode');
        var escapeStream = keyup.filter(keyCodeEq(AJS.keyCode.ESCAPE));

        var isEnterKey = keyCodeEq(AJS.keyCode.ENTER);

        return keyup.filter(isEnterKey).merge(escapeStream).doAction('.preventDefault').doAction('.currentTarget.blur').filter(isEnterKey).flatMap(function (e) {
            return e.target.value;
        }).merge(clearEvents.map(fn.constant(''))).skipDuplicates();
    };

    SearchInput.prototype.destroy = function () {
        _.invoke(this._destroyables, 'destroy');
    };

    return SearchInput;
});