define('bitbucket/internal/bbui/image-differ/differ', ['module', 'exports', 'jquery', 'lodash', 'resemble', '../widget/widget', './image-differ-mode', './image-differ-modes'], function (module, exports, _jquery, _lodash, _resemble, _widget, _imageDifferMode, _imageDifferModes) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _resemble2 = babelHelpers.interopRequireDefault(_resemble);

    var _widget2 = babelHelpers.interopRequireDefault(_widget);

    var _imageDifferMode2 = babelHelpers.interopRequireDefault(_imageDifferMode);

    var _imageDifferModes2 = babelHelpers.interopRequireDefault(_imageDifferModes);

    var RESIZE_DEBOUNCE = 200;

    /**
     * Create an ImageDiffer instance in the provided $container. This instance must eventually be `.init()`ed
     *
     * @param {jQuery|HTMLElement} $container where to place the differ.
     * @constructor
     */

    var ImageDiffer = function (_Widget) {
        babelHelpers.inherits(ImageDiffer, _Widget);


        /**
         * @param {jQuery|HtmlElement} container - The container to use for this ImageDiffer
         */

        function ImageDiffer(container) {
            babelHelpers.classCallCheck(this, ImageDiffer);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(ImageDiffer).call(this));

            _this._$container = (0, _jquery2.default)(container);
            return _this;
        }

        /**
         * Initialize the instance. This expects two images to be found in the $container and assumes the first
         * is the "old" revision and the second is the "new" revision. This function will retrieve information about the
         * images like width and height.
         *
         * @returns {Promise} promise that is resolved when the ImageDiffer is fully initialized.
         */


        babelHelpers.createClass(ImageDiffer, [{
            key: 'init',
            value: function init() {
                var _this2 = this;

                var $imgs = this._$imgs = this._$container.find('img');

                this._$sinceImg = $imgs.eq(0);
                this._$untilImg = $imgs.eq(1);

                this._$untilRevision = this._$untilImg.parent();
                this._$sinceRevision = this._$sinceImg.parent();
                this._$revisions = this._$untilRevision.add(this._$sinceRevision);

                this._$untilRevisionLabel = this._$untilRevision.find('h5');
                this._$sinceRevisionLabel = this._$sinceRevision.find('h5');
                this._setupDiffModes();

                this.setMode(_imageDifferModes2.default.TWO_UP);

                var initialized = _jquery2.default.Deferred();

                var defaultModes = [_imageDifferModes2.default.TWO_UP];
                // Extra modes is all available modes except two-up
                var extraModes = _lodash2.default.chain(_imageDifferModes2.default).values().difference(defaultModes).value();

                _jquery2.default.when(calculateImageNaturalSize(this._$sinceImg), calculateImageNaturalSize(this._$untilImg)).done(function (oldSize, newSize) {
                    var sameDimensions = oldSize.width === newSize.width && oldSize.height === newSize.height;
                    var enableExtraModes = sameDimensions && oldSize.width > 0;
                    _this2.enabledModes = enableExtraModes ? defaultModes.concat(extraModes) : defaultModes;
                    initialized.resolve(_this2.enabledModes);
                }).fail(function () {
                    initialized.reject();
                });

                return initialized;
            }
        }, {
            key: 'destroy',
            value: function destroy() {
                if (this.modes && this._mode) {
                    this.modes[this._mode].destroy();
                }
                this._mode = null;
            }
        }, {
            key: 'setMode',
            value: function setMode(mode) {
                if (this._mode !== mode) {
                    this._onDiffModeChanged(mode, this._mode);
                    this._mode = mode;
                }
            }
        }, {
            key: '_onDiffModeChanged',
            value: function _onDiffModeChanged(newMode, oldMode) {

                this._$container.removeClass(_lodash2.default.values(_imageDifferModes2.default).join(' ')).addClass(newMode);

                if (oldMode) {
                    this.modes[oldMode].destroy();
                }
                if (newMode) {
                    this.modes[newMode].setup();
                }

                this.trigger('modeChanged', {
                    newMode: newMode,
                    oldMode: oldMode
                });
            }
        }, {
            key: '_setupDiffModes',
            value: function _setupDiffModes() {
                var _this3 = this;

                this.modes = {};

                var _setSplitDiffElementProperties = function _setSplitDiffElementProperties($untilRevisionImageContainer, $splitContainer, naturalImageSize) {

                    // determine the chain of element widths that will allow us to fit our imgs within the content frame:
                    // max width of .binary-container
                    var maxBinaryContainerWidth = getMaxWidthToFit(_this3._$container, _this3._$container.parent().width());
                    // max width of .split-container
                    var maxSplitContainerWidth = getMaxWidthToFit($splitContainer, maxBinaryContainerWidth);
                    // max width of each .binary
                    var maxRevisionWidth = getMaxWidthToFit(_this3._$sinceRevision, maxSplitContainerWidth);
                    // max width of each image
                    var maxImgWidth = getMaxWidthToFit(_this3._$sinceImg, maxRevisionWidth);

                    // set the imgs to their natural width explicitly, or else to the max width if they won't fit.
                    var imageWidth = Math.min(naturalImageSize.width, maxImgWidth);
                    _this3._$imgs.width(imageWidth);
                    // set a proportional height
                    _this3._$imgs.height(Math.floor(imageWidth / naturalImageSize.width * naturalImageSize.height));

                    // set the image container height to perfectly fit the images (they have a border, so we can't just use the same value).
                    $untilRevisionImageContainer.height(_this3._$imgs.outerHeight(true));

                    // now that we have the width of the images, work back up so we can set an explicit width on .binary
                    var revisionWidth = imageWidth + (maxRevisionWidth - maxImgWidth);
                    _this3._$revisions.width(revisionWidth);
                    // shift the entire .until-revision container to the left by the same distance as the width of the image, so that the two .binary containers overlap
                    _this3._$untilRevision.css('margin-left', -revisionWidth);
                };

                /**
                 * Setup and Destroy for TWO_UP are noops
                 */
                this.modes[_imageDifferModes2.default.TWO_UP] = new _imageDifferMode2.default();

                /**
                 * Setup and Destroy methods for BLEND mode
                 */
                this.modes[_imageDifferModes2.default.BLEND] = new _imageDifferMode2.default(

                /**
                 * Setup for BLEND mode
                 */
                function () {
                    // add in the slider
                    var $opacitySliderContainer = (0, _jquery2.default)(bitbucket.internal.component.imageDiffer.opacitySlider());
                    _this3._$container.children('.since-revision').before($opacitySliderContainer);

                    $opacitySliderContainer.on('input change', 'input[type="range"]', function (e) {
                        _this3._$untilImg.css('opacity', parseFloat((0, _jquery2.default)(e.target).val()));
                    });
                },

                /**
                 * Destroy for BLEND mode
                 */
                function () {
                    var $opacitySliderContainer = _this3._$container.children('.opacity-slider-container');

                    $opacitySliderContainer.off('input change');
                    $opacitySliderContainer.remove();
                    _this3._$untilImg.css('opacity', '');
                });

                /**
                 * Setup and Destroy methods for SPLIT mode
                 */
                this.modes[_imageDifferModes2.default.SPLIT] = new _imageDifferMode2.default(

                /**
                 * Setup for SPLIT mode
                 */
                function () {
                    calculateImageNaturalSize(_this3._$imgs).done(function (naturalImageSize) {

                        _this3._$untilImg.wrap(bitbucket.internal.component.imageDiffer.imageContainer());
                        _this3._$revisions.wrapAll(bitbucket.internal.component.imageDiffer.splitContainer());

                        _this3._$untilRevisionImageContainer = _this3._$untilImg.parent();
                        _this3._$splitContainer = _this3._$container.find('.split-container');

                        var maxImageContainerWidth = void 0;
                        var setMaxImageContainerWidth = function setMaxImageContainerWidth() {
                            _setSplitDiffElementProperties(_this3._$untilRevisionImageContainer, _this3._$splitContainer, naturalImageSize);
                            maxImageContainerWidth = _this3._$sinceImg.outerWidth(true);
                        };

                        _this3._onResize = _lodash2.default.debounce(setMaxImageContainerWidth, RESIZE_DEBOUNCE);

                        (0, _jquery2.default)(window).on('resize', _this3._onResize);
                        setMaxImageContainerWidth();

                        var MIN_IMAGE_WIDTH_THRESHOLD = 50;
                        var OFFSET_IMAGE_WIDTH_THRESHOLD = 100;

                        if (naturalImageSize.width < MIN_IMAGE_WIDTH_THRESHOLD) {
                            // If the image width is < 50px, that offset based on image width is not going to be sufficient
                            // to prevent overlap, so fix it at -50px
                            _this3._$untilRevisionLabel.css('margin-left', '-' + MIN_IMAGE_WIDTH_THRESHOLD + 'px');
                            _this3._$sinceRevisionLabel.css('margin-right', '-' + MIN_IMAGE_WIDTH_THRESHOLD + 'px');
                        } else if (naturalImageSize.width < OFFSET_IMAGE_WIDTH_THRESHOLD) {
                            // If the image width is < 100px, offset the since and until (old/new) labels by the same px
                            // distance using negative margins so they sit outside of the .binary container
                            _this3._$untilRevisionLabel.css('margin-left', -naturalImageSize.width);
                            _this3._$sinceRevisionLabel.css('margin-right', -naturalImageSize.width);
                        }

                        var onMove = function onMove(e) {
                            _this3._$untilRevisionImageContainer.css('width', Math.min(e.pageX - e.data.offset.left, maxImageContainerWidth));
                        };

                        _this3._$splitContainer.hover(function () {
                            _this3._$revisions.on('mousemove', { offset: _this3._$untilRevision.offset() }, onMove);
                        }, function () {
                            _this3._$revisions.off('mousemove', onMove);
                        });
                    });
                },

                /**
                 * Destroy for SPLIT mode
                 */
                function () {
                    _this3._$imgs.css({
                        width: '',
                        height: ''
                    });
                    _this3._$revisions.css('width', '');
                    _this3._$untilRevision.css('margin-left', '');
                    _this3._$untilRevisionLabel.add(_this3._$sinceRevisionLabel).css({
                        marginLeft: '',
                        marginRight: ''
                    });

                    _this3._$untilImg.unwrap();
                    _this3._$untilRevisionImageContainer.remove(); // cleanup events
                    delete _this3._$untilRevisionImageContainer;

                    _this3._$revisions.unwrap();
                    _this3._$splitContainer.remove(); // cleanup events
                    delete _this3._$splitContainer;

                    if (_this3._onResize) {
                        (0, _jquery2.default)(window).off('resize', _this3._onResize);
                        delete _this3._onResize;
                    }
                });

                /**
                 * Setup and Destroy for PIXEL_DIFF mode
                 */
                this.modes[_imageDifferModes2.default.PIXEL_DIFF] = new _imageDifferMode2.default(

                /**
                 * Setup for PIXEL_DIFF mode
                 */
                function () {
                    _this3._$revisions.wrapAll(bitbucket.internal.component.imageDiffer.pixelDiffContainer());
                    _this3._$pixelDiffContainer = _this3._$container.find('.pixeldiff-container');

                    if (_this3._$pixelDiffImg) {
                        _this3._$pixelDiffContainer.append(_this3._$pixelDiffImg);
                        return;
                    }

                    var $spinner = (0, _jquery2.default)(bitbucket.internal.component.imageDiffer.spinner());
                    _this3._$pixelDiffContainer.append($spinner);
                    $spinner.spin('large');

                    _lodash2.default.defer(function () {
                        var sincePromise = getImageData(_this3._$sinceImg);
                        var untilPromise = getImageData(_this3._$untilImg);

                        _jquery2.default.when(sincePromise, untilPromise).then(function (sinceImgData, untilImgData) {
                            _resemble2.default.outputSettings({
                                errorColor: {
                                    red: 208,
                                    green: 68,
                                    blue: 55
                                },
                                errorType: 'flat',
                                transparency: 0.1 });

                            // setting to 0 is broken: https://github.com/Huddle/Resemble.js/issues/26
                            var comparePromise = _jquery2.default.Deferred();
                            (0, _resemble2.default)(sinceImgData).compareTo(untilImgData).onComplete(function (data) {
                                return comparePromise.resolve(data);
                            });

                            return comparePromise;
                        }).done(function (data) {
                            _this3._$pixelDiffImg = (0, _jquery2.default)(bitbucket.internal.component.imageDiffer.pixelDiffImage({ imageSrc: data.getImageDataUrl() }));
                            _this3._$pixelDiffContainer.append(_this3._$pixelDiffImg);
                        }).always(function () {
                            $spinner.remove();
                        });
                    });
                },

                /**
                 * Destroy for PIXEL_DIFF mode
                 */
                function () {
                    if (_this3._$pixelDiffImg) {
                        _this3._$pixelDiffImg.remove(); // Removing from DOM but keeping generated image for perf reasons
                    }

                    _this3._$revisions.unwrap();
                    _this3._$pixelDiffContainer.remove();
                    delete _this3._$pixelDiffContainer;
                });
            }
        }]);
        return ImageDiffer;
    }(_widget2.default);

    /**
     * Calculate the natural size of an image.
     *
     * @param {jQuery|HtmlElement} image - The image whose size will be calculated
     * @returns {Promise.<{width:number, height:number}>}
     */
    function calculateImageNaturalSize(image) {
        var $image = (0, _jquery2.default)(image);
        if ($image.data('natural-size')) {
            return _jquery2.default.Deferred().resolve($image.data('natural-size'));
        }

        // user the naturalWidth and naturalHeight properties if it's available
        if (image.naturalWidth) {
            var size = {
                width: image.naturalWidth,
                height: image.naturalHeight
            };
            $image.data('natural-size', size);
            return _jquery2.default.Deferred().resolve(size);
        }

        // create an image object in memory, wait till it's loaded and get its dimensions
        var newImg = new Image();
        var promise = _jquery2.default.Deferred();
        var onComplete = _lodash2.default.once(function () {
            var size = {
                width: newImg.width,
                height: newImg.height
            };
            $image.data('natural-size', size);
            promise.resolve(size);
        });

        newImg.onload = onComplete;
        newImg.src = $image.attr('src');
        if (newImg.complete) {
            onComplete();
        }
        return promise;
    }

    /**
     * Get the maximum width of a given element by subtracting the box model things from it
     *
     * @param {jQuery} $el - The element to measure
     * @param {number} parentWidth - The width to fit into
     * @returns {number}
     */
    function getMaxWidthToFit($el, parentWidth) {

        var marginBorderPadding = $el.data('margin_border_padding');
        if (marginBorderPadding == null) {
            marginBorderPadding = $el.outerWidth(true) - $el.width();
            $el.data('margin_border_padding', marginBorderPadding);
        }

        return parentWidth - marginBorderPadding;
    }

    /**
     * Get the image data for a given image tag
     *
     * @param {jQuery} $image - The image element to get data from
     * @returns {*|Promise.<{width: number, height: number}>|Promise|!Promise.<RESULT>}
     */
    function getImageData($image) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        return calculateImageNaturalSize($image).then(function (size) {
            canvas.height = size.height;
            canvas.width = size.width;
            ctx.drawImage($image[0], 0, 0);
            return ctx.getImageData(0, 0, canvas.width, canvas.height);
        });
    }

    exports.default = ImageDiffer;
    module.exports = exports['default'];
});