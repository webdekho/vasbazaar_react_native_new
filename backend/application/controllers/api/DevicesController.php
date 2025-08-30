<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class DevicesController extends ApiController {
    public function __construct() {
        parent::__construct();
        $this->load->model('Device_model');
    }

    public function index() {
        $this->require_auth();
        $limit = (int)($this->input->get('limit') ?: 50);
        $offset = (int)($this->input->get('offset') ?: 0);
        $result = $this->Device_model->list_by_user($this->user['id'], $limit, $offset);
        return $this->respond_paginated($result['items'], $limit, $offset, $result['total']);
    }

    public function store() {
        $this->require_auth();
        $input = json_decode($this->input->raw_input_stream, true) ?: $_POST;
        $required = array('serialNumber','deviceName','deviceType','minimumPressure','maximumPressure');
        foreach ($required as $r) if (!isset($input[$r]) || $input[$r] === '') return $this->respond_error(400, 'VALIDATION_ERROR', 'Missing ' . $r, array($r => $r . ' is required'));
        if ($this->Device_model->find_by_user_and_serial($this->user['id'], trim($input['serialNumber']))){
            return $this->respond_error(409, 'DUPLICATE', 'Device serial already exists for this user');
        }
        $data = array(
            'serialNumber' => trim($input['serialNumber']),
            'userId' => $this->user['id'],
            'deviceName' => trim($input['deviceName']),
            'deviceType' => trim($input['deviceType']),
            'minimumPressure' => (float)$input['minimumPressure'],
            'maximumPressure' => (float)$input['maximumPressure']
        );
        $id = $this->Device_model->create($data);
        return $this->respond_success(array('id' => $id));
    }

    public function update($id) {
        $this->require_auth();
        $input = json_decode($this->input->raw_input_stream, true) ?: $_POST;
        $ok = $this->Device_model->update_by_id((int)$id, $input);
        return $this->respond_success(array('updated' => $ok));
    }

    public function destroy($id) {
        $this->require_auth();
        $ok = $this->Device_model->delete_by_id((int)$id);
        return $this->respond_success(array('deleted' => $ok));
    }
}


