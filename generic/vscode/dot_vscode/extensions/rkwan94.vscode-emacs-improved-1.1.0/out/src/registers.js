"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RegisterKind;
(function (RegisterKind) {
    RegisterKind[RegisterKind["KText"] = 1] = "KText";
    RegisterKind[RegisterKind["KPoint"] = 2] = "KPoint";
    RegisterKind[RegisterKind["KRectangle"] = 3] = "KRectangle";
})(RegisterKind = exports.RegisterKind || (exports.RegisterKind = {}));
class RectangleContent {
}
exports.RectangleContent = RectangleContent;
class RegisterContent {
    static fromRegion(registerContent) {
        return new this(RegisterKind.KText, registerContent);
    }
    static fromPoint(registerContent) {
        return new this(RegisterKind.KPoint, registerContent);
    }
    static fromRectangle(registerContent) {
        return new this(RegisterKind.KRectangle, registerContent);
    }
    constructor(registerKind, registerContent) {
        this.kind = registerKind;
        this.content = registerContent;
    }
    getRegisterKind() {
        return this.kind;
    }
    getRegisterContent() {
        return this.content;
    }
}
exports.RegisterContent = RegisterContent;
class Register {
    constructor() {
        this.storage = {};
    }
    saveTextToRegister(registerName, text) {
        if (registerName === null) {
            return;
        }
        this.storage[registerName] = RegisterContent.fromRegion(text);
    }
    getTextFromRegister(registerName) {
        const obj = this.storage[registerName];
        if (!obj) {
            return null;
        }
        if (obj.getRegisterKind() !== RegisterKind.KText) {
            return null;
        }
        else {
            return obj.getRegisterContent();
        }
    }
}
exports.default = Register;
//# sourceMappingURL=registers.js.map