const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure for React Native Firebase
config.resolver.assetExts.push('bin');

module.exports = config;