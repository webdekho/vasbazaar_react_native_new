<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * API Response Library
 * 
 * Standardized API response builder for vasbazaar application
 * Provides consistent response format similar to Spring Boot ApiResponse
 */
class Api_response {
    
    protected $CI;
    
    public function __construct()
    {
        $this->CI =& get_instance();
    }
    
    /**
     * Build standardized API response
     * 
     * @param mixed $data Response data
     * @param string $status Response status (SUCCESS/FAILURE)
     * @param int $status_code HTTP status code
     * @param string $message Response message
     * @return array
     */
    public function build($data = null, $status = 'SUCCESS', $status_code = 200, $message = '')
    {
        $response = array(
            'Status' => $status,
            'StatusCode' => $status_code,
            'message' => $message,
            'data' => $data
        );
        
        return $response;
    }
    
    /**
     * Send JSON response with proper HTTP status code
     * 
     * @param mixed $data Response data
     * @param string $status Response status (SUCCESS/FAILURE)  
     * @param int $status_code HTTP status code
     * @param string $message Response message
     */
    public function send($data = null, $status = 'SUCCESS', $status_code = 200, $message = '')
    {
        $this->CI->output
            ->set_status_header($status_code)
            ->set_content_type('application/json', 'utf-8')
            ->set_output(json_encode($this->build($data, $status, $status_code, $message)));
    }
    
    /**
     * Send success response
     * 
     * @param mixed $data Response data
     * @param string $message Success message
     * @param int $status_code HTTP status code (default: 200)
     */
    public function success($data = null, $message = 'Success', $status_code = 200)
    {
        $this->send($data, 'SUCCESS', $status_code, $message);
    }
    
    /**
     * Send error response
     * 
     * @param string $message Error message
     * @param int $status_code HTTP status code (default: 400)
     * @param mixed $data Optional error data
     */
    public function error($message = 'Error', $status_code = 400, $data = null)
    {
        $this->send($data, 'FAILURE', $status_code, $message);
    }
    
    /**
     * Send internal server error response
     * 
     * @param string $message Error message
     * @param mixed $data Optional error data
     */
    public function internal_error($message = 'Internal server error', $data = null)
    {
        $this->send($data, 'FAILURE', 500, $message);
    }
    
    /**
     * Send unauthorized response
     * 
     * @param string $message Error message
     */
    public function unauthorized($message = 'Unauthorized')
    {
        $this->send(null, 'FAILURE', 401, $message);
    }
    
    /**
     * Send not found response
     * 
     * @param string $message Error message
     */
    public function not_found($message = 'Not found')
    {
        $this->send(null, 'FAILURE', 404, $message);
    }
}