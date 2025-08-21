import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

export const clearSessionOnStart = async () => {
  const authContext = useContext(AuthContext);
  const { ClearSessionToken } = authContext;
  try {
    await ClearSessionToken();
    console.log('Session token cleared');
  } catch (e) {
    console.log('Error clearing session:', e);
  }
};