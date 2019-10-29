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
const environment_1 = require("../azure/environment");
const telemetry_1 = require("../telemetry");
const sprintf_js_1 = require("sprintf-js");
const HdinsightTreeInfoProvider_1 = require("./HdinsightTreeInfoProvider");
const hiveJob = require("../hive/jobs");
const hiveController_1 = require("../controllers/hiveController");
const utils = require("../utils");
class TreeViewCommands {
    static register(context) {
        vscode.commands.registerCommand('hdinsight.treeview.itemRefresh', (node) => __awaiter(this, void 0, void 0, function* () {
            try {
                telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('ClusterRefreshed', { Action: 'hdinsight.treeview.itemRefresh' });
                if ((node.treeItem).contextValue === TreeViewCommands.startingPreviewQuery) {
                    return;
                }
                // disable preview when refresh running
                (node.treeItem).contextValue = TreeViewCommands.startingRefresh;
                yield node.refresh();
            }
            catch (ex) {
                utils.error(`running refresh failed: ${ex}`);
            }
            finally {
                // add extra delay to wait until refresh finished
                yield utils.delay(3000);
                (node.treeItem).contextValue = TreeViewCommands.stoppedRefresh;
            }
        }));
        vscode.commands.registerCommand('hdinsight.treeview.itemPreview', (node) => __awaiter(this, void 0, void 0, function* () {
            telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('ClusterPreviewed', { Action: 'hdinsight.treeview.itemPreview' });
            if ((node.treeItem).contextValue === TreeViewCommands.startingRefresh) {
                return;
            }
            let queryStringMaps = new Map();
            let clusterName = (node.treeItem).cluster.name;
            let tableName = node.treeItem.label;
            queryStringMaps.set('clusterName', clusterName);
            // set title by tableName
            queryStringMaps.set('title', tableName);
            queryStringMaps.set('isPreview', 'true');
            if (!!node) {
                try {
                    node.treeItem.description = 'Previewing';
                    // add contextValue to monitor displaying preivew button through `view/item/context`
                    (node.treeItem).contextValue = TreeViewCommands.startingPreviewQuery;
                    yield node.treeDataProvider.refresh(node, false);
                    yield hiveJob.previewQuery(hiveController_1.getOrCreateHiveController(context), queryStringMaps);
                }
                catch (ex) {
                    utils.error(`running preview failed: ${ex}`);
                }
                finally {
                    // wait the table result to show completely, otherwise it will be wrong when click again preview while running
                    yield utils.delay(3000);
                    node.treeItem.description = '';
                    (node.treeItem).contextValue = TreeViewCommands.stoppedPreviewQuery;
                    yield node.treeDataProvider.refresh(node, false);
                }
            }
        }));
        // https:// + {cluster Name} + .azurehdinsight.net
        vscode.commands.registerCommand('hdinsight.treeview.cluster.openUrl', (node) => {
            telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('ClusterUrlOpened', { Action: 'hdinsight.treeview.cluster.openUrl' });
            const HDIEnv = environment_1.AzureEnvironmentUtil.getEnvironmentByAzureEnvName(node.environment.name);
            const url = HDIEnv.getClusterConnectionFormat();
            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(sprintf_js_1.sprintf(url, node.treeItem.label)));
        });
        vscode.commands.registerCommand('hdinsightExplorer.loadMore', (node) => HdinsightTreeInfoProvider_1.loadMore(node));
    }
}
TreeViewCommands.initializingPreviewQuery = 'initializingPreviewQuery';
TreeViewCommands.startingPreviewQuery = 'startingPreviewQuery';
TreeViewCommands.stoppedPreviewQuery = 'stoppedPreviewQuery';
TreeViewCommands.startingRefresh = 'startingRefresh';
TreeViewCommands.stoppedRefresh = 'stoppedRefresh';
exports.TreeViewCommands = TreeViewCommands;

//# sourceMappingURL=TreeViewCommands.js.map
