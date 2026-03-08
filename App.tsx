import React, {useEffect} from 'react';
import {AppNavigator} from './src/navigation/AppNavigator';
import {initDatabase} from './src/services/database';

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize database on app start with delay to ensure native modules are ready
    const initDb = async () => {
      try {
        // Small delay to ensure native modules are initialized
        await new Promise(resolve => setTimeout(resolve, 500));
        await initDatabase();
        console.log('✅ Database initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        // Don't crash the app - database will be initialized when needed
      }
    };
    
    initDb();
  }, []);

  return <AppNavigator />;
}

export default App;

