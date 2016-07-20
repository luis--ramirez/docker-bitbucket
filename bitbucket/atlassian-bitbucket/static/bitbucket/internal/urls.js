'use strict';

define('bitbucket/internal/impl/urls', ['bitbucket/util/navbuilder', 'bitbucket/internal/bbui/javascript-errors/javascript-errors', 'bitbucket/internal/bbui/urls/urls', 'bitbucket/internal/util/object'], function (nav, errors, UrlsSPI, obj) {
    'use strict';

    function Urls() {
        UrlsSPI.call(this);
    }

    obj.inherits(Urls, UrlsSPI);

    var fileChanges = function fileChanges(repository, commitRange) {
        //throw new NotImplementedError();
    };

    Urls.prototype.avatarUrl = function (person, size) {
        var stashPerson = {
            avatarUrl: person.avatar_url
        };
        return nav._avatarUrl(stashPerson, size).build();
    };

    Urls.prototype.pullRequest = function (pullRequest) {
        return nav.currentRepo().pullRequest(pullRequest).build();
    };

    Urls.prototype.inboxPullRequest = function (proj, repo, pullRequest) {
        return nav.project(proj).repo(repo).pullRequest(pullRequest).build();
    };

    Urls.prototype.createPullRequest = function (repository) {
        return nav.project(repository.project).repo(repository).createPullRequest().build();
    };

    Urls.prototype.allPullRequests = function (repository) {
        return nav.project(repository.project).repo(repository).allPullRequests().build();
    };

    Urls.prototype.help = function (key) {
        switch (key) {
            case 'help.mirroring.clone.dialog':
                return bitbucket_help_url('bitbucket.help.mirroring.clone.dialog');
            case 'help.mirroring.getting.started':
                return bitbucket_help_url('bitbucket.help.mirroring.getting.started');
            case 'help.mirroring.setup':
                return bitbucket_help_url('bitbucket.help.mirroring.setup.guide');
            case 'help.pull.request':
                return bitbucket_help_url('bitbucket.help.pull.request');
            case 'help.search.guide':
                return bitbucket_help_url('bitbucket.go.search.guide'); // TODO replace with 'bitbucket.help' link prior to GA
            case 'help.search.troubleshoot':
                return bitbucket_help_url('bitbucket.go.search.troubleshoot'); // TODO replace with 'bitbucket.help' link prior to GA
            case 'help.search.query':
                return bitbucket_help_url('bitbucket.go.search.query'); // TODO replace with 'bitbucket.help' link prior to GA
            default:
                throw new errors.NotImplementedError();
        }
    };

    Urls.prototype.search = function (terms) {
        return nav.search(terms).build();
    };

    Urls.prototype.project = function (project) {
        return nav.project(project).build();
    };

    Urls.prototype.repo = function (repository) {
        return nav.project(repository.project).repo(repository).build();
    };

    Urls.prototype.user = function (user) {
        return nav.user(user.slug).build();
    };

    Urls.prototype.remote = function (repository) {
        return nav.project(repository.project.key).repo(repository.slug).clone(repository.scm_id).buildAbsolute();
    };

    return new Urls();
});