
import { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { Platform, Linking } from 'react-native';
import StackNavigation from './src/Navigation/StackNavigation';
import { AuthProvider } from './src/context/AuthContext';
import { PWAProvider } from './src/context/PWAContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import VersionChecker from './src/components/VersionChecker';
import CrashReportingService from './src/Services/CrashReportingService';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0f60bd',
    background: '#ffffff',
  },
};

// Simplified linking configuration for web compatibility
const linking = Platform.OS === 'web' ? undefined : {
  prefixes: ['vasbazaar://'],
  config: {
    screens: {
      sign_in: {
        path: '/sign_in',
        parse: {
          code: (code) => code || '',
        },
      },
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
      PinValidate: '/PinValidate',
    },
  },
};

export default function App() {
  const navigationRef = useRef(null);
  const [initialReferralCode, setInitialReferralCode] = useState(null);

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

    // Handle URL query parameters on web platform
    if (Platform.OS === 'web') {
      // Extract referral code from URL query string
      const extractReferralCode = () => {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          
          if (code) {
            console.log('Referral code found in URL:', code);
            setInitialReferralCode(code);
            
            // Store in sessionStorage for persistence
            window.sessionStorage.setItem('referralCode', code);
            
            // Optionally clean the URL without reloading
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          } else {
            // Check if there's a stored referral code
            const storedCode = window.sessionStorage.getItem('referralCode');
            if (storedCode) {
              setInitialReferralCode(storedCode);
            }
          }
        } catch (error) {
          console.error('Error extracting referral code:', error);
        }
      };

      extractReferralCode();
    } else {
      // Handle deep linking for mobile platforms
      const handleDeepLink = (url) => {
        if (url) {
          try {
            const route = url.replace(/.*?:\/\//g, '');
            const [path, queryString] = route.split('?');
            
            if (queryString) {
              const params = new URLSearchParams(queryString);
              const code = params.get('code');
              
              if (code) {
                console.log('Referral code from deep link:', code);
                setInitialReferralCode(code);
              }
            }
          } catch (error) {
            console.error('Error parsing deep link:', error);
          }
        }
      };

      // Check initial URL
      Linking.getInitialURL().then(handleDeepLink);

      // Listen for new URLs
      const subscription = Linking.addEventListener('url', (event) => {
        handleDeepLink(event.url);
      });

      return () => {
        subscription?.remove();
      };
    }
  }, []);

  const handleError = (error) => {
    // Navigate to home or show restart option
    console.log('App-level error handler called:', error);
    // You can add navigation logic here if needed
  };

  return (
    <ErrorBoundary screenName="App" onError={handleError}>
      <PWAProvider>
        <VersionChecker>
          <AuthProvider>
            <PaperProvider theme={theme}>
              <NavigationContainer 
                ref={navigationRef}
                linking={Platform.OS === 'web' ? { enabled: false } : linking}
              >
                <ErrorBoundary screenName="Navigation">
                  <StackNavigation initialReferralCode={initialReferralCode} />
                </ErrorBoundary>
              </NavigationContainer>
            </PaperProvider>
          </AuthProvider>
        </VersionChecker>
      </PWAProvider>
    </ErrorBoundary>
  );
}