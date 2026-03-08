const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  server: {
    // Allow connections from any IP (useful for WiFi debugging)
    enhanceMiddleware: (middleware) => {
      return middleware;
    },
  },
  resolver: {
    // Ensure URL polyfill is resolved correctly
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
  },
  transformer: {
    // Enable inline requires for better performance
    inlineRequires: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

