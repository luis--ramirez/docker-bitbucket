This is the Bower component for the Image Differ and Image Diff Toolbar that's used in Stash and Bitbucket.

## Setup

1. Run `npm install` in the root
1. Run `gulp` in the root to build the component

You can also `gulp bbui:watch` to build as files are saved.

## Tests
Set up a watcher that will run tests on any file changes using `npm test`


## Sample markup to implement the Image Diff Toolbar

```
<div class="aui-toolbar2 image-differ-toolbar" role="toolbar">
    <div class="aui-toolbar2-inner">
        <div class="aui-toolbar2-primary image-differ-toggle">
            <div class="aui-buttons">
                <button class="aui-button image-differ-two-up" aria-pressed="true" title="Compare images alongside each other">
                    Two-up
                </button>
                <button class="aui-button image-differ-blend" aria-disabled="true" title="Blend mode image diff is not available because images are not of the same dimension">
                    Blend
                </button>
                <button class="aui-button image-differ-split" aria-disabled="true" title="Split mode image diff is not available because images are not of the same dimension">
                    Split
                </button>
            </div>
        </div>
    </div>
</div>
```
