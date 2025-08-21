import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// import { BASE_URL } from './Base_Url';

const VERSION_CHECK_KEY = 'last_version_check';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BASE_URL = 'https://vasbazaar.web.webdekho.in';

class VersionService {
  constructor() {
    this.currentVersion = '1.0.0'; // This should match package.json version
    this.isChecking = false;
    this.updateCallbacks = [];
  }

  // Get current app version
  getCurrentVersion() {
    return this.currentVersion;
  }

  // Add callback for version updates
  onUpdateAvailable(callback) {
    this.updateCallbacks.push(callback);
  }

  // Remove callback
  removeUpdateCallback(callback) {
    this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
  }

  // Notify all callbacks about available update
  notifyUpdateAvailable(latestVersion, updateInfo) {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(latestVersion, updateInfo);
      } catch (error) {
        console.error('Version update callback error:', error);
      }
    });
  }

  // Check if we should check for updates (rate limiting)
  async shouldCheckVersion() {
    const lastCheck = await AsyncStorage.getItem(VERSION_CHECK_KEY);
    const now = Date.now();
    
    if (!lastCheck) {
      return true;
    }
    
    const timeDiff = now - parseInt(lastCheck, 10);
    return timeDiff >= CHECK_INTERVAL;
  }

  // Mark version check as completed
  async markVersionChecked() {
    await AsyncStorage.setItem(VERSION_CHECK_KEY, Date.now().toString());
  }

  // Compare version strings (semantic versioning)
  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }
    
    return 0;
  }

  // Check if update is required
  isUpdateRequired(currentVersion, latestVersion, minimumVersion) {
    // If there's a minimum version requirement, check against it
    if (minimumVersion) {
      return this.compareVersions(currentVersion, minimumVersion) < 0;
    }
    
    // Otherwise, check if latest version is newer
    return this.compareVersions(currentVersion, latestVersion) < 0;
  }

  // Get latest version from API
  async getLatestVersion() {
    try {
      const response = await fetch(BASE_URL + '/version.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Version API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch latest version:', error);
      
      // Fallback: Try to get version from a static JSON file
      try {
        const fallbackResponse = await fetch('/version.json?' + Date.now(), {
          cache: 'no-cache',
        });
        
        if (fallbackResponse.ok) {
          return await fallbackResponse.json();
        }
      } catch (fallbackError) {
        console.error('Fallback version check failed:', fallbackError);
      }
      
      throw error;
    }
  }

  // Main version check function
  async checkForUpdates(force = false) {
    // Prevent multiple simultaneous checks
    if (this.isChecking && !force) {
      return null;
    }

    // Check rate limiting unless forced
    if (!force && !(await this.shouldCheckVersion())) {
      return null;
    }

    this.isChecking = true;

    try {
      const versionInfo = await this.getLatestVersion();
      const { 
        latestVersion, 
        minimumVersion, 
        forceUpdate = false,
        updateMessage,
        downloadUrl 
      } = versionInfo;

      const currentVersion = this.getCurrentVersion();
      
      // Check if update is required
      const updateRequired = forceUpdate || 
        this.isUpdateRequired(currentVersion, latestVersion, minimumVersion);

      if (updateRequired) {
        const updateInfo = {
          currentVersion,
          latestVersion,
          minimumVersion,
          forceUpdate,
          updateMessage: updateMessage || 'A new version is available. Please update to continue using the app.',
          downloadUrl: downloadUrl || window.location.origin,
          isRequired: forceUpdate || (minimumVersion && 
            this.compareVersions(currentVersion, minimumVersion) < 0)
        };

        // Notify callbacks
        this.notifyUpdateAvailable(latestVersion, updateInfo);
        
        await this.markVersionChecked();
        return updateInfo;
      }

      await this.markVersionChecked();
      return null;

    } catch (error) {
      console.error('Version check failed:', error);
      return null;
    } finally {
      this.isChecking = false;
    }
  }

  // Start periodic version checking
  startPeriodicCheck() {
    // Initial check
    this.checkForUpdates();
    
    // Set up interval for periodic checks
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, CHECK_INTERVAL);
  }

  // Stop periodic version checking
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Force reload the app (for PWA)
  forceReload() {
    if (Platform.OS === 'web') {
      // Clear cache and reload
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      
      // Unregister service worker and reload
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister();
          });
          window.location.reload(true);
        });
      } else {
        window.location.reload(true);
      }
    }
  }
}

// Export singleton instance
export default new VersionService();