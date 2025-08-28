import { StyleSheet, Text } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Calibri',
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    fontFamily: 'Calibri',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
    fontFamily: 'Calibri',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Calibri',
  },
});
