import { getRequest } from '../api/baseApi';

/**
 * Get customer notifications/announcements with pagination
 * @param {number} pageNumber - Page number (default 0)
 * @param {number} pageSize - Number of records per page (optional)
 * @param {string} sessionToken - User's session token (used as access_token in header)
 * @returns {Promise} API response with notifications data
 */
export const getNotifications = async (pageNumber = 0, pageSize = 10, sessionToken) => {
  try {
    const endpoint = `api/customer/announcement/notification?pageNumber=${pageNumber}`;
    console.log('Fetching notifications:', { endpoint, pageNumber, hasToken: !!sessionToken });
    
    const response = await getRequest(endpoint, {}, sessionToken);
    
    console.log('Notifications API raw response:', response);
    console.log('Response Status check:', response?.Status);
    console.log('Response data check:', !!response?.data);
    
    // Check for response success - baseApi transforms Status to status
    if (response?.status === 'success' && response?.data) {
      console.log('SUCCESS - Data structure:', response.data);
      console.log('Records available:', response.data?.records?.length || 0);
      
      if (!response.data.records || !Array.isArray(response.data.records)) {
        console.error('Invalid data structure - no records array');
        return {
          status: 'error',
          data: [],
          message: 'Invalid response structure'
        };
      }
      
      // Transform API data to match component expectations
      const transformedNotifications = response.data.records.map(notification => ({
        id: notification.id,
        title: notification.title || 'Announcement',
        message: notification.message,
        date: formatNotificationDate(notification.schedule || notification.createdDate),
        time: formatNotificationTime(notification.schedule),
        status: notification.status,
        type: notification.userType || 'general',
        cnf: notification.cnfId ? {
          id: notification.cnfId.id,
          name: notification.cnfId.name,
          bonus: notification.cnfId.bonus
        } : null,
        originalData: notification
      }));
      
      return {
        status: 'success',
        data: transformedNotifications,
        pagination: {
          totalRecords: response.data.totalRecords,
          pageSize: response.data.pageSize,
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages
        },
        message: response.message
      };
    }
    
    return {
      status: 'error', 
      data: [],
      pagination: null,
      message: response?.message || 'Failed to fetch notifications'
    };
    
  } catch (error) {
    console.error('Notifications API error:', error);
    return {
      status: 'error',
      data: [],
      pagination: null,
      message: 'Network error while fetching notifications'
    };
  }
};

/**
 * Helper function to format notification date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatNotificationDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    // Calculate difference in milliseconds
    const diffTime = today - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    // Check if it's in the future
    if (diffTime < 0) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Less than 1 minute ago
    if (diffMinutes < 1) {
      return 'Just now';
    }
    
    // Less than 1 hour ago
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than 24 hours ago
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    
    // 1 day ago
    if (diffDays === 1) {
      return '1 day ago';
    }
    
    // 2-6 days ago
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    
    // 1 week ago
    if (diffDays < 14) {
      return '1 week ago';
    }
    
    // Multiple weeks ago (less than a month)
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    
    // More than a month - show actual date
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
    
  } catch (error) {
    console.error('Error formatting notification date:', error);
    return dateString;
  }
};

/**
 * Helper function to format notification time
 * @param {string} dateTimeString - ISO datetime string
 * @returns {string} Formatted time
 */
const formatNotificationTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  try {
    const date = new Date(dateTimeString);
    // Format as "2:17 PM"
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString('en-US', options);
  } catch (error) {
    console.error('Error formatting notification time:', error);
    return '';
  }
};

/**
 * Get notifications for a specific page (alias for getNotifications)
 * @param {number} pageNumber - Page number
 * @param {string} sessionToken - User's session token
 * @returns {Promise} API response with notifications data
 */
export const getNotificationsByPage = async (pageNumber, sessionToken) => {
  return await getNotifications(pageNumber, 10, sessionToken);
};