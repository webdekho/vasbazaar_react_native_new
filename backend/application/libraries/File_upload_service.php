<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * File Upload Service Library
 * 
 * Handles file upload functionality
 * Equivalent to Spring Boot File_uploading utility
 */
class File_upload_service {
    
    protected $CI;
    protected $upload_path = './uploads/';
    protected $allowed_types = 'gif|jpg|jpeg|png|pdf|doc|docx';
    protected $max_size = 5120; // 5MB in KB
    
    public function __construct($config = array())
    {
        $this->CI =& get_instance();
        $this->CI->load->library('upload');
        
        // Override default config if provided
        if (!empty($config)) {
            foreach ($config as $key => $value) {
                if (property_exists($this, $key)) {
                    $this->$key = $value;
                }
            }
        }
        
        // Ensure upload directory exists
        if (!is_dir($this->upload_path)) {
            mkdir($this->upload_path, 0755, true);
        }
    }
    
    /**
     * Upload single file
     * 
     * @param string $field_name Form field name
     * @param string $sub_folder Subfolder within upload path (optional)
     * @return array Upload result with file info or error
     */
    public function upload_file($field_name, $sub_folder = '')
    {
        try {
            $upload_path = $this->upload_path;
            
            if (!empty($sub_folder)) {
                $upload_path .= rtrim($sub_folder, '/') . '/';
                
                // Create subfolder if it doesn't exist
                if (!is_dir($upload_path)) {
                    mkdir($upload_path, 0755, true);
                }
            }
            
            // Generate unique filename
            $original_name = $_FILES[$field_name]['name'] ?? '';
            $file_ext = pathinfo($original_name, PATHINFO_EXTENSION);
            $new_filename = uniqid() . '_' . date('YmdHis') . '.' . $file_ext;
            
            $config = array(
                'upload_path' => $upload_path,
                'allowed_types' => $this->allowed_types,
                'max_size' => $this->max_size,
                'file_name' => $new_filename,
                'encrypt_name' => false
            );
            
            $this->CI->upload->initialize($config);
            
            if ($this->CI->upload->do_upload($field_name)) {
                $upload_data = $this->CI->upload->data();
                
                return array(
                    'status' => 'success',
                    'file_info' => array(
                        'original_name' => $original_name,
                        'file_name' => $upload_data['file_name'],
                        'file_path' => $upload_data['full_path'],
                        'file_size' => $upload_data['file_size'],
                        'file_type' => $upload_data['file_type'],
                        'file_ext' => $upload_data['file_ext'],
                        'upload_path' => $upload_path,
                        'relative_path' => str_replace('./', '', $upload_data['full_path'])
                    )
                );
            } else {
                return array(
                    'status' => 'error',
                    'message' => $this->CI->upload->display_errors('', ''),
                    'file_info' => null
                );
            }
            
        } catch (Exception $e) {
            return array(
                'status' => 'error',
                'message' => 'Upload failed: ' . $e->getMessage(),
                'file_info' => null
            );
        }
    }
    
    /**
     * Upload multiple files
     * 
     * @param string $field_name Form field name
     * @param string $sub_folder Subfolder within upload path (optional)
     * @return array Upload results for all files
     */
    public function upload_multiple_files($field_name, $sub_folder = '')
    {
        $results = array();
        $files_count = count($_FILES[$field_name]['name']);
        
        for ($i = 0; $i < $files_count; $i++) {
            // Create temporary single file array
            $_FILES['temp_file'] = array(
                'name' => $_FILES[$field_name]['name'][$i],
                'type' => $_FILES[$field_name]['type'][$i],
                'tmp_name' => $_FILES[$field_name]['tmp_name'][$i],
                'error' => $_FILES[$field_name]['error'][$i],
                'size' => $_FILES[$field_name]['size'][$i]
            );
            
            $result = $this->upload_file('temp_file', $sub_folder);
            $results[] = $result;
            
            // Clean up temporary file reference
            unset($_FILES['temp_file']);
        }
        
        return $results;
    }
    
    /**
     * Upload image with thumbnail generation
     * 
     * @param string $field_name Form field name
     * @param string $sub_folder Subfolder within upload path (optional)
     * @param array $thumb_config Thumbnail configuration
     * @return array Upload result with thumbnail info
     */
    public function upload_image_with_thumbnail($field_name, $sub_folder = '', $thumb_config = array())
    {
        // Set image-only allowed types
        $this->allowed_types = 'gif|jpg|jpeg|png';
        
        $result = $this->upload_file($field_name, $sub_folder);
        
        if ($result['status'] === 'success') {
            // Generate thumbnail
            $this->CI->load->library('image_lib');
            
            $default_thumb_config = array(
                'width' => 150,
                'height' => 150,
                'quality' => '90%'
            );
            
            $thumb_config = array_merge($default_thumb_config, $thumb_config);
            
            $file_info = $result['file_info'];
            $thumb_filename = 'thumb_' . $file_info['file_name'];
            $thumb_path = $file_info['upload_path'] . $thumb_filename;
            
            $resize_config = array(
                'image_library' => 'gd2',
                'source_image' => $file_info['file_path'],
                'new_image' => $thumb_path,
                'maintain_ratio' => true,
                'width' => $thumb_config['width'],
                'height' => $thumb_config['height'],
                'quality' => $thumb_config['quality']
            );
            
            $this->CI->image_lib->initialize($resize_config);
            
            if ($this->CI->image_lib->resize()) {
                $result['thumbnail_info'] = array(
                    'thumb_name' => $thumb_filename,
                    'thumb_path' => $thumb_path,
                    'thumb_relative_path' => str_replace('./', '', $thumb_path)
                );
            } else {
                $result['thumbnail_error'] = $this->CI->image_lib->display_errors('', '');
            }
            
            $this->CI->image_lib->clear();
        }
        
        return $result;
    }
    
    /**
     * Delete uploaded file
     * 
     * @param string $file_path Full path to file
     * @return bool Success status
     */
    public function delete_file($file_path)
    {
        try {
            if (file_exists($file_path)) {
                return unlink($file_path);
            }
            return true; // File doesn't exist, consider it deleted
            
        } catch (Exception $e) {
            log_message('error', 'File deletion error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get file size in human readable format
     * 
     * @param int $bytes File size in bytes
     * @return string Formatted file size
     */
    public function format_file_size($bytes)
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');
        
        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
    
    /**
     * Validate file type
     * 
     * @param string $filename File name
     * @param array $allowed_extensions Allowed file extensions
     * @return bool Validation result
     */
    public function validate_file_type($filename, $allowed_extensions = null)
    {
        if ($allowed_extensions === null) {
            $allowed_extensions = explode('|', $this->allowed_types);
        }
        
        $file_ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        return in_array($file_ext, $allowed_extensions);
    }
    
    /**
     * Get MIME type from file extension
     * 
     * @param string $filename File name
     * @return string MIME type
     */
    public function get_mime_type($filename)
    {
        $mime_types = array(
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        return $mime_types[$ext] ?? 'application/octet-stream';
    }
}