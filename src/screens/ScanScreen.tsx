import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {colors} from '../theme/colors';
import {borders} from '../theme/borders';
import {StyledMessageModal} from '../components/StyledMessageModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Scan'>;

export const ScanScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isCapturing, setIsCapturing] = useState(false);
  const [qrCodeDetected, setQrCodeDetected] = useState(false);
  const [scannedQrCode, setScannedQrCode] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  let cameraRef: Camera | null = null;

  // Reset QR code detection when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setQrCodeDetected(false);
      setScannedQrCode(null);
      setCapturedPhoto(null);
      setIsCapturing(false);
    });

    return unsubscribe;
  }, [navigation]);

  const handleQRCodeRead = (event: any) => {
    if (!qrCodeDetected && event?.nativeEvent?.codeStringValue) {
      const qrCode = event.nativeEvent.codeStringValue;
      setQrCodeDetected(true);
      setScannedQrCode(qrCode);
      setQrModalVisible(true);
    }
  };

  const handleCapture = async () => {
    if (!qrCodeDetected) {
      Alert.alert(
        'Scan QR Code First',
        'Please scan a QR code before taking a photo',
      );
      return;
    }

    if (isCapturing || !cameraRef) {
      console.log('❌ Cannot capture:', {isCapturing, hasCameraRef: !!cameraRef});
      return;
    }

    try {
      setIsCapturing(true);
      
      console.log('📸 Attempting to capture photo...');
      
      // react-native-camera-kit capture() can return different types
      const result = await cameraRef.capture();
      
      console.log('📸 Capture result:', {
        result,
        type: typeof result,
        isString: typeof result === 'string',
        isObject: typeof result === 'object',
        hasUri: result?.uri,
        keys: typeof result === 'object' ? Object.keys(result || {}) : 'not-object'
      });
      
      // Handle different return types from camera-kit
      let photoUri: string | null = null;
      
      if (typeof result === 'string') {
        photoUri = result;
      } else if (result && typeof result === 'object' && result.uri) {
        photoUri = result.uri;
      } else if (result && typeof result === 'object' && result.path) {
        photoUri = result.path;
      }
      
      console.log('📸 Extracted URI:', photoUri);
      
      if (photoUri && photoUri.length > 0) {
        setCapturedPhoto(photoUri);

        // Navigate to Preview screen with both photo and QR code
        navigation.replace('Preview', {
          photoPath: photoUri,
          qrCode: scannedQrCode,
        });
      } else {
        console.error('❌ Invalid result from capture:', result);
        Alert.alert(
          'Capture Error', 
          `Photo capture returned invalid data.\n\nType: ${typeof result}\nValue: ${JSON.stringify(result)}`
        );
      }
    } catch (error: any) {
      console.error('❌ Photo capture exception:', error);
      Alert.alert('Error', `Failed to capture photo: ${error.message || String(error)}`);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={ref => (cameraRef = ref)}
        style={styles.camera}
        cameraType={CameraType.Back}
        scanBarcode={true}
        onReadCode={handleQRCodeRead}
        showFrame={true}
        laserColor="red"
        frameColor="white"
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
          
          <Text style={styles.headerTitle}>Smart Notebook</Text>
          
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
          {!qrCodeDetected
            ? '1. Scan a QR code first'
            : '2. Tap the button to take photo'}
        </Text>
      </View>

      {/* Capture Button */}
      <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.captureButton,
            (!qrCodeDetected || isCapturing) && styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
          disabled={!qrCodeDetected || isCapturing}>
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
});
