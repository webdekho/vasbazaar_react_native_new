<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Alert_model extends CI_Model {
    protected $table = 'alerts';

    public function list($filters = array(), $limit = 50, $offset = 0) {
        if (isset($filters['deviceId'])) $this->db->where('deviceId', (int)$filters['deviceId']);
        if (isset($filters['userId'])) $this->db->where('userId', (int)$filters['userId']);
        if (isset($filters['severity'])) $this->db->where('severity', $filters['severity']);
        $this->db->order_by('occurredAt', 'DESC');
        $count = $this->db->count_all_results($this->table, FALSE);
        $this->db->limit($limit, $offset);
        $items = $this->db->get()->result_array();
        return array('total' => (int)$count, 'items' => $items);
    }

    public function acknowledge($id, $userId) {
        $this->db->where('id', (int)$id)->update($this->table, array(
            'acknowledged' => 1,
            'acknowledgedBy' => $userId,
            'acknowledgedAt' => date('Y-m-d H:i:s')
        ));
        return $this->db->affected_rows() > 0;
    }
}


