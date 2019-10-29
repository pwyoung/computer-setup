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
const HdinsightTreeInfoProvider_1 = require("./HdinsightTreeInfoProvider");
class BlobContainerNode extends baseInfo_1.BaseNode {
    constructor(myLabel) {
        super(myLabel, 'BlobContainerNode');
        this.setIcon('AzureContainer.svg');
    }
}
exports.BlobContainerNode = BlobContainerNode;
class BlobFolderInfo extends baseInfo_1.ParentBase {
    constructor(myLabel, storage) {
        super(myLabel, 'BlobFolderInfo');
        this.setIcon('folder.svg');
        this.storage = storage;
    }
    loadMoreChildren(_node, clearCache) {
        return __awaiter(this, void 0, void 0, function* () {
            // The getStorageAccessKeyWithNoCred() covers getting storageKey from keytar automatically and asking for input manually for users who lack of authority (usually AdlsGen2)
            if (this.storage.isAdlsGen2) {
                yield this.storage.getStorageAccessKeyWithNoCred(this.storage.defaultStorageWithDnsSuffix);
            }
            this.keys = HdinsightTreeInfoProvider_1.HdinsightProvider.getInstance().getStoreKey(this.storage);
            return this.keys.map(key => {
                const defaultStorage = this.storage.getDefaultStorageAccountName();
                const selectedStoragename = key.storageName;
                const formattedBlobName = (selectedStoragename === defaultStorage ? `${selectedStoragename} (Default)` : selectedStoragename);
                return new BlobStorageInfo(formattedBlobName, this.storage, key);
            });
        });
    }
}
exports.BlobFolderInfo = BlobFolderInfo;
class BlobStorageInfo extends baseInfo_1.ParentBase {
    constructor(mylabel, storage, key) {
        super(mylabel, 'BlobStorageInfo');
        this.storage = storage;
        this.key = key;
        this.setIcon('AzureStorageAccount.svg');
    }
    loadMoreChildren(_node, clearCache) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.key.storageName === this.storage.getDefaultStorageAccountName() ? [new BlobContainerNode(this.storage.defaultContainer)] : [];
        });
    }
}
exports.BlobStorageInfo = BlobStorageInfo;

//# sourceMappingURL=BlobInfo.js.map
