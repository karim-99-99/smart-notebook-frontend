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
import {uploadImageForOCR, loginBackend} from '../services/api';
import {getCurrentUser} from '../lib/supabase';
import type {NotebookQRData} from '../utils/qrCodeParser';
import {trackError, trackEvent, trackAccuracy} from '../services/analytics';
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
  const [ocrStep, setOcrStep] = useState('');
  const [imageError, setImageError] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [backendPassword, setBackendPassword] = useState('');
  const [backendLoginEmail, setBackendLoginEmail] = useState<string | null>(null);

  const goBackToScan = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'Scan'}],
    });
  };

  const handleRetake = () => {
    navigation.replace('Scan');
  };

  const handleSendToOCR = async () => {
    if (isUploading) return;

    setIsUploading(true);
    setOcrStep('Uploading image...');
    console.log('🚀 Starting OCR process...');

    // Progressive step labels so the user sees movement, not a frozen spinner.
    // Timings are approximate; the actual result clears the label when ready.
    const stepTimers = [
      setTimeout(() => setOcrStep('Detecting text regions...'), 4000),
      setTimeout(() => setOcrStep('Reading Arabic / English text...'), 10000),
      setTimeout(() => setOcrStep('Almost there...'), 25000),
    ];
    try {
      // Pass QR data to OCR for auto-configuration
      const result = await uploadImageForOCR(photoPath, qrData);

      if (result.success && result.data) {
        console.log('✅ OCR successful:', result.data);
        trackEvent('scan', {has_lines: (result.data.lines?.length ?? 0) > 0});
        const conf = result.data.average_confidence ?? (result.data.lines?.length ? result.data.lines.reduce((s: number, l: { confidence?: number }) => s + (l.confidence ?? 0), 0) / result.data.lines.length : 0);
        if (typeof conf === 'number' && !Number.isNaN(conf)) trackAccuracy('ocr_confidence', conf, null, {line_count: result.data.line_count ?? 0});
        // Navigate to edit screen with image and OCR result
        // User can edit text before saving
        navigation.navigate('EditNote', {
          photoPath: photoPath,
          ocrResult: result.data,
          qrData: qrData,
        });
      } else {
        console.error('❌ OCR failed:', result.error);
        trackError('ocr', result.error || 'OCR failed', undefined, {});
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
            {text: 'Back to scan', onPress: goBackToScan},
            {text: 'Cancel', style: 'cancel'},
          ],
        );
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      trackError('ocr', error instanceof Error ? error.message : String(error), undefined, {});
      Alert.alert(
        'Something went wrong',
        'Check connection to backend or log in (log out and log in again if needed). Return to the scan screen and try again.',
        [
          {text: 'Back to scan', onPress: goBackToScan},
          {text: 'OK'},
        ],
      );
    } finally {
      stepTimers.forEach(t => clearTimeout(t));
      setOcrStep('');
      setIsUploading(false);
    }
  };

  const handleBackendLoginFromModal = async () => {
    if (!backendLoginEmail || !backendPassword.trim()) {
      Alert.alert('Enter your password', 'Password is required to log in to the backend.');
      return;
    }
    setShowPasswordModal(false);
    const result = await loginBackend(backendLoginEmail, backendPassword.trim());
    if (result.error) {
      Alert.alert('Backend login failed', result.error);
      return;
    }
    handleSendToOCR();
  };

  // If photo is missing or failed to load (e.g. after app reload), show message and back to scan
  if (!photoPath || !photoPath.trim() || imageError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {imageError
              ? 'The photo could not be displayed. Return to the scan screen and try again.'
              : 'The photo could not be loaded. Return to the scan screen and try again.'}
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={goBackToScan}>
            <Text style={styles.buttonText}>Back to scan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          onError={() => setImageError(true)}
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
              <Text style={styles.buttonText}>{ocrStep || 'Processing...'}</Text>
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
  errorCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.teal,
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
