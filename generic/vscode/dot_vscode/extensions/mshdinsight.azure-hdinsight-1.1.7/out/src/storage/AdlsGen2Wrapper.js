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
const AdlsGen2Rest_1 = require("./AdlsGen2Rest");
class AdlsGen2Wrapper {
    static uploadFile(localPath, remotePath, storageAccpuntName, storageAccessKey, restUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const adlsGen2Rest = new AdlsGen2Rest_1.AdlsGen2Rest(localPath, remotePath, storageAccpuntName, storageAccessKey, restUrl);
            return yield adlsGen2Rest.uploadFile();
        });
    }
}
exports.default = AdlsGen2Wrapper;

//# sourceMappingURL=AdlsGen2Wrapper.js.map
