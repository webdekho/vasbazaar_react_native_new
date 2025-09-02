# Biometric Authentication Flow Test Guide

## Expected Flow

### First Time User (PIN Setup to Biometric Setup):
1. User enters PIN on PinValidate screen
2. PIN is validated successfully via API
3. `handleBiometricSetup()` is called automatically
4. PIN is stored securely with `storeSecurePin()`
5. Biometric preference is set with `setBiometricPreference(true)`
6. Setup completion is marked with `setBiometricSetupCompleted()`
7. User is redirected to Home screen

### Second Time User (Should Use Biometric):
1. User opens app and goes to PinValidate screen
2. `isBiometricAuthAvailable()` is called
3. Should return `{ available: true }` because:
   - Device has biometric support
   - User has biometric enabled (`getBiometricPreference() === true`)
   - Setup is completed (`isBiometricSetupCompleted() === true`)
   - PIN is stored securely (`getSecurePin() !== null`)
4. `attemptBiometricLogin()` is called automatically
5. Biometric authentication prompt appears
6. On success, calls biometric login API
7. User is redirected to Home screen

## Debug Points to Check

### Console Logs to Look For:
1. `🆔 User identifier:` - Should show a valid user ID
2. `📱 Biometric availability:` - Should show availability status
3. `📊 Current biometric status before login attempt:` - Should show all true values
4. `✅ Biometric authentication successful` - Should appear on successful login

### Common Issues:
1. **User identifier is null** - Check if userData/permanentToken exists
2. **Biometric preference is false** - Setup didn't complete properly
3. **No PIN stored** - Secure storage failed
4. **Device not supported** - Check device capabilities

## Manual Test Steps

1. Clear app storage: Delete app data or clear AsyncStorage
2. Go through normal login flow: Login → OTP → Aadhaar → PIN Setup → PIN Validate
3. Enter PIN manually first time - should setup biometric
4. Close app completely
5. Reopen app - should go to PinValidate and attempt biometric automatically

## Key Files Modified
- `/app/auth/PinValidateScreen.jsx` - Main implementation
- `/services/auth/biometricService.js` - Biometric logic and API calls
- `/services/auth/biometricLoginService.js` - API integration
- `/utils/secureStorage.js` - Secure PIN and preference storage