import { getRequest } from '../api/baseApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Current app version - Update this when releasing new versions
export const CURRENT_APP_VERSION = '1.0.0';

/**
 * Version check service for PWA
 * Checks for app updates every 5 minutes
 */
class VersionService {
  constructor() {
    this.intervalId = null;
    this.isChecking = false;
    this.listeners = new Set();
  }

  /**
   * Start version checking with 5-minute intervals
   */
  startVersionCheck() {
    console.log('🔄 Starting version check service...');
    
    // Initial check
    this.checkVersion();
    
    // Check every 5 minutes (300,000 milliseconds)
    this.intervalId = setInterval(() => {
      this.checkVersion();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop version checking
   */
  stopVersionCheck() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Version check service stopped');
    }
  }

  /**
   * Check version from API
   */
  async checkVersion() {
    if (this.isChecking) {
      console.log('⏳ Version check already in progress, skipping...');
      return;
    }

    this.isChecking = true;

    try {
      console.log('🔍 Checking app version...');
      
      // Call the version API
      const response = await getRequest('api/dashboard/version');
      
      console.log('📦 Version API Response:', response);
      
      if (response?.Status === 'SUCCESS' || response?.status === 'success') {
        const versionData = response.data || response;
        const latestVersion = versionData.latestVersion || versionData.version || versionData.app_version;
        const forceUpdate = versionData.forceUpdate === 'true' || versionData.forceUpdate === true;
        
        if (!latestVersion) {
          console.log('❌ No version found in API response');
          return;
        }
        
        console.log('📱 Version check result:', {
          current: CURRENT_APP_VERSION,
          latest: latestVersion,
          forceUpdate
        });

        // Store version info
        await AsyncStorage.setItem('app_version_info', JSON.stringify({
          latestVersion,
          forceUpdate,
          lastChecked: new Date().toISOString(),
          currentVersion: CURRENT_APP_VERSION
        }));

        // Compare versions
        const versionComparison = this.compareVersions(CURRENT_APP_VERSION, latestVersion);
        console.log(`🔍 Version comparison: ${CURRENT_APP_VERSION} vs ${latestVersion} = ${versionComparison}`);
        
        if (versionComparison < 0) {
          // Current version is older
          console.log('🆕 New version available:', latestVersion);
          console.log('🔔 Notifying', this.listeners.size, 'listeners');
          this.notifyListeners({
            hasUpdate: true,
            latestVersion,
            currentVersion: CURRENT_APP_VERSION,
            forceUpdate
          });
        } else {
          console.log('✅ App is up to date');
          this.notifyListeners({
            hasUpdate: false,
            latestVersion,
            currentVersion: CURRENT_APP_VERSION,
            forceUpdate: false
          });
        }

      } else {
        console.log('❌ Version check failed:', response?.message);
      }

    } catch (error) {
      console.error('💥 Version check error:', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Compare two version strings
   * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    const maxLength = Math.max(parts1.length, parts2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    
    return 0;
  }

  /**
   * Add version update listener
   */
  addVersionListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners about version updates
   */
  notifyListeners(versionInfo) {
    this.listeners.forEach(listener => {
      try {
        listener(versionInfo);
      } catch (error) {
        console.error('Error in version listener:', error);
      }
    });
  }

  /**
   * Get cached version info
   */
  async getCachedVersionInfo() {
    try {
      const cached = await AsyncStorage.getItem('app_version_info');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached version info:', error);
      return null;
    }
  }

  /**
   * Manual version check (for user-triggered checks)
   */
  async manualVersionCheck() {
    console.log('👆 Manual version check triggered');
    await this.checkVersion();
  }
}

// Create singleton instance
const versionService = new VersionService();

export default versionService;

// Export individual functions for convenience
export const startVersionCheck = () => versionService.startVersionCheck();
export const stopVersionCheck = () => versionService.stopVersionCheck();
export const checkVersion = () => versionService.checkVersion();
export const addVersionListener = (listener) => versionService.addVersionListener(listener);
export const getCachedVersionInfo = () => versionService.getCachedVersionInfo();
export const manualVersionCheck = () => versionService.manualVersionCheck();