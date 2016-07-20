'use strict';

/* eslint max-depth: 0, complexity: 0 */
define('bitbucket/internal/util/markup', ['exports'], function (exports) {

    /**
     * Check if a given position is inside a code block
     * @param {number} position
     * @param {string} str
     * @returns {boolean}
     */
    function isPositionInsideCodeBlock(position, str) {
        var tokens = codeBlockTokenizer(str);
        // check if the position is > or < any of the codeStart/codeEnd in the tokens
        var inCodeBlock = false;
        tokens.forEach(function (token, i) {
            if (token.type === TokenTypes.CODE_START && token.start < position) {
                // check if the following closing block is past the cursor pos
                var nextToken = tokens[i + 1];
                // if there is a next token and it is the CODE_END token that matches the current token type we're in a code block,
                // also if there no next token because then we're in a code block at the end of the text
                if (nextToken && nextToken.type === TokenTypes.CODE_END && nextToken.blockType === token.blockType && nextToken.start >= position || !nextToken) {
                    inCodeBlock = true;
                    return false;
                }
            }
        });
        return inCodeBlock;
    }

    /**
     * Find the next token in Str, starting from start until end. If no token is found, returns null
     * @param {string} str
     * @param {string} token
     * @param {?number} start
     * @param {?number?} end
     * @returns {?number}
     */
    function findNextTokenIndex(str, token, start, end) {
        var idx = str.indexOf(token, start || 0);
        if (idx === -1 || end && idx > end) {
            return null;
        }
        return idx;
    }

    /**
     * Tokenize a block of text to MarkDown codeblock tokens.
     * See {@link http://spec.commonmark.org/ CommonMark spec} for details.
     *
     * @param {string} str
     * @returns {Array<Object>}
     */
    function codeBlockTokenizer(str) {
        var pos = 0;
        var tokens = [];
        var inlineCodeStarted = false;
        var fencedBlockStarted = false;
        var INLINE_TOKEN_RE = /`/;
        var FENCED_TOKEN_RE = /`|~/;
        var FENCED_BLOCK_RE = /^(~~~+|```+[\S]*)/;
        var ESCAPE_CHAR_RE = /\\/;
        var lastNewLinePos = 0;

        while (pos < str.length) {
            var startPos = pos;
            var chr = str[pos++];
            var tokenVal = chr;

            if (chr === '\n') {
                lastNewLinePos = pos;
                // if an inline code block has started, then the newline will end it.
                if (inlineCodeStarted) {
                    tokens.push({ start: startPos,
                        end: pos,
                        value: tokenVal,
                        blockType: BlockTypes.INLINE,
                        type: TokenTypes.CODE_END
                    });
                    inlineCodeStarted = false;
                }
            }

            if (FENCED_TOKEN_RE.test(chr)) {
                // fenced tokens are a superset of inline tokens so this test will catch both
                // get the current line to check if this is the start of a fenced code block
                var currLine = str.substring(lastNewLinePos, findNextTokenIndex(str, '\n', pos) || str.length);
                if (FENCED_BLOCK_RE.test(currLine)) {
                    // get the characters up to the end of the line
                    while (str[pos] !== '\n' && pos < str.length) {
                        tokenVal += str[pos++]; // increment the position because the token is more than a single character long
                    }

                    if (fencedBlockStarted) {
                        // if this fenced block does not match the previous block's character then continue
                        // e.g. if a block was started with ``` it cannot be ended with ~~~
                        var lastToken = tokens[tokens.length - 1];
                        if (lastToken.value.substring(0, 3) !== tokenVal.substring(0, 3)) {
                            continue;
                        }
                        fencedBlockStarted = false;
                    } else {
                        fencedBlockStarted = true;
                    }

                    tokens.push({ start: startPos,
                        end: pos,
                        value: tokenVal,
                        blockType: BlockTypes.FENCED,
                        type: fencedBlockStarted ? TokenTypes.CODE_START : TokenTypes.CODE_END
                    });
                    continue;
                }

                // if the token is escaped (preceded by a backslash) then don't start a code block.
                if (ESCAPE_CHAR_RE.test(str[startPos - 1])) {
                    continue;
                }

                // if a fenced block is currently open, then no inline blocks needs to be registered inside that fenced block
                if (fencedBlockStarted) {
                    continue;
                }

                if (INLINE_TOKEN_RE.test(chr)) {
                    if (inlineCodeStarted) {
                        inlineCodeStarted = false;
                    } else {
                        inlineCodeStarted = true;
                    }
                    tokens.push({
                        start: startPos,
                        end: pos,
                        value: tokenVal,
                        blockType: BlockTypes.INLINE,
                        type: inlineCodeStarted ? TokenTypes.CODE_START : TokenTypes.CODE_END
                    });
                }
            }
        }

        return tokens;
    }

    var TokenTypes = {
        CODE_START: 'CODE_START',
        CODE_END: 'CODE_END'
    };
    var BlockTypes = {
        INLINE: 'INLINE',
        FENCED: 'FENCED'
    };

    exports.TokenTypes = TokenTypes;
    exports.BlockTypes = BlockTypes;

    exports.isPositionInsideCodeBlock = isPositionInsideCodeBlock;
    exports.codeBlockTokenizer = codeBlockTokenizer;
    exports.findNextTokenIndex = findNextTokenIndex;
});