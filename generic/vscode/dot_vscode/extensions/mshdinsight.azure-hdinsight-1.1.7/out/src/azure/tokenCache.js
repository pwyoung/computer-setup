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
const log_1 = require("adal-node/lib/log");
const CacheDriver = require("adal-node/lib/cache-driver");
const authorization_1 = require("./authorization");
function addTokenToCache(tokenCache, tokenResponse) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const driver = new CacheDriver({ _logContext: log_1.createLogContext('') }, `${authorization_1.CredentialsManagerInstance.hdiEnvironment.getAADEndpointUrl()}${tokenResponse.tenantId}`, tokenResponse.resource, authorization_1.azureClientId, tokenCache, (entry, resource, callback) => {
                callback(null, entry);
            });
            driver.add(tokenResponse, function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    });
}
exports.addTokenToCache = addTokenToCache;
function clearTokenCache(tokenCache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield new Promise((resolve, reject) => {
            tokenCache.find({}, (err, entries) => {
                if (err) {
                    reject(err);
                }
                else {
                    tokenCache.remove(entries, (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                }
            });
        });
    });
}
exports.clearTokenCache = clearTokenCache;

//# sourceMappingURL=tokenCache.js.map
