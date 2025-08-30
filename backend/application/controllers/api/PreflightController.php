<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class PreflightController extends MY_Controller {
    public function __construct() {
        parent::__construct();
    }

    public function index() {
        // MY_Controller already set CORS headers and exits on OPTIONS with 204
        // But if invoked directly, just send 204 here as well.
        if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
        http_response_code(204);
        exit;
    }
}


