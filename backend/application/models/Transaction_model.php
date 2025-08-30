<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Transaction Model
 * 
 * Handles transaction-related database operations
 * Equivalent to Spring Boot TransactionEntity and TransactionRepository
 */
class Transaction_model extends CI_Model {
    
    private $table = 'transaction';
    private $primary_key = 'id';
    
    public function __construct()
    {
        parent::__construct();
        $this->load->database();
    }
    
    /**
     * Get transaction by ID
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
     * Get transactions by user ID
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
     * Get transaction by transaction ID (external)
     * 
     * @param string $transaction_id External transaction ID
     * @return array|null Transaction data or null if not found
     */
    public function get_by_transaction_id($transaction_id)
    {
        $query = $this->db->get_where($this->table, array('transaction_id' => $transaction_id));
        return $query->row_array();
    }
    
    /**
     * Create new transaction
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
     * Update transaction
     * 
     * @param int $id Transaction ID
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
     * Get transactions by status
     * 
     * @param string $status Transaction status
     * @param int $limit Number of records
     * @param int $offset Starting record
     * @return array Transactions data
     */
    public function get_by_status($status, $limit = 10, $offset = 0)
    {
        $this->db->where('status', $status);
        $this->db->order_by('created_at', 'DESC');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get($this->table);
        return $query->result_array();
    }
    
    /**
     * Get transactions by date range
     * 
     * @param string $from_date Start date (Y-m-d format)
     * @param string $to_date End date (Y-m-d format)
     * @param int $limit Number of records
     * @param int $offset Starting record
     * @return array Transactions data
     */
    public function get_by_date_range($from_date, $to_date, $limit = 100, $offset = 0)
    {
        $this->db->where('DATE(created_at) >=', $from_date);
        $this->db->where('DATE(created_at) <=', $to_date);
        $this->db->order_by('created_at', 'DESC');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get($this->table);
        return $query->result_array();
    }
    
    /**
     * Get transaction statistics for dashboard
     * 
     * @param string $from_date Start date (optional)
     * @param string $to_date End date (optional)
     * @return array Transaction statistics
     */
    public function get_transaction_stats($from_date = null, $to_date = null)
    {
        if ($from_date && $to_date) {
            $this->db->where('DATE(created_at) >=', $from_date);
            $this->db->where('DATE(created_at) <=', $to_date);
        }
        
        $this->db->select('
            COUNT(*) as total_transactions,
            SUM(CASE WHEN status = "SUCCESS" THEN 1 ELSE 0 END) as successful_transactions,
            SUM(CASE WHEN status = "FAILED" THEN 1 ELSE 0 END) as failed_transactions,
            SUM(CASE WHEN status = "PENDING" THEN 1 ELSE 0 END) as pending_transactions,
            SUM(CASE WHEN status = "SUCCESS" THEN amount ELSE 0 END) as total_successful_amount
        ');
        
        $query = $this->db->get($this->table);
        return $query->row_array();
    }
    
    /**
     * Get transactions for graph/chart data
     * 
     * @param string $from_date Start date
     * @param string $to_date End date
     * @return array Graph data
     */
    public function get_transaction_graph_data($from_date, $to_date)
    {
        $this->db->select('
            DATE(created_at) as date,
            COUNT(*) as transaction_count,
            SUM(CASE WHEN status = "SUCCESS" THEN amount ELSE 0 END) as successful_amount
        ');
        $this->db->where('DATE(created_at) >=', $from_date);
        $this->db->where('DATE(created_at) <=', $to_date);
        $this->db->group_by('DATE(created_at)');
        $this->db->order_by('date', 'ASC');
        
        $query = $this->db->get($this->table);
        return $query->result_array();
    }
    
    /**
     * Count transactions by user
     * 
     * @param int $user_id User ID
     * @param array $filters Optional filters
     * @return int Transaction count
     */
    public function count_by_user($user_id, $filters = array())
    {
        $this->db->where('user_id', $user_id);
        
        if (!empty($filters)) {
            foreach ($filters as $key => $value) {
                if (!empty($value)) {
                    $this->db->where($key, $value);
                }
            }
        }
        
        return $this->db->count_all_results($this->table);
    }
    
    /**
     * Get pending transactions for processing
     * 
     * @param int $limit Number of records
     * @return array Pending transactions
     */
    public function get_pending_transactions($limit = 50)
    {
        $this->db->where('status', 'PENDING');
        $this->db->order_by('created_at', 'ASC');
        $this->db->limit($limit);
        
        $query = $this->db->get($this->table);
        return $query->result_array();
    }
    
    /**
     * Update transaction status
     * 
     * @param int $id Transaction ID
     * @param string $status New status
     * @param string $remarks Optional remarks
     * @return bool Success status
     */
    public function update_status($id, $status, $remarks = '')
    {
        $data = array(
            'status' => $status,
            'updated_at' => date('Y-m-d H:i:s')
        );
        
        if (!empty($remarks)) {
            $data['remarks'] = $remarks;
        }
        
        $this->db->where('id', $id);
        return $this->db->update($this->table, $data);
    }
}