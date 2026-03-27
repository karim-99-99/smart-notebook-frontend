import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import {CameraView, useCameraPermissions} from 'expo-camera';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {colors} from '../theme/colors';
import {borders} from '../theme/borders';
import {StyledMessageModal} from '../components/StyledMessageModal';
import {getBackendUrl, setBackendUrl} from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Scan'>;

export const ScanScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isCapturing, setIsCapturing] = useState(false);
  const [qrCodeDetected, setQrCodeDetected] = useState(false);
  const [scannedQrCode, setScannedQrCode] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const cameraRef = React.useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(
    null,
  );
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const openUrlModal = () => {
    setUrlInput(getBackendUrl());
    setUrlModalVisible(true);
  };

  const saveUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed.startsWith('http')) {
      Alert.alert('Invalid URL', 'URL must start with http:// or https://');
      return;
    }
    await setBackendUrl(trimmed);
    setUrlModalVisible(false);
    Alert.alert('Saved', `Backend URL updated to:\n${trimmed}`);
  };

  // Reset QR code detection when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setQrCodeDetected(false);
      setScannedQrCode(null);
      setCapturedPhoto(null);
      setIsCapturing(false);
      setIsCameraReady(false);
    });

    return unsubscribe;
  }, [navigation]);

  const requestCameraPermission = async () => {
    try {
      setIsRequestingPermission(true);
      setPermissionError(null);
      if (permission?.granted) {
        setHasCameraPermission(true);
        return true;
      }

      const result = await requestPermission();
      const allowed = !!result.granted;
      setHasCameraPermission(allowed);
      if (!allowed) {
        setPermissionError(
          Platform.OS === 'ios'
            ? 'Camera access is denied. Enable camera permission from iOS Settings.'
            : 'Camera access is denied. Enable camera permission in system Settings.',
        );
      }
      return allowed;
    } catch (error) {
      console.error('❌ Camera permission request failed:', error);
      setHasCameraPermission(false);
      setPermissionError('Unable to request camera permission. Please try again.');
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const handleCapture = async () => {
    if (!qrCodeDetected) {
      // QR code improves OCR accuracy but is not required to take a photo
      console.log('Capturing without QR code — accuracy hints not available');
    }

    if (isCapturing || !cameraRef.current) {
      console.log('❌ Cannot capture:', {
        isCapturing,
        hasCameraRef: !!cameraRef.current,
      });
      return;
    }

    try {
      setIsCapturing(true);

      console.log('📸 Attempting to capture photo...');
      let photoUri: string | null = null;

      if (!isCameraReady) {
        Alert.alert('Camera not ready', 'Please wait a moment and try again.');
        return;
      }
      if (
        !cameraRef.current ||
        typeof cameraRef.current.takePictureAsync !== 'function'
      ) {
        throw new Error('Camera ref is not ready');
      }
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        exif: false,
      });
      photoUri = photo?.uri ?? null;

      console.log('📸 Extracted URI:', photoUri);

      if (photoUri && photoUri.length > 0) {
        setCapturedPhoto(photoUri);

        // Navigate to Preview screen with both photo and QR code
        navigation.replace('Preview', {
          photoPath: photoUri,
          qrCode: scannedQrCode,
        });
      } else {
        console.error('❌ Invalid result from capture: empty photo URI');
        Alert.alert(
          'Capture Error',
          'Photo capture returned empty image data. Please try again.',
        );
      }
    } catch (error: any) {
      console.error('❌ Photo capture exception:', error);
      Alert.alert('Error', `Failed to capture photo: ${error.message || String(error)}`);
    } finally {
      setIsCapturing(false);
    }
  };

  if (hasCameraPermission === null || isRequestingPermission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!hasCameraPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          Please allow camera access to scan QR codes and take photos.
        </Text>
        {!!permissionError && (
          <Text style={styles.permissionErrorText}>{permissionError}</Text>
        )}
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.permissionButton, styles.settingsButton]}
          onPress={() => Linking.openSettings()}>
          <Text style={styles.permissionButtonText}>
            {Platform.OS === 'ios' ? 'Open iOS Settings' : 'Open Settings'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => setIsCameraReady(true)}
        barcodeScannerSettings={{barcodeTypes: ['qr']}}
        onBarcodeScanned={event => {
          if (!qrCodeDetected && event?.data) {
            setQrCodeDetected(true);
            setScannedQrCode(event.data);
            setQrModalVisible(true);
          }
        }}
      />

      {/* Navigation Header */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Folders')}>
            <Text style={styles.navIcon}>📁</Text>
            <Text style={styles.navLabel}>Folders</Text>
          </TouchableOpacity>

          <TouchableOpacity onLongPress={openUrlModal} delayLongPress={600}>
            <Text style={styles.headerTitle}>Letra</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('History')}>
            <Text style={styles.navIcon}>📷</Text>
            <Text style={styles.navLabel}>History</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* QR Code Status Indicator */}
      {qrCodeDetected && scannedQrCode && (
        <View style={styles.qrStatusContainer}>
          <View style={styles.qrStatusBadge}>
            <Text style={styles.qrStatusText}>✓ QR Code Scanned</Text>
            <Text style={styles.qrCodeValue} numberOfLines={1}>
              {scannedQrCode}
            </Text>
          </View>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {qrCodeDetected
            ? 'QR scanned — Tap to take photo'
            : 'Tap the button to take a photo'}
        </Text>
      </View>

      {/* Capture Button */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.captureButton,
            isCapturing && styles.captureButtonDisabled,
          ]}
          onPress={handleCapture}
          disabled={isCapturing}>
          {isCapturing ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>
      </View>
      <StyledMessageModal
        visible={qrModalVisible}
        title="QR Code Detected!"
        message="Now you can take a photo."
        onPress={() => setQrModalVisible(false)}
      />

      {/* Backend URL Settings Modal – long-press the title to open */}
      <Modal
        visible={urlModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUrlModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.urlModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.urlModalBox}>
            <Text style={styles.urlModalTitle}>Backend URL</Text>
            <Text style={styles.urlModalHint}>
              Paste the new Cloudflare / ngrok tunnel URL
            </Text>
            <TextInput
              style={styles.urlInput}
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://your-tunnel.trycloudflare.com"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              selectTextOnFocus
            />
            <View style={styles.urlModalButtons}>
              <TouchableOpacity
                style={[styles.urlBtn, styles.urlBtnCancel]}
                onPress={() => setUrlModalVisible(false)}>
                <Text style={styles.urlBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.urlBtn, styles.urlBtnSave]}
                onPress={saveUrl}>
                <Text style={styles.urlBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    zIndex: 10,
    ...borders.headerBar,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minWidth: 70,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  navLabel: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  qrStatusContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  qrStatusBadge: {
    backgroundColor: 'rgba(37, 168, 138, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    maxWidth: '90%',
  },
  qrStatusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  qrCodeValue: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  instructionsContainer: {
    position: 'absolute',
    top: 200,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 24,
  },
  permissionErrorText: {
    color: '#ffb4b4',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  permissionButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  settingsButton: {
    backgroundColor: '#444',
    marginTop: 10,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  instructionsText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#5B2A8F',
  },
  captureButtonDisabled: {
    opacity: 0.5,
    borderColor: '#666',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#5B2A8F',
  },
  urlModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  urlModalBox: {
    width: '100%',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  urlModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  urlModalHint: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 16,
  },
  urlInput: {
    backgroundColor: '#0d0d1a',
    color: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.teal,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  urlModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    gap: 12,
  },
  urlBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  urlBtnCancel: {
    backgroundColor: '#444',
  },
  urlBtnSave: {
    backgroundColor: colors.teal ?? '#25a88a',
  },
  urlBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
