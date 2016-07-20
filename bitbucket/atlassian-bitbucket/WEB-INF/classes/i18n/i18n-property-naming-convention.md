# Bitbucket Server i18n Properties Naming Convention

## Conventions

* General structure, where each module corresponds to its Maven project, and sections are semantically grouped together.

	`bitbucket.[module].[section].{more sections if required}.[key]`

* Keys should be all in lowercase; non-alphanumeric, non-period characters are discouraged. Properties are handled as ISO 8859-1 encoded by default; non-conformant characters are forbidden. (If you need to insert a Unicode character into a properties file as a value, use \u0000 notation, though Unicode characters must not be used in property keys.)	

	`bitbucket.web.about.copyright=Copyright \u00A9 {0} Atlassian Corporation Pty Ltd.`

* Singular tags are preferred over plural. (Exceptions: situations where the intent is clearer with the plural, e.g. settings)

	`bitbucket.web.admin.commit.*`
	
	instead of

	`bitbucket.web.admin.commits.*`

* Tags and semantic groups with multiple words should generally be concatenated without separating characters or camel casing.

	`bitbucket.web.admin.pullrequest.*`

	instead of

	`bitbucket.web.admin.pullRequest.*, bitbucket.web.admin.pull-request.*, bitbucket.web.admin.pull.request.*`

* Common keys should be specified in a "global" group at the level of re-use.

	A key commonly used across the web module:

	`bitbucket.web.global.cancel`

	A key commonly used across the entire Stash project:

	`bitbucket.global.appname`

* Verbs should typically go at the end of a key. (Exception: if there are no other similar keys and it makes sense to concatenate, do so; e.g. `bitbucket.web.pullrequest.createemail` if there were no other keys in `bitbucket.web.pullrequest.email.*`.)

	`bitbucket.web.pullrequest.email.create`

	instead of

	`bitbucket.web.pullrequest.create.email`

* If there are multiple related keys that justify creating a new group, create that group.
	
	Refactor:

	`bitbucket.web.pullrequest.createemail, stash.web.pullrequest.sendemail`

	into:

	`bitbucket.web.pullrequest.email.create, stash.web.pullrequest.email.send`

* Key sections should progress from broader scope to narrower scope.

	`bitbucket.web.settings.admin.database.hostname`

	instead of

	`bitbucket.web.admin.database.settings.hostname`
