<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class HistoryController extends ApiController {
    public function __construct() {
        parent::__construct();
        $this->load->model('History_model');
    }

    public function index() {
        $this->require_auth();
        $filters = array('userId' => $this->user['id']);
        if ($this->input->get('deviceId')) $filters['deviceId'] = (int)$this->input->get('deviceId');
        if ($this->input->get('start')) $filters['start'] = $this->input->get('start');
        if ($this->input->get('end')) $filters['end'] = $this->input->get('end');
        $limit = (int)($this->input->get('limit') ?: 50);
        $offset = (int)($this->input->get('offset') ?: 0);
        $result = $this->History_model->list($filters, $limit, $offset);
        return $this->respond_paginated($result['items'], $limit, $offset, $result['total']);
    }
}


