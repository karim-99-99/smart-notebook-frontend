/**
 * Letta/Letra Brand Design System
 * Extracted from logo, pattern, and brand identity images
 */
export const colors = {
  // Primary - Deep Purple/Indigo (from logo)
  primary: '#5B2A8F',
  primaryDark: '#4F1D77',
  primaryLight: '#6E3AA3',

  // Secondary - Teal/Turquoise
  teal: '#25A88A',
  tealDark: '#1E8B73',
  tealLight: '#2DBB92',

  // Accent - Golden Yellow
  accent: '#F5C62E',
  accentDark: '#DEBE3A',
  accentLight: '#F8D854',

  // Neutrals
  white: '#FFFFFF',
  background: '#FFFFFF',
  backgroundLight: '#FAFAFA',
  surface: '#F5F5F5',

  // Dark mode / overlays
  darkOverlay: 'rgba(91, 42, 143, 0.15)',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: 'rgba(91, 42, 143, 0.2)',

  // Semantic
  success: '#25A88A',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#5B2A8F',
} as const;

export type Colors = typeof colors;
