'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
var Flavor;
(function (Flavor) {
    Flavor[Flavor["CoreCLR"] = 0] = "CoreCLR";
    Flavor[Flavor["Mono"] = 1] = "Mono";
    Flavor[Flavor["Desktop"] = 2] = "Desktop";
})(Flavor = exports.Flavor || (exports.Flavor = {}));
var Platform;
(function (Platform) {
    Platform[Platform["Unknown"] = 0] = "Unknown";
    Platform[Platform["Windows"] = 1] = "Windows";
    Platform[Platform["OSX"] = 2] = "OSX";
    Platform[Platform["macOS"] = 3] = "macOS";
    Platform[Platform["CentOS"] = 4] = "CentOS";
    Platform[Platform["Debian"] = 5] = "Debian";
    Platform[Platform["Fedora"] = 6] = "Fedora";
    Platform[Platform["OpenSUSE"] = 7] = "OpenSUSE";
    Platform[Platform["RHEL"] = 8] = "RHEL";
    Platform[Platform["Ubuntu14"] = 9] = "Ubuntu14";
    Platform[Platform["Ubuntu16"] = 10] = "Ubuntu16";
    Platform[Platform["UbuntuOther"] = 11] = "UbuntuOther";
})(Platform = exports.Platform || (exports.Platform = {}));
function getCurrentPlatform() {
    if (process.platform === 'win32') {
        return Platform.Windows;
    }
    else if (process.platform === 'darwin') {
        return Platform.OSX;
    }
    else if (process.platform === 'linux') {
        // For details: https://www.freedesktop.org/software/systemd/man/os-release.html
        const text = child_process.execSync('cat /etc/os-release').toString();
        const lines = text.split('\n');
        function getValue(name) {
            for (let line of lines) {
                line = line.trim();
                if (line.startsWith(name)) {
                    const equalsIndex = line.indexOf('=');
                    if (equalsIndex >= 0) {
                        let value = line.substring(equalsIndex + 1);
                        // Strip double quotes if necessary
                        if (value.length > 1 && value.startsWith('"') && value.endsWith('"')) {
                            value = value.substring(1, value.length - 1);
                        }
                        return value;
                    }
                }
            }
            return undefined;
        }
        const id = getValue('ID');
        switch (id) {
            case 'ubuntu':
                const versionId = getValue('VERSION_ID');
                if (!versionId) {
                    return Platform.UbuntuOther;
                }
                else if (versionId.startsWith('14')) {
                    // This also works for Linux Mint
                    return Platform.Ubuntu14;
                }
                else if (versionId.startsWith('16')) {
                    return Platform.Ubuntu16;
                }
                else {
                    // only two versions of LTS Ubuntu(14, 16) are supported and tested, we do not grant the functionality on other versions
                    return Platform.UbuntuOther;
                }
            case 'centos':
                return Platform.CentOS;
            case 'fedora':
                return Platform.Fedora;
            case 'opensuse':
                return Platform.OpenSUSE;
            case 'rhel':
                return Platform.RHEL;
            case 'debian':
                return Platform.Debian;
            case 'ol':
                // Oracle Linux is binary compatible with CentOS
                return Platform.CentOS;
            case 'elementary OS':
                const eOSVersionId = getValue('VERSION_ID');
                if (!eOSVersionId) {
                    return Platform.UbuntuOther;
                }
                else if (eOSVersionId.startsWith('0.3')) {
                    // Elementary OS 0.3 Freya is binary compatible with Ubuntu 14.04
                    return Platform.Ubuntu14;
                }
                else if (eOSVersionId.startsWith('0.4')) {
                    // Elementary OS 0.4 Loki is binary compatible with Ubuntu 16.04
                    return Platform.Ubuntu16;
                }
        }
    }
    return Platform.Unknown;
}
exports.getCurrentPlatform = getCurrentPlatform;
function getFlavoredVersion() {
    let platform = getCurrentPlatform();
    if (platform == Platform.Windows) {
        return Flavor.Desktop;
    }
    else {
        return Flavor.Mono;
    }
}
exports.getFlavoredVersion = getFlavoredVersion;

//# sourceMappingURL=platform.js.map
