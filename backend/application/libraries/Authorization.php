<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Authorization Library
 * 
 * Handles user authentication and authorization for VasBazaar application
 * Provides token validation and role-based access control
 */
class Authorization {
    
    protected $CI;
    
    public function __construct()
    {
        $this->CI =& get_instance();
        $this->CI->load->library('aes_encryption');
        $this->CI->load->helper('unix_timestamp');
    }
    
    /**
     * Authorize admin user
     * 
     * @param string $token Encrypted token
     * @throws Exception if validation fails
     */
    public function authorize_admin($token)
    {
        $this->validate_user_type($token, 'admin');
    }
    
    /**
     * Authorize customer user
     * 
     * @param string $token Encrypted token
     * @throws Exception if validation fails
     */
    public function authorize_customer($token)
    {
        $this->validate_user_type($token, 'customer');
    }
    
    /**
     * Authorize support user
     * 
     * @param string $token Encrypted token
     * @throws Exception if validation fails
     */
    public function authorize_support($token)
    {
        $this->validate_user_type($token, 'support');
    }
    
    /**
     * Authorize CNF user
     * 
     * @param string $token Encrypted token
     * @throws Exception if validation fails
     */
    public function authorize_cnf($token)
    {
        $this->validate_user_type($token, 'cnf');
    }
    
    /**
     * Validate user type from token
     * 
     * @param string $token Encrypted token
     * @param string $expected_user_type Expected user type
     * @throws Exception if validation fails
     */
    private function validate_user_type($token, $expected_user_type)
    {
        try {
            // Decrypt the token
            $decrypted_token = $this->CI->aes_encryption->decrypt($token);
            
            if (!$decrypted_token) {
                throw new Exception('Invalid token');
            }
            
            // Parse the decrypted token
            $token_data = json_decode($decrypted_token, true);
            
            if (!$token_data) {
                throw new Exception('Invalid token format');
            }
            
            // Extract user type and timestamp
            $user_type = isset($token_data['userType']) ? $token_data['userType'] : null;
            $timestamp = isset($token_data['timestamp']) ? $token_data['timestamp'] : null;
            
            // Validate user type
            if ($user_type !== $expected_user_type) {
                throw new Exception('Unauthorized access');
            }
            
            // Check token expiration
            if ($timestamp) {
                $current_timestamp = get_current_timestamp();
                if ($current_timestamp > $timestamp) {
                    throw new Exception('Token has expired');
                }
            }
            
        } catch (Exception $e) {
            throw new Exception('Authorization failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Get user info from token
     * 
     * @param string $token Encrypted token
     * @return array User information
     * @throws Exception if token is invalid
     */
    public function get_user_info($token)
    {
        try {
            $decrypted_token = $this->CI->aes_encryption->decrypt($token);
            
            if (!$decrypted_token) {
                throw new Exception('Invalid token');
            }
            
            $token_data = json_decode($decrypted_token, true);
            
            if (!$token_data) {
                throw new Exception('Invalid token format');
            }
            
            return $token_data;
            
        } catch (Exception $e) {
            throw new Exception('Failed to get user info: ' . $e->getMessage());
        }
    }
    
    /**
     * Check if token is valid
     * 
     * @param string $token Encrypted token
     * @return bool
     */
    public function is_valid_token($token)
    {
        try {
            $decrypted_token = $this->CI->aes_encryption->decrypt($token);
            
            if (!$decrypted_token) {
                return false;
            }
            
            $token_data = json_decode($decrypted_token, true);
            
            if (!$token_data) {
                return false;
            }
            
            // Check token expiration
            if (isset($token_data['timestamp'])) {
                $current_timestamp = get_current_timestamp();
                if ($current_timestamp > $token_data['timestamp']) {
                    return false;
                }
            }
            
            return true;
            
        } catch (Exception $e) {
            return false;
        }
    }
}