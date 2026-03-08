/**
 * QR Code Detector Component
 * Displays QR code detection status in bottom left corner
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {NotebookQRData} from '../utils/qrCodeParser';

interface QRCodeDetectorProps {
  detectedData: NotebookQRData | null;
  isDetecting: boolean;
}

export const QRCodeDetector: React.FC<QRCodeDetectorProps> = ({
  detectedData,
  isDetecting,
}) => {
  if (!isDetecting && !detectedData) {
    return null;
  }

  return (
    <View style={styles.container}>
      {detectedData ? (
        <View style={styles.detectedContainer}>
          <Text style={styles.icon}>✅</Text>
          <View style={styles.textContainer}>
            <Text style={styles.title}>QR Detected</Text>
            <Text style={styles.subtitle}>
              Page {detectedData.page_number} • {detectedData.layout}
            </Text>
            <Text style={styles.subtitle}>
              {detectedData.language_hint === 'ar' ? '🇸🇦' : detectedData.language_hint === 'en' ? '🇬🇧' : '🌐'} {detectedData.language_hint}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.detectingContainer}>
          <Text style={styles.icon}>🔍</Text>
          <Text style={styles.detectingText}>Scanning QR...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 10,
  },
  detectedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(40, 167, 69, 0.95)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
    borderWidth: 2,
    borderColor: '#28A745',
  },
  detectingContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 122, 255, 0.95)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    color: '#FFF',
    fontSize: 11,
    opacity: 0.9,
  },
  detectingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

