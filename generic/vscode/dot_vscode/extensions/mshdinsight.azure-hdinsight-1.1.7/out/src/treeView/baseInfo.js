"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
class BaseNode {
    constructor(label, contextValue) {
        this.label = label;
        this.contextValue = contextValue;
    }
    setIcon(iconFileName) {
        this.iconPath = {
            light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', iconFileName),
            dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', iconFileName)
        };
    }
}
exports.BaseNode = BaseNode;
class ParentBase extends BaseNode {
    constructor() {
        super(...arguments);
        this._hasMoreChildren = false;
    }
    hasMoreChildren() {
        return this._hasMoreChildren;
    }
}
exports.ParentBase = ParentBase;

//# sourceMappingURL=baseInfo.js.map
