// Use React Native metro config for React Native CLI projects
// EAS Build will work with this configuration
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration for React Native
 * https://reactnative.dev/docs/metro
 * 
 * Note: Using @react-native/metro-config for React Native CLI projects.
 * EAS Build supports React Native CLI projects and will handle the build correctly.
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

