/**
 * React Native Entry Point
 * Add URL polyfill for Supabase compatibility with Hermes engine
 * 
 * IMPORTANT: URL polyfill MUST be imported FIRST before any other imports
 */
// Import URL polyfill FIRST - this is critical for Supabase to work
import 'react-native-url-polyfill/auto';

// Now import React Native
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Verify URL is available (for debugging)
if (typeof global.URL === 'undefined') {
  console.error('❌ URL polyfill failed to load! Supabase will not work.');
} else {
  console.log('✅ URL polyfill loaded successfully');
}

AppRegistry.registerComponent(appName, () => App);

