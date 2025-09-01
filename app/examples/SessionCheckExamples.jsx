import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';

// Different ways to implement session checking
import { useSessionCheck, useProtectedAction } from '../../hooks/useSessionCheck';
// import { withSessionCheck } from '../../utils_old/sessionUtils';
import { SessionProtected, withSessionProtection } from '../../components/SessionProtected';

/**
 * Example component showing different approaches to session validation
 */

// Approach 1: Using useProtectedAction hook
const ExampleWithHook = () => {
  const router = useRouter();
  const executeWithSessionCheck = useProtectedAction();

  const handleButtonPress = () => {
    executeWithSessionCheck(() => {
      console.log('Action executed with session check');
      router.push('/some-screen');
    });
  };

  return (
    <TouchableOpacity onPress={handleButtonPress}>
      <Text>Button with Hook Protection</Text>
    </TouchableOpacity>
  );
};

// Approach 2: Using withSessionCheck utility - COMMENTED OUT due to import issues
// const ExampleWithUtility = () => {
//   const router = useRouter();

//   const handleButtonPress = withSessionCheck(() => {
//     console.log('Action executed with utility session check');
//     router.push('/some-screen');
//   });

//   return (
//     <TouchableOpacity onPress={handleButtonPress}>
//       <Text>Button with Utility Protection</Text>
//     </TouchableOpacity>
//   );
// };

// Approach 3: Manual session check
const ExampleWithManualCheck = () => {
  const router = useRouter();
  const checkSession = useSessionCheck();

  const handleButtonPress = async () => {
    const isValid = await checkSession();
    if (isValid) {
      console.log('Session is valid, proceeding...');
      router.push('/some-screen');
    }
    // If session is invalid, checkSession automatically redirects
  };

  return (
    <TouchableOpacity onPress={handleButtonPress}>
      <Text>Button with Manual Check</Text>
    </TouchableOpacity>
  );
};

// Approach 4: Component-level protection
const ProtectedComponent = () => {
  const router = useRouter();

  const handleAction = () => {
    // No need for session check here - component is already protected
    console.log('Action in protected component');
    router.push('/some-screen');
  };

  return (
    <TouchableOpacity onPress={handleAction}>
      <Text>Button in Protected Component</Text>
    </TouchableOpacity>
  );
};

// Wrap component with session protection
const ProtectedComponentWithHOC = withSessionProtection(ProtectedComponent);

// Approach 5: Using SessionProtected wrapper
const ExampleWithSessionProtected = () => {
  return (
    <SessionProtected>
      <ProtectedComponent />
    </SessionProtected>
  );
};

// Main example component
export default function SessionCheckExamples() {
  return (
    <>
      <Text style={{ fontSize: 18, fontWeight: 'bold', margin: 16 }}>
        Session Check Examples
      </Text>
      
      <ExampleWithHook />
      {/* <ExampleWithUtility /> */}
      <ExampleWithManualCheck />
      <ProtectedComponentWithHOC />
      <ExampleWithSessionProtected />
    </>
  );
}

/* 
Usage Examples in Real Components:

1. For individual button/action protection:
   const executeWithSessionCheck = useProtectedAction();
   const handlePress = () => executeWithSessionCheck(() => doSomething());

2. For utility-based protection:
   const handlePress = withSessionCheck(() => doSomething());

3. For component-level protection:
   export default withSessionProtection(MyComponent);

4. For screen-level protection:
   <SessionProtected>
     <MyScreen />
   </SessionProtected>

5. For global protection (already implemented in _layout.jsx):
   <GlobalSessionInterceptor> checks every 30 seconds

Choose the approach that best fits your use case:
- Use hooks for React components
- Use utilities for simple functions
- Use HOC/wrapper for entire components
- Use global interceptor for app-wide protection
*/