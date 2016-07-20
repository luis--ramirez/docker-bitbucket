define('bitbucket/internal/bbui/paged-table/paged-table', ['module', 'exports', 'react', 'classnames', '../aui-react/spinner', '../scroll-handler/scroll-handler'], function (module, exports, _react, _classnames, _spinner, _scrollHandler) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var _spinner2 = babelHelpers.interopRequireDefault(_spinner);

    var _scrollHandler2 = babelHelpers.interopRequireDefault(_scrollHandler);

    var propTypes = {
        allFetched: _react.PropTypes.bool.isRequired,
        allFetchedMessage: _react.PropTypes.string,
        bufferPx: _scrollHandler2.default.propTypes.bufferPx,
        className: _react.PropTypes.string,
        focusedIndex: _react.PropTypes.number,
        header: _react.PropTypes.func,
        items: _react.PropTypes.array.isRequired,
        loading: _react.PropTypes.bool.isRequired,
        onMoreItemsRequested: _react.PropTypes.func.isRequired,
        row: _react.PropTypes.func.isRequired,
        scrollElement: _scrollHandler2.default.propTypes.scrollElement
    };

    var PagedTable = function PagedTable(props) {
        var VISIBLE_PRS = 7;
        var rows = props.row ? props.items.map(function (item, i) {
            return props.row({
                item: item,
                focused: props.focusedIndex === i
            });
        }) : null;

        return _react2.default.createElement(
            'div',
            { className: 'paged-table-container' },
            _react2.default.createElement(
                _scrollHandler2.default,
                {
                    bufferPx: props.bufferPx,
                    onScrollToBottom: props.onMoreItemsRequested,
                    scrollElement: props.scrollElement,
                    suspend: props.allFetched || props.loading
                },
                _react2.default.createElement(
                    'table',
                    { className: (0, _classnames2.default)("aui paged-table", props.className) },
                    props.header && _react2.default.createElement(
                        'thead',
                        null,
                        props.header()
                    ),
                    _react2.default.createElement(
                        'tbody',
                        null,
                        rows
                    )
                )
            ),
            props.loading && _react2.default.createElement(_spinner2.default, null),
            props.allFetched && !props.loading && props.items.length > VISIBLE_PRS && _react2.default.createElement(
                'div',
                { className: 'paged-table-message' },
                props.allFetchedMessage
            )
        );
    };

    PagedTable.propTypes = propTypes;

    exports.default = PagedTable;
    module.exports = exports['default'];
});