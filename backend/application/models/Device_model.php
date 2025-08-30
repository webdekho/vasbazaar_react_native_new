<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Device_model extends CI_Model {
    protected $table = 'devices';

    public function find_by_user_and_serial($userId, $serialNumber) {
        return $this->db->get_where($this->table, array('userId' => (int)$userId, 'serialNumber' => $serialNumber))->row_array();
    }

    public function list_by_user($userId, $limit = 50, $offset = 0) {
        $this->db->where('userId', $userId);
        $count = $this->db->count_all_results($this->table, FALSE);
        $this->db->limit($limit, $offset);
        $items = $this->db->get()->result_array();
        return array('total' => (int)$count, 'items' => $items);
    }

    public function create($data) {
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    public function update_by_id($id, $data) {
        $this->db->where('id', $id)->update($this->table, $data);
        return $this->db->affected_rows() > 0;
    }

    public function delete_by_id($id) {
        return $this->db->delete($this->table, array('id' => $id));
    }
}


