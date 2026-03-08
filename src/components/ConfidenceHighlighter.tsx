/**
 * ConfidenceHighlighter Component - Week 8
 * Highlights lines with low confidence to encourage corrections
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export interface LineData {
  text: string;
  confidence: number;
}

interface ConfidenceHighlighterProps {
  lines: LineData[];
  threshold?: number; // Default 0.85
  onLinePress?: (lineIndex: number) => void;
}

export const ConfidenceHighlighter: React.FC<ConfidenceHighlighterProps> = ({
  lines,
  threshold = 0.85,
  onLinePress,
}) => {
  const lowConfidenceLines = lines.filter(line => line.confidence < threshold);
  const lowConfidenceCount = lowConfidenceLines.length;

  if (lowConfidenceCount === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.warningBanner}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <View style={styles.warningTextContainer}>
          <Text style={styles.warningTitle}>
            Low confidence detected — please review
          </Text>
          <Text style={styles.warningSubtitle}>
            {lowConfidenceCount} line{lowConfidenceCount !== 1 ? 's' : ''} with
            confidence &lt; {Math.round(threshold * 100)}%
          </Text>
        </View>
      </View>

      <View style={styles.linesContainer}>
        {lowConfidenceLines.map((line, index) => {
          const originalIndex = lines.indexOf(line);
          return (
            <View
              key={originalIndex}
              style={[
                styles.lineItem,
                line.confidence < 0.7 && styles.lineItemCritical,
              ]}>
              <View style={styles.lineHeader}>
                <Text style={styles.lineNumber}>Line {originalIndex + 1}</Text>
                <View
                  style={[
                    styles.confidenceBadge,
                    line.confidence < 0.7 && styles.confidenceBadgeCritical,
                  ]}>
                  <Text style={styles.confidenceBadgeText}>
                    {Math.round(line.confidence * 100)}%
                  </Text>
                </View>
              </View>
              <Text style={styles.lineText}>{line.text}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  warningSubtitle: {
    fontSize: 12,
    color: '#856404',
  },
  linesContainer: {
    gap: 8,
  },
  lineItem: {
    backgroundColor: '#FFF',
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  lineItemCritical: {
    borderLeftColor: '#F44336',
    borderColor: '#EF9A9A',
    backgroundColor: '#FFEBEE',
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  confidenceBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confidenceBadgeCritical: {
    backgroundColor: '#F44336',
  },
  confidenceBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  lineText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

