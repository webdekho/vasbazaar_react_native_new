<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Authentication Controller
 * 
 * Handles authentication-related API endpoints
 * Equivalent to Spring Boot Authentication modules
 */
class AuthController extends CI_Controller {
    
    public function __construct() {
        parent::__construct();
        $this->load->model('User_model');
        $this->load->library('api_response');
        $this->load->library('aes_encryption');
        $this->load->helper('unix_timestamp');
        
        // Set JSON response header
        $this->output->set_content_type('application/json');
    }

    /**
     * User registration
     * POST /api/auth/register
     */
    public function register() {
        try {
            $input = json_decode($this->input->raw_input_stream, true) ?: $_POST;
            
            $name = trim($input['name'] ?? '');
            $mobile = trim($input['mobile'] ?? '');
            $email = trim($input['email'] ?? '');
            $password = $input['password'] ?? '';
            $aadhaar_number = trim($input['aadhaar_number'] ?? '');
            
            // Validation
            if (empty($name) || empty($mobile) || empty($password)) {
                $this->api_response->error('Missing required fields', 400);
                return;
            }
            
            // Check if mobile already exists
            if ($this->User_model->exists_by_mobile($mobile)) {
                $this->api_response->error('Mobile number already registered', 409);
                return;
            }
            
            // Check if email already exists
            if (!empty($email) && $this->User_model->exists_by_email($email)) {
                $this->api_response->error('Email already registered', 409);
                return;
            }
            
            // Create user
            $user_data = array(
                'name' => $name,
                'mobile_number' => $mobile,
                'email' => $email,
                'password' => password_hash($password, PASSWORD_BCRYPT),
                'aadhaar_number' => $aadhaar_number,
                'user_type' => 'customer',
                'status' => 'active',
                'wallet_balance' => 0
            );
            
            $user_id = $this->User_model->create($user_data);
            
            if (!$user_id) {
                $this->api_response->internal_error('Failed to create user');
                return;
            }
            
            // Generate token
            $token_data = array(
                'userId' => $user_id,
                'userType' => 'customer',
                'mobile' => $mobile,
                'timestamp' => add_minutes_to_timestamp(get_current_timestamp(), 600) // 10 hours expiry
            );
            
            $encrypted_token = $this->aes_encryption->encrypt(json_encode($token_data));
            
            $response_data = array(
                'user_id' => $user_id,
                'access_token' => $encrypted_token,
                'user_type' => 'customer'
            );
            
            $this->api_response->success($response_data, 'User registered successfully', 201);
            
        } catch (Exception $e) {
            log_message('error', 'Registration error: ' . $e->getMessage());
            $this->api_response->internal_error('Internal server error');
        }
    }

    /**
     * User login
     * POST /api/auth/login
     */
    public function login() {
        try {
            $input = json_decode($this->input->raw_input_stream, true) ?: $_POST;
            
            $mobile = trim($input['mobile'] ?? '');
            $password = $input['password'] ?? '';
            
            // Validation
            if (empty($mobile) || empty($password)) {
                $this->api_response->error('Mobile and password are required', 400);
                return;
            }
            
            // Find user by mobile
            $user = $this->User_model->get_by_mobile($mobile);
            
            if (!$user) {
                $this->api_response->error('Invalid mobile number or password', 401);
                return;
            }
            
            // Verify password
            if (!password_verify($password, $user['password'])) {
                $this->api_response->error('Invalid mobile number or password', 401);
                return;
            }
            
            // Check user status
            if ($user['status'] !== 'active') {
                $this->api_response->error('User account is inactive', 403);
                return;
            }
            
            // Generate token
            $token_data = array(
                'userId' => (int)$user['id'],
                'userType' => $user['user_type'],
                'mobile' => $user['mobile_number'],
                'timestamp' => add_minutes_to_timestamp(get_current_timestamp(), 600) // 10 hours expiry
            );
            
            $encrypted_token = $this->aes_encryption->encrypt(json_encode($token_data));
            
            $response_data = array(
                'user_id' => (int)$user['id'],
                'access_token' => $encrypted_token,
                'user_type' => $user['user_type'],
                'name' => $user['name'],
                'mobile_number' => $user['mobile_number'],
                'wallet_balance' => floatval($user['wallet_balance'] ?? 0)
            );
            
            $this->api_response->success($response_data, 'Login successful');
            
        } catch (Exception $e) {
            log_message('error', 'Login error: ' . $e->getMessage());
            $this->api_response->internal_error('Internal server error');
        }
    }

    // Mock OTP endpoints (no SMS provider required)
    public function send_otp() {
        $input = json_decode($this->input->raw_input_stream, true) ?: $_POST;
        $mobile = trim($input['mobile'] ?? '');
        if ($mobile === '') return $this->respond_error(400, 'VALIDATION_ERROR', 'Mobile required', array('mobile' => 'Mobile is required'));
        $code = (string)random_int(100000, 999999);
        $expiresAt = date('Y-m-d H:i:s', time() + 5 * 60);
        $this->db->insert('otps', array(
            'mobile' => $mobile,
            'code' => $code,
            'purpose' => 'forgot_password',
            'expiresAt' => $expiresAt
        ));
        return $this->respond_success(array('mockCode' => $code));
    }

    public function verify_otp() {
        $input = json_decode($this->input->raw_input_stream, true) ?: $_POST;
        $mobile = trim($input['mobile'] ?? '');
        $code = trim($input['code'] ?? '');
        if ($mobile === '' || $code === '') return $this->respond_error(400, 'VALIDATION_ERROR', 'Mobile and code required', array(
            'mobile' => $mobile === '' ? 'Mobile is required' : null,
            'code' => $code === '' ? 'Code is required' : null,
        ));
        $row = $this->db->order_by('id', 'DESC')->get_where('otps', array(
            'mobile' => $mobile,
            'code' => $code,
            'isUsed' => 0
        ))->row_array();
        if (!$row) return $this->respond_error(404, 'NOT_FOUND', 'OTP not found');
        if (strtotime($row['expiresAt']) < time()) return $this->respond_error(500, 'EXPIRED', 'Token has been expired.');
        $this->db->where('id', $row['id'])->update('otps', array('isUsed' => 1));
        return $this->respond_success();
    }
}


