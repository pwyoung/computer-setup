"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
class SettingsManagerNew {
    constructor() {
        if (SettingsManagerNew.Instance) {
            throw new Error('constructor should not be called');
        }
    }
    updatePATH(section, key, env) {
        let configSection = vscode.workspace.getConfiguration(section);
        const value = configSection.get(key);
        if (!!value && value.length > 0) {
            this.appendPATH(value, env);
        }
        else {
            vscode.window.showErrorMessage(`${section}.${key} is not configured in your configuration.`);
        }
    }
    appendPATH(value, env) {
        if (!!env.PATH) {
            env.PATH = `${value}${path.delimiter}${env.PATH}`;
        }
        else {
            env.Path = `${value}${path.delimiter}${env.Path}`;
        }
    }
    updateVariable(section, key, env) {
        let configSection = vscode.workspace.getConfiguration(section);
        const value = configSection.get(key);
        if (!!value && value.length > 0) {
            env[key] = value;
            return value;
        }
        else {
            vscode.window.showErrorMessage(`${section}.${key} is not configured in your configuration.`);
            return "";
        }
    }
    // If cluster configuration format is incorrect, then replace it with a empty array
    getClusterConfiguration() {
        return __awaiter(this, void 0, void 0, function* () {
            const config = vscode.workspace.getConfiguration('hdinsightJobSumission');
            const clusterConf = config.get('ClusterConf');
            return clusterConf ? clusterConf : [];
        });
    }
    getSelectClusterConfiguration(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const clusterConfs = yield this.getClusterConfiguration();
            let clusterName;
            if (filePath && vscode.workspace.rootPath) {
                for (const num in clusterConfs) {
                    if (clusterConfs[num]['filePath'] == filePath) {
                        clusterName = clusterConfs[num]['name'];
                    }
                }
            }
            return clusterName;
        });
    }
    setClusterConfiguration(clusterName, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const clusterConfArray = yield this.getClusterConfiguration();
            const newItem = new ClusterConfiguration(clusterName, filePath);
            // Remove the item if a filePath has already existed in configuration file
            for (let index = 0; index < clusterConfArray.length; index++) {
                if (clusterConfArray[index].filePath === filePath) {
                    clusterConfArray.splice(index, 1);
                }
            }
            clusterConfArray.push(newItem);
            let newArray;
            if (clusterConfArray.length >= SettingsManagerNew.MAX_CLUSTER_NUMBER) {
                newArray = clusterConfArray.slice(-SettingsManagerNew.MAX_CLUSTER_NUMBER);
            }
            else {
                newArray = clusterConfArray;
            }
            const config = vscode.workspace.getConfiguration('hdinsightJobSumission');
            yield config.update('ClusterConf', newArray, vscode.ConfigurationTarget.Workspace);
        });
    }
    getSparkConfiguration() {
        const livyConfig = vscode.workspace.getConfiguration('hdinsightJobSumission').get('livyConf');
        let livyConfReturn = {};
        if (livyConfig) {
            for (const prop in livyConfig) {
                if (prop && (prop in LivyPropertyList)) {
                    const value = livyConfig[prop];
                    const checkResult = checkParameters(value, prop);
                    if (checkResult) {
                        if (value === '') {
                            livyConfReturn[prop] = null;
                        }
                        else {
                            livyConfReturn[prop] = value;
                        }
                    }
                }
            }
        }
        return livyConfReturn;
    }
    getAzureEnvironment() {
        return vscode.workspace.getConfiguration('hdinsight').get('azureEnvironment');
    }
    setAzureEnvironment(environmentName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (environmentName) {
                const azureConfig = vscode.workspace.getConfiguration('hdinsight');
                yield azureConfig.update('azureEnvironment', environmentName, vscode.ConfigurationTarget.Global);
            }
        });
    }
}
SettingsManagerNew.MAX_CLUSTER_NUMBER = 10;
SettingsManagerNew.Instance = new SettingsManagerNew();
exports.SettingsManagerNew = SettingsManagerNew;
class ClusterConfiguration {
    constructor(name, filePath) {
        this.name = name;
        this.filePath = filePath;
    }
}
exports.ClusterConfiguration = ClusterConfiguration;
class SparkDotnetConfiguration {
}
exports.SparkDotnetConfiguration = SparkDotnetConfiguration;
// function to check the format of user input
function checkParameters(value, property) {
    if (!value) {
        return true;
    }
    switch (property) {
        case 'file':
            return checkString(value, property);
        case 'proxyUser':
            return checkString(value, property);
        case 'className':
            return checkString(value, property);
        case 'args':
            return checkListOfString(value, property);
        case 'jars':
            return checkListOfString(value, property);
        case 'pyFiles':
            return checkListOfString(value, property);
        case 'files':
            return checkListOfString(value, property);
        case 'driverMemory':
            return checkMemoryFormat(value, property);
        case 'driverCores':
            return checkNumber(value, property);
        case 'executorMemory':
            return checkMemoryFormat(value, property);
        case 'executorCores':
            return checkNumber(value, property);
        case 'numExecutors':
            return checkNumber(value, property);
        case 'archives':
            return checkListOfString(value, property);
        case 'queue':
            return checkString(value, property);
        case 'name':
            return checkString(value, property);
        case 'conf':
            return true;
    }
    return false;
}
exports.checkParameters = checkParameters;
// check whether the user input is number or not
function checkNumber(value, prop) {
    if (typeof (value) === 'number') {
        return true;
    }
    throw new SparkConfigurationError(`input ${prop} : ${value} is not a number`);
}
exports.checkNumber = checkNumber;
// check whether the user input is string or not
function checkString(value, prop) {
    if (typeof (value) === 'string') {
        return true;
    }
    throw new SparkConfigurationError(`input ${prop} : ${value} is not a string`);
}
exports.checkString = checkString;
function checkMemoryFormat(value, prop) {
    // regular express to check memory format
    // memory can only in the format of 'number g' or 'number G' or 'number M' or 'number m'
    const regexp = new RegExp('[0-9]+[g|G|m|M]$');
    if (typeof (value) === 'string') {
        if (value.match(regexp)) {
            return true;
        }
    }
    throw new SparkConfigurationError(`${prop} : ${value} format error`);
}
exports.checkMemoryFormat = checkMemoryFormat;
function checkListOfString(value, prop) {
    let result = false;
    if (value.constructor === Array) {
        for (const key of value) {
            if (typeof (key) === 'string') {
                result = true;
            }
            else {
                result = false;
            }
        }
    }
    if (result) {
        return result;
    }
    else {
        throw new SparkConfigurationError(`input ${prop} : ${value} is not a List of string`);
    }
}
exports.checkListOfString = checkListOfString;
// to check whether Livy configuration contains certain property
var LivyPropertyList;
(function (LivyPropertyList) {
    LivyPropertyList["file"] = "file";
    LivyPropertyList["proxyUser"] = "proxyUser";
    LivyPropertyList["className"] = "className";
    LivyPropertyList["args"] = "args";
    LivyPropertyList["jars"] = "jars";
    LivyPropertyList["pyFiles"] = "pyFiles";
    LivyPropertyList["files"] = "files";
    LivyPropertyList["driverMemory"] = "driverMemory";
    LivyPropertyList["driverCores"] = "driverCores";
    LivyPropertyList["executorMemory"] = "executorMemory";
    LivyPropertyList["executorCores"] = "executorCores";
    LivyPropertyList["numExecutors"] = "numExecutors";
    LivyPropertyList["archives"] = "archives";
    LivyPropertyList["queue"] = "queue";
    LivyPropertyList["name"] = "name";
    LivyPropertyList["conf"] = "conf";
})(LivyPropertyList = exports.LivyPropertyList || (exports.LivyPropertyList = {}));
class SparkConfigurationError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.SparkConfigurationError = SparkConfigurationError;

//# sourceMappingURL=newSettings.js.map
