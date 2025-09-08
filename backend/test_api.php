<?php
/**
 * Simple API Test File
 * Test URL: http://localhost/vasbazaar/backend/test_api.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, access_token');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = array(
    'Status' => 'SUCCESS',
    'StatusCode' => 200,
    'message' => 'vasbazaar CodeIgniter 3 Backend API is working!',
    'data' => array(
        'version' => '1.0.0',
        'framework' => 'CodeIgniter 3.1.13',
        'php_version' => phpversion(),
        'timestamp' => date('Y-m-d H:i:s'),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'request_uri' => $_SERVER['REQUEST_URI'],
        'available_endpoints' => array(
            'Authentication' => array(
                'POST /api/auth/register',
                'POST /api/auth/login',
                'POST /api/auth/otp/send',
                'POST /api/auth/otp/verify'
            ),
            'Dashboard' => array(
                'GET /api/dashboard/version',
                'GET /api/dashboard/graph/transactions',
                'GET /api/dashboard/stats'
            ),
            'Users' => array(
                'GET /api/users',
                'GET /api/users/{id}',
                'PUT /api/users/{id}'
            ),
            'Transactions' => array(
                'GET /api/transactions',
                'POST /api/transactions',
                'GET /api/transactions/{id}'
            )
        )
    )
);

echo json_encode($response, JSON_PRETTY_PRINT);
?>