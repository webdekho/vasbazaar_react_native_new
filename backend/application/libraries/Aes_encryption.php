<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * AES Encryption Library
 * 
 * Provides AES-256 encryption/decryption functionality
 * Compatible with Spring Boot AES256Util
 */
class Aes_encryption {
    
    private $cipher = 'AES-256-CBC';
    private $key;
    private $iv_length;
    
    public function __construct($params = array())
    {
        // Use a default key or load from config
        $this->key = isset($params['key']) ? $params['key'] : 'vasbazaarSecretKey123456789012345'; // 32 chars for AES-256
        $this->iv_length = openssl_cipher_iv_length($this->cipher);
    }
    
    /**
     * Encrypt data using AES-256-CBC
     * 
     * @param string $data Data to encrypt
     * @return string|false Encrypted data (base64 encoded) or false on failure
     */
    public function encrypt($data)
    {
        try {
            $iv = openssl_random_pseudo_bytes($this->iv_length);
            $encrypted = openssl_encrypt($data, $this->cipher, $this->key, OPENSSL_RAW_DATA, $iv);
            
            if ($encrypted === false) {
                return false;
            }
            
            // Combine IV and encrypted data, then base64 encode
            return base64_encode($iv . $encrypted);
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Decrypt data using AES-256-CBC
     * 
     * @param string $encrypted_data Encrypted data (base64 encoded)
     * @return string|false Decrypted data or false on failure
     */
    public function decrypt($encrypted_data)
    {
        try {
            $data = base64_decode($encrypted_data);
            
            if ($data === false || strlen($data) < $this->iv_length) {
                return false;
            }
            
            $iv = substr($data, 0, $this->iv_length);
            $encrypted = substr($data, $this->iv_length);
            
            $decrypted = openssl_decrypt($encrypted, $this->cipher, $this->key, OPENSSL_RAW_DATA, $iv);
            
            return $decrypted;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Generate a secure random key
     * 
     * @param int $length Key length (default: 32 for AES-256)
     * @return string
     */
    public function generate_key($length = 32)
    {
        return bin2hex(random_bytes($length / 2));
    }
    
    /**
     * Set encryption key
     * 
     * @param string $key Encryption key
     */
    public function set_key($key)
    {
        $this->key = $key;
    }
}