
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import StackNavigation from './src/Navigation/StackNavigation';
import { AuthProvider } from './src/context/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import CrashReportingService from './src/Services/CrashReportingService';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0f60bd',
    background: '#ffffff',
  },
};

const linking = {
  prefixes: ['vasbazaar://'],
  config: {
    screens: {
      DeepLinkHome: {
        path: '/',
        exact: true,
      },
      sign_in: 'sign_in',
      otp_validate: {
        path: '/otp_validate',
        parse: {
          response: (response) => decodeURIComponent(response || ''),
          mobileNumber: (mobileNumber) => mobileNumber || '',
          code: (code) => decodeURIComponent(code || ''),
        },
      },
      aadhaar_number: {
        path: '/aadhaar_number',
        parse: {
          permanentToken: (permanentToken) => permanentToken || '',
          sessionToken: (sessionToken) => sessionToken || '',
        },
      },
      aadhaar_otp_validate: {
        path: '/aadhaar_otp_validate',
        parse: {
          ref_id: (ref_id) => ref_id || '',
          permanentToken: (permanentToken) => permanentToken || '',
          sessionToken: (sessionToken) => sessionToken || '',
          aadhaar_number: (aadhaar_number) => aadhaar_number || '',
        },
      },
      PinGenerate: {
        path: '/PinGenerate',
        parse: {
          permanentToken: (permanentToken) => permanentToken || '',
          sessionToken: (sessionToken) => sessionToken || '',
          data: (data) => {
            try {
              return data ? JSON.parse(decodeURIComponent(data)) : {};
            } catch {
              return {};
            }
          },
        },
      },
      HomeRoute: {
        path: '/Home',
      },
      PinValidate: 'PinValidate',
    },
  },
};

export default function App() {
  useEffect(() => {
    // Initialize crash reporting (using mock service for development)
    const initializeCrashReporting = () => {
      CrashReportingService.initialize();
      
      // Log app startup
      CrashReportingService.logEvent('app_startup', {
        timestamp: new Date().toISOString(),
        platform: 'android'
      });
    };

    // Initialize immediately since using mock service
    initializeCrashReporting();
  }, []);

  const handleError = (error) => {
    // Navigate to home or show restart option
    console.log('App-level error handler called:', error);
    // You can add navigation logic here if needed
  };

  return (
    <ErrorBoundary screenName="App" onError={handleError}>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer linking={linking}>
            <ErrorBoundary screenName="Navigation">
              <StackNavigation />
            </ErrorBoundary>
          </NavigationContainer>
        </PaperProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}