# Session Protection System

This system automatically redirects users to PIN validation when their session token expires.

## Quick Usage

### 1. Import the utilities
```javascript
import { protect, protectedPush, checkSession } from '../utils/sessionProtection';
```

### 2. Protect any click handler
```javascript
// Wrap any function with session protection
const handleButtonPress = protect(() => {
  console.log('This only runs if session is valid');
  router.push('/some-screen');
});

// Use in your component
<TouchableOpacity onPress={handleButtonPress}>
  <Text>Protected Button</Text>
</TouchableOpacity>
```

### 3. Direct protected navigation
```javascript
// Direct navigation with session protection
const handleNavigation = () => protectedPush('/some-screen');

// With parameters
const handleNavigationWithParams = () => 
  protectedPush('/some-screen', { param1: 'value1' });
```

### 4. Manual session check
```javascript
const handleAction = async () => {
  const isValid = await checkSession();
  if (isValid) {
    // Session is valid, proceed with action
    doSomething();
  }
  // If session is invalid, user is already redirected
};
```

## Available Functions

- **`protect(fn)`** - Wraps any function with session validation
- **`protectedPush(path, params)`** - Protected router.push()
- **`protectedReplace(path, params)`** - Protected router.replace()
- **`checkSession()`** - Manual session validation with auto-redirect
- **`hasValidSession()`** - Simple boolean check without redirect

## Global Protection

The app also has global session monitoring via `GlobalSessionInterceptor` that:
- Checks session every 30 seconds
- Automatically redirects if session expires
- Runs in the background

## Examples

### Button with Protection
```javascript
const MyButton = () => {
  const handlePress = protect(() => {
    // Your action here
    Alert.alert('Success', 'Action completed!');
  });

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>Click Me</Text>
    </TouchableOpacity>
  );
};
```

### Service Navigation
```javascript
const handleServicePress = protect((service) => {
  const serviceId = service.id;
  router.push(`/main/service/${serviceId}`);
});
```

### Form Submission
```javascript
const handleSubmit = protect(async (formData) => {
  const result = await submitForm(formData);
  router.push('/success');
});
```

## How It Works

1. **User clicks** → `protect()` wrapper executes
2. **Session check** → Validates session token exists
3. **Valid session** → Original function executes
4. **Invalid session** → Auto redirect to `/auth/PinValidateScreen`

This ensures that any action requiring authentication will automatically redirect users to re-authenticate if their session has expired.