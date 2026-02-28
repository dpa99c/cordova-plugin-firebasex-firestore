var fs = require("fs");
var path = require("path");

var PLUGIN_ID = "cordova-plugin-firebasex-firestore";

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
    var standardPodRegExp = /<pod\s+name="FirebaseFirestore"\s+spec="([^"]+)"\s*\/>/;
    var precompiledPodRegExp = /<pod\s+name="FirebaseFirestore"\s+tag="([^"]+)"\s+git="[^"]+"\s*\/>/;

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
