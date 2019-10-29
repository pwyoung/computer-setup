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
const HdinsightTreeInfoProvider_1 = require("./HdinsightTreeInfoProvider");
const baseInfo_1 = require("./baseInfo");
const HiveInfo_1 = require("./HiveInfo");
const BlobInfo_1 = require("./BlobInfo");
const ADLInfo_1 = require("./ADLInfo");
const TreeViewCommands_1 = require("./TreeViewCommands");
class ClusterInfo extends baseInfo_1.ParentBase {
    constructor(label, cluster, credential) {
        super(label, 'HdInsightCluster');
        this.cluster = cluster;
        this.credential = credential;
        this.hiveJobQueue = [];
        this.contextValue = TreeViewCommands_1.TreeViewCommands.initializingPreviewQuery;
        const clusterType = cluster.getClusterType().toLocaleUpperCase();
        if (clusterType === 'SPARK') {
            this.setIcon('AzureSHSpark.png');
        }
        else if (clusterType === 'INTERACTIVEHIVE' || clusterType === 'HADOOP') {
            this.setIcon('AzureSHHiveHadoop.png');
        }
        else {
            this.setIcon('AzureSHHBase.png');
        }
    }
    loadMoreChildren(_node, clearCache) {
        return __awaiter(this, void 0, void 0, function* () {
            let treeList = [];
            const clusterPromise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const storage = yield HdinsightTreeInfoProvider_1.HdinsightProvider.getInstance().getStorage(this.cluster, this.credential);
                if (storage.isAdls) {
                    treeList.push(new ADLInfo_1.ADLFolderInfo('Data Lake Storage', storage));
                }
                else if (storage.isAdlsGen2) {
                    // TODO: Create a new FolderNode Type for ADLSGen2 later
                    // This time just use BlobFolderInfo to envelop it temporarily.
                    treeList.push(new BlobInfo_1.BlobFolderInfo('Data Lake Storage Gen2', storage));
                }
                else {
                    treeList.push(new BlobInfo_1.BlobFolderInfo('Blob Storage', storage));
                }
                treeList.push(new HiveInfo_1.HiveMetadataFolderInfo('Hive Databases', this.cluster, new HiveJobFunctions((node) => this.enqueueHiveJob(node), () => this.runHiveJob())));
                resolve(treeList);
            }));
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve([]);
                }, 30000);
            });
            return Promise.race([clusterPromise, timeoutPromise]);
        });
    }
    enqueueHiveJob(node) {
        this.hiveJobQueue.push(node);
    }
    runHiveJob() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hiveJobQueue.length > 0) {
                yield this.hiveJobQueue.shift().refresh();
            }
        });
    }
}
exports.ClusterInfo = ClusterInfo;
class HiveJobFunctions {
    constructor(enqueueHiveJob, runHiveJob) {
        this.enqueueHiveJob = enqueueHiveJob;
        this.runHiveJob = runHiveJob;
    }
}
exports.HiveJobFunctions = HiveJobFunctions;

//# sourceMappingURL=ClusterInfo.js.map
