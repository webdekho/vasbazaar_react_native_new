<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Dashboard Controller
 * 
 * Handles dashboard-related API endpoints
 * Equivalent to Spring Boot DashboardController
 */
class Dashboard extends CI_Controller {
    
    public function __construct()
    {
        parent::__construct();
        $this->load->model('Transaction_model');
        $this->load->model('User_model');
        $this->load->library('api_response');
        $this->load->library('authorization');
        $this->load->helper('unix_timestamp');
        
        // Set JSON response header
        $this->output->set_content_type('application/json');
    }
    
    /**
     * Get application version
     * GET /api/dashboard/version
     */
    public function version()
    {
        try {
            $version_data = array(
                'version' => '1.0.0',
                'build' => 'CI3-' . date('Ymd'),
                'environment' => ENVIRONMENT,
                'timestamp' => get_current_timestamp()
            );
            
            $this->api_response->success($version_data, 'Version fetched successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Dashboard version error: ' . $e->getMessage());
            $this->api_response->internal_error('Internal server error');
        }
    }
    
    /**
     * Get transaction graph data (public endpoint)
     * GET /api/dashboard/graph/transactions
     */
    public function graph_transactions()
    {
        try {
            $from_date = $this->input->get('fromDate');
            $to_date = $this->input->get('toDate');
            
            // Set default dates if not provided
            if (!$from_date) {
                $from_date = date('Y-m-d', strtotime('-30 days'));
            }
            if (!$to_date) {
                $to_date = date('Y-m-d');
            }
            
            $graph_data = $this->Transaction_model->get_transaction_graph_data($from_date, $to_date);
            
            $this->api_response->success($graph_data, 'Graph data fetched successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Dashboard graph error: ' . $e->getMessage());
            $this->api_response->internal_error('Internal server error');
        }
    }
    
    /**
     * Get transaction graph data (authenticated endpoint)
     * GET /api/dashboard/graph
     */
    public function graph()
    {
        try {
            // Get access token from header
            $token = $this->input->get_request_header('access_token');
            
            if (!$token) {
                $this->api_response->unauthorized('Access token is required');
                return;
            }
            
            // Validate token
            if (!$this->authorization->is_valid_token($token)) {
                $this->api_response->unauthorized('Invalid or expired token');
                return;
            }
            
            $from_date = $this->input->get('fromDate');
            $to_date = $this->input->get('toDate');
            
            if (!$from_date || !$to_date) {
                $this->api_response->error('fromDate and toDate are required', 400);
                return;
            }
            
            $graph_data = $this->Transaction_model->get_transaction_graph_data($from_date, $to_date);
            
            $this->api_response->success($graph_data, 'Graph data fetched successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Dashboard authenticated graph error: ' . $e->getMessage());
            $this->api_response->internal_error('Internal server error');
        }
    }
    
    /**
     * Get all dashboard data for admin
     * GET /api/dashboard/getAll
     */
    public function getAll()
    {
        try {
            // Get access token from header or parameter
            $token = $this->input->get_request_header('access_token') ?: $this->input->get('token');
            
            if (!$token) {
                $this->api_response->unauthorized('Access token is required');
                return;
            }
            
            // Authorize admin access
            try {
                $this->authorization->authorize_admin($token);
            } catch (Exception $e) {
                $this->api_response->unauthorized($e->getMessage());
                return;
            }
            
            $start_date = $this->input->get('startDate');
            $end_date = $this->input->get('endDate');
            
            if (!$start_date || !$end_date) {
                $this->api_response->error('startDate and endDate are required', 400);
                return;
            }
            
            // Get dashboard statistics
            $transaction_stats = $this->Transaction_model->get_transaction_stats($start_date, $end_date);
            $graph_data = $this->Transaction_model->get_transaction_graph_data($start_date, $end_date);
            
            // Get service-wise statistics
            $service_stats = $this->get_service_statistics($start_date, $end_date);
            
            $response_data = array(
                'transaction_statistics' => $transaction_stats,
                'graph_data' => $graph_data,
                'service_statistics' => $service_stats,
                'date_range' => array(
                    'start_date' => $start_date,
                    'end_date' => $end_date
                )
            );
            
            $this->api_response->success($response_data, 'Dashboard data fetched successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Dashboard getAll error: ' . $e->getMessage());
            $this->api_response->internal_error('Internal server error');
        }
    }
    
    /**
     * Get transaction statistics summary
     * GET /api/dashboard/stats
     */
    public function stats()
    {
        try {
            $token = $this->input->get_request_header('access_token');
            
            if (!$token) {
                $this->api_response->unauthorized('Access token is required');
                return;
            }
            
            // Validate token and get user info
            try {
                $user_info = $this->authorization->get_user_info($token);
            } catch (Exception $e) {
                $this->api_response->unauthorized('Invalid token');
                return;
            }
            
            $from_date = $this->input->get('fromDate') ?: date('Y-m-d', strtotime('-7 days'));
            $to_date = $this->input->get('toDate') ?: date('Y-m-d');
            
            $stats = $this->Transaction_model->get_transaction_stats($from_date, $to_date);
            
            // Add user-specific stats if it's a customer
            if ($user_info['userType'] === 'customer') {
                $user_id = $user_info['userId'] ?? null;
                if ($user_id) {
                    $user_stats = $this->Transaction_model->count_by_user($user_id);
                    $stats['user_transaction_count'] = $user_stats;
                }
            }
            
            $this->api_response->success($stats, 'Statistics fetched successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Dashboard stats error: ' . $e->getMessage());
            $this->api_response->internal_error('Internal server error');
        }
    }
    
    /**
     * Get service-wise statistics
     * 
     * @param string $start_date Start date
     * @param string $end_date End date
     * @return array Service statistics
     */
    private function get_service_statistics($start_date, $end_date)
    {
        // This would require a service-wise query
        // For now, returning a basic structure
        $this->db->select('
            service_type,
            COUNT(*) as transaction_count,
            SUM(CASE WHEN status = "SUCCESS" THEN amount ELSE 0 END) as successful_amount
        ');
        $this->db->where('DATE(created_at) >=', $start_date);
        $this->db->where('DATE(created_at) <=', $end_date);
        $this->db->group_by('service_type');
        $this->db->order_by('transaction_count', 'DESC');
        
        $query = $this->db->get('transaction');
        return $query->result_array();
    }
    
    /**
     * Get real-time dashboard data
     * GET /api/dashboard/realtime
     */
    public function realtime()
    {
        try {
            $token = $this->input->get_request_header('access_token');
            
            if (!$token) {
                $this->api_response->unauthorized('Access token is required');
                return;
            }
            
            // Authorize admin or support access
            try {
                $user_info = $this->authorization->get_user_info($token);
                $user_type = $user_info['userType'];
                
                if (!in_array($user_type, ['admin', 'support'])) {
                    throw new Exception('Unauthorized access');
                }
            } catch (Exception $e) {
                $this->api_response->unauthorized($e->getMessage());
                return;
            }
            
            // Get real-time statistics (last 24 hours)
            $today = date('Y-m-d');
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            
            $realtime_data = array(
                'today_stats' => $this->Transaction_model->get_transaction_stats($today, $today),
                'yesterday_stats' => $this->Transaction_model->get_transaction_stats($yesterday, $yesterday),
                'pending_transactions' => count($this->Transaction_model->get_pending_transactions(10)),
                'last_updated' => date('Y-m-d H:i:s')
            );
            
            $this->api_response->success($realtime_data, 'Real-time data fetched successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Dashboard realtime error: ' . $e->getMessage());
            $this->api_response->internal_error('Internal server error');
        }
    }
}