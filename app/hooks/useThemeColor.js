/**
 * A hook that returns the appropriate color value based on the current theme.
 * For this app, we primarily use a black/white theme.
 */

const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    tint: '#000000',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#000000',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    tint: '#FFFFFF',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FFFFFF',
  },
};

/**
 * Hook to get theme-appropriate colors
 * @param {Object} props - Object with light and dark color overrides
 * @param {string} colorName - The color name to get from the theme
 * @returns {string} The appropriate color for the current theme
 */
export function useThemeColor(props, colorName) {
  // For now, we'll default to light theme since the app primarily uses black/white
  // This can be extended later to detect system theme or user preference
  const theme = 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

/**
 * Hook to get the current theme
 * @returns {string} The current theme ('light' or 'dark')
 */
export function useColorScheme() {
  // Default to light theme for consistency with app's black/white design
  return 'light';
}