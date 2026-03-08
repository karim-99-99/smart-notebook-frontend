import React, {useState} from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../navigation/types';
import {uploadImageForOCR} from '../services/api';
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

  const handleRetake = () => {
    // Navigate back to Scan screen explicitly
    navigation.navigate('Scan');
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
        Alert.alert(
          'Upload Failed',
          result.error || 'Could not process image. Please try again.',
          [
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
        'Error',
        'An unexpected error occurred. Check your network connection.',
        [{text: 'OK'}],
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
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
