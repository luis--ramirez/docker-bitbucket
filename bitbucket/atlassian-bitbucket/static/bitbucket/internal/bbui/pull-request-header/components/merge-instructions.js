define('bitbucket/internal/bbui/pull-request-header/components/merge-instructions', ['module', 'exports', 'react', 'bitbucket/internal/impl/urls', '../../codeblock/codeblock', '../../models/models'], function (module, exports, _react, _urls, _codeblock, _models) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _urls2 = babelHelpers.interopRequireDefault(_urls);

    var _codeblock2 = babelHelpers.interopRequireDefault(_codeblock);

    var MergeInstructions = function (_Component) {
        babelHelpers.inherits(MergeInstructions, _Component);
        babelHelpers.createClass(MergeInstructions, null, [{
            key: 'propTypes',
            get: function get() {
                return {
                    stability: _react.PropTypes.oneOf(Object.keys(_models.BranchStability).map(function (k) {
                        return _models.BranchStability[k];
                    })),
                    isAutoMergeConflict: _react.PropTypes.bool,
                    pullRequest: _react.PropTypes.object.isRequired
                };
            }
        }, {
            key: 'defaultProps',
            get: function get() {
                return {
                    stability: _models.BranchStability.STABLE
                };
            }
        }]);

        function MergeInstructions() {
            var _Object$getPrototypeO;

            babelHelpers.classCallCheck(this, MergeInstructions);

            for (var _len = arguments.length, props = Array(_len), _key = 0; _key < _len; _key++) {
                props[_key] = arguments[_key];
            }

            var _this = babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(MergeInstructions)).call.apply(_Object$getPrototypeO, [this].concat(props)));

            var sourceRepo = _this.props.pullRequest.from_ref.repository;
            var targetRepo = _this.props.pullRequest.to_ref.repository;
            var sourceRemote = null;
            var targetRemote = null;

            if (sourceRepo.id !== targetRepo.id) {
                sourceRemote = _urls2.default.remote(sourceRepo);
                targetRemote = _urls2.default.remote(targetRepo);
            }

            _this.refDetails = {
                sourceBranch: _this.props.pullRequest.from_ref.display_id,
                targetBranch: _this.props.pullRequest.to_ref.display_id,
                sourceRemote: sourceRemote,
                targetRemote: targetRemote
            };
            return _this;
        }

        babelHelpers.createClass(MergeInstructions, [{
            key: 'mergeSteps',
            value: function mergeSteps() {
                // Stable source branch means we fetch source first and then target, and then merge FETCH_HEAD in to target
                // (and thus remotely merging the pull request). This is also the  approach for automerge conflicts.
                if (this.props.stability === _models.BranchStability.STABLE || this.props.isAutoMergeConflict) {
                    return _react2.default.createElement(
                        'div',
                        null,
                        _react2.default.createElement(
                            'p',
                            null,
                            _react2.default.createElement(
                                'strong',
                                null,
                                AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step1'),
                                ' '
                            ),
                            this.refDetails.targetRemote ? AJS.I18n.getText('bitbucket.component.pull.request.merge.fetch.source.branch.crossrepo') : AJS.I18n.getText('bitbucket.component.pull.request.merge.fetch.source.branch.samerepo')
                        ),
                        _react2.default.createElement(
                            _codeblock2.default,
                            { instructionBlock: true },
                            'git fetch ',
                            this.refDetails.sourceRemote ? this.refDetails.sourceRemote : 'origin',
                            ' ',
                            this.refDetails.sourceBranch
                        ),
                        _react2.default.createElement(
                            'p',
                            null,
                            _react2.default.createElement(
                                'strong',
                                null,
                                AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step2'),
                                ' '
                            ),
                            AJS.I18n.getText('bitbucket.component.pull.request.merge.source.into.target.resolve.conflicts')
                        ),
                        _react2.default.createElement(
                            _codeblock2.default,
                            { instructionBlock: true },
                            _react2.default.createElement(
                                'line',
                                null,
                                'git checkout ',
                                this.refDetails.targetBranch
                            ),
                            _react2.default.createElement(
                                'line',
                                null,
                                'git merge FETCH_HEAD'
                            )
                        ),
                        _react2.default.createElement(
                            'p',
                            null,
                            _react2.default.createElement(
                                'strong',
                                null,
                                AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step3'),
                                ' '
                            ),
                            AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step3.text')
                        ),
                        _react2.default.createElement(
                            _codeblock2.default,
                            { instructionBlock: true },
                            _react2.default.createElement(
                                'line',
                                null,
                                'git commit'
                            ),
                            _react2.default.createElement(
                                'line',
                                null,
                                'git push ',
                                this.refDetails.targetRemote ? this.refDetails.targetRemote : 'origin',
                                ' HEAD'
                            )
                        ),
                        _react2.default.createElement(
                            'p',
                            null,
                            _react2.default.createElement(
                                'strong',
                                null,
                                AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step4'),
                                ' '
                            ),
                            AJS.I18n.getText('bitbucket.component.pull.request.merge.merged.remotely')
                        )
                    );
                }
                // Unstable source branch means we fetch target first and then source, and then merge FETCH_HEAD in to source
                return _react2.default.createElement(
                    'div',
                    null,
                    _react2.default.createElement(
                        'p',
                        null,
                        _react2.default.createElement(
                            'strong',
                            null,
                            AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step1'),
                            ' '
                        ),
                        this.refDetails.targetRemote ? AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step1.crossrepo.text') : AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step1.samerepo.text')
                    ),
                    _react2.default.createElement(
                        _codeblock2.default,
                        { instructionBlock: true },
                        'git fetch ',
                        this.refDetails.targetRemote ? this.refDetails.targetRemote : 'origin',
                        ' ',
                        this.refDetails.targetBranch
                    ),
                    _react2.default.createElement(
                        'p',
                        null,
                        _react2.default.createElement(
                            'strong',
                            null,
                            AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step2'),
                            ' '
                        ),
                        AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step2.text')
                    ),
                    _react2.default.createElement(
                        _codeblock2.default,
                        { instructionBlock: true },
                        _react2.default.createElement(
                            'line',
                            null,
                            'git checkout ',
                            this.refDetails.sourceBranch
                        ),
                        _react2.default.createElement(
                            'line',
                            null,
                            'git merge FETCH_HEAD'
                        )
                    ),
                    _react2.default.createElement(
                        'p',
                        null,
                        _react2.default.createElement(
                            'strong',
                            null,
                            AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step3'),
                            ' '
                        ),
                        AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step3.text')
                    ),
                    _react2.default.createElement(
                        _codeblock2.default,
                        { instructionBlock: true },
                        _react2.default.createElement(
                            'line',
                            null,
                            'git commit'
                        ),
                        _react2.default.createElement(
                            'line',
                            null,
                            'git push ',
                            this.refDetails.sourceRemote ? this.refDetails.sourceRemote : 'origin',
                            ' HEAD'
                        )
                    ),
                    _react2.default.createElement(
                        'p',
                        null,
                        _react2.default.createElement(
                            'strong',
                            null,
                            AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step4'),
                            ' '
                        ),
                        AJS.I18n.getText('bitbucket.component.pull.request.merge.help.step4.text')
                    )
                );
            }
        }, {
            key: 'render',
            value: function render() {
                var intro = AJS.I18n.getText('bitbucket.component.pull.request.merge.help.introduction');
                if (this.props.isAutoMergeConflict) {
                    intro = AJS.I18n.getText('bitbucket.component.pull.request.automerge.help.introduction');
                }

                return _react2.default.createElement(
                    'div',
                    { className: 'merge-instructions' },
                    _react2.default.createElement(
                        'p',
                        { className: 'intro' },
                        intro
                    ),
                    this.mergeSteps()
                );
            }
        }]);
        return MergeInstructions;
    }(_react.Component);

    exports.default = MergeInstructions;
    module.exports = exports['default'];
});