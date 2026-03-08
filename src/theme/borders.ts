/**
 * Letra brand – styled borders for cards, buttons, and text containers
 */
import {colors} from './colors';

export const borders = {
  /** Purple header / nav bar – visible border and shadow */
  headerBar: {
    borderWidth: 2,
    borderColor: colors.teal,
    borderBottomWidth: 3,
    borderBottomColor: colors.tealDark,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  button: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonPrimary: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  buttonSecondary: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.teal,
  },
  input: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.teal,
    borderWidth: 2,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
} as const;
