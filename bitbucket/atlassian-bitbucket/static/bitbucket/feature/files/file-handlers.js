'use strict';

/**
 * Provides a way to register file-handlers to handle rendering the source of a file or the diff of file changed.
 * For example, a {@linkCode FileHandler} can be registered to handle .stl files and render them as 3D files.
 * JS files registering file-handlers should use the resource context 'bitbucket.internal.feature.files.fileHandlers'.
 *
 * **This module is available synchronously.**
 *
 * **Web Resource:** com.atlassian.bitbucket.server.bitbucket-web-api:file-handlers
 *
 * @namespace bitbucket/feature/files/file-handlers
 *
 * @example
 * function MyView(options) {
 *     var $element = $('&lt;div/&gt;');
 *     $container.append($element);
 *
 *     return {
 *         destroy: function() {
 *             $element.remove();
 *         },
 *         extraClasses: 'my-class something-else'
 *     };
 * }
 *
 * var myFileHandler = {
 *     weight: 400,
 *     handle: function(options) {
 *         if (options.fileChange.path.extension === 'stl') {
 *             return new MyView(options);
 *         } else if (options.fileChange.path.extension === 'stl2') {
 *             // Returning a rejected promise with a message will display errors appropriately
 *             return $.Deferred().reject('File extension not supported');
 *         }
 *         // Return null/undefined or an empty promise to pass silently
 *     }
 * };
 *
 * // Register your handler immediately to ensure it is in place when needed.
 * // Note that we use the synchronous syntax to require the module, which ensures there is no delay before
 * // register() is called.
 * require('feature/file-content/file-handlers').register(myFileHandler);
 */
define('bitbucket/feature/files/file-handlers', ['bitbucket/internal/util/handler-registry', 'bitbucket/internal/util/object'],
/**
 * @exports bitbucket/feature/files/file-handlers
 */
function (HandlerRegistry, object) {

  'use strict';

  var fileHandlers = new HandlerRegistry();

  /**
   * @typedef {Object}    FileHandlingContext
   * @memberOf bitbucket/feature/files/file-handlers
   *
   * @property {string}           contentMode - The mode of content. This is either 'source' or 'diff'.
   * @property {jQuery}           $toolbar - A jQuery object pointing to the toolbar contents - any toolbar web panels can be found as descendants. (Since 3.5)
   * @property {jQuery}           $container  - A jQuery object in which you should append your rendered file content.
   * @property {JSON.FileChangeJSON}   fileChange - Describes the changed file.
   * @property {string}           commentMode - The comment rendering mode. "none", "read", "reply-only", or "create-new"
   * @property {boolean}          isExcerpt - Indicates whether this is only an excerpt and not a full file/diff.
   * @property {*}                anchor - An anchor of any type which can be used by the appropriate handler to deep link into the content
   * @property {string}           [scrollStyle] - The style of scrolling to be used, "fixed" or "inline".
   * @property {Function}         [diffUrlBuilder] - An optional function that accepts a {JSON.FileChangeJSON} and will return
   *                                                 a {bitbucket/util/navbuilder.Builder} to the built-in Stash REST
   *                                                 endpoint to obtain the diff information.
   * @property {Array<JSON.CommentJSON>}    [lineComments] - An array of comments anchored to the lines of the file. The structure
   *                                      matches the structure for comments retrieved via the REST API. This is only provided
   *                                      for handling diffs as activity items for a pull request. For other usages, line comments
   *                                      will be retrieved from the server when retrieving diffs.
   * @property {Function}         [commentUrlBuilder] – An optional function that returns a {bitbucket/util/navbuilder.Builder} to the built-in Stash REST
   *                                                 endpoint to send the comment information.
   */

  /**
   * Callback to handle file.
   *
   * @callback FileHandleCallback
   * @memberOf bitbucket/feature/files/file-handlers
   *
   * @param {bitbucket/feature/files/file-handlers.FileHandlingContext}   context - A map of properties describing the content
   *                                                              to be rendered and the context in which it is to be rendered.
   * @return {Promise}        A promise object that resolves with {@linkcode FileHandlerResult} if this handler will handle the request, or rejects otherwise.
   */

  /**
   * An object that can either render file sources, file diffs, or both for a particular subset of files.
   *
   * @typedef {Object}    FileHandler
   * @memberOf bitbucket/feature/files/file-handlers
   *
   * @property {number}               [weight=1000] - The weight of handler determining the order it is tried.
   *                                                  The default weight of the source/diff view is 1000.
   * @property {bitbucket/feature/files/file-handlers.FileHandleCallback}   handle        - A function called to handle file content rendering.
   */

  /**
   * @typedef {Object}    FileHandlerResult
   * @memberOf bitbucket/feature/files/file-handlers
   *
   * @property {Function} [destroy]        - A function that will be called before the current view is destroyed, which may happen on state change.
   *                                       This is a chance to destroy/cleanup any event listeners and remove DOM elements.
   * @property {string}   [extraClasses] - Additional style class applied to parent file-content. Can be used to apply background color.
   * @property {string}   [handlerID]    - A unique string identifying your handler (or a "sub-" handler if your handler has a few different ways
   *                                       to display data). This is passed to toolbar web-fragments so they can enable or disable themselves based
   *                                       on which handler is being displayed.
   *
   *                                       The built-in handler IDs are listed in {@link bitbucket/feature-files/file-handlers#builtInHandlers}. Your handler
   *                                       should NOT use these IDs, but should instead specify a unique ID string of its own.
   *
   */

  /**
   * Register a file handler. Call this method as soon as possible to ensure your handler is considered when a file content is loaded.
   *
   * @memberof bitbucket/feature/files/file-handlers
   * @param {FileHandler} fileHandler - your file handler to register
   */
  function register(fileHandler) {}

  /**
   * An enum of built-in handlers that may be used to handle the display of file content. It is not an exhaustive list.
   * Any plugin can handle any file it wishes and may or may not provide an ID.
   *
   * @enum {string}
   * @readonly
   * @memberof bitbucket/feature/files/file-handlers
   * @param {FileHandler} fileHandler
   */
  fileHandlers.builtInHandlers = {
    /**
     * Generic error handler
     */
    ERROR: 'error',
    /**
     * Textual source handler
     */
    SOURCE_TEXT: 'source-text',
    /**
     * Empty source handler
     */
    SOURCE_EMPTY: 'source-empty',
    /**
     * Image source handler
     */
    SOURCE_IMAGE: 'source-image',
    /**
     * Non-image binary source handler
     */
    SOURCE_BINARY: 'source-binary',
    /**
     * Textual diff handler with side-by-side display
     */
    DIFF_TEXT_SIDE_BY_SIDE: 'diff-text-side-by-side',
    /**
     * Textual diff handler with unified display
     */
    DIFF_TEXT_UNIFIED: 'diff-text-unified',
    /**
     * Empty diff handler
     */
    DIFF_EMPTY: 'diff-empty',
    /**
     * Too-large diff handler
     */
    DIFF_TOO_LARGE: 'diff-too-large',
    /**
     * Image diff handler
     */
    DIFF_IMAGE: 'diff-image',
    /**
     * Non-image binary diff handler
     */
    DIFF_BINARY: 'diff-binary'
  };

  object.freeze(fileHandlers.builtInHandlers);

  return fileHandlers;
});