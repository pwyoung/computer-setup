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
class ADLMountPointNode extends baseInfo_1.BaseNode {
    constructor(mylabel) {
        super(mylabel, 'ADLMountPointNode');
        this.setIcon('AzureContainer.svg');
    }
}
exports.ADLMountPointNode = ADLMountPointNode;
class ADLFolderInfo extends baseInfo_1.ParentBase {
    constructor(mylabel, storage) {
        super(mylabel, 'ADLFolder');
        this.storage = storage;
        this.setIcon('folder.svg');
    }
    loadMoreChildren(_node, clearCache) {
        return __awaiter(this, void 0, void 0, function* () {
            return [new ADLStorageInfo(`${this.storage.getAdlsStorageName()} (Default)`, this.storage)];
        });
    }
}
exports.ADLFolderInfo = ADLFolderInfo;
class ADLStorageInfo extends baseInfo_1.ParentBase {
    constructor(myLabel, storage) {
        super(myLabel, 'ADLStorageInfo');
        this.storage = storage;
        this.setIcon('adlstorage.svg');
    }
    loadMoreChildren(_node, clearCache) {
        return __awaiter(this, void 0, void 0, function* () {
            return [new ADLMountPointNode(this.storage.adlsHomeMountpont)];
        });
    }
}
exports.ADLStorageInfo = ADLStorageInfo;

//# sourceMappingURL=ADLInfo.js.map
