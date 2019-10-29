'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
const path = require("path");
const vscode_languageclient_1 = require("vscode-languageclient");
const utils = require("../utils");
const monoHelper_1 = require("../cross/monoHelper");
let _hiveInteracvitServiceRuntimeFolder;
const _hiveInteractiveFolder = 'HiveInteractive';
function copyHiveInteractiveFilesToUserFolder() {
    const tempFolder = os.tmpdir();
    utils.cleanUserFolder(tempFolder, _hiveInteractiveFolder);
    const folder = _hiveInteractiveFolder + utils.generateUuid();
    _hiveInteracvitServiceRuntimeFolder = path.join(tempFolder, folder);
    fs.mkdirSync(_hiveInteracvitServiceRuntimeFolder);
    const sourceFolder = path.join(utils.getRootInstallDirectory(), 'HiveInteractiveService');
    const promises = utils.copyFolder(sourceFolder, _hiveInteracvitServiceRuntimeFolder);
    return Promise.all(promises);
}
function createServiceOptions() {
    return __awaiter(this, void 0, void 0, function* () {
        let result = yield copyHiveInteractiveFilesToUserFolder();
        let runPath = path.join(_hiveInteracvitServiceRuntimeFolder, 'Microsoft.HDInsight.Hive.Data.Wrapper.exe');
        let command = '';
        let argument;
        switch (process.platform) {
            case 'win32':
                command = runPath;
                break;
            case 'linux':
            case 'darwin':
                let isMonoEnabled = monoHelper_1.checkMonoEnvironment();
                if (isMonoEnabled) {
                    command = 'mono';
                    argument = runPath;
                    break;
                }
        }
        let args = [];
        if (argument) {
            args.push(argument);
        }
        let serverOptions = { command: command, args: args, transport: vscode_languageclient_1.TransportKind.stdio };
        return serverOptions;
    });
}
exports.createServiceOptions = createServiceOptions;

//# sourceMappingURL=interactiveService.js.map
