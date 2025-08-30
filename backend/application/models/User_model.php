<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * User Model
 * 
 * Handles user-related database operations
 * Equivalent to Spring Boot UserEntity and UserRepository
 */
class User_model extends CI_Model {
    
    private $table = 'user';
    private $primary_key = 'id';
    
    public function __construct()
    {
        parent::__construct();
        $this->load->database();
    }
    
    /**
     * Get user by ID
     * 
     * @param int $id User ID
     * @return array|null User data or null if not found
     */
    public function get_by_id($id)
    {
        $query = $this->db->get_where($this->table, array('id' => $id));
        return $query->row_array();
    }
    
    /**
     * Get user by mobile number
     * 
     * @param string $mobile_number Mobile number
     * @return array|null User data or null if not found
     */
    public function get_by_mobile($mobile_number)
    {
        $query = $this->db->get_where($this->table, array('mobile_number' => $mobile_number));
        return $query->row_array();
    }
    
    /**
     * Legacy method for backward compatibility
     */
    public function find_by_mobile($mobile) {
        return $this->get_by_mobile($mobile);
    }
    
    /**
     * Get user by email
     * 
     * @param string $email Email address
     * @return array|null User data or null if not found
     */
    public function get_by_email($email)
    {
        $query = $this->db->get_where($this->table, array('email' => $email));
        return $query->row_array();
    }
    
    /**
     * Get user by Aadhaar number
     * 
     * @param string $aadhaar_number Aadhaar number
     * @return array|null User data or null if not found
     */
    public function get_by_aadhaar($aadhaar_number)
    {
        $query = $this->db->get_where($this->table, array('aadhaar_number' => $aadhaar_number));
        return $query->row_array();
    }
    
    /**
     * Create new user
     * 
     * @param array $data User data
     * @return int|bool User ID on success, false on failure
     */
    public function create($data)
    {
        // Add timestamps
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        if ($this->db->insert($this->table, $data)) {
            return $this->db->insert_id();
        }
        
        return false;
    }
    
    /**
     * Update user
     * 
     * @param int $id User ID
     * @param array $data Data to update
     * @return bool Success status
     */
    public function update($id, $data)
    {
        // Update timestamp
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update($this->table, $data);
    }
    
    /**
     * Delete user
     * 
     * @param int $id User ID
     * @return bool Success status
     */
    public function delete($id)
    {
        return $this->db->delete($this->table, array('id' => $id));
    }
    
    /**
     * Get all users with pagination
     * 
     * @param int $limit Number of records per page
     * @param int $offset Starting record
     * @param array $filters Optional filters
     * @return array Users data
     */
    public function get_all($limit = 10, $offset = 0, $filters = array())
    {
        if (!empty($filters)) {
            foreach ($filters as $key => $value) {
                if (!empty($value)) {
                    $this->db->like($key, $value);
                }
            }
        }
        
        $this->db->order_by('created_at', 'DESC');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get($this->table);
        return $query->result_array();
    }
    
    /**
     * Count total users
     * 
     * @param array $filters Optional filters
     * @return int Total count
     */
    public function count_all($filters = array())
    {
        if (!empty($filters)) {
            foreach ($filters as $key => $value) {
                if (!empty($value)) {
                    $this->db->like($key, $value);
                }
            }
        }
        
        return $this->db->count_all_results($this->table);
    }
    
    /**
     * Check if user exists by mobile number
     * 
     * @param string $mobile_number Mobile number
     * @param int $exclude_id User ID to exclude (for updates)
     * @return bool
     */
    public function exists_by_mobile($mobile_number, $exclude_id = null)
    {
        $this->db->where('mobile_number', $mobile_number);
        
        if ($exclude_id) {
            $this->db->where('id !=', $exclude_id);
        }
        
        return $this->db->count_all_results($this->table) > 0;
    }
    
    /**
     * Update user balance
     * 
     * @param int $user_id User ID
     * @param float $amount Amount to add/subtract
     * @param string $operation Operation type (add/subtract)
     * @return bool Success status
     */
    public function update_balance($user_id, $amount, $operation = 'add')
    {
        $user = $this->get_by_id($user_id);
        
        if (!$user) {
            return false;
        }
        
        $current_balance = floatval($user['wallet_balance'] ?? 0);
        
        if ($operation === 'add') {
            $new_balance = $current_balance + $amount;
        } else {
            $new_balance = $current_balance - $amount;
        }
        
        // Prevent negative balance for regular users
        if ($new_balance < 0 && $user['user_type'] === 'customer') {
            return false;
        }
        
        return $this->update($user_id, array('wallet_balance' => $new_balance));
    }
}


