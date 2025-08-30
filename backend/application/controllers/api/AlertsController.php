<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class AlertsController extends ApiController {
    public function __construct() {
        parent::__construct();
        $this->load->model('Alert_model');
    }

    public function index() {
        $this->require_auth();
        $filters = array('userId' => $this->user['id']);
        if ($this->input->get('deviceId')) $filters['deviceId'] = (int)$this->input->get('deviceId');
        if ($this->input->get('severity')) $filters['severity'] = $this->input->get('severity');
        $limit = (int)($this->input->get('limit') ?: 50);
        $offset = (int)($this->input->get('offset') ?: 0);
        $result = $this->Alert_model->list($filters, $limit, $offset);
        return $this->respond_paginated($result['items'], $limit, $offset, $result['total']);
    }

    public function acknowledge($id) {
        $this->require_auth();
        $ok = $this->Alert_model->acknowledge((int)$id, $this->user['id']);
        return $this->respond_success(array('acknowledged' => $ok));
    }
}


