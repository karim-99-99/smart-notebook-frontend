/**
 * Fallback ScanScreen without QR code detection
 * Use this if vision-camera-code-scanner is not installed
 * 
 * To enable QR code detection:
 * 1. npm install vision-camera-code-scanner
 * 2. Replace this file with ScanScreen.tsx (with QR code support)
 */
import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Scan'>;

export const ScanScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleCapture = async () => {
    if (!camera.current || isCapturing) return;

    try {
      setIsCapturing(true);
      console.log('📸 Taking photo...');

      const photo = await camera.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      console.log('✅ Photo captured:', photo.path);

      // Navigate to preview with the photo path
      navigation.navigate('Preview', {photoPath: `file://${photo.path}`});
    } catch (error) {
      console.error('❌ Capture error:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Camera UI Overlay */}
      <View style={styles.overlay}>
        {/* Top instructions */}
        <View style={styles.topContainer}>
          <Text style={styles.instructionText}>
            Position your notebook page in the frame
          </Text>
          <View style={styles.topButtonsContainer}>
            <TouchableOpacity
              style={styles.topButton}
              onPress={() => navigation.navigate('Folders')}>
              <Text style={styles.topButtonText}>📁 Folders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topButton}
              onPress={() => navigation.navigate('History', {})}>
              <Text style={styles.topButtonText}>📚 History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Frame guide */}
        <View style={styles.frameGuide} />

        {/* Bottom controls */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              isCapturing && styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={isCapturing}>
            {isCapturing ? (
              <ActivityIndicator size="large" color="#FFF" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  topButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  topButton: {
    backgroundColor: 'rgba(0,122,255,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  topButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  frameGuide: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 100,
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  bottomContainer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  permissionText: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

