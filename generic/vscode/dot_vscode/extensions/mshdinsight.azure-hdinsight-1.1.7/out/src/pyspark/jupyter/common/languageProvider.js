"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const os_1 = require("os");
const events_1 = require("events");
class LanguageProviders extends events_1.EventEmitter {
    constructor() {
        super();
    }
    raiseLanguageProvderRegistered(language) {
        this.emit('onLanguageProviderRegistered', language);
    }
    static getInstance() {
        return LanguageProviders.languageProviders;
    }
    static registerLanguageProvider(language, provider) {
        if (typeof language !== 'string' || language.length === 0) {
            throw new Error(`Argument 'language' is invalid`);
        }
        if (typeof provider !== 'object' || language === null) {
            throw new Error(`Argument 'provider' is invalid`);
        }
        let languageRegistered = LanguageProviders.providers.has(language);
        LanguageProviders.providers.set(language, provider);
        if (!languageRegistered) {
            LanguageProviders.getInstance().raiseLanguageProvderRegistered(language);
        }
    }
    static cellIdentifier(language) {
        let settings = LanguageProviders.getLanguageSetting(language);
        if (settings && settings.cellIdentificationPattern && settings.cellIdentificationPattern.length > 0) {
            return new RegExp(settings.cellIdentificationPattern, 'i');
        }
        return LanguageProviders.providers.has(language) ?
            LanguageProviders.providers.get(language).cellIdentifier : null;
    }
    static getSelectedCode(language, selectedCode, currentCell) {
        return LanguageProviders.providers.has(language) ?
            LanguageProviders.providers.get(language).getSelectedCode(selectedCode, currentCell) :
            Promise.resolve(selectedCode);
    }
    static getFirstLineOfExecutableCode(language, defaultRange, document, range) {
        return LanguageProviders.providers.has(language) ?
            LanguageProviders.providers.get(language).getFirstLineOfExecutableCode(document, range) :
            Promise.resolve(defaultRange.start);
    }
    static getLanguageSetting(language) {
        let jupyterConfig = vscode_1.workspace.getConfiguration('hdinsightJupyter');
        let langSettings = jupyterConfig.get('languages');
        let lowerLang = language.toLowerCase();
        return langSettings.find(setting => setting.languageId.toLowerCase() === lowerLang);
    }
    static getDefaultKernel(language) {
        let langSetting = LanguageProviders.getLanguageSetting(language);
        return langSetting ? langSetting.defaultKernel : null;
    }
    static getStartupCode(language) {
        let langSetting = LanguageProviders.getLanguageSetting(language);
        if (!langSetting || !langSetting.startupCode || langSetting.startupCode.length === 0) {
            return null;
        }
        return langSetting.startupCode.join(os_1.EOL);
    }
}
LanguageProviders.languageProviders = new LanguageProviders();
LanguageProviders.providers = new Map();
exports.LanguageProviders = LanguageProviders;

//# sourceMappingURL=languageProvider.js.map
