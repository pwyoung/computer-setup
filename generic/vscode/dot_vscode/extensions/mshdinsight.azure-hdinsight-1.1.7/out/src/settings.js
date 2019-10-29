"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const json = require("comment-json");
const productConstants_1 = require("./productConstants");
const utils = require("./utils");
class SettingsManager {
    constructor() {
        this._hasWorkspaceSettings = false;
        if (SettingsManager.Instance) {
            throw new Error('constructor should not be called');
        }
        SettingsManager.Instance = this;
    }
    initlize() {
        this.globalSettings();
        this._hasWorkspaceSettings = this.workspaceSettings() ? true : false;
    }
    globalSettings() {
        if (!this._globalSettings) {
            let globalSettingsPath = path.join(productConstants_1.ProductConstants.WorkingFolder, 'global_settings.json');
            this._globalSettings = new GlobalSettings(globalSettingsPath);
        }
        return this._globalSettings;
    }
    workspaceSettings() {
        if (!vscode.workspace.rootPath) {
            return null;
        }
        if (!this._workspaceSettings) {
            let workingFolderSettingsPath = path.join(vscode.workspace.rootPath, path.basename(vscode.workspace.rootPath) + '_hdi_settings.json');
            this._workspaceSettings = new WorkSpaceSettings(workingFolderSettingsPath);
        }
        return this._workspaceSettings;
    }
    getSparkConf(filePath) {
        if (this.isWorkspaceFile(filePath)) {
            let workspace = this.workspaceSettings();
            return workspace ? workspace.getLivyConf() : undefined;
        }
        return undefined;
    }
    setSelectCluster(clusterName, filePath) {
        if (filePath && this.isWorkspaceFile(filePath) && vscode.workspace.rootPath) {
            let workspace = this.workspaceSettings();
            if (workspace) {
                workspace.setSelectCluster(clusterName, path.relative(vscode.workspace.rootPath, filePath));
            }
        }
        else {
            // this.globalSettings().setSelectCluster(clusterName, 'global');
        }
    }
    getAzureEnvironment() {
        let workspaceEnvironment = null;
        if (this._hasWorkspaceSettings) {
            let workspace = this.workspaceSettings();
            workspaceEnvironment = workspace ? workspace.getAzureEnvironment() : null;
        }
        return workspaceEnvironment ? workspaceEnvironment : this.globalSettings().getAzureEnvironment();
    }
    setAzureEnvironment(environmentName) {
        if (environmentName) {
            if (this._hasWorkspaceSettings) {
                let workspace = this.workspaceSettings();
                if (workspace) {
                    workspace.setAzureEnvironment(environmentName);
                }
            }
            else {
                // this.globalSettings().setAzureEnvironment(environmentName);
            }
        }
    }
    getSelectCluster(filePath) {
        // let clusterName = this.globalSettings().getDefaultCluster('global');
        let clusterName;
        if (filePath && this.isWorkspaceFile(filePath) && vscode.workspace.rootPath) {
            let workspace = this.workspaceSettings();
            if (workspace) {
                let workSpaceClusterName = workspace.getDefaultCluster(path.relative(vscode.workspace.rootPath, filePath));
                if (workSpaceClusterName) {
                    clusterName = workSpaceClusterName;
                }
            }
        }
        return clusterName;
    }
    isWorkspaceFile(filePath) {
        let result = vscode.workspace.rootPath && this._hasWorkspaceSettings && filePath.startsWith(vscode.workspace.rootPath);
        // can not return result directly since tsconfig check
        return result === true;
    }
}
SettingsManager.Instance = new SettingsManager();
exports.SettingsManager = SettingsManager;
class ClusterFilePair {
    constructor(clusterName, filePath) {
        this.clusterName = clusterName;
        this.filePath = filePath;
    }
}
class Configuration {
    constructor() {
        this.script_to_cluster = [];
        this.livy_conf = {};
        this.additional_conf = {};
    }
}
exports.Configuration = Configuration;
class Settings {
    constructor(_settingPath, isLocal) {
        this._settingPath = _settingPath;
        this._conf = new Configuration();
        this._ensureDirectoryExist();
        if (!fs.existsSync(this._settingPath) && !isLocal) {
            fs.writeFileSync(this._settingPath, json.stringify(this._conf));
        }
    }
    get(key) {
        return this._conf.additional_conf[key];
    }
    set(key, value) {
        this._conf.additional_conf[key] = value;
    }
    _ensureDirectoryExist() {
        if (!fs.existsSync(productConstants_1.ProductConstants.WorkingFolder)) {
            fs.mkdirSync(productConstants_1.ProductConstants.WorkingFolder);
        }
        let dirName = path.dirname(this._settingPath);
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName);
        }
    }
    setSelectCluster(clusterName, filePath) {
        let indexItem = this._conf.script_to_cluster.find(item => item.filePath === filePath);
        if (indexItem) {
            indexItem.clusterName = clusterName;
        }
        else {
            this._conf.script_to_cluster.push(new ClusterFilePair(clusterName, filePath));
        }
        this._saveSetting();
    }
    getAzureEnvironment() {
        return this._conf.additional_conf[Settings.AzureEnvironment];
    }
    setAzureEnvironment(environmentName) {
        if (environmentName === this.getAzureEnvironment()) {
            return;
        }
        this._conf.additional_conf[Settings.AzureEnvironment] = environmentName;
        this._saveSetting();
    }
    getDefaultCluster(filePath) {
        let selectedCluster = this._conf.script_to_cluster.find(item => item.filePath === filePath);
        return selectedCluster ? selectedCluster.clusterName : null;
    }
    getLivyConf() {
        return this._conf;
    }
    _loadSettings() {
        if (fs.existsSync(this._settingPath)) {
            let fileContent = fs.readFileSync(this._settingPath, { encoding: 'UTF8' }).toString();
            try {
                let configContent = json.parse(fileContent);
                this._conf = Object.assign(new Configuration(), configContent);
            }
            catch (error) {
                // corruption configuration file   
                // just ignore this error and generate a new configuration file 
                utils.warn(JSON.stringify(error));
                this._conf = new Configuration();
            }
        }
        else {
            this._conf = new Configuration();
        }
    }
    _saveSetting() {
        this._ensureDirectoryExist();
        fs.writeFileSync(this._settingPath, json.stringify(this._conf, null, 4));
    }
}
Settings.AzureEnvironment = 'azure_environment';
class WorkSpaceSettings extends Settings {
    constructor(configFilePath) {
        super(configFilePath, true);
        // copy configuration template to workspace
        if (!fs.existsSync(configFilePath)) {
            let readBuffer = fs.readFileSync(path.join(utils.getRootInstallDirectory(), 'resources', 'workspace_settings_template.json'));
            fs.writeFileSync(this._settingPath, readBuffer.toString('UTF8'));
        }
        let settingsFileWatcher = vscode.workspace.createFileSystemWatcher('**/*_hdi_settings.json', false, false, false);
        settingsFileWatcher.onDidChange(event => {
            this._loadSettings();
        });
        settingsFileWatcher.onDidDelete(event => {
            this._loadSettings();
        });
        this._loadSettings();
    }
}
exports.WorkSpaceSettings = WorkSpaceSettings;
class GlobalSettings extends Settings {
    constructor(configFilePath) {
        super(configFilePath);
        this._loadSettings();
    }
}

//# sourceMappingURL=settings.js.map
