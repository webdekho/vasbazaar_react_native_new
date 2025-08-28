import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

const SimpleImageCropper = ({ src, onCropComplete, onCancel, visible }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, size: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ size: 0, mouseX: 0, mouseY: 0 });

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size to match display size
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image to fit canvas while maintaining aspect ratio
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imageAspect > canvasAspect) {
      drawHeight = canvas.height;
      drawWidth = drawHeight * imageAspect;
      drawX = (canvas.width - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = canvas.width;
      drawHeight = drawWidth / imageAspect;
      drawX = 0;
      drawY = (canvas.height - drawHeight) / 2;
    }
    
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    
    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear crop area (circular)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cropArea.x + cropArea.size/2, cropArea.y + cropArea.size/2, cropArea.size/2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw crop border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cropArea.x + cropArea.size/2, cropArea.y + cropArea.size/2, cropArea.size/2, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw resize handles
    const handleSize = 16;
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    
    // Corner handles for resizing
    const corners = [
      { x: cropArea.x - handleSize/2, y: cropArea.y - handleSize/2 },
      { x: cropArea.x + cropArea.size - handleSize/2, y: cropArea.y - handleSize/2 },
      { x: cropArea.x - handleSize/2, y: cropArea.y + cropArea.size - handleSize/2 },
      { x: cropArea.x + cropArea.size - handleSize/2, y: cropArea.y + cropArea.size - handleSize/2 }
    ];
    
    corners.forEach(corner => {
      ctx.fillRect(corner.x, corner.y, handleSize, handleSize);
      ctx.strokeRect(corner.x, corner.y, handleSize, handleSize);
    });
    
    // Center handle for dragging (different color)
    ctx.fillStyle = '#22c55e';
    const centerHandleSize = 20;
    ctx.beginPath();
    ctx.arc(cropArea.x + cropArea.size/2, cropArea.y + cropArea.size/2, centerHandleSize/2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }, [imageLoaded, cropArea]);

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [imageLoaded, cropArea, drawCanvas]);

  const getHandleAt = useCallback((x, y) => {
    const handleSize = 16;
    const centerHandleSize = 20;
    
    // Check corner handles (for resizing)
    const corners = [
      { x: cropArea.x - handleSize/2, y: cropArea.y - handleSize/2, type: 'resize-tl' },
      { x: cropArea.x + cropArea.size - handleSize/2, y: cropArea.y - handleSize/2, type: 'resize-tr' },
      { x: cropArea.x - handleSize/2, y: cropArea.y + cropArea.size - handleSize/2, type: 'resize-bl' },
      { x: cropArea.x + cropArea.size - handleSize/2, y: cropArea.y + cropArea.size - handleSize/2, type: 'resize-br' }
    ];
    
    for (const corner of corners) {
      if (x >= corner.x && x <= corner.x + handleSize && 
          y >= corner.y && y <= corner.y + handleSize) {
        return corner.type;
      }
    }
    
    // Check center handle (for dragging)
    const centerX = cropArea.x + cropArea.size / 2;
    const centerY = cropArea.y + cropArea.size / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    if (distance <= centerHandleSize / 2) {
      return 'drag';
    }
    
    // Check if inside crop area (for dragging)
    const cropCenterDistance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (cropCenterDistance <= cropArea.size / 2) {
      return 'drag';
    }
    
    return null;
  }, [cropArea]);

  const handlePointerUp = useCallback(() => {
    console.log('Pointer up - stopping drag/resize');
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const getEventCoordinates = (e) => {
    // Handle both mouse and touch events
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return { clientX, clientY };
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging && !isResizing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const { clientX, clientY } = getEventCoordinates(e);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (isDragging) {
      const newX = Math.max(0, Math.min(rect.width - cropArea.size, x - dragStart.x));
      const newY = Math.max(0, Math.min(rect.height - cropArea.size, y - dragStart.y));
      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing) {
      const deltaX = x - resizeStart.mouseX;
      const deltaY = y - resizeStart.mouseY;
      
      // Use the maximum delta to maintain square aspect ratio
      const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX + deltaY > 0 ? 1 : -1);
      
      let newSize = Math.max(50, resizeStart.size + delta * 2); // Minimum size of 50px
      const maxSize = Math.min(rect.width, rect.height) * 0.8; // Maximum 80% of canvas
      newSize = Math.min(newSize, maxSize);
      
      // Adjust position to keep crop area centered during resize
      const sizeDiff = newSize - cropArea.size;
      let newX = cropArea.x - sizeDiff / 2;
      let newY = cropArea.y - sizeDiff / 2;
      
      // Keep within canvas bounds
      newX = Math.max(0, Math.min(rect.width - newSize, newX));
      newY = Math.max(0, Math.min(rect.height - newSize, newY));
      
      setCropArea({ x: newX, y: newY, size: newSize });
    }
  }, [isDragging, isResizing, cropArea, dragStart, resizeStart]);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const { clientX, clientY } = getEventCoordinates(e);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const handleType = getHandleAt(x, y);
    console.log('Mouse down at:', x, y, 'Handle type:', handleType);
    
    if (handleType === 'drag') {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
      console.log('Started dragging');
    } else if (handleType && handleType.startsWith('resize')) {
      setIsResizing(true);
      setResizeStart({ 
        size: cropArea.size, 
        mouseX: x, 
        mouseY: y,
        cropX: cropArea.x,
        cropY: cropArea.y,
        handle: handleType
      });
      console.log('Started resizing');
    }
  }, [cropArea, getHandleAt]);

  // Add global pointer event listeners for better drag/resize experience (supports both mouse and touch)
  useEffect(() => {
    const handleGlobalPointerMove = (e) => {
      e.preventDefault();
      handlePointerMove(e);
    };
    
    const handleGlobalPointerUp = (e) => {
      e.preventDefault();
      handlePointerUp();
    };

    if (isDragging || isResizing) {
      // Add both mouse and touch event listeners for cross-platform support
      document.addEventListener('mousemove', handleGlobalPointerMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalPointerUp);
      document.addEventListener('touchmove', handleGlobalPointerMove, { passive: false });
      document.addEventListener('touchend', handleGlobalPointerUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
      document.body.style.touchAction = 'none'; // Prevent scrolling on touch devices
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalPointerMove);
      document.removeEventListener('mouseup', handleGlobalPointerUp);
      document.removeEventListener('touchmove', handleGlobalPointerMove);
      document.removeEventListener('touchend', handleGlobalPointerUp);
      document.body.style.userSelect = ''; // Restore text selection
      document.body.style.touchAction = ''; // Restore touch actions
    };
  }, [isDragging, isResizing, handlePointerMove, handlePointerUp]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height) * 0.6;
      setCropArea({
        x: (rect.width - size) / 2,
        y: (rect.height - size) / 2,
        size: size
      });
    }
  };

  // Detect if we're on iOS
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  // Alternative crop method for iOS that might have canvas touch issues
  const handleQuickCrop = async (position = 'center') => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !imageLoaded) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y, size;
    
    // Set crop area based on position
    size = Math.min(rect.width, rect.height) * 0.7;
    
    switch (position) {
      case 'center':
        x = (rect.width - size) / 2;
        y = (rect.height - size) / 2;
        break;
      case 'top':
        x = (rect.width - size) / 2;
        y = rect.height * 0.1;
        break;
      case 'bottom':
        x = (rect.width - size) / 2;
        y = rect.height - size - rect.height * 0.1;
        break;
      default:
        x = (rect.width - size) / 2;
        y = (rect.height - size) / 2;
    }
    
    setCropArea({ x, y, size });
    
    // Auto-crop after a short delay to allow visual feedback
    setTimeout(() => {
      handleCrop();
    }, 500);
  };


  const handleCrop = async () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !imageLoaded) return;
    
    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    
    const size = 300; // Output size
    cropCanvas.width = size;
    cropCanvas.height = size;
    
    // Calculate source coordinates on the original image
    const rect = canvas.getBoundingClientRect();
    const scaleX = image.naturalWidth / rect.width;
    const scaleY = image.naturalHeight / rect.height;
    
    const sourceX = cropArea.x * scaleX;
    const sourceY = cropArea.y * scaleY;
    const sourceSize = cropArea.size * Math.min(scaleX, scaleY);
    
    // Draw cropped image
    cropCtx.drawImage(
      image,
      sourceX, sourceY, sourceSize, sourceSize,
      0, 0, size, size
    );
    
    // Convert to base64
    const base64Image = cropCanvas.toDataURL('image/jpeg', 0.9);
    
    // Also create blob for upload if needed
    cropCanvas.toBlob((blob) => {
      if (blob && onCropComplete) {
        onCropComplete(base64Image, blob);
      }
    }, 'image/jpeg', 0.9);
  };

  // Return null if not on web or not visible
  if (Platform.OS !== 'web' || !visible) {
    return null;
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Crop Profile Photo</h3>
          <button style={styles.closeButton} onClick={onCancel}>×</button>
        </div>
        
        <div style={styles.cropContainer}>
          <img
            ref={imageRef}
            src={src}
            style={{ display: 'none' }}
            onLoad={handleImageLoad}
          />
          <canvas
            ref={canvasRef}
            style={styles.canvas}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            onContextMenu={(e) => e.preventDefault()}
          />
          <p style={styles.instruction}>
            {isIOS() ? 'Adjust crop area with buttons below' : 'Drag the green circle to move • Drag blue corners to resize'}
          </p>
          
          {/* iOS-friendly quick crop buttons */}
          {isIOS() && (
            <div style={styles.quickCropContainer}>
              <p style={styles.quickCropLabel}>Quick crop positions:</p>
              <div style={styles.quickCropButtons}>
                <button style={styles.quickCropButton} onClick={() => handleQuickCrop('top')}>
                  Top
                </button>
                <button style={styles.quickCropButton} onClick={() => handleQuickCrop('center')}>
                  Center
                </button>
                <button style={styles.quickCropButton} onClick={() => handleQuickCrop('bottom')}>
                  Bottom
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div style={styles.buttonContainer}>
          <button style={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button 
            style={styles.cropButton} 
            onClick={handleCrop}
            disabled={!imageLoaded}
          >
            Crop & Use
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '500px',
    maxHeight: '90vh',
    width: '90%',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropContainer: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  canvas: {
    width: '100%',
    maxWidth: '400px',
    height: '300px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'crosshair',
    userSelect: 'none',
    touchAction: 'none', // Prevent default touch actions like scrolling
    WebkitTouchCallout: 'none', // Prevent iOS touch callout
    WebkitUserSelect: 'none', // Prevent iOS text selection
  },
  instruction: {
    margin: '10px 0',
    fontSize: '14px',
    color: '#666',
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
  },
  cropButton: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
  },
  quickCropContainer: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  quickCropLabel: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  quickCropButtons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  quickCropButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    color: '#333',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
};

export default SimpleImageCropper;