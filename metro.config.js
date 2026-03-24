// Merge RN defaults (required RN 0.73+) with Expo's asset/bundle settings.
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {getDefaultConfig: getExpoDefaultConfig} = require('expo/metro-config');

const expoConfig = getExpoDefaultConfig(__dirname);

/** @type {import('metro-config').MetroConfig} */
module.exports = mergeConfig(getDefaultConfig(__dirname), expoConfig);
