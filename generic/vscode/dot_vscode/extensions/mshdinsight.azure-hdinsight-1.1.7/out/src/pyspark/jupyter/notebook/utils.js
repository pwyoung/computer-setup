"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../../common");
const procUtils_1 = require("../common/procUtils");
const vscode_1 = require("vscode");
const utils_1 = require("../../../utils");
const jupyterService_1 = require("../../jupyterService");
function getAvailableNotebooks() {
    return procUtils_1.execPythonFileSync(jupyterService_1.default.getInstance().getJupyterPath(), ['notebook', 'list', '--jsonlist'], jupyterService_1.default.getInstance().getBinDir())
        .then(resp => {
        const originalObj = JSON.parse(resp);
        var items = originalObj.map(item => {
            return {
                baseUrl: item['url'],
                token: item['token'],
                startupFolder: item['notebook_dir'],
                port: item['port'],
                pid: item['pid']
            };
        }).filter(nb => utils_1.isNotNull(nb));
        return items;
    });
}
exports.getAvailableNotebooks = getAvailableNotebooks;
function waitForNotebookToStart(baseUrl, retryInterval, timeout) {
    baseUrl = baseUrl.toLowerCase();
    let def = common_1.createDeferred();
    let stop = setTimeout(() => {
        if (!def.completed) {
            def.reject('Timeout waiting for Notebook to start');
        }
    }, timeout);
    let startTime = Date.now();
    function check() {
        getAvailableNotebooks()
            .catch(ex => {
            console.error('Error in checking if notebook has started');
            console.error(ex);
            return [];
        })
            .then(items => {
            let index = items.findIndex(item => item.baseUrl.toLowerCase().indexOf(baseUrl) === 0);
            if (index === -1) {
                if (Date.now() - startTime > timeout) {
                    return def.reject('Timeout waiting for Notebook to start');
                }
                setTimeout(() => check(), retryInterval);
            }
            else {
                def.resolve(items[index]);
            }
        });
    }
    setTimeout(() => check(), 0);
    return def.promise;
}
exports.waitForNotebookToStart = waitForNotebookToStart;
function parseNotebookListItem(item) {
    if (!item.trim().startsWith('http')) {
        return utils_1.nullValue();
    }
    let parts = item.split('::').filter(part => part !== '::').map(part => part.trim());
    let url = parts.shift();
    let startupFolder = item.indexOf('::') > 0 ? parts[0].trim() : null;
    let token = '';
    let urlOnly = url;
    if (url.indexOf('token=') > 0) {
        token = url.split('=')[1].trim();
        urlOnly = url.split('?')[0].trim();
    }
    return {
        startupFolder: startupFolder,
        token: token,
        baseUrl: urlOnly
    };
}
function selectExistingNotebook() {
    let def = common_1.createDeferred();
    getAvailableNotebooks()
        .then(notebooks => {
        let items = notebooks.map(item => {
            let details = item.startupFolder && item.startupFolder.length > 0 ? `Starup Folder: ${item.startupFolder}` : '';
            return {
                label: item.baseUrl,
                description: '',
                detail: details,
                notebook: item
            };
        });
        vscode_1.window.showQuickPick(items)
            .then(item => {
            if (item) {
                def.resolve(item.notebook);
            }
            else {
                def.resolve();
            }
        });
    });
    return def.promise;
}
exports.selectExistingNotebook = selectExistingNotebook;
function inputNotebookDetails() {
    let def = common_1.createDeferred();
    vscode_1.window.showInputBox({
        prompt: 'Provide Url of existing Jupyter Notebook (e.g. http://localhost:888/)',
        value: 'http://localhost:8888/'
    }).then(url => {
        if (!url) {
            return;
        }
        let nb = parseNotebookListItem(url);
        if (!nb) {
            return;
        }
        return nb;
    }).then(nb => {
        if (!nb || nb.token) {
            return def.resolve(nb);
        }
        vscode_1.window.showInputBox({
            prompt: 'Provide the token to connect to the Jupyter Notebook'
        }).then(token => {
            if (token) {
                nb.token = token;
            }
            def.resolve(nb);
        });
    });
    return def.promise;
}
exports.inputNotebookDetails = inputNotebookDetails;

//# sourceMappingURL=utils.js.map
