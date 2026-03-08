/**
 * React Native Entry Point
 * Add URL polyfill for Supabase compatibility with Hermes engine
 */
import 'react-native-url-polyfill/auto';
import {AppRegistry} from 'react-native';
import App from './App';
// Native app (MainActivity) expects "SmartNotebook" - use app.json name or fallback
const appConfig = require('./app.json');
const appName = appConfig.name || (appConfig.expo && appConfig.expo.name ? appConfig.expo.name.replace(/\s/g, '') : null) || 'SmartNotebook';

AppRegistry.registerComponent(appName, () => App);

