'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const statusView_1 = require("../views/statusView");
class ThemeColor {
    /**
     * Creates a reference to a theme color.
     * @param id of the color. The available colors are listed in https://code.visualstudio.com/docs/getstarted/theme-color-reference.
     */
    constructor(id) { }
    ;
}
/**
     * Represents the alignment of status bar items.
     */
var StatusBarAlignment;
(function (StatusBarAlignment) {
    /**
     * Aligned to the left side.
     */
    StatusBarAlignment[StatusBarAlignment["Left"] = 1] = "Left";
    /**
     * Aligned to the right side.
     */
    StatusBarAlignment[StatusBarAlignment["Right"] = 2] = "Right";
})(StatusBarAlignment || (StatusBarAlignment = {}));
// Create a dummy Status bar element for each file in the editor
class DummyFileStatusBar extends statusView_1.FileStatusBar {
}
// create a DummyStatusView for the use of making a dummy StatusView in createQueryRunner 
// under runPreviewQuery of hiveOutputContentProvider.ts
class DummyStatusView {
    constructor() {
    }
    dispose() {
    }
    // Create status bar item if needed
    createStatusBar() {
    }
    destroyStatusBar() {
    }
    getStatusBar() {
        // just to return a value since it expects DummyFileStatusBar
        return new DummyFileStatusBar();
    }
    show() {
    }
    notConnected() {
    }
    connecting() {
    }
    executingQuery() {
    }
    executedQuery(fileUri) {
    }
    cancelingQuery() {
    }
    updateStatusMessage() {
    }
    associateWithExisting() {
        // just to return a fake value since it expects a boolean value to return
        return false;
    }
    hideLastShownStatusBar() {
    }
    onDidCloseTextDocument() {
    }
    showStatusBarItem() {
    }
    showProgress() {
    }
}
exports.DummyStatusView = DummyStatusView;

//# sourceMappingURL=dummyStatusView.js.map
