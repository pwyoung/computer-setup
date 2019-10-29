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
const seccluster_2 = require("./seccluster");
class GenericLivyCluster extends ambariManagedCluster_1.AmbariManagedCluster {
    constructor(livyUrl, clusterName, userName, password, clusterNickName) {
        super(clusterName ? clusterName : livyUrl, livyUrl, userName ? userName : '', password ? password : '', seccluster_1.SecClusterType.Spark);
        this.livyUrl = livyUrl;
        this.linkedClusterType = seccluster_2.LinkedClusterType.GenericLivy;
        this.clusterNickName = clusterNickName;
        if (!userName) {
            this.authorizationType = seccluster_1.EAuthorizationType.None;
        }
    }
    getLivyEndpoint() {
        return this.livyUrl;
    }
    validAuthorizationInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            // valid the livy endpoint by acquiring livy batches rest api
            if (this.linkedClusterType === seccluster_2.LinkedClusterType.GenericLivy) {
                const response = yield this.httpRequest(`${this.getLivyEndpoint()}/batches`);
                if (response['from'] === undefined || response['total'] === undefined) {
                    throw new Error(`generic livy endpoint validation error ${JSON.stringify(response)}`);
                }
            }
        });
    }
    getFormattedName() {
        return __awaiter(this, void 0, void 0, function* () {
            return `${this.getName()} (${this.userName ? this.userName : 'NONE'})`;
        });
    }
}
exports.GenericLivyCluster = GenericLivyCluster;

//# sourceMappingURL=genericLivyCluster.js.map
