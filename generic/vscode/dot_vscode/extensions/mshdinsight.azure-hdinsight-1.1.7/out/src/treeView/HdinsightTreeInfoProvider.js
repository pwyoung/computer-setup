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
const utils = require("../utils");
const vscode = require("vscode");
const clusters_1 = require("../cluster/clusters");
const vscode_azureextensionui_1 = require("vscode-azureextensionui");
const AzureHDInsightProvider_1 = require("./AzureHDInsightProvider");
const TreeViewCommands_1 = require("./TreeViewCommands");
const authInfo_1 = require("../azure/authInfo");
const utils_1 = require("../utils");
class HdinsightProvider {
    constructor() {
        if (HdinsightProvider._instance) {
            throw new Error('Error: Instantiation failed: Use HdinsightProvider.getInstance() instead of new.');
        }
    }
    static getInstance() {
        return HdinsightProvider._instance;
    }
    getClusters(subscription, credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield clusters_1.getClusterBySubscriptionAndCred(subscription, credentials);
        });
    }
    getStoreKey(storage) {
        return storage.getStorageKey();
    }
    getStorage(cluster, credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield cluster.getConfiguration(credentials);
            }
            catch (ex) {
                utils.error(`get Configuration Credential FAILED: ${utils.exceptionToString(ex)}`);
            }
            return cluster.getStorage();
        });
    }
}
HdinsightProvider._instance = new HdinsightProvider();
exports.HdinsightProvider = HdinsightProvider;
let ifTreeCommandsRegistered = false;
let treeViewfunc;
function registerHdInsightTreeView(context) {
    return __awaiter(this, void 0, void 0, function* () {
        treeViewfunc = yield registerTreeView(context);
    });
}
exports.registerHdInsightTreeView = registerHdInsightTreeView;
function registerTreeView(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const treeDataProvider = new vscode_azureextensionui_1.AzureTreeDataProvider(new AzureHDInsightProvider_1.AzureHDInsightProvider(), 'hdinsightExplorer.loadMore', new vscode_azureextensionui_1.AzureUserInput(context.globalState), undefined);
        context.subscriptions.push(treeDataProvider);
        context.subscriptions.push(vscode.window.registerTreeDataProvider('hdinsight.treeview', treeDataProvider));
        if (!getCommandsRegisterStatus()) {
            TreeViewCommands_1.TreeViewCommands.register();
            setCommandsRegisterStatus(true);
        }
        return {
            getSubscriptionChildren: () => __awaiter(this, void 0, void 0, function* () {
                return yield treeDataProvider.getChildren();
            }),
            findSubscriptionNode: (nodeId) => __awaiter(this, void 0, void 0, function* () {
                return yield treeDataProvider.findNode(nodeId);
            }),
            loadMore: (node) => __awaiter(this, void 0, void 0, function* () {
                return treeDataProvider.loadMore(node);
            })
        };
    });
}
function getSubscriptionWithCredFromTreeviewByID(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const treeNode = yield findSubscriptionNode(id);
        if (treeNode) {
            let subscription = new authInfo_1.Subscription();
            subscription.displayName = treeNode.subscriptionDisplayName;
            subscription.id = treeNode.id;
            subscription.tenantId = treeNode.tenantId;
            return new SubscriptionWithCred(utils_1.generateNewCredentials(treeNode.credentials), subscription);
        }
        else {
            return undefined;
        }
    });
}
exports.getSubscriptionWithCredFromTreeviewByID = getSubscriptionWithCredFromTreeviewByID;
function getSubscriptionWithCredFromTreeview() {
    return __awaiter(this, void 0, void 0, function* () {
        const nodeList = yield getSubscriptionChildren();
        let subWithCredList = [];
        nodeList
            .filter(node => node.subscriptionDisplayName !== undefined) // remove the non-subscription node
            .forEach((node) => {
            let subscription = new authInfo_1.Subscription();
            subscription.displayName = node.subscriptionDisplayName;
            subscription.id = node.id;
            subscription.tenantId = node.tenantId;
            subWithCredList.push(new SubscriptionWithCred(utils_1.generateNewCredentials(node.credentials), subscription));
        });
        return subWithCredList;
    });
}
exports.getSubscriptionWithCredFromTreeview = getSubscriptionWithCredFromTreeview;
function getSubscriptionChildren() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!treeViewfunc) {
            return [];
        }
        return yield treeViewfunc.getSubscriptionChildren();
    });
}
exports.getSubscriptionChildren = getSubscriptionChildren;
function getCredentialFromTreeView(subscriptionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const subscriptionNode = yield findSubscriptionNode(`/subscriptions/${subscriptionId}`);
        if (subscriptionNode) {
            return utils_1.generateNewCredentials(subscriptionNode.credentials);
        }
        else {
            return undefined;
        }
    });
}
exports.getCredentialFromTreeView = getCredentialFromTreeView;
function findSubscriptionNode(id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!treeViewfunc) {
            return undefined;
        }
        return yield treeViewfunc.findSubscriptionNode(id);
    });
}
exports.findSubscriptionNode = findSubscriptionNode;
function loadMore(node) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!treeViewfunc) {
            return undefined;
        }
        yield treeViewfunc.loadMore(node);
    });
}
exports.loadMore = loadMore;
function getCommandsRegisterStatus() {
    return ifTreeCommandsRegistered;
}
function setCommandsRegisterStatus(status) {
    ifTreeCommandsRegistered = status;
}
class SubscriptionWithCred {
    constructor(credential, subscription) {
        this.credential = credential;
        this.subscription = subscription;
    }
}
exports.SubscriptionWithCred = SubscriptionWithCred;

//# sourceMappingURL=HdinsightTreeInfoProvider.js.map
