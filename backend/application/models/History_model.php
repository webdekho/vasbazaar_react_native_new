<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class History_model extends CI_Model {
    protected $table = 'history';

    public function list($filters = array(), $limit = 50, $offset = 0) {
        if (isset($filters['userId'])) $this->db->where('userId', $filters['userId']);
        if (isset($filters['deviceId'])) $this->db->where('deviceId', $filters['deviceId']);
        if (isset($filters['start'])) $this->db->where('deviceStartDateTime >=', $filters['start']);
        if (isset($filters['end'])) $this->db->where('deviceEndDateTime <=', $filters['end']);
        $this->db->order_by('deviceStartDateTime', 'DESC');
        $count = $this->db->count_all_results($this->table, FALSE);
        $this->db->limit($limit, $offset);
        $items = $this->db->get()->result_array();
        return array('total' => (int)$count, 'items' => $items);
    }
}


