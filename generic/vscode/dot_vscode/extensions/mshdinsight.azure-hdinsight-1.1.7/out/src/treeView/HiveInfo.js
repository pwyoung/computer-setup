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
const baseInfo_1 = require("./baseInfo");
const hiveJob = require("../hive/jobs");
const hiveController_1 = require("../controllers/hiveController");
const events_1 = require("events");
class HiveSchemaNode extends baseInfo_1.BaseNode {
    constructor(myLabel) {
        super(myLabel, 'hiveSchemaNode');
        this.setIcon('schema.svg');
    }
}
exports.HiveSchemaNode = HiveSchemaNode;
class HiveMetadataFolderInfo extends baseInfo_1.ParentBase {
    constructor(mylabel, cluster, hiveJobFunctions) {
        super(mylabel, 'HiveFolderInfo');
        this.cluster = cluster;
        this.hiveJobFunctions = hiveJobFunctions;
        this.setIcon('folder.svg');
    }
    loadMoreChildren(_node, clearCache) {
        return __awaiter(this, void 0, void 0, function* () {
            const hiveData = new HiveDataOperation(HiveMetadataFolderInfo.showDatabasesCommand, this.cluster, QueryType.query_database, 'undefined', 'undefined', this.hiveJobFunctions);
            const queryPromise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                hiveData.eventEmitter.on('conflict', () => {
                    this.hiveJobFunctions.enqueueHiveJob(_node);
                    resolve([]);
                });
                hiveData.eventEmitter.on('database', rowList => {
                    resolve(rowList.map(key => new HiveDataBaseInfo(key, this.cluster, this.hiveJobFunctions)));
                });
                hiveJob.getHiveMetadata(hiveController_1.getOrCreateHiveController(), hiveData);
            }));
            return Promise.race([queryPromise, setQueryTimeout()]);
        });
    }
}
HiveMetadataFolderInfo.showDatabasesCommand = 'show databases;';
exports.HiveMetadataFolderInfo = HiveMetadataFolderInfo;
class HiveDataBaseInfo extends baseInfo_1.ParentBase {
    constructor(myLabel, cluster, hiveJobFunctions) {
        super(myLabel, 'HiveDataBaseInfo');
        this.myLabel = myLabel;
        this.cluster = cluster;
        this.hiveJobFunctions = hiveJobFunctions;
        this.setIcon('database.svg');
    }
    loadMoreChildren(_node, clearCache) {
        return __awaiter(this, void 0, void 0, function* () {
            const hiveData = new HiveDataOperation(`show tables in ${this.myLabel};`, this.cluster, QueryType.query_table, this.myLabel, 'undefined', this.hiveJobFunctions);
            const queryPromise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                hiveData.eventEmitter.on('conflict', () => {
                    this.hiveJobFunctions.enqueueHiveJob(_node);
                    resolve([]);
                });
                hiveData.eventEmitter.on('table', rowList => {
                    resolve(rowList.map(tableName => new HiveTableInfo(tableName, this.myLabel, this.cluster, this.hiveJobFunctions)));
                });
                yield hiveJob.getHiveMetadata(hiveController_1.getOrCreateHiveController(), hiveData);
            }));
            return Promise.race([queryPromise, setQueryTimeout()]);
        });
    }
}
exports.HiveDataBaseInfo = HiveDataBaseInfo;
class HiveTableInfo extends baseInfo_1.ParentBase {
    constructor(myLabel, databaseName, cluster, hiveJobFunctions) {
        super(myLabel, 'HiveTableInfo');
        this.myLabel = myLabel;
        this.databaseName = databaseName;
        this.cluster = cluster;
        this.hiveJobFunctions = hiveJobFunctions;
        this.setIcon('table.svg');
    }
    loadMoreChildren(_node, clearCache) {
        return __awaiter(this, void 0, void 0, function* () {
            const hiveData = new HiveDataOperation(`describe ${this.databaseName}.${this.myLabel};`, this.cluster, QueryType.query_schema, this.databaseName, this.myLabel, this.hiveJobFunctions);
            const queryPromise = new Promise((resolve, reject) => {
                hiveData.eventEmitter.on('conflict', () => {
                    this.hiveJobFunctions.enqueueHiveJob(_node);
                    resolve([]);
                });
                hiveData.eventEmitter.on('schema', (rowList) => {
                    resolve(rowList.map(schemaItem => new HiveSchemaNode(schemaItem)));
                });
                hiveJob.getHiveMetadata(hiveController_1.getOrCreateHiveController(), hiveData);
            });
            return Promise.race([queryPromise, setQueryTimeout()]);
        });
    }
}
exports.HiveTableInfo = HiveTableInfo;
// set timeout (30 Seconds) when expanding hive tree node, return empty array when reaching time limit
function setQueryTimeout() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([]);
            }, 30000);
        });
    });
}
exports.setQueryTimeout = setQueryTimeout;
class HiveDataOperation {
    constructor(query, cluster, query_type, database, table, funcList) {
        this.query = query;
        this.cluster = cluster;
        this.query_type = query_type;
        this.database = database;
        this.table = table;
        this.funcList = funcList;
        this.eventEmitter = new events_1.EventEmitter();
        this.querySendTime = Date.now();
    }
}
exports.HiveDataOperation = HiveDataOperation;
var QueryType;
(function (QueryType) {
    QueryType["query_table"] = "query_table";
    QueryType["query_schema"] = "query_schema";
    QueryType["query_database"] = "query_database";
})(QueryType = exports.QueryType || (exports.QueryType = {}));

//# sourceMappingURL=HiveInfo.js.map
