import React, {useState} from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../navigation/types';
import {uploadImageForOCR, loginToBackend} from '../services/api';
import {getCurrentUser} from '../lib/supabase';
import type {NotebookQRData} from '../utils/qrCodeParser';
import {colors} from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Preview'
>;
type PreviewRouteProp = RouteProp<RootStackParamList, 'Preview'>;

export const PreviewScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PreviewRouteProp>();
  const {photoPath, qrData} = route.params;
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [backendPassword, setBackendPassword] = useState('');
  const [backendLoginEmail, setBackendLoginEmail] = useState<string | null>(null);

  const handleRetake = () => {
    navigation.replace('Scan');
  };

  const handleSendToOCR = async () => {
    if (isUploading) return;

    setIsUploading(true);
    console.log('🚀 Starting OCR process...');
    // #region agent log
    const RNFS = require('react-native-fs');
    const DEBUG_LOG_PATH = `${RNFS.DocumentDirectoryPath}/debug.log`;
    const logLine = JSON.stringify({location:'PreviewScreen.tsx:33',message:'handleSendToOCR entry',data:{photoPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'}) + '\n';
    RNFS.appendFile(DEBUG_LOG_PATH, logLine, 'utf8').catch(() => {});
    // #endregion

    try {
      // Pass QR data to OCR for auto-configuration
      const result = await uploadImageForOCR(photoPath, qrData);
      // #region agent log
      const logLine2 = JSON.stringify({location:'PreviewScreen.tsx:41',message:'uploadImageForOCR returned',data:{success:result.success,hasData:!!result.data,error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'}) + '\n';
      RNFS.appendFile(DEBUG_LOG_PATH, logLine2, 'utf8').catch(() => {});
      // #endregion

      if (result.success && result.data) {
        console.log('✅ OCR successful:', result.data);
        
        // Navigate to edit screen with image and OCR result
        // User can edit text before saving
        navigation.navigate('EditNote', {
          photoPath: photoPath,
          ocrResult: result.data,
          qrData: qrData,
        });
      } else {
        console.error('❌ OCR failed:', result.error);
        // #region agent log
        const logLine3 = JSON.stringify({location:'PreviewScreen.tsx:53',message:'OCR failed - showing alert',data:{error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'}) + '\n';
        RNFS.appendFile(DEBUG_LOG_PATH, logLine3, 'utf8').catch(() => {});
        // #endregion
        const hint = 'Check connection to backend or log in (log out and log in again if needed).';
        const isAuthError = (result.error || '').toLowerCase().includes('logged in to backend') || (result.error || '').toLowerCase().includes('not logged in');
        const openPasswordModal = async () => {
          const user = await getCurrentUser();
          if (!user?.email) {
            Alert.alert('Not signed in', 'Go to Login and sign in first.');
            return;
          }
          setBackendLoginEmail(user.email);
          setBackendPassword('');
          setShowPasswordModal(true);
        };
        Alert.alert(
          'Upload Failed',
          [result.error || 'Could not process image. Please try again.', hint].join('\n\n'),
          [
            ...(isAuthError ? [{text: 'Re-enter password', onPress: openPasswordModal}, {text: 'Go to Login', onPress: () => navigation.navigate('Login' as never)}] : []),
            {text: 'Retry', onPress: handleSendToOCR},
            {text: 'Cancel', style: 'cancel'},
          ],
        );
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      // #region agent log
      const logLine4 = JSON.stringify({location:'PreviewScreen.tsx:63',message:'Catch block in handleSendToOCR',data:{errorType:error?.constructor?.name,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'}) + '\n';
      RNFS.appendFile(DEBUG_LOG_PATH, logLine4, 'utf8').catch(() => {});
      // #endregion
      Alert.alert(
        'Something went wrong',
        'Check connection to backend or log in (log out and log in again if needed). Return to the scan screen and try again.',
        [
          {text: 'Go to Login', onPress: () => navigation.navigate('Login' as never)},
          {text: 'OK'},
        ],
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackendLoginFromModal = async () => {
    if (!backendLoginEmail || !backendPassword.trim()) {
      Alert.alert('Enter your password', 'Password is required to log in to the backend.');
      return;
    }
    setShowPasswordModal(false);
    const result = await loginToBackend(backendLoginEmail, backendPassword.trim());
    if (!result.ok) {
      Alert.alert('Backend login failed', result.error ?? 'Unknown error');
      return;
    }
    handleSendToOCR();
  };

  return (
    <View style={styles.container}>
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log in to backend</Text>
            <Text style={styles.modalEmail}>{backendLoginEmail}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Password"
              placeholderTextColor="#999"
              value={backendPassword}
              onChangeText={setBackendPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.retakeButton]} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.sendButton]} onPress={handleBackendLoginFromModal}>
                <Text style={styles.buttonText}>Log in & retry OCR</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      {/* Preview Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{uri: photoPath}}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.retakeButton]}
          onPress={handleRetake}
          disabled={isUploading}>
          <Text style={styles.buttonText}>↻ Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.sendButton,
            isUploading && styles.buttonDisabled,
          ]}
          onPress={handleSendToOCR}
          disabled={isUploading}>
          {isUploading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.buttonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>📤 Send to OCR</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.teal,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  modalEmail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: colors.primary,
    borderTopWidth: 3,
    borderTopColor: colors.teal,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderLeftColor: colors.teal,
    borderRightColor: colors.teal,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  retakeButton: {
    backgroundColor: '#6B7280',
    borderColor: colors.teal,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderColor: colors.teal,
  },
  buttonDisabled: {
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
