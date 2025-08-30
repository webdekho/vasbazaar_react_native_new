<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Wallet Transaction Model
 * 
 * Handles wallet transaction-related database operations
 * Equivalent to Spring Boot WalletTransactionEntity
 */
class WalletTransaction_model extends CI_Model {
    
    private $table = 'wallet_transaction';
    private $primary_key = 'id';
    
    public function __construct()
    {
        parent::__construct();
        $this->load->database();
    }
    
    /**
     * Get wallet transaction by ID
     * 
     * @param int $id Transaction ID
     * @return array|null Transaction data or null if not found
     */
    public function get_by_id($id)
    {
        $query = $this->db->get_where($this->table, array('id' => $id));
        return $query->row_array();
    }
    
    /**
     * Get wallet transactions by user ID
     * 
     * @param int $user_id User ID
     * @param int $limit Number of records
     * @param int $offset Starting record
     * @return array Transactions data
     */
    public function get_by_user_id($user_id, $limit = 10, $offset = 0)
    {
        $this->db->where('user_id', $user_id);
        $this->db->order_by('created_at', 'DESC');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get($this->table);
        return $query->result_array();
    }
    
    /**
     * Create new wallet transaction
     * 
     * @param array $data Transaction data
     * @return int|bool Transaction ID on success, false on failure
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
     * Get wallet balance for user
     * 
     * @param int $user_id User ID
     * @return float Current balance
     */
    public function get_balance($user_id)
    {
        $this->db->select('
            SUM(CASE WHEN transaction_type = "CREDIT" THEN amount ELSE 0 END) as total_credit,
            SUM(CASE WHEN transaction_type = "DEBIT" THEN amount ELSE 0 END) as total_debit
        ');
        $this->db->where('user_id', $user_id);
        $this->db->where('status', 'SUCCESS');
        
        $query = $this->db->get($this->table);
        $result = $query->row_array();
        
        $total_credit = floatval($result['total_credit'] ?? 0);
        $total_debit = floatval($result['total_debit'] ?? 0);
        
        return $total_credit - $total_debit;
    }
    
    /**
     * Add money to wallet (credit)
     * 
     * @param int $user_id User ID
     * @param float $amount Amount to credit
     * @param string $description Transaction description
     * @param string $reference_id Reference transaction ID
     * @return int|bool Transaction ID on success, false on failure
     */
    public function credit($user_id, $amount, $description = '', $reference_id = '')
    {
        $data = array(
            'user_id' => $user_id,
            'transaction_type' => 'CREDIT',
            'amount' => $amount,
            'description' => $description,
            'reference_id' => $reference_id,
            'status' => 'SUCCESS'
        );
        
        return $this->create($data);
    }
    
    /**
     * Deduct money from wallet (debit)
     * 
     * @param int $user_id User ID
     * @param float $amount Amount to debit
     * @param string $description Transaction description
     * @param string $reference_id Reference transaction ID
     * @return int|bool Transaction ID on success, false on failure
     */
    public function debit($user_id, $amount, $description = '', $reference_id = '')
    {
        // Check if user has sufficient balance
        $current_balance = $this->get_balance($user_id);
        
        if ($current_balance < $amount) {
            return false; // Insufficient balance
        }
        
        $data = array(
            'user_id' => $user_id,
            'transaction_type' => 'DEBIT',
            'amount' => $amount,
            'description' => $description,
            'reference_id' => $reference_id,
            'status' => 'SUCCESS'
        );
        
        return $this->create($data);
    }
    
    /**
     * Get wallet transaction statistics
     * 
     * @param int $user_id User ID (optional)
     * @param string $from_date Start date (optional)
     * @param string $to_date End date (optional)
     * @return array Statistics
     */
    public function get_statistics($user_id = null, $from_date = null, $to_date = null)
    {
        if ($user_id) {
            $this->db->where('user_id', $user_id);
        }
        
        if ($from_date && $to_date) {
            $this->db->where('DATE(created_at) >=', $from_date);
            $this->db->where('DATE(created_at) <=', $to_date);
        }
        
        $this->db->select('
            COUNT(*) as total_transactions,
            SUM(CASE WHEN transaction_type = "CREDIT" AND status = "SUCCESS" THEN amount ELSE 0 END) as total_credits,
            SUM(CASE WHEN transaction_type = "DEBIT" AND status = "SUCCESS" THEN amount ELSE 0 END) as total_debits,
            COUNT(CASE WHEN transaction_type = "CREDIT" THEN 1 END) as credit_count,
            COUNT(CASE WHEN transaction_type = "DEBIT" THEN 1 END) as debit_count
        ');
        
        $query = $this->db->get($this->table);
        return $query->row_array();
    }
}