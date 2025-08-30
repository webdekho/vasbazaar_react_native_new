<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/*
| -------------------------------------------------------------------------
| URI ROUTING
| -------------------------------------------------------------------------
| This file lets you re-map URI requests to specific controller functions.
|
| Typically there is a one-to-one relationship between a URL string
| and its corresponding controller class/method. The segments in a
| URL normally follow this pattern:
|
|	example.com/class/method/id/
|
| In some instances, however, you may want to remap this relationship
| so that a different class/function is called than the one
| corresponding to the URL.
|
| Please see the user guide for complete details:
|
|	https://codeigniter.com/userguide3/general/routing.html
|
| -------------------------------------------------------------------------
| RESERVED ROUTES
| -------------------------------------------------------------------------
|
| There are three reserved routes:
|
|	$route['default_controller'] = 'welcome';
|
| This route indicates which controller class should be loaded if the
| URI contains no data. In the above example, the "welcome" class
| would be loaded.
|
|	$route['404_override'] = 'errors/page_missing';
|
| This route will tell the Router which controller/method to use if those
| provided in the URL cannot be matched to a valid route.
|
|	$route['translate_uri_dashes'] = FALSE;
|
| This is not exactly a route, but allows you to automatically route
| controller and method names that contain dashes. '-' isn't a valid
| class or method name character, so it requires translation.
| When you set this option to TRUE, it will replace ALL dashes in the
| controller and method URI segments.
|
| Examples:	my-controller/index	-> my_controller/index
|		my-controller/my-method	-> my_controller/my_method
*/
$route['default_controller'] = 'welcome';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;

// API routes - VasBazaar Spring Boot conversion
// Authentication routes
$route['api/auth/register']['post'] = 'api/AuthController/register';
$route['api/auth/login']['post'] = 'api/AuthController/login';
$route['api/auth/otp/send']['post'] = 'api/AuthController/send_otp';
$route['api/auth/otp/verify']['post'] = 'api/AuthController/verify_otp';

// Dashboard routes
$route['api/dashboard/version']['get'] = 'api/Dashboard/version';
$route['api/dashboard/graph/transactions']['get'] = 'api/Dashboard/graph_transactions';
$route['api/dashboard/graph']['get'] = 'api/Dashboard/graph';
$route['api/dashboard/getAll']['get'] = 'api/Dashboard/getAll';
$route['api/dashboard/stats']['get'] = 'api/Dashboard/stats';
$route['api/dashboard/realtime']['get'] = 'api/Dashboard/realtime';

// User management routes
$route['api/users']['get'] = 'api/UserController/index';
$route['api/users/(\d+)']['get'] = 'api/UserController/get/$1';
$route['api/users/(\d+)']['put'] = 'api/UserController/update/$1';
$route['api/users/(\d+)/balance']['put'] = 'api/UserController/update_balance/$1';

// Transaction routes
$route['api/transactions']['get'] = 'api/TransactionController/index';
$route['api/transactions/(\d+)']['get'] = 'api/TransactionController/get/$1';
$route['api/transactions']['post'] = 'api/TransactionController/create';
$route['api/transactions/(\d+)/status']['put'] = 'api/TransactionController/update_status/$1';

// Legacy API routes (backward compatibility)
$route['api/v1/register']['post'] = 'api/AuthController/register';
$route['api/v1/login']['post'] = 'api/AuthController/login';
$route['api/v1/otp/send']['post'] = 'api/AuthController/send_otp';
$route['api/v1/otp/verify']['post'] = 'api/AuthController/verify_otp';

$route['api/v1/devices']['get'] = 'api/DevicesController/index';
$route['api/v1/devices']['post'] = 'api/DevicesController/store';
$route['api/v1/devices/(\d+)']['put'] = 'api/DevicesController/update/$1';
$route['api/v1/devices/(\d+)']['delete'] = 'api/DevicesController/destroy/$1';

$route['api/v1/history']['get'] = 'api/HistoryController/index';
$route['api/v1/alerts']['get'] = 'api/AlertsController/index';
$route['api/v1/alerts/(\d+)/ack']['post'] = 'api/AlertsController/acknowledge/$1';

// Preflight route catch-all for OPTIONS
$route['api/(.*)']['options'] = 'api/PreflightController/index';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;
