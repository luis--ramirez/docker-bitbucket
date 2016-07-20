'use strict';

define('bitbucket/internal/model/commit-range', ['backbone-brace', 'bitbucket/internal/model/pull-request', 'bitbucket/internal/model/revision'], function (Brace, PullRequest, Revision) {

    'use strict';

    var ROOT = "ROOT";

    /**
     * Generate an ID from the pull request or revisions. Brace complains about
     * defining a getId function, so we eagerly calculate this.
     * Should it cause a performance concern at some point, we should take a look at modifying Brace.
     * It's very unlikely that will happen though.
     */
    function getId(commitRange) {
        //Get a string identifier that can be used as a key in a map of CommitRanges
        if (commitRange.getPullRequest()) {
            return commitRange.getPullRequest().getId();
        }

        return commitRange.getUntilRevision().getId() + "_" + (commitRange.getSinceRevision() ? commitRange.getSinceRevision().getId() : ROOT);
    }

    return Brace.Model.extend({
        namedAttributes: {
            'pullRequest': PullRequest,
            'untilRevision': Revision,
            'sinceRevision': Revision
        },
        initialize: function initialize() {

            if (!this.getUntilRevision()) {
                if (this.getPullRequest()) {
                    //fromRef => the Ref for the FROM/source branch of the pull request (the "newer" end)
                    var fromRef = this.getPullRequest().getFromRef();
                    this.setUntilRevision(fromRef && new Revision({
                        id: fromRef.getLatestCommit()
                    }));

                    //toRef => the Ref for the TO/target branch of the pull request (the "older" end)
                    var toRef = this.getPullRequest().getToRef();
                    this.setSinceRevision(toRef && new Revision({
                        id: toRef.getLatestCommit()
                    }));
                } else {
                    throw new Error("Commits range requires either a pull request or revision(s)");
                }
            }

            if (this.getSinceRevision() && this.getSinceRevision().getId() === ROOT) {
                this.setSinceRevision(undefined);
            }

            this.setId(getId(this));
        }
    });
});