/**
 * Login Screen - Letra Brand Design
 * User authentication with Supabase
 */
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {signIn, signUp, signOut, testSupabaseConnection} from '../lib/supabase';
import {loginBackend, registerBackend, syncBackendPassword, testBackendReachability, setBackendAuthToken, getBackendBaseUrl} from '../services/api';
import {trackEvent, trackError} from '../services/analytics';
import {colors} from '../theme/colors';
import {borders} from '../theme/borders';
import {StyledMessageModal} from '../components/StyledMessageModal';
import {initDatabase} from '../services/database';

const logoImage = require('../assets/logo.png');

export const LoginScreen = () => {
  const navigation = useNavigation();
  const {width} = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [successModal, setSuccessModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onOK: () => void;
    isLoginSuccess?: boolean;
  }>({visible: false, title: '', message: '', onOK: () => {}});
  const loginSuccessHandled = useRef(false);

  // Auto-navigate to camera after login success (no need to tap OK)
  useEffect(() => {
    if (!successModal.visible || !successModal.isLoginSuccess || loginSuccessHandled.current) return;
    loginSuccessHandled.current = true;
    const t = setTimeout(() => {
      successModal.onOK();
    }, 1500);
    return () => clearTimeout(t);
  }, [successModal.visible, successModal.isLoginSuccess]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const {error} = await signIn(email, password);
        if (error) {
          trackError('app', error.message || 'Login failed', undefined, {email: email.slice(0, 3) + '***'});
          let errorMessage = error.message || 'Login failed';
          if (errorMessage.toLowerCase().includes('network') ||
              errorMessage.toLowerCase().includes('connection')) {
            errorMessage += '\n\nTroubleshooting:\n• Check your internet connection\n• Verify Supabase project is active\n• Try again in a few moments';
          }
          Alert.alert('Login Failed', errorMessage);
        } else {
          trackEvent('login', {});
          loginSuccessHandled.current = false;
          // Log in to backend so "Send to OCR" and other API calls work. Same account in both.
          let backendResult = await loginBackend(email, password);
          if (backendResult.error) {
            const registerResult = await registerBackend(email, password);
            if (registerResult.alreadyRegistered) {
              await syncBackendPassword(email, password);
            }
            backendResult = await loginBackend(email, password);
          }
          const backendOk = !backendResult.error;
          if (!backendOk) {
            console.warn('Backend login failed (OCR may ask to log in again):', backendResult.error);
          }
          // Fire-and-forget: pre-load the PaddleOCR model while the user reads the success message.
          // This cuts the cold-start delay on the first "Send to OCR" of the session.
          fetch(`${getBackendBaseUrl()}/api/notes/ocr/warm`, {method: 'POST'}).catch(() => {});
          setSuccessModal({
            visible: true,
            title: 'Success',
            message: backendOk
              ? 'Logged in successfully!'
              : 'Logged in! If "Send to OCR" says to log in again, log out and log in once more, and ensure your device can reach the backend.',
            isLoginSuccess: true,
            onOK: async () => {
              setSuccessModal(s => ({...s, visible: false}));
              try {
                await initDatabase();
              } catch (dbError) {
                console.error('Database init error:', dbError);
              }
              navigation.reset({
                index: 0,
                routes: [{name: 'Scan' as never}],
              });
            },
          });
        }
      } else {
        const {error} = await signUp(email, password);
        if (error) {
          trackError('app', error.message || 'Sign up failed', undefined, {});
          let errorMessage = error.message || 'Sign up failed';
          if (errorMessage.toLowerCase().includes('network') ||
              errorMessage.toLowerCase().includes('connection')) {
            errorMessage += '\n\nTroubleshooting:\n• Check your internet connection\n• Verify Supabase project is active\n• Try again in a few moments';
          }
          Alert.alert('Sign Up Failed', errorMessage);
        } else {
          trackEvent('signup', {});
          // Save same account in backend so OCR works (no need to add from PC/code)
          let registerResult = await registerBackend(email, password);
          if (registerResult.error && !registerResult.alreadyRegistered) {
            await new Promise(r => setTimeout(r, 2000));
            registerResult = await registerBackend(email, password);
          }
          const backendSaved = !registerResult.error || registerResult.alreadyRegistered;
          await loginBackend(email, password);
          setSuccessModal({
            visible: true,
            title: 'Success',
            message: backendSaved
              ? 'Account saved in Supabase and backend. You can use Send to OCR.'
              : 'Account saved in Supabase. If Send to OCR fails, log in again when the backend is reachable.',
            onOK: () => {
              setSuccessModal(s => ({...s, visible: false}));
              setIsLogin(true);
            },
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const result = await testSupabaseConnection();
      if (result.success) {
        Alert.alert('Connection Test', '✅ ' + result.message);
      } else {
        Alert.alert(
          'Connection Test Failed',
          '❌ ' + result.message + '\n\nPossible issues:\n• No internet connection\n• Supabase project might be paused\n• Check Supabase URL in settings',
        );
      }
    } catch (error) {
      Alert.alert('Test Error', error instanceof Error ? error.message : 'Failed to test connection');
    } finally {
      setLoading(false);
    }
  };

  /** Test if the app can reach the backend (for OCR). Shows URL and result. */
  const handleTestBackend = async () => {
    setLoading(true);
    try {
      const { reachable, message } = await testBackendReachability();
      if (reachable) {
        Alert.alert(
          'Backend reachable',
          `✅ ${message}\n\nOCR will use this URL. If you still get "no authentication", log out and log in again so the app can store your backend token.`,
        );
      } else {
        Alert.alert(
          'Backend not reachable',
          `❌ ${message}\n\n• Use the same WiFi as the machine running the backend\n• Or update API_BASE_URL in mobile/src/services/api.ts (e.g. ngrok URL)\n• Ensure the backend is running (e.g. uvicorn or docker)`,
        );
      }
    } catch (error) {
      Alert.alert('Test Error', error instanceof Error ? error.message : 'Failed to test backend');
    } finally {
      setLoading(false);
    }
  };

  const formMaxWidth = Math.min(width - 48, 420);
  const cardPadding = width > 400 ? 28 : 20;

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Pattern Background */}
        <View style={styles.backgroundLayer}>
          <View style={[styles.patternOverlay, {backgroundColor: colors.primary + '08'}]} />
        </View>

        <View style={[styles.content, {paddingHorizontal: width > 400 ? 24 : 16}]}>
          {/* Logo - no text, same background as page */}
          <View style={styles.logoContainer}>
            <View style={styles.logoImageWrapper}>
              <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
            </View>
          </View>

          <Text style={styles.title}>Letra · Smart Notebook</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account to get started'}
          </Text>

          <View style={[styles.formCard, {maxWidth: formMaxWidth, padding: cardPadding}]}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsLogin(!isLogin)}
                activeOpacity={0.7}>
                <Text style={styles.switchText}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <Text style={styles.switchTextBold}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.testButton}
                onPress={handleTestConnection}
                disabled={loading}
                activeOpacity={0.6}>
                <Text style={styles.testButtonText}>🔗 Test Supabase</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.testButton, { marginTop: 10 }]}
                onPress={handleTestBackend}
                disabled={loading}
                activeOpacity={0.6}>
                <Text style={styles.testButtonText}>🖥️ Test backend (OCR)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.testButton, { marginTop: 14 }]}
                onPress={async () => {
                  await signOut();
                  await setBackendAuthToken(null);
                  Alert.alert('Signed out', 'Sign in again to refresh your backend token for Send to OCR.');
                }}
                disabled={loading}
                activeOpacity={0.6}>
                <Text style={styles.testButtonText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    <StyledMessageModal
      visible={successModal.visible}
      title={successModal.title}
      message={successModal.message}
      onPress={successModal.onOK}
    />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    backgroundColor: colors.backgroundLight,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  logoImageWrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoImage: {
    width: 280,
    height: 140,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  formCard: {
    width: '100%',
    backgroundColor: colors.white,
    ...borders.card,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    ...borders.input,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputWrapperFocused: {
    ...borders.inputFocused,
    backgroundColor: colors.teal + '12',
    shadowColor: colors.teal,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.primary,
    ...borders.buttonPrimary,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.2,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 14,
    paddingHorizontal: 16,
    fontWeight: '500',
  },
  switchButton: {
    marginTop: 4,
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  switchTextBold: {
    color: colors.teal,
    fontWeight: '700',
  },
  testButton: {
    marginTop: 16,
    padding: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary + '50',
  },
  testButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
