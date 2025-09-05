# 🧪 PWA Testing Guide for vasbazaar

## Quick Start

Open your browser console and use these test helpers:

## 🔧 Available Test Functions

### 1. **Reset Everything**
```javascript
PWATestHelpers.resetPWAState()
```
- Clears all PWA settings
- Reloads the page
- Fresh start for testing

### 2. **Simulate Login**
```javascript
PWATestHelpers.simulateLogin()
```
- Sets login trigger
- PWA prompt should appear within 2 seconds
- **Test**: Login → Prompt appears compulsory

### 3. **Check Current State**
```javascript
PWATestHelpers.checkPWAState()
```
- Shows all PWA storage values
- Login trigger status
- Installation status
- Dismissal history

### 4. **Test Temporary Dismissal (30 seconds)**
```javascript
PWATestHelpers.simulateTemporaryDismissal()
```
- Simulates user clicking "Continue web"
- **Test**: Prompt reappears after 30 seconds

### 5. **Check Cooldown Status**
```javascript
PWATestHelpers.checkCooldown()
```
- Shows remaining cooldown time
- **Test**: Countdown from 30 seconds to 0

### 6. **Test Permanent Dismissal**
```javascript
PWATestHelpers.simulatePermanentDismissal()
```
- Simulates "Don't show again"
- **Test**: Prompt never appears again

### 7. **Test Installation**
```javascript
PWATestHelpers.simulateInstallation()
```
- Marks PWA as installed
- **Test**: Prompt stops appearing

### 8. **Get Platform Info**
```javascript
PWATestHelpers.getPlatformInfo()
```
- Shows browser detection results
- **Test**: Correct platform-specific buttons

## 📱 Complete Testing Flow

### Test 1: Login Flow
```javascript
// Step 1: Reset
PWATestHelpers.resetPWAState()

// Step 2: Simulate login (after page reloads)
PWATestHelpers.simulateLogin()

// Expected: PWA prompt appears within 2 seconds
```

### Test 2: Dismissal & Reappearance
```javascript
// Step 1: Show prompt
PWATestHelpers.simulateLogin()

// Step 2: Dismiss (click "Continue web" or use)
PWATestHelpers.simulateTemporaryDismissal()

// Step 3: Wait and check cooldown
PWATestHelpers.checkCooldown()

// Expected: Prompt reappears after 30 seconds
```

### Test 3: Platform Detection
```javascript
// Check platform
PWATestHelpers.getPlatformInfo()

// Expected Results:
// - Android Chrome: "Install Shortcut" + "Android" buttons
// - iOS Safari: "iPhone App" + "Continue web" buttons  
// - Other browsers: Appropriate buttons
```

## 🎯 Expected Behaviors

### ✅ Login Flow
- PWA prompt **MUST** appear after login
- Check every 2 seconds initially
- Compulsory display

### ✅ Dismissal Flow  
- Click "Continue web" → 30-second cooldown
- Prompt reappears automatically
- Check every 30 seconds after dismissal

### ✅ Platform-Specific UI
- **Android**: "Install Shortcut" (universal) + "Android" (Play Store)
- **iOS**: "iPhone App" (App Store) + "Continue web"
- **Material Icons**: All buttons use proper icons

### ✅ Installation Methods
- **Chrome**: Native `beforeinstallprompt` API
- **Samsung**: `navigator.addToHomescreen()` API
- **Firefox/Opera/Edge**: Browser-specific instructions
- **Generic**: Universal fallback instructions

## 🔍 Debug Functions

### Additional Debug Functions:
```javascript
// Force show PWA prompt
debugShowPWAPrompt()

// Reset all PWA settings
resetAllPWASettings()
```

## 🚨 Troubleshooting

### PWA Prompt Not Appearing?
1. Check console logs for debug messages
2. Verify platform: `PWATestHelpers.getPlatformInfo()`
3. Check state: `PWATestHelpers.checkPWAState()`
4. Reset and retry: `PWATestHelpers.resetPWAState()`

### Wrong Platform Detection?
- Check User Agent string in platform info
- Test on different browsers
- Verify button options match platform

### Cooldown Not Working?
- Use `PWATestHelpers.checkCooldown()` to verify timing
- Should be exactly 30 seconds
- Check timestamp accuracy

## 📊 Test Checklist

- [ ] Login triggers PWA prompt (compulsory)
- [ ] Dismissal starts 30-second cooldown  
- [ ] Prompt reappears after 30 seconds
- [ ] Platform-specific buttons display correctly
- [ ] Material icons show properly
- [ ] Installation methods work per browser
- [ ] Debug functions work as expected
- [ ] Reset function clears all state

## 🎉 Success Criteria

✅ **Login Flow**: Prompt appears compulsory after login  
✅ **Dismissal Flow**: 30-second reappearance cycle  
✅ **Universal Support**: Works on all Android browsers  
✅ **iOS Support**: Proper App Store integration  
✅ **Debug Tools**: Full testing capabilities  

---

**Ready to test!** Open browser console and start with `PWATestHelpers.resetPWAState()`