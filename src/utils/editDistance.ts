/**
 * Calculate Levenshtein Edit Distance
 * 
 * Measures how different two strings are.
 * Used to quantify OCR errors:
 * - edit_distance = 0 → OCR was perfect (no corrections)
 * - edit_distance > 0 → OCR had errors (higher = more errors)
 * 
 * Reference: https://en.wikipedia.org/wiki/Levenshtein_distance
 */

export const calculateEditDistance = (str1: string, str2: string): number => {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a matrix to store distances
  const matrix: number[][] = [];

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        // Characters match, no edit needed
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        // Take minimum of: insert, delete, or substitute
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1, // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
};

/**
 * Calculate normalized edit distance (0-1 scale)
 * Useful for comparing edit distances across different text lengths
 */
export const calculateNormalizedEditDistance = (
  str1: string,
  str2: string,
): number => {
  const distance = calculateEditDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength > 0 ? distance / maxLength : 0;
};

