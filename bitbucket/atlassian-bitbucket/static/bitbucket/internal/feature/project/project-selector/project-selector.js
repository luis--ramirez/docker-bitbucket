'use strict';

define('bitbucket/internal/feature/project/project-selector', ['jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/model/project', 'bitbucket/internal/util/events', 'bitbucket/internal/widget/searchable-selector'], function ($, _, nav, Project, events, SearchableSelector) {

    /**
     * A searchable selector for choosing a Project
     * @extends {SearchableSelector}
     * @return {ProjectSelector}  The new ProjectSelector instance
     *
     * @param {HTMLElement|jQuery}  trigger     The trigger (usually a button) to bind opening the selector to.
     * @param {Object}              options     A hash of options, valid options are specified in ProjectSelector.prototype.defaults
     */
    function ProjectSelector(trigger, options) {
        return this.init.apply(this, arguments);
    }

    $.extend(ProjectSelector.prototype, SearchableSelector.prototype);

    /**
     * Default options.
     * All options can also be specified as functions that return the desired type (except params that expect a function).
     * Full option documentation can be found on SearchableSelector.prototype.defaults
     * @inheritDocs
     */
    ProjectSelector.prototype.defaults = $.extend(true, {}, SearchableSelector.prototype.defaults, {
        url: function url() {
            return nav.allProjects().withParams({
                avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' }),
                permission: 'PROJECT_ADMIN'
            }).build();
        },
        searchable: true,
        queryParamKey: 'name',
        extraClasses: 'project-selector',
        resultsTemplate: bitbucket.internal.feature.project.projectSelectorResults,
        triggerContentTemplate: bitbucket.internal.feature.project.projectSelectorTriggerContent,
        searchPlaceholder: 'Search for a project',
        namespace: 'project-selector',
        itemSelectedEvent: 'bitbucket.internal.feature.project.projectSelector.projectChanged',
        itemDataKey: 'project',
        paginationContext: 'project-selector'
    });

    ProjectSelector.constructDataPageFromPreloadArray = SearchableSelector.constructDataPageFromPreloadArray;

    /**
     * Build a Project from the metadata on the trigger.
     * @override
     * @return {Project} The newly created Project
     */
    ProjectSelector.prototype._getItemFromTrigger = function () {
        var $triggerItem = this.$trigger.find('.project');
        return new Project(this._buildObjectFromElementDataAttributes($triggerItem));
    };

    /**
     * @param project
     */
    ProjectSelector.prototype.setSelectedItem = function (project) {
        if (project instanceof Project && !project.isEqual(this._selectedItem)) {
            this._itemSelected(project);
        }
    };

    /**
     * Handle an item being selected.
     * This creates a new Project from the item data,
     * triggers the stash.feature.project.projectSelector.projectChanged event with the new Project,
     * sets the selectedItem to the new Project and updates the trigger and form field (if supplied)
     * @override
     *
     * @param {Object|Project}  projectData     The JSON data or Project model for the selected item.
     */
    ProjectSelector.prototype._itemSelected = function (projectData) {
        var project;
        if (projectData instanceof Project) {
            project = projectData;
            projectData = projectData.toJSON();
        } else {
            projectData = _.pick(projectData, _.keys(Project.prototype.namedAttributes));
            project = new Project(projectData);
        }
        this._selectedItem = project;
        if (this._getOptionVal('field')) {
            $(this._getOptionVal('field')).val(project.getId());
        }
        this.updateTrigger({ project: projectData }, project.getName());
        events.trigger(this._getOptionVal('itemSelectedEvent'), this, project, this._getOptionVal('context'));
    };

    return ProjectSelector;
});