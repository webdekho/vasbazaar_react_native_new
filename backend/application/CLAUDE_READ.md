# CLAUDE_READ.md

This file provides guidance to Claude Code (claude.ai/code) when working with the **CodeIgniter 3 backend** of the VasBazaar application (converted from Spring Boot).

## Development Commands

### Core Development
- **Start development server**: Start XAMPP and access via `http://localhost/vasbazaar/backend/`
- **Run application**: Access through web browser (no build required)
- **Database management**: Use phpMyAdmin or MySQL CLI
- **Clear cache**: Delete files in `application/cache/` directory
- **Enable/Disable modules**: Modify `application/config/autoload.php` and routes

### CodeIgniter 3 Configuration
- **PHP Version**: 7.4+ (compatible with legacy CI3)
- **Framework**: CodeIgniter 3.1.13
- **Database**: MySQL with MySQLi driver
- **Base URL**: Configure in `application/config/config.php`

## Architecture Overview

### Project Structure
This is a **CodeIgniter 3 REST API backend** converted from Spring Boot, serving the VasBazaar mobile/web application for mobile recharges, bill payments, and financial services. The application follows **MVC architecture** with additional service layer.

### Core Architecture Patterns

#### 1. Application Configuration
- **Main Application**: Standard CodeIgniter 3 bootstrap with custom configurations
- **Caching Enabled**: File-based caching with optional Redis support
- **Session Management**: Database or file-based sessions
- **Environment-based Configuration**: Development/Production configurations
- **Database Configuration**: `application/config/database.php`

#### 2. Directory Structure
```
application/
├── controllers/
│   └── api/ - API endpoint controllers
│       ├── AuthController.php - Authentication endpoints
│       ├── Dashboard.php - Dashboard APIs
│       ├── UserController.php - User management
│       └── TransactionController.php - Transaction handling
├── models/
│   ├── User_model.php - User data operations
│   ├── Transaction_model.php - Transaction operations
│   ├── WalletTransaction_model.php - Wallet operations
│   └── [Entity]_model.php - Other entity models
├── libraries/
│   ├── Api_response.php - Standardized API responses
│   ├── Authorization.php - Token validation & authorization
│   ├── Aes_encryption.php - AES-256 encryption/decryption
│   ├── Email_service.php - Email functionality
│   └── File_upload_service.php - File upload handling
├── helpers/
│   └── unix_timestamp_helper.php - Timestamp utilities
├── config/
│   ├── database.php - Database configuration
│   ├── routes.php - URL routing definitions
│   ├── config.php - Main application config
│   └── autoload.php - Auto-loaded resources
└── views/ - Template files (minimal for API)
```

#### 3. Database Layer Architecture
- **Database**: MySQL with MySQLi driver
- **Active Record**: CodeIgniter's Query Builder for database operations
- **Model Pattern**: Custom models extending CI_Model with business logic
- **Transaction Support**: Database transactions for data consistency

#### 4. API Architecture
- **REST Controllers**: Modular controllers in `/controllers/api/` directory
- **Standardized Responses**: `Api_response` library for consistent API responses
- **Authentication**: AES-256 token-based authentication with role validation
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Key Technologies & Dependencies

#### Core CodeIgniter 3 Stack
- **CodeIgniter 3.1.13**: PHP MVC framework
- **MySQLi**: Database driver for MySQL
- **Sessions**: User session management
- **Email**: Built-in email library with SMTP support
- **Upload**: File upload handling library
- **Image Manipulation**: GD2 library for image processing

#### Security & Encryption  
- **AES Encryption**: Custom AES-256-CBC encryption library
- **Password Hashing**: PHP password_hash() with BCRYPT
- **Input Validation**: XSS filtering and input sanitization
- **CSRF Protection**: Cross-site request forgery protection

#### Custom Libraries & Services
- **Api_response**: Consistent API response formatting
- **Authorization**: Token-based authentication system  
- **Email_service**: Enhanced email functionality with templates
- **File_upload_service**: Advanced file upload with validation

### Critical Implementation Details

#### Authentication & Authorization
- **Token Encryption**: AES-256-CBC encryption for secure token storage
- **Role-based Access**: Admin, Customer, Support, CNF user types
- **Token Expiration**: Configurable token expiration (default: 10 hours)
- **Session Management**: Stateless token-based authentication

#### API Response Pattern
```php
// Standard API response format (matches Spring Boot structure)
$this->api_response->success($data, 'Success message', 200);
$this->api_response->error('Error message', 400);
$this->api_response->internal_error('Internal server error');

// Response structure:
{
    "Status": "SUCCESS|FAILURE",
    "StatusCode": 200,
    "message": "Response message",
    "data": {...}
}
```

#### Model Relationship Management
- **User Model**: User management with balance tracking
- **Transaction Model**: Transaction processing and status management
- **WalletTransaction Model**: Wallet credit/debit operations
- **Audit Fields**: Automatic created_at/updated_at timestamps

#### Service Layer Pattern
- **Libraries as Services**: Business logic in custom libraries
- **Dependency Injection**: Load services via `$this->load->library()`
- **Helper Functions**: Utility functions in helpers directory

#### Configuration Management
- **Environment-based**: Separate configs for development/production
- **Database Configuration**: Centralized DB settings in config/database.php
- **URL Routing**: Clean URLs with custom routing in config/routes.php

### Important Patterns

#### Controller Structure (Converted from Spring Boot)
```php
class Dashboard extends CI_Controller {
    
    public function __construct()
    {
        parent::__construct();
        $this->load->model('Transaction_model');
        $this->load->library('api_response');
        $this->load->library('authorization');
        $this->output->set_content_type('application/json');
    }
    
    public function version()
    {
        try {
            $version_data = array(
                'version' => '1.0.0',
                'environment' => ENVIRONMENT
            );
            $this->api_response->success($version_data, 'Version fetched successfully');
        } catch (Exception $e) {
            $this->api_response->internal_error('Internal server error');
        }
    }
}
```

#### Model Pattern (Equivalent to Spring Boot Repositories)
```php
class User_model extends CI_Model {
    
    private $table = 'user';
    
    public function get_by_id($id)
    {
        $query = $this->db->get_where($this->table, array('id' => $id));
        return $query->row_array();
    }
    
    public function create($data)
    {
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        if ($this->db->insert($this->table, $data)) {
            return $this->db->insert_id();
        }
        return false;
    }
}
```

#### Authorization Pattern (Token Validation)
```php
// In controller
$token = $this->input->get_request_header('access_token');
try {
    $this->authorization->authorize_admin($token);
    // Proceed with authorized operation
} catch (Exception $e) {
    $this->api_response->unauthorized($e->getMessage());
    return;
}
```

### Development Notes

#### Database Integration
- Use CodeIgniter's Query Builder for all database operations
- Follow Active Record pattern for database queries
- Implement proper error handling for database operations
- Use transactions for multi-table operations

#### API Development  
- Always use `Api_response` library for consistent response format
- Implement proper error handling in all controller methods
- Follow RESTful URL patterns: `/api/{module}/{action}`
- Use appropriate HTTP methods (GET, POST, PUT, DELETE)

#### Security Best Practices
- Validate all input using CodeIgniter's input library
- Use authorization library methods for access control
- Never log sensitive data (passwords, tokens, personal information)
- Implement proper token validation for all protected endpoints

#### Performance Optimization
- Use CodeIgniter's caching library for frequently accessed data
- Implement database query optimization
- Use pagination for large dataset endpoints
- Enable GZIP compression in web server

#### Configuration
- Use environment-specific configuration files
- Store sensitive data in config files (not in code)
- Use CodeIgniter's config library for configuration access
- Follow naming conventions for config keys

#### Error Handling & Logging
- Use CodeIgniter's log_message() for error logging
- Implement try-catch blocks in all controller methods
- Provide user-friendly error messages
- Log technical errors for debugging

#### File Upload & Management
- Use File_upload_service library for file operations  
- Validate file types and sizes before upload
- Generate unique filenames to prevent conflicts
- Store upload paths in database for reference

This CodeIgniter 3 application serves as the converted backend API for the VasBazaar financial services platform, maintaining the same functionality as the original Spring Boot application while following CodeIgniter conventions and patterns.