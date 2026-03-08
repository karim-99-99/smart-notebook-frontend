import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../navigation/types';
import Clipboard from '@react-native-clipboard/clipboard';
import {colors} from '../theme/colors';
import RNFS from 'react-native-fs';
import {exportToWord} from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Result'>;
type ResultRouteProp = RouteProp<RootStackParamList, 'Result'>;

export const ResultScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResultRouteProp>();
  const {ocrResult} = route.params;
  const [isExporting, setIsExporting] = useState(false);

  const handleCopyText = () => {
    Clipboard.setString(ocrResult.full_text);
    Alert.alert('✅ Copied!', 'Text copied to clipboard');
  };

  const handleExportToWord = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      console.log('🚀 Starting Word export...');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const filename = `smart_notebook_${timestamp}.docx`;
      const downloadPath = `${RNFS.DownloadDirectoryPath}/${filename}`;

      // Export and download
      const result = await exportToWord(
        ocrResult.full_text,
        'Smart Notebook Note',
        downloadPath,
      );

      if (result.success && result.filePath) {
        Alert.alert(
          '✅ Export Successful',
          `Word document saved to:\nDownloads/${filename}`,
          [
            {text: 'OK'},
            {
              text: 'Open Folder',
              onPress: () => {
                // Try to open the Downloads folder
                if (Platform.OS === 'android') {
                  Linking.openURL('content://com.android.externalstorage.documents/document/primary:Download').catch(
                    () => {
                      Alert.alert('Info', 'Please check your Downloads folder');
                    },
                  );
                }
              },
            },
          ],
        );
      } else {
        Alert.alert('❌ Export Failed', result.error || 'Could not export document');
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      Alert.alert(
        'Error',
        'Failed to export document. Check your connection.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleScanAnother = () => {
    // Navigate back to the Scan screen (remove all intermediate screens)
    navigation.reset({
      index: 0,
      routes: [{name: 'Scan'}],
    });
  };

  // Calculate average confidence if not provided
  const avgConfidence =
    ocrResult.average_confidence ||
    (ocrResult.lines && ocrResult.lines.length > 0
      ? ocrResult.lines.reduce((sum, line) => sum + line.confidence, 0) /
        ocrResult.lines.length
      : 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📝 Extracted Text</Text>
        <Text style={styles.subtitle}>
          {ocrResult.line_count} lines • {Math.round(avgConfidence * 100)}%
          accuracy
        </Text>
      </View>

      {/* Text Content */}
      <ScrollView style={styles.textContainer}>
        <Text style={styles.text}>{ocrResult.full_text}</Text>

        {/* Show individual lines with confidence if available */}
        {ocrResult.lines && ocrResult.lines.length > 0 && (
          <View style={styles.linesContainer}>
            <Text style={styles.linesTitle}>Line-by-line breakdown:</Text>
            {ocrResult.lines.map((line, index) => (
              <View key={index} style={styles.lineItem}>
                <Text style={styles.lineNumber}>{index + 1}.</Text>
                <View style={styles.lineContent}>
                  <Text style={styles.lineText}>{line.text}</Text>
                  <Text style={styles.lineConfidence}>
                    {Math.round(line.confidence * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleCopyText}>
          <Text style={styles.buttonText}>📋 Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.exportButton, isExporting && styles.buttonDisabled]}
          onPress={handleExportToWord}
          disabled={isExporting}>
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>📄 Word</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleScanAnother}>
          <Text style={styles.buttonText}>📸 Scan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    backgroundColor: colors.white,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  textContainer: {
    flex: 1,
    padding: 20,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  linesContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  linesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  lineItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lineNumber: {
    fontSize: 14,
    color: '#999',
    marginRight: 8,
    minWidth: 30,
  },
  lineContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  lineText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  lineConfidence: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButton: {
    backgroundColor: colors.teal,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

