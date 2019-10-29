"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../utils");
const languageService = require("../hive/languageService");
const commandManager_1 = require("./commandManager");
const fileType_1 = require("./fileType");
const hiveController_1 = require("./hiveController");
function defaultOpenedEditorValidation(context) {
    let currentActiveDoc = utils.getCurrentActiveDocument();
    if (currentActiveDoc && currentActiveDoc.languageId === 'hql') {
        if (!languageService.isLanguageServiceEnabled()) {
            languageService.initializeHiveLanguageService(context);
        }
        commandManager_1.CommandManager.Instance.fireActiveEditorChanged(fileType_1.FileType.Hql);
        hiveController_1.getOrCreateHiveController(context);
    }
    if (currentActiveDoc && currentActiveDoc.languageId === 'python') {
        commandManager_1.CommandManager.Instance.fireActiveEditorChanged(fileType_1.FileType.PySpark);
    }
}
exports.defaultOpenedEditorValidation = defaultOpenedEditorValidation;

//# sourceMappingURL=defaultOpenedEditorValidation.js.map
