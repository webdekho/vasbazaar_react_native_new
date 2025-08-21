import { Platform, StyleSheet } from 'react-native';

// Shared input theme and styles
export const inputTheme = {
  colors: {
    primary: '#000000',
    background: '#ffffff',
    surface: '#ffffff',
    disabled: '#f5f5f5',
    placeholder: '#666666',
    text: '#000000',
    error: '#E53E3E',
    success: '#4CAF50',
    border: '#e0e0e0',
    focusedBorder: '#000000',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
  },
  typography: {
    fontSize: {
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
};

export const inputStyles = StyleSheet.create({
  // Base input container
  inputContainer: {
    marginBottom: inputTheme.spacing.lg,
  },

  // Label styles
  label: {
    fontSize: inputTheme.typography.fontSize.sm,
    fontWeight: inputTheme.typography.fontWeight.medium,
    color: inputTheme.colors.text,
    marginBottom: inputTheme.spacing.xs,
  },

  labelRequired: {
    color: inputTheme.colors.error,
  },

  // Base input field
  baseInput: {
    backgroundColor: inputTheme.colors.background,
    borderWidth: 1,
    borderColor: inputTheme.colors.border,
    borderRadius: inputTheme.borderRadius.md,
    paddingHorizontal: inputTheme.spacing.lg,
    paddingVertical: Platform.select({
      ios: inputTheme.spacing.md,
      android: inputTheme.spacing.sm,
      web: inputTheme.spacing.md,
    }),
    fontSize: Platform.select({
      ios: 16, // Must be 16px or larger to prevent iOS zoom
      android: inputTheme.typography.fontSize.md,
      web: 16,
    }),
    fontWeight: inputTheme.typography.fontWeight.normal,
    color: inputTheme.colors.text,
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: inputTheme.colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        // Prevent iOS zoom
        WebkitTextSizeAdjust: '100%',
      },
      android: {
        elevation: 1,
      },
      web: {
        outlineWidth: 0,
        boxShadow: `0 1px 3px ${inputTheme.colors.shadow}`,
        // Prevent web zoom
        WebkitTextSizeAdjust: '100%',
        textSizeAdjust: '100%',
      },
    }),
  },

  // Input states
  inputFocused: {
    borderColor: inputTheme.colors.focusedBorder,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: `0 2px 6px ${inputTheme.colors.shadow}`,
      },
    }),
  },

  inputError: {
    borderColor: inputTheme.colors.error,
    borderWidth: 2,
  },

  inputDisabled: {
    backgroundColor: inputTheme.colors.disabled,
    borderColor: inputTheme.colors.disabled,
    color: inputTheme.colors.placeholder,
  },

  inputSuccess: {
    borderColor: inputTheme.colors.success,
  },

  // Input with icons
  inputWithLeftIcon: {
    paddingLeft: 48,
  },

  inputWithRightIcon: {
    paddingRight: 48,
  },

  // Icon containers
  leftIconContainer: {
    position: 'absolute',
    left: inputTheme.spacing.lg,
    top: '50%',
    transform: [{ translateY: -12 }],
    zIndex: 1,
  },

  rightIconContainer: {
    position: 'absolute',
    right: inputTheme.spacing.lg,
    top: '50%',
    transform: [{ translateY: -12 }],
    zIndex: 1,
  },

  // Multiline input
  multilineInput: {
    minHeight: 80,
    paddingTop: inputTheme.spacing.md,
    textAlignVertical: 'top',
  },

  // Paper-style input (Material Design)
  paperInputContainer: {
    backgroundColor: inputTheme.colors.background,
    borderRadius: inputTheme.borderRadius.sm,
  },

  paperInput: {
    backgroundColor: 'transparent',
    fontSize: inputTheme.typography.fontSize.md,
  },

  paperInputContent: {
    color: inputTheme.colors.text,
  },

  paperInputLabel: {
    fontSize: inputTheme.typography.fontSize.sm,
    fontWeight: inputTheme.typography.fontWeight.medium,
  },

  // Error text
  errorText: {
    fontSize: inputTheme.typography.fontSize.sm,
    color: inputTheme.colors.error,
    marginTop: inputTheme.spacing.xs,
    fontWeight: inputTheme.typography.fontWeight.medium,
  },

  // Helper text
  helperText: {
    fontSize: inputTheme.typography.fontSize.sm,
    color: inputTheme.colors.placeholder,
    marginTop: inputTheme.spacing.xs,
  },

  // PIN input styles
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  pinInput: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: inputTheme.colors.border,
    borderRadius: inputTheme.borderRadius.md,
    backgroundColor: inputTheme.colors.background,
    textAlign: 'center',
    fontSize: Platform.select({
      ios: 18, // Larger font to prevent iOS zoom
      android: inputTheme.typography.fontSize.lg,
      web: 18,
    }),
    fontWeight: inputTheme.typography.fontWeight.semibold,
    color: inputTheme.colors.text,
    ...Platform.select({
      ios: {
        shadowColor: inputTheme.colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        WebkitTextSizeAdjust: '100%',
      },
      android: {
        elevation: 1,
      },
      web: {
        outlineWidth: 0,
        WebkitTextSizeAdjust: '100%',
      },
    }),
  },

  pinInputFocused: {
    borderColor: inputTheme.colors.focusedBorder,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.15,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  pinInputFilled: {
    borderColor: inputTheme.colors.success,
    backgroundColor: '#f8fff8',
  },

  // Search input styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: inputTheme.colors.background,
    borderRadius: inputTheme.borderRadius.md,
    paddingHorizontal: inputTheme.spacing.lg,
    paddingVertical: inputTheme.spacing.md,
    borderWidth: 1,
    borderColor: inputTheme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: inputTheme.colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: `0 1px 3px ${inputTheme.colors.shadow}`,
      },
    }),
  },

  searchInput: {
    flex: 1,
    fontSize: Platform.select({
      ios: 16, // Must be 16px or larger to prevent iOS zoom
      android: inputTheme.typography.fontSize.md,
      web: 16,
    }),
    color: inputTheme.colors.text,
    marginLeft: inputTheme.spacing.sm,
    ...Platform.select({
      ios: {
        WebkitTextSizeAdjust: '100%',
      },
      web: {
        outlineWidth: 0,
        WebkitTextSizeAdjust: '100%',
      },
    }),
  },

  searchIcon: {
    color: inputTheme.colors.placeholder,
  },
});

export default { inputTheme, inputStyles };