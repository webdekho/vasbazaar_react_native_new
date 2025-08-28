# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- **Start development server**: `npx expo start`
- **Start with specific platform**: `npx expo start --web`, `npx expo start --android`, `npx expo start --ios`
- **Install dependencies**: `npm install`
- **Lint code**: `npx expo lint`
- **Reset project structure**: `npm run reset-project`

### Testing
- Manual testing files located in `/tests/` directory
- Run authentication flow tests by examining test files in `/tests/authFlowTest.js`, `/tests/pinValidationTest.js`

## Architecture Overview

### Project Structure
This is a **React Native Expo app** with **file-based routing** using Expo Router. The app is a **vasbzaar mobile/web application** for mobile recharges, bill payments, and financial services.

### Core Architecture Patterns

#### 1. Authentication & Session Management
- **AuthGuard component** wraps the entire app to manage authentication state
- **Session-based authentication** with automatic token expiration (10 minutes)
- **Multi-step auth flow**: Login → OTP → Aadhaar → PIN creation/validation
- **Bypass flags** in AsyncStorage prevent auth loops during validation flows
- **useAuth hook** provides centralized auth state management

#### 2. API Architecture
- **Centralized API layer** in `/services/` with modular service structure
- **baseApi.js** handles all HTTP requests with consistent response formatting
- **Token hierarchy**: `permanentToken` (persistent auth) vs `sessionToken` (API access)
- **BASE_URL**: `https://apis.vasbazaar.com`
- **Response normalization**: Handles various API response formats (Status/STATUS/status)

#### 3. Navigation Structure
```
/(tabs) - Main tab navigation
  ├── home - Dashboard with services, sliders, upcoming dues
  ├── history - Transaction history with pagination
  ├── profile - User profile management
  └── wallet - Wallet and balance management

/auth - Authentication flow screens
  ├── LoginScreen
  ├── OtpScreen  
  ├── AadhaarScreen
  ├── PinSetScreen
  └── PinValidateScreen

/main - Feature screens
  ├── prepaid/ - Mobile recharge flow
  ├── dth/ - DTH recharge flow  
  ├── biller/ - Bill payment flow
  └── common/ - Shared transaction screens
```

#### 4. Service Layer Organization
- **Modular services** by feature: auth, user, transaction, notification, etc.
- **Service exports** through `/services/index.js` for clean imports
- **Consistent error handling** with try/catch and standardized error responses
- **AsyncStorage integration** for caching and offline capabilities

### Key Components

#### Headers & Navigation
- **MainHeader**: Customizable header with back/search/notification options
- **CommonHeader/CommonHeader2**: Alternative header variants
- **AuthGuard**: Route protection based on authentication state

#### Business Components  
- **SimpleCardSlider**: Advertisement banners with API integration
- **ServicesSection**: Dynamic services grid from API
- **UpcomingDues**: Payment reminders and scheduler integration
- **Sidebar**: User profile, QR code, and navigation drawer

#### UI Components
- **CustomInput**: Form input with validation
- **ThemedText/ThemedView**: Theme-aware text and view components

### Critical Implementation Details

#### Authentication Flow
1. **Login** with mobile number → **OTP validation** → **Aadhaar verification** → **PIN setup/validation**
2. **Bypass flags** prevent redirect loops: `pinValidationSuccess`, `otpValidationSuccess`, `pinSetSuccess`
3. **AuthGuard** checks authentication state and redirects appropriately
4. **Session tokens** auto-expire and clear user to login screen

#### API Request Patterns
- **sessionToken** used as `access_token` header for authenticated requests
- **Automatic response transformation**: `Status: "SUCCESS"` → `status: "success"`
- **Error handling**: Network errors, API errors, and validation errors uniformly handled

#### State Management
- **AsyncStorage** for persistent data (tokens, user data, cached API responses)
- **React hooks** for component-level state management
- **Context** used minimally, primarily for authentication state

#### Platform Compatibility
- **Cross-platform** React Native app supporting iOS, Android, and Web
- **Platform-specific handling** for contacts, file pickers, and native features
- **Web fallbacks** for mobile-only features (contact import via file upload)

### Important Patterns

#### API Integration
```javascript
// Standard API service pattern
export const getServiceData = async (params, sessionToken) => {
  try {
    const response = await getRequest('api/endpoint', params, sessionToken);
    if (response?.status === 'success') {
      return { status: 'success', data: response.data };
    }
    return { status: 'error', message: response?.message };
  } catch (error) {
    return { status: 'error', message: 'Network error' };
  }
};
```

#### Navigation with Parameters
```javascript
router.push({
  pathname: '/main/prepaid/RechargePlanScreen',
  params: {
    contactName: contact.name,
    phoneNumber: contact.number,
    operatorData: JSON.stringify(data)
  }
});
```

#### AsyncStorage Caching
```javascript
// Cache with expiration pattern
const storageKey = `cache_${identifier}`;
const timestampKey = `${storageKey}_timestamp`;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

### Development Notes

#### Token Management
- Always use `sessionToken` for API requests, not `permanentToken`
- Check token validity before making API calls
- Handle session expiry gracefully with redirect to login

#### Error Handling  
- Provide user-friendly error messages
- Log technical errors for debugging
- Implement fallbacks for API failures (cached data, default values)

#### Performance
- Cache API responses in AsyncStorage with expiration
- Use pull-to-refresh pattern for data updates
- Implement pagination for large data sets

#### Screen Configuration
- All screens have `headerShown: false` in `_layout.jsx` 
- Use `MainHeader` component for consistent navigation
- Handle back navigation with proper fallbacks

#### UI Consistency
- Use black/white color scheme throughout the app
- Maintain consistent spacing and typography
- Follow platform-specific UI patterns (iOS vs Android)

This app follows a service-oriented architecture with clear separation of concerns between authentication, API integration, UI components, and business logic.