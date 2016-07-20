'use strict';

define('bitbucket/internal/feature/repository/branch-diagram', ['jquery', 'lodash', 'bitbucket/internal/model/repository', 'bitbucket/internal/model/revision-reference'], function ($, _, Repository, RevisionReference) {

    function BranchDiagram(el) {
        this.$el = $(el);
    }

    BranchDiagram.prototype._updateRefLozenge = function (refLozengeClass, newRef, repo) {
        var $refLozenge = this.$el.find("." + refLozengeClass);
        $refLozenge.trigger('mouseout'); // This is to hide any visible Tipsy tooltips

        if (newRef && newRef instanceof RevisionReference) {

            if (!newRef.getDisplayId() && !newRef.getId()) {
                $refLozenge.addClass('invisible');
            } else {
                var newRefLozenge = bitbucket.internal.feature.repository.refLozenge({
                    ref: newRef.toJSON(),
                    repository: repo && repo instanceof Repository ? repo.toJSON() : null,
                    extraClasses: refLozengeClass
                });

                if ($refLozenge.length) {
                    $refLozenge.replaceWith(newRefLozenge).removeClass('invisible');
                } else {
                    this.$el.append(newRefLozenge);
                }
            }
        } else if (newRef == null || newRef === '') {
            $refLozenge.addClass('invisible');
        }

        var isSourceAndTargetSet = this.$el.find('.source-ref').length && this.$el.find('.target-ref').length;
        this.$el.toggleClass('disabled', !isSourceAndTargetSet);
    };

    BranchDiagram.prototype.updateSourceRef = _.partial(BranchDiagram.prototype._updateRefLozenge, 'source-ref');
    BranchDiagram.prototype.updateTargetRef = _.partial(BranchDiagram.prototype._updateRefLozenge, 'target-ref');

    return BranchDiagram;
});