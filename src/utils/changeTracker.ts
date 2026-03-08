/**
 * Change Tracker - Week 8
 * Tracks character-level changes between original and corrected text
 * This data is gold for training OCR models
 */

export interface ChangeStats {
  totalCharacters: number;
  changedCharacters: number;
  changePercentage: number;
  insertions: number;
  deletions: number;
  substitutions: number;
  unchanged: number;
}

/**
 * Calculate detailed change statistics between original and corrected text
 */
export const calculateChangeStats = (
  original: string,
  corrected: string,
): ChangeStats => {
  const originalLength = original.length;
  const correctedLength = corrected.length;

  // Simple character-level comparison
  // For more sophisticated diff, we could use Levenshtein distance
  let changedChars = 0;
  let insertions = 0;
  let deletions = 0;
  let substitutions = 0;
  let unchanged = 0;

  const maxLength = Math.max(originalLength, correctedLength);

  for (let i = 0; i < maxLength; i++) {
    const origChar = original[i];
    const corrChar = corrected[i];

    if (origChar === undefined) {
      // Insertion
      insertions++;
      changedChars++;
    } else if (corrChar === undefined) {
      // Deletion
      deletions++;
      changedChars++;
    } else if (origChar !== corrChar) {
      // Substitution
      substitutions++;
      changedChars++;
    } else {
      // Unchanged
      unchanged++;
    }
  }

  const changePercentage =
    originalLength > 0 ? (changedChars / originalLength) * 100 : 0;

  return {
    totalCharacters: originalLength,
    changedCharacters: changedChars,
    changePercentage: Math.round(changePercentage * 100) / 100,
    insertions,
    deletions,
    substitutions,
    unchanged,
  };
};

/**
 * Get a summary message about changes made
 */
export const getChangeSummary = (stats: ChangeStats): string => {
  if (stats.changePercentage === 0) {
    return 'No changes made';
  }

  const parts: string[] = [];
  if (stats.substitutions > 0) {
    parts.push(`${stats.substitutions} corrections`);
  }
  if (stats.insertions > 0) {
    parts.push(`${stats.insertions} additions`);
  }
  if (stats.deletions > 0) {
    parts.push(`${stats.deletions} deletions`);
  }

  return `${stats.changePercentage.toFixed(1)}% changed (${parts.join(', ')})`;
};

