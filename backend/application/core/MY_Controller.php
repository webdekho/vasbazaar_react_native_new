<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class MY_Controller extends CI_Controller {
    public function __construct() {
        parent::__construct();
        header('Content-Type: application/json; charset=utf-8');
        $this->setup_cors();
    }

    private function setup_cors() {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        $allowedOrigins = array(
            'http://localhost:8082',
            'http://127.0.0.1:8082',
            
        );

        if ($origin && in_array($origin, $allowedOrigins, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        } else {
            header('Access-Control-Allow-Origin: *');
        }
        header('Vary: Origin');

        // Preflight: only include the minimal headers needed
        if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
            http_response_code(204);
            exit;
        }
    }

    protected function respond_success($data = array(), $message = 'Request completed successfully', $status = 200, $errorCode = 'VALIDATION_SUCCESS') {
        $payload = array(
            'success' => true,
            'status' => $status,
            'error_code' => $errorCode,
            'data' => $data,
            'message' => $message
        );
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }

    protected function respond_error($status = 400, $errorCode = 'VALIDATION_ERROR', $message = 'Something went wrong.', $errors = null, $data = null) {
        $payload = array(
            'success' => false,
            'status' => $status,
            'error_code' => $errorCode,
            'message' => $message,
            'errors' => $errors,
            'data' => $data
        );
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }

    protected function respond_paginated($items = array(), $limit = 10, $offset = 0, $total = 0, $message = 'Request completed successfully') {
        $nextOffset = $offset + $limit;
        $hasNext = $nextOffset < $total;
        $totalPages = $limit > 0 ? (int)ceil($total / $limit) : 0;
        $payload = array(
            'success' => true,
            'status' => 200,
            'error_code' => 'VALIDATION_SUCCESS',
            'data' => $items,
            'pagination' => array(
                'limit' => (int)$limit,
                'offset' => (int)$offset,
                'total' => (int)$total,
                'total_pages' => $totalPages,
                'next_offset' => $hasNext ? $nextOffset : null,
                'has_next' => $hasNext
            ),
            'message' => $message
        );
        http_response_code(200);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

class ApiController extends MY_Controller {
    protected $user = null;

    protected function require_auth() {
        $authHeader = $this->input->get_request_header('Authorization');
        if (!$authHeader || stripos($authHeader, 'Bearer ') !== 0) {
            $this->respond_error(401, 'UNAUTHORIZED', 'Invalid or expired token');
        }
        $token = trim(substr($authHeader, 7));
        $this->load->library('JwtToken');
        $payload = $this->jwttoken->validate($token);
        if (!$payload) {
            $this->respond_error(401, 'UNAUTHORIZED', 'Invalid or expired token');
        }
        if (is_array($payload) && isset($payload['_error'])) {
            if ($payload['_error'] === 'EXPIRED') {
                $this->respond_error(500, 'EXPIRED', 'Token has been expired.');
            }
            $this->respond_error(401, 'UNAUTHORIZED', 'Invalid or expired token');
        }
        $this->user = $payload;
    }
}


