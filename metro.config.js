const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure Metro resolves .mjs files used by some packages (e.g. lucide-react-native)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// Provide shims for optional node-only packages that Metro attempts to resolve
// (axios may reference `https-proxy-agent` in the http adapter).
config.resolver.extraNodeModules = {
	...(config.resolver.extraNodeModules || {}),
	'https-proxy-agent': path.resolve(__dirname, 'shims', 'https-proxy-agent.js'),
};

module.exports = config;
