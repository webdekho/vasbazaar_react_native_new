/**
 * Theme Constants
 * Centralized theme configuration for consistent design across the app
 */

export const COLORS = {
  // Primary colors
  PRIMARY: '#000000',
  PRIMARY_LIGHT: '#333333',
  PRIMARY_DARK: '#000000',
  
  // Secondary colors
  SECONDARY: '#0f60bd',
  SECONDARY_LIGHT: '#4A90E2',
  SECONDARY_DARK: '#0A4A8A',
  
  // Background colors
  BACKGROUND_PRIMARY: '#FFFFFF',
  BACKGROUND_SECONDARY: '#F5F7FA',
  BACKGROUND_LIGHT: '#F8F9FA',
  
  // Text colors
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#666666',
  TEXT_LIGHT: '#999999',
  TEXT_WHITE: '#FFFFFF',
  
  // Status colors
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  
  // Border and separator colors
  BORDER_LIGHT: '#E0E0E0',
  BORDER_MEDIUM: '#CCCCCC',
  BORDER_DARK: '#999999',
  
  // Card and surface colors
  CARD_BACKGROUND: '#FFFFFF',
  SURFACE: '#FAFAFA',
  OVERLAY: 'rgba(0, 0, 0, 0.5)',
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 40,
};

export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 28,
  TITLE: 32,
};

export const FONT_WEIGHTS = {
  LIGHT: '300',
  REGULAR: '400',
  MEDIUM: '500',
  SEMIBOLD: '600',
  BOLD: '700',
  EXTRA_BOLD: '800',
};

export const BORDER_RADIUS = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  ROUND: 50,
};

export const SHADOWS = {
  LIGHT: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  HEAVY: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const DIMENSIONS = {
  BUTTON_HEIGHT: 48,
  INPUT_HEIGHT: 48,
  HEADER_HEIGHT: 56,
  TAB_HEIGHT: 60,
};

// System font stack for better performance and native feel
export const FONT_FAMILY = {
  SYSTEM: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  MONOSPACE: 'Menlo, Monaco, "Courier New", monospace',
};

export default {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
  SHADOWS,
  DIMENSIONS,
  FONT_FAMILY,
};