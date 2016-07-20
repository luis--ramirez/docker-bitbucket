# bitbucket-filter-bar

> A configurable set of toggle buttons or dropdowns that apply a filter to a list or table.

## Usage

Initialize the FilterBar with a description of the filters in it. Then listen to the "change" method and read the `state` to get a map of ID to value for each filter.

```
var filterBar = new FilterBar(containerEl, options);

filterBar.on('change', function() {
    console.log(filterBar.state);
});

```

### Options

```
{
    id : 'an HTML ID to give the bar itself'
    filters: [{ // a list of filters to place in the bar.
        id: 'an HTML ID for the filter, and also the key that will be used when outputting the filter's state,
        text: 'A label to display for the filter. This is the text of a toggle button, or merely assistive for select filters.',
        type: 'toggle|select',
        value: 'the  ID of the item to initially select for the filter'
    }, {
        id: 'filter-two',
        text: 'filter two',
        type: 'select',
        menu: { // A select filter requires a menu to describe results
            items : [{ // you can either hardcode items (which will be passed to Select2), or pass a dataProvider and placeholder (see below)
                id : 'item-one',
                text: 'item one'
            }, {
                id : 'item-two',
                text: 'item two'
            }],
            formatResults: function() {
                console.log('You can also pass any Select2 options through here. Note that if you provide a dataProvider, then you can't pass through query or AJAX');
            }
        }
    }, {
        id: 'filter-three',
        text: 'filter three',
        type: 'select',
        menu: {
            dataProvider: new DummyDataProvider(),
            transform: function(rawItem) { return transformed(rawItem) }, // do whatever transforms you want on the dataProvider output.
            placeholder: 'Text that will show in the filter when nothing is selected.'
        },
        value: initialValues && initialValues['filter-three']
    }]
}
```
