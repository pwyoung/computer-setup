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
const seccluster_1 = require("./seccluster");
const ambariManagedCluster_1 = require("./ambariManagedCluster");
class SqlServerBigDataCluster extends ambariManagedCluster_1.AmbariManagedCluster {
    constructor(sqlServerBigDataUrl, clusterName, userName, password, clusterNickName) {
        super(clusterName ? clusterName : sqlServerBigDataUrl, sqlServerBigDataUrl, userName ? userName : '', password ? password : '', seccluster_1.SecClusterType.Spark);
        this.sqlServerBigDataUrl = sqlServerBigDataUrl;
        this.linkedClusterType = seccluster_1.LinkedClusterType.SQLServerBigData;
        this.clusterNickName = clusterNickName;
        if (!userName) {
            this.authorizationType = seccluster_1.EAuthorizationType.None;
        }
    }
    getLivyEndpoint() {
        return `${this.sqlServerBigDataUrl}/gateway/default/livy/v1`;
    }
    validAuthorizationInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            // valid the sql livy endpoint by acquiring livy batches rest api
            if (this.linkedClusterType === seccluster_1.LinkedClusterType.SQLServerBigData) {
                const response = yield this.httpRequest(`${this.getLivyEndpoint()}/batches`);
                if (response['from'] === undefined || response['total'] === undefined) {
                    throw new Error(`sqlserverbigdata livy endpoint validation error ${JSON.stringify(response)}`);
                }
            }
        });
    }
}
exports.SqlServerBigDataCluster = SqlServerBigDataCluster;

//# sourceMappingURL=sqlServerBigDataCluster.js.map
