/**
 * @file post_install.js
 * @brief Cordova "after_prepare" hook for the cordova-plugin-firebasex-firestore plugin.
 *
 * Modifies the plugin's `plugin.xml` to switch between the standard and precompiled
 * FirebaseFirestore iOS pods based on the `IOS_USE_PRECOMPILED_FIRESTORE_POD` plugin variable.
 *
 * When enabled, the standard `FirebaseFirestore` pod (installed from CocoaPods) is replaced
 * with the precompiled version from the `invertase/firestore-ios-sdk-frameworks` GitHub
 * repository, which significantly reduces iOS build times.
 *
 * When disabled (or not set), restores the standard CocoaPods-based pod if the precompiled
 * version was previously applied.
 *
 * Plugin variables are resolved using a 3-layer override strategy:
 * 1. Defaults from `plugin.xml` `<preference>` elements.
 * 2. Overrides from `config.xml` `<plugin><variable>` elements.
 * 3. Overrides from `package.json` `cordova.plugins` entries (highest priority).
 *
 * @module scripts/post_install
 */
var fs = require("fs");
var path = require("path");

/** @constant {string} The plugin identifier. */
var PLUGIN_ID = "cordova-plugin-firebasex-firestore";

/**
 * Resolves plugin variables using a 3-layer override strategy:
 * 1. Default values from `plugin.xml` `<preference>` elements.
 * 2. Overrides from `config.xml` `<plugin><variable>` elements.
 * 3. Overrides from `package.json` `cordova.plugins` entries (highest priority).
 *
 * @returns {Object} Resolved plugin variable key/value pairs.
 */
function getPluginVariables() {
    var variables = {};

    // Try reading from plugin.xml
    try {
        var pluginXmlPath = path.join("plugins", PLUGIN_ID, "plugin.xml");
        if (fs.existsSync(pluginXmlPath)) {
            var pluginXml = fs.readFileSync(pluginXmlPath, "utf-8");
            var prefRegex = /<preference\s+name="([^"]+)"\s+default="([^"]+)"\s*\/>/g;
            var match;
            while ((match = prefRegex.exec(pluginXml)) !== null) {
                variables[match[1]] = match[2];
            }
        }
    } catch (e) {
        console.warn("Could not read plugin.xml: " + e.message);
    }

    // Override with values from config.xml
    try {
        var configXmlPath = path.join("config.xml");
        if (fs.existsSync(configXmlPath)) {
            var configXml = fs.readFileSync(configXmlPath, "utf-8");
            var pluginRegex = new RegExp('<plugin[^>]+name="' + PLUGIN_ID + '"[^>]*>(.*?)</plugin>', "s");
            var pluginMatch = configXml.match(pluginRegex);
            if (pluginMatch) {
                var varRegex = /<variable\s+name="([^"]+)"\s+value="([^"]+)"\s*\/>/g;
                var varMatch;
                while ((varMatch = varRegex.exec(pluginMatch[1])) !== null) {
                    variables[varMatch[1]] = varMatch[2];
                }
            }
        }
    } catch (e) {
        console.warn("Could not read config.xml: " + e.message);
    }

    // Override with values from package.json
    try {
        var packageJsonPath = path.join("package.json");
        if (fs.existsSync(packageJsonPath)) {
            var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            if (packageJson.cordova && packageJson.cordova.plugins && packageJson.cordova.plugins[PLUGIN_ID]) {
                var pluginVars = packageJson.cordova.plugins[PLUGIN_ID];
                for (var key in pluginVars) {
                    variables[key] = pluginVars[key];
                }
            }
        }
    } catch (e) {
        console.warn("Could not read package.json: " + e.message);
    }

    return variables;
}

/**
 * Cordova hook entry point.
 *
 * Reads plugin variables, then either replaces the standard FirebaseFirestore pod
 * with the precompiled version (if `IOS_USE_PRECOMPILED_FIRESTORE_POD` is `true`)
 * or restores the standard pod (if the precompiled version was previously applied).
 *
 * @param {object} context - The Cordova hook context.
 */
module.exports = function (context) {
    var pluginVariables = getPluginVariables();
    var pluginXmlPath = path.join("plugins", PLUGIN_ID, "plugin.xml");

    if (!fs.existsSync(pluginXmlPath)) {
        console.warn(PLUGIN_ID + " plugin.xml not found at " + pluginXmlPath);
        return;
    }

    var pluginXmlText = fs.readFileSync(pluginXmlPath, "utf-8");
    var pluginXmlModified = false;

    // Handle IOS_USE_PRECOMPILED_FIRESTORE_POD
    /** @constant {RegExp} Matches the standard CocoaPods-based FirebaseFirestore pod entry. */
    var standardPodRegExp = /<pod\s+name="FirebaseFirestore"\s+spec="([^"]+)"\s*\/>/;
    /** @constant {RegExp} Matches the precompiled FirebaseFirestore pod entry (from invertase git repo). */
    var precompiledPodRegExp = /<pod\s+name="FirebaseFirestore"\s+tag="([^"]+)"\s+git="[^"]+"\s*\/>/;;

    if (pluginVariables["IOS_USE_PRECOMPILED_FIRESTORE_POD"] === "true") {
        var match = pluginXmlText.match(standardPodRegExp);
        if (match) {
            var replacement = '<pod name="FirebaseFirestore" tag="' + match[1] + '" git="https://github.com/invertase/firestore-ios-sdk-frameworks.git" />';
            pluginXmlText = pluginXmlText.replace(standardPodRegExp, replacement);
            pluginXmlModified = true;
            console.log("Replaced FirebaseFirestore pod with precompiled version (tag " + match[1] + ") in " + PLUGIN_ID + "/plugin.xml");
        } else if (pluginXmlText.match(precompiledPodRegExp)) {
            console.log("FirebaseFirestore pod already using precompiled version in " + PLUGIN_ID + "/plugin.xml");
        } else {
            console.warn('Failed to find <pod name="FirebaseFirestore"> in ' + PLUGIN_ID + "/plugin.xml");
        }
    } else {
        // Restore standard pod if precompiled was previously applied
        var preMatch = pluginXmlText.match(precompiledPodRegExp);
        if (preMatch) {
            var restored = '<pod name="FirebaseFirestore" spec="' + preMatch[1] + '"/>';
            pluginXmlText = pluginXmlText.replace(precompiledPodRegExp, restored);
            pluginXmlModified = true;
            console.log("Restored standard FirebaseFirestore pod (spec " + preMatch[1] + ") in " + PLUGIN_ID + "/plugin.xml");
        }
    }

    if (pluginXmlModified) {
        fs.writeFileSync(pluginXmlPath, pluginXmlText, "utf-8");
    }
};
