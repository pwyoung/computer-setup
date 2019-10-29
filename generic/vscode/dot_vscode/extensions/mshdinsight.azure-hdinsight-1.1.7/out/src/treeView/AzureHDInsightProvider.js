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
const ClusterInfo_1 = require("./ClusterInfo");
const authInfo_1 = require("../azure/authInfo");
const utils_1 = require("../utils");
const authorization_1 = require("../azure/authorization");
class AzureHDInsightProvider {
    hasMoreChildren() {
        return false;
    }
    loadMoreChildren(element, clearcache) {
        return __awaiter(this, void 0, void 0, function* () {
            let subscription = new authInfo_1.Subscription();
            subscription.displayName = element.subscriptionDisplayName;
            subscription.id = element.id;
            subscription.tenantId = element.tenantId;
            const credentials = utils_1.generateNewCredentials(element.credentials);
            let clusterList = yield HdinsightTreeInfoProvider_1.HdinsightProvider.getInstance().getClusters(subscription, credentials);
            clusterList.forEach(cluster => {
                authorization_1.CredentialsManagerInstance.addCluster(cluster.getName(), cluster);
            });
            return clusterList.map(cluster => new ClusterInfo_1.ClusterInfo(cluster.getName(), cluster, credentials));
        });
    }
}
exports.AzureHDInsightProvider = AzureHDInsightProvider;

//# sourceMappingURL=AzureHDInsightProvider.js.map
