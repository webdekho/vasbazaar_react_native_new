import { postRequest, getRequest, uploadMultipartApi } from '../api/baseApi';
import { Platform } from 'react-native';

// Simple user functions

export const getUserProfile = async (sessionToken) => {
  return await getRequest('user/profile', {}, sessionToken);
};

export const updateUserProfile = async (profileData, sessionToken) => {
  return await postRequest('user/update-profile', profileData, sessionToken);
};

export const getUserBalance = async (sessionToken) => {
  try {
    const endpoint = 'api/customer/user/getByUserId';
    console.log('Fetching user balance:', { endpoint, hasToken: !!sessionToken });
    
    const response = await getRequest(endpoint, {}, sessionToken);
    
    console.log('User balance API response:', response);
    
    if (response?.status === 'success' && response?.data) {
      // Extract and format balance data
      const { balance, cashback, incentive, referralBonus } = response.data;
      
      const formattedData = {
        balance: balance != null && !isNaN(balance) ? parseFloat(balance).toFixed(2) : '0.00',
        cashback: cashback != null && !isNaN(cashback) ? parseFloat(cashback).toFixed(2) : '0.00',
        incentive: incentive != null && !isNaN(incentive) ? parseFloat(incentive).toFixed(2) : '0.00',
        referralBonus: referralBonus != null && !isNaN(referralBonus) ? parseFloat(referralBonus).toFixed(2) : '0.00'
      };
      
      return {
        status: 'success',
        data: formattedData,
        originalData: response.data,
        message: response.message
      };
    }
    
    return {
      status: 'error',
      data: {
        balance: '0.00',
        cashback: '0.00',
        incentive: '0.00',
        referralBonus: '0.00'
      },
      message: response?.message || 'Failed to fetch user balance'
    };
    
  } catch (error) {
    console.error('User balance API error:', error);
    return {
      status: 'error',
      data: {
        balance: '0.00',
        cashback: '0.00',
        incentive: '0.00',
        referralBonus: '0.00'
      },
      message: 'Network error while fetching user balance'
    };
  }
};


export const getReferredUsers = async (sessionToken, pageNumber = 0, pageSize = 10) => {
  const params = {
    pageNumber,
    pageSize,
    isactive: 1
  };
  return await getRequest('api/customer/user/getReffered_user', params, sessionToken);
};

// Helper function to fix image orientation
const fixImageOrientation = (imageUri) => {
  return new Promise((resolve, reject) => {
    if (!imageUri.startsWith('data:')) {
      // If not a data URI, return as is
      resolve(imageUri);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Clear canvas and draw image with proper orientation
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      // Always draw image right-side up
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(0); // No rotation - keep original orientation
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      ctx.restore();

      // Convert back to data URI
      const correctedDataUri = canvas.toDataURL('image/jpeg', 0.9);
      resolve(correctedDataUri);
    };

    img.onerror = () => {
      console.error('Failed to load image for orientation correction');
      resolve(imageUri); // Return original if correction fails
    };

    img.src = imageUri;
  });
};

export const updateProfilePhoto = async (imageUri, sessionToken) => {
  try {
    console.log('updateProfilePhoto service called');
    console.log('Image URI:', imageUri);
    console.log('Has token:', !!sessionToken);
    
    // Fix image orientation if it's a data URI (web/cropped images)
    let correctedImageUri = imageUri;
    if (Platform.OS === 'web' && imageUri.startsWith('data:')) {
      console.log('Applying orientation correction...');
      correctedImageUri = await fixImageOrientation(imageUri);
    }
    
    // Create form data
    const formData = new FormData();
    
    // Generate clean filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const originalFilename = correctedImageUri.split('/').pop() || '';
    const extension = originalFilename.includes('.') ? originalFilename.split('.').pop() : 'jpg';
    const cleanFilename = `profile_${timestamp}_${randomId}.${extension}`;
    
    // Determine MIME type
    let mimeType = 'image/jpeg';
    const ext = extension.toLowerCase();
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'gif') mimeType = 'image/gif';
    else if (ext === 'webp') mimeType = 'image/webp';
    
    // Check if the image is base64 (common on web or when base64 is enabled)
    if (correctedImageUri.startsWith('data:') || correctedImageUri.startsWith('blob:')) {
      console.log('Detected data URI or blob, processing for web...');
      
      if (correctedImageUri.startsWith('data:')) {
        // Extract base64 data and mime type
        const [header, base64Data] = correctedImageUri.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        const detectedMimeType = mimeMatch ? mimeMatch[1] : mimeType;
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: detectedMimeType });
        
        // Create a File object from the blob (for better compatibility)
        const file = new File([blob], cleanFilename, { 
          type: detectedMimeType,
          lastModified: Date.now()
        });
        
        // Append the file to FormData
        formData.append('photo', file, cleanFilename);
        
        console.log('FormData created with photo (data URI):', {
          filename: cleanFilename,
          type: detectedMimeType,
          size: file.size
        });
      } else {
        // Handle blob URLs (common in browsers)
        try {
          const response = await fetch(correctedImageUri);
          const blob = await response.blob();
          const file = new File([blob], cleanFilename, { 
            type: blob.type || mimeType,
            lastModified: Date.now()
          });
          formData.append('photo', file, cleanFilename);
          
          console.log('FormData created with photo (blob URL):', {
            filename: cleanFilename,
            type: file.type,
            size: file.size
          });
        } catch (blobError) {
          console.error('Error processing blob URL:', blobError);
          throw new Error('Failed to process image file');
        }
      }
      
    } else {
      // Handle file URIs (mobile platforms)
      let fileUri = correctedImageUri;
      if (Platform.OS === 'android' && !correctedImageUri.startsWith('file://')) {
        fileUri = `file://${correctedImageUri}`;
      } else if (Platform.OS === 'ios' && correctedImageUri.startsWith('/')) {
        fileUri = `file://${correctedImageUri}`;
      }
      
      // Append photo to FormData with 'photo' as field name
      formData.append('photo', {
        uri: fileUri,
        name: cleanFilename,
        type: mimeType,
      });
      
      console.log('FormData created with photo:', {
        uri: fileUri,
        name: cleanFilename,
        type: mimeType
      });
    }
    
    // Call the upload API
    console.log('About to call uploadMultipartApi...');
    const response = await uploadMultipartApi('api/customer/user/updateProfile', formData, sessionToken);
    console.log('API call completed, response:', response);
    
    // Handle various response formats
    const isSuccess = response?.success || 
                     response?.Status === 'SUCCESS' || 
                     response?.status === 'SUCCESS' ||
                     response?.data?.Status === 'SUCCESS';
    
    if (isSuccess) {
      // Extract photo URL from various possible response formats
      let photoUrl = null;
      const responseData = response?.data || response;
      
      if (responseData?.profile_photo) {
        photoUrl = responseData.profile_photo;
      } else if (responseData?.photo_url) {
        photoUrl = responseData.photo_url;
      } else if (responseData?.data?.profile_photo) {
        photoUrl = responseData.data.profile_photo;
      } else if (responseData?.user?.profile_photo) {
        photoUrl = responseData.user.profile_photo;
      }
      
      return {
        status: 'success',
        message: response?.message || response?.success || 'Profile photo updated successfully',
        photoUrl: photoUrl,
        response: response
      };
    }
    
    return {
      status: 'failure',
      message: response?.message || response?.fail || 'Failed to update profile photo',
      response: response
    };
  } catch (error) {
    console.error('Profile photo upload error:', error);
    
    // Better error message based on error type
    let errorMessage = 'Failed to upload profile photo';
    if (error.message?.includes('Network')) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.response?.status === 413) {
      errorMessage = 'Image file is too large';
    } else if (error.response?.status === 415) {
      errorMessage = 'Unsupported image format';
    }
    
    return {
      status: 'error',
      message: errorMessage,
      error: error
    };
  }
};