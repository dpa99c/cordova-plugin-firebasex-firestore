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
    if (pluginVariables["IOS_USE_PRECOMPILED_FIRESTORE_POD"] === "true") {
        var firestorePodsRegExp = /<pod name="FirebaseFirestore" spec="(\d+\.\d+\.\d+)"\/>/;
        var precompiledPodReplacementPattern = '<pod name="FirebaseFirestore" tag="$version$" git="https://github.com/invertase/firestore-ios-sdk-frameworks.git" />';
        var match = pluginXmlText.match(firestorePodsRegExp);
        if (match) {
            var precompiledPodReplacement = precompiledPodReplacementPattern.replace("$version$", match[1]);
            pluginXmlText = pluginXmlText.replace(firestorePodsRegExp, precompiledPodReplacement);
            pluginXmlModified = true;
            console.log("Replaced FirebaseFirestore pod with precompiled version in " + PLUGIN_ID + "/plugin.xml");
        } else {
            console.warn('Failed to find <pod name="FirebaseFirestore"> in ' + PLUGIN_ID + "/plugin.xml");
        }
    }

    if (pluginXmlModified) {
        fs.writeFileSync(pluginXmlPath, pluginXmlText, "utf-8");
    }
};
