'use strict';

define('bitbucket/internal/util/html', ['aui', 'bitbucket/internal/util/function', 'exports'], function (AJS, fn, exports) {

    'use strict';

    var logError = window.console && console.error ? function () {
        console.error.apply(console, arguments);
    } : AJS.log;

    var NodeType = {
        OPEN: 'open',
        CLOSE: 'close'
    };

    function NodeStream() {}

    /**
     * Gets an object representing the next opening or closing html tag in this stream.
     * open tags look like: {
     *     type : NodeType.OPEN,
     *     value : '<tagName>',
     *     textPosition: 0,
     *     close : {
     *         type : NodeType.CLOSE,
     *         value : '</tagName>'
     *     }
     * }
     * close tags look like: {
     *     type : NodeType.CLOSE,
     *     value : '</tagName>'
     * }
     */
    NodeStream.prototype.next = function () {
        logError('NodeStream.next is abstract and must be implemented');
    };

    /**
     * Gets the NodeType for the upcoming tag, or null if there are no more tags.
     */
    NodeStream.prototype.getNextType = function () {
        logError('NodeStream.getNextType is abstract and must be implemented');
    };

    /**
     * Gets the text position of the upcoming tag, or null if there are no more tags.
     * E.g., the following will log 0, then 2:
     * var stream = htmlNodeStream("<div>hi</div>");
     * console.log(stream.getNextTextPosition()); // 0
     * stream.next();
     * console.log(stream.getNextTextPosition()); // 2
     */
    NodeStream.prototype.getNextTextPosition = function () {
        logError('NodeStream.getNextTextPosition is abstract and must be implemented');
    };

    var tagNameRegex = /<\s*(\w+)(?=\s|>)/;
    var tagNameGroup = 1;

    /**
     * Returns a nodeStream based on a well-formed HTML string
     * @param html the html string to stream nodes from.
     * @param customUnescape a custom function to use when unescaping text to determine next text position
     */
    function htmlNodeStream(html, customUnescape) {
        var pos = 0;
        var textPos = 0;
        var len = html.length;
        var tagBegin = '<';
        var tagEnd = '>';

        var nextType;
        var moved;

        var unescape = customUnescape || function (value) {
            logError('Not yet implemented');
        };

        function resetInternals() {
            nextType = null;
            moved = false;
        }

        function moveToNextNode() {
            if (moved || pos == null) {
                return;
            }
            moved = true;

            var nextTag = html.indexOf(tagBegin, pos);

            if (nextTag === pos) {
                return;
            }

            if (nextTag === -1) {
                pos = null;
                textPos = null;
            } else {
                textPos += unescape(html.substring(pos, nextTag)).length;
                pos = nextTag;
            }
        }

        function getNextType() {
            moveToNextNode();
            if (pos == null) {
                return null;
            }
            return html[pos + 1] === '/' ? NodeType.CLOSE : NodeType.OPEN;
        }

        var newStream = new NodeStream();

        var openPositions = [];

        newStream.getNextType = function () {
            return nextType || (nextType = getNextType());
        };
        newStream.next = function () {
            moveToNextNode();

            if (pos == null) {
                return null;
            }

            var currentType = this.getNextType();

            var until = html.indexOf(tagEnd, pos);
            // if this segment goes to the end, newPos = length of the input.
            // else the segment includes the match if it's an end tag (>), but not if it's a begin tag (<)
            var newPos = until === -1 ? len : until + 1;
            var currentTag = html.substring(pos, newPos);

            var node = {
                type: currentType,
                value: currentTag,
                textPosition: textPos
            };
            if (currentType === NodeType.OPEN) {
                node.close = {
                    type: NodeType.CLOSE,
                    value: '</' + currentTag.match(tagNameRegex)[tagNameGroup] + '>'
                };
                openPositions.push(textPos);
            }
            pos = newPos;
            resetInternals();
            return node;
        };

        newStream.getNextTextPosition = function () {
            moveToNextNode();
            return textPos;
        };

        return newStream;
    }

    function toGetter(val, defaultVal, valType) {
        valType = valType || 'string';
        return typeof val === 'function' ? val : fn.constant((typeof val === 'undefined' ? 'undefined' : babelHelpers.typeof(val)) === valType ? val : defaultVal);
    }

    /**
     * Returns a nodeStream that, given an array of lines, will output a wrapping <pre> tag around each one.
     * @param lines the array of objects containing a text property.
     */
    function lineNodeStream(lines, getLineText, opts) {
        opts = opts || {};
        var lineIndex = 0;
        var textPos = 0;
        var len = lines.length;
        var state = NodeType.OPEN;
        var lineStart = toGetter(opts.lineStart, '');
        var lineEnd = toGetter(opts.lineEnd, '<br />');
        var emptyLine = toGetter(opts.emptyLine, '');
        var lineOffset = toGetter(opts.lineOffset, 1, 'number'); // the 1 is for the implied \n
        var openNode;
        var closeNode;

        getLineText = getLineText || fn.dot('text');

        function open() {
            state = NodeType.CLOSE;
            var lineLength = getLineText(lines[lineIndex], lineIndex).length;
            closeNode = {
                type: NodeType.CLOSE,
                value: lineLength ? lineEnd(lines[lineIndex], lineIndex) : emptyLine(lines[lineIndex], lineIndex) + lineEnd(lines[lineIndex], lineIndex)
            };

            openNode = {
                type: NodeType.OPEN,
                value: lineStart(lines[lineIndex], lineIndex),
                close: closeNode,
                textPosition: textPos
            };

            textPos = textPos + lineLength + lineOffset(lines[lineIndex], lineIndex);

            return openNode;
        }

        function close() {
            lineIndex++;
            closeNode.textPosition = textPos;
            state = NodeType.OPEN;
            openNode = null;
            return closeNode;
        }

        var states = {
            open: open,
            close: close
        };

        var newStream = new NodeStream();
        newStream.getNextType = function () {
            if (lineIndex >= len) {
                return null;
            }

            return state;
        };
        newStream.next = function () {
            if (lineIndex >= len) {
                return null;
            }

            return states[state]();
        };

        newStream.getNextTextPosition = function () {
            if (lineIndex >= len) {
                return null;
            }

            return textPos;
        };

        return newStream;
    }

    //internal: determines the next stream to pull a node from.
    function nextStream(streams) {
        var minI;
        var minTextPosition = Infinity;
        var firstStream = {
            getNextTextPosition: fn.constant(null)
        };

        var i;
        var len = streams.length;

        for (i = 0; i < len; i++) {
            var stream = streams[i];
            var streamTextPosition = stream.getNextTextPosition();
            if (streamTextPosition != null && streamTextPosition < minTextPosition) {
                firstStream = stream;
                minTextPosition = streamTextPosition;
                minI = i;
                continue;
            }

            if (streamTextPosition === minTextPosition) {

                /* all things equal, open lower-index streams first and close them last. e.g.
                    if all streams have nodes that open and close at the same text position,
                    then you want to handle this:
                        streams = [stream1, stream2, stream3]
                    as:
                        handle(stream1.open)
                            handle(stream2.open)
                                handle(stream3.open)
                                    ...handle inner text...
                    |           handle(stream3.close) // close higher indexes first
                    |       handle(stream2.close)
                    |   handle(stream1.close)
                    |   handle(stream1.open)          // then open lower indexes first
                    |       handle(stream2.open)
                    |           handle(stream3.open)
                                    ...handle inner text...
                        ...
                 */
                if (stream.getNextType() === NodeType.CLOSE) {
                    firstStream = stream;
                    minI = i;
                }
            }
        }

        return {
            index: minI,
            stream: firstStream
        };
    }

    /**
     * internal: functions like a stack, but lower priorities are inserted further down the stack.
     * Negative priorities are not allowed.
     */
    function PriorityStack() {
        this._backing = [];
    }
    PriorityStack.prototype.pushAtPriority = function (item, priority) {
        var queueForPriority = this._backing[priority] || (this._backing[priority] = []);
        queueForPriority.push(item);
    };
    PriorityStack.prototype.popAtPriority = function (priority) {
        var queueForPriority = this._backing[priority] || (this._backing[priority] = []);
        return queueForPriority.pop();
    };
    PriorityStack.prototype.popPrioritiesAbove = function (priority) {
        var ret = [];
        var backing = this._backing;
        var popUntilLength = priority + 1;
        while (backing.length > popUntilLength) {
            var queueForPriority = this._backing.pop();
            if (queueForPriority) {
                for (var j = queueForPriority.length - 1; j >= 0; j--) {
                    ret.push(queueForPriority[j]);
                }
            }
        }
        return ret;
    };
    PriorityStack.prototype.peek = function () {
        var priority = this._backing.length;
        while (priority--) {
            if (this._backing[priority] && this._backing[priority].length) {
                return this._backing[priority][this._backing[priority].length - 1];
            }
        }
        return undefined;
    };

    /**
     * Given canonical text and a number of node streams based on that text, will return a string containing
     * the text and html from all streams.
     * The order of stream arguments is important: earlier stream arguments are considered to always wrap later stream arguments.
     * @param text
     * @param streams...
     */
    function mergeStreams(text /*, streams*/) {
        var streams = Array.prototype.slice.call(arguments, 1);
        var textPos = 0;
        var openNodes = new PriorityStack();
        var toReopen = [];
        var reopenFromStreamIndex;

        var out = "";

        while (true) {
            // eslint-disable-line no-constant-condition
            var nextStreamResult = nextStream(streams);
            var streamIndex = nextStreamResult.index;
            var stream = nextStreamResult.stream;
            var newTextPos = stream.getNextTextPosition();
            var reachedEnd = newTextPos == null;
            var textPositionChanged = reachedEnd || newTextPos > textPos;

            // We want to reopen any tags that were prematurely closed
            // We want to delay reopening them until we have to - that is, until a tag they should surround (as
            // determined by the streamIndex) appears
            // OR if the text position is about to change, we want to reopen them first.
            if (toReopen.length && (textPositionChanged || streamIndex >= reopenFromStreamIndex)) {
                for (var i = toReopen.length - 1; i >= 0; i--) {
                    var reopenedNode = toReopen[i];
                    out += reopenedNode.tag.value;
                    openNodes.pushAtPriority(reopenedNode, reopenedNode.streamIndex);
                }
                toReopen = [];
                reopenFromStreamIndex = null;
            }

            if (textPositionChanged) {
                out += AJS.escapeHtml(text.substring(textPos, newTextPos || undefined));
            }

            if (reachedEnd) {
                return out;
            }

            var tag = stream.next();

            if (tag != null) {
                if (tag.type === NodeType.CLOSE) {
                    // when you close a tag, close all the inner tags first.
                    openNodes.popAtPriority(streamIndex);
                } else {
                    openNodes.pushAtPriority({
                        streamIndex: streamIndex,
                        tag: tag
                    }, streamIndex);
                }

                var toClose = openNodes.popPrioritiesAbove(streamIndex);
                if (toClose.length) {
                    reopenFromStreamIndex = toClose[0].streamIndex;
                    var j;
                    var len = toClose.length;
                    for (j = 0; j < len; j++) {
                        out += toClose[j].tag.close.value;
                    }
                    toReopen.push.apply(toReopen, toClose);
                }

                out += tag.value;
            }

            textPos = newTextPos;
        }
    }

    var holder = document.createElement('div');

    // jQuery does lots of cleaning / guarding that takes about 500ms in IE.  We assume our html is clean (no scripts, etc)
    // and skip all that. Still super slow though...
    function quickNDirtyAttach(element, html, attachmentMethod) {
        if (attachmentMethod === 'html' || !element.hasChildNodes()) {
            element.innerHTML = html;
            return;
        }

        // create nodes
        holder.innerHTML = html;

        // append them individually toa fragment.
        var documentFragment = document.createDocumentFragment();
        var i = holder.childNodes.length;
        while (i--) {
            documentFragment.appendChild(holder.childNodes[0]);
        }

        // append the document fragment appropriately
        if (attachmentMethod === 'append') {
            element.appendChild(documentFragment);
        } else {
            // prepend
            element.insertBefore(documentFragment, element.firstChild);
        }
    }

    /**
     * jQuery uses [.] and : as special characters for selectors. These characters are still valid in HTML ids.
     * Use this method to return a sanitized version of the id for use in jQuery selectors.
     * @param id id to sanitize
     */
    function sanitizeId(id) {
        return id.replace(/:/g, "\\:").replace(/\./g, "\\.");
    }

    exports.quickNDirtyAttach = quickNDirtyAttach;
    exports.NodeStream = NodeStream;
    exports.NodeType = NodeType;
    exports.htmlNodeStream = htmlNodeStream;
    exports.lineNodeStream = lineNodeStream;
    exports.mergeStreams = mergeStreams;
    exports.sanitizeId = sanitizeId;
});