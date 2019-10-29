"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class KillRing {
    constructor() {
        this.MAX_LENGTH = 60;
        this.save = (text) => {
            this.items[this.pointer] = text;
            this.pointer = (this.pointer + 1) % this.MAX_LENGTH;
        };
        this.top = () => {
            return this.items[(this.pointer - 1) % this.MAX_LENGTH];
        };
        this.append = (str) => {
            if (this.pointer > 0) {
                this.items[this.pointer - 1] += str;
            }
        };
        this.forward = () => {
            if (this.items[(this.pointer + 1) % this.MAX_LENGTH] === undefined) {
                this.pointer = 0;
            }
            else {
                this.pointer = (this.pointer + 1) % this.MAX_LENGTH;
            }
        };
        this.backward = () => {
            if (this.pointer === 1) {
                const firstEmpty = this.items.findIndex(i => i === undefined);
                this.pointer = firstEmpty !== -1 ? firstEmpty : this.MAX_LENGTH - 1;
            }
            else {
                this.pointer = (this.pointer - 1) % this.MAX_LENGTH;
            }
        };
        this.setLastInsertedRange = (r) => {
            this.oldRange = r;
        };
        this.getLastRange = () => this.oldRange;
        this.getLastInsertionPoint = () => {
            return this.oldRange.start;
        };
        this.isEmpty = () => {
            return !this.items.some(i => i !== undefined);
        };
        this.oldRange = null;
        this.pointer = 0;
        this.items = new Array(this.MAX_LENGTH);
    }
}
exports.default = KillRing;
//# sourceMappingURL=killring.js.map