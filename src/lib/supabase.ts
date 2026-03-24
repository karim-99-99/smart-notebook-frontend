/**
 * Supabase Client Configuration
 * 
 * Setup Instructions:
 * 1. Go to https://app.supabase.com
 * 2. Create a new project
 * 3. Go to Settings → API
 * 4. Copy your Project URL and anon/public key
 * 5. Replace the values below
 * 
 * Docs: https://supabase.com/docs/guides/getting-started
 */
import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ REPLACE THESE WITH YOUR SUPABASE CREDENTIALS
const SUPABASE_URL = 'https://esntokgbrryughnilqwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbnRva2dicnJ5dWdobmlscXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTY4MjcsImV4cCI6MjA4MTEzMjgyN30.4melJDVZtAsUIWPQCan6yKqC8JhuLVZDGH94hyMV6GQ';

// Create Supabase client with AsyncStorage for session persistence
// React Native specific configuration to handle URL protocol issues
let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  
  // Verify client is properly initialized
  if (!supabase || !supabase.auth) {
    console.error('Supabase client initialization failed: auth is undefined');
  }
} catch (error) {
  console.error('Error creating Supabase client:', error);
  throw error;
}

export {supabase};

export const getSupabase = () => supabase;

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  const {
    data: {user},
  } = await supabase.auth.getUser();
  return user;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};

/**
 * Test Supabase connection
 */
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  error?: any;
}> => {
  try {
    // Try to access Supabase health endpoint or make a simple request
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });
    
    if (response.ok || response.status === 404) {
      // 404 is OK - it means the server is reachable
      return {
        success: true,
        message: 'Connected to Supabase successfully',
      };
    } else {
      return {
        success: false,
        message: `Server responded with status: ${response.status}`,
      };
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    let message = 'Cannot connect to Supabase server';
    
    if (errorMessage.includes('Network request failed') || 
        errorMessage.includes('Failed to connect')) {
      message = 'Network error: Please check your internet connection';
    } else if (errorMessage.includes('timeout')) {
      message = 'Connection timeout: Server might be unreachable';
    } else {
      message = `Connection error: ${errorMessage}`;
    }
    
    return {
      success: false,
      message,
      error: errorMessage,
    };
  }
};

/**
 * Sign up with email and password
 */
export const signUp = async (email: string, password: string) => {
  try {
    // Verify supabase client is initialized
    if (!supabase || !supabase.auth) {
      return {
        data: null,
        error: {
          message: 'Supabase client not initialized. Please restart the app.',
          name: 'ClientError',
        },
      };
    }

    const {data, error} = await supabase.auth.signUp({
      email,
      password,
    });
    
    // Enhance error messages for better debugging
    if (error) {
      console.error('Sign up error:', error);
      
      // Check if it's a network error
      const errorMessage = error.message?.toLowerCase() || '';
      if (errorMessage.includes('network') || 
          errorMessage.includes('fetch') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('timeout')) {
        return {
          data,
          error: {
            ...error,
            message: 'Network error: Cannot connect to server. Please check your internet connection.',
          },
        };
      }
    }
    
    return {data, error};
  } catch (error: any) {
    console.error('Sign up exception:', error);
    return {
      data: null,
      error: {
        message: error?.message || 'An unexpected error occurred during sign up',
        name: 'SignUpError',
      },
    };
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string) => {
  try {
    // Verify supabase client is initialized
    if (!supabase || !supabase.auth) {
      return {
        data: null,
        error: {
          message: 'Supabase client not initialized. Please restart the app.',
          name: 'ClientError',
        },
      };
    }

    const {data, error} = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Enhance error messages for better debugging
    if (error) {
      console.error('Sign in error:', error);
      
      // Check if it's a network error
      const errorMessage = error.message?.toLowerCase() || '';
      if (errorMessage.includes('network') || 
          errorMessage.includes('fetch') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('timeout')) {
        return {
          data,
          error: {
            ...error,
            message: 'Network error: Cannot connect to server. Please check your internet connection.',
          },
        };
      }
    }
    
    return {data, error};
  } catch (error: any) {
    console.error('Sign in exception:', error);
    return {
      data: null,
      error: {
        message: error?.message || 'An unexpected error occurred during sign in',
        name: 'SignInError',
      },
    };
  }
};

/**
 * Sign out
 */
export const signOut = async () => {
  const {error} = await supabase.auth.signOut();
  return {error};
};

