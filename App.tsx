import 'react-native-url-polyfill/auto';
import React, {useEffect, Component} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {AppNavigator} from './src/navigation/AppNavigator';
import {initDatabase} from './src/services/database';

class ErrorBoundary extends Component<
  {children: React.ReactNode},
  {error: Error | null}
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {error: null};
  }
  static getDerivedStateFromError(error: Error) {
    return {error};
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('💥 App crashed:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.errorContainer}>
          <Text style={styles.errorTitle}>💥 App crashed — copy this and report it:</Text>
          <Text style={styles.errorText}>{this.state.error.toString()}</Text>
          <Text style={styles.errorStack}>{this.state.error.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {flex: 1, padding: 20, backgroundColor: '#fff'},
  errorTitle: {fontSize: 16, fontWeight: 'bold', color: 'red', marginBottom: 12, marginTop: 40},
  errorText: {fontSize: 14, color: '#c00', marginBottom: 8},
  errorStack: {fontSize: 11, color: '#666', fontFamily: 'monospace'},
});

function App(): React.JSX.Element {
  useEffect(() => {
    const initDb = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        await initDatabase();
        console.log('✅ Database initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
      }
    };
    initDb();
  }, []);

  return (
    <ErrorBoundary>
      <AppNavigator />
    </ErrorBoundary>
  );
}

export default App;

