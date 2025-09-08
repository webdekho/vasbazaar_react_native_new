<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Email Service Library
 * 
 * Handles email functionality
 * Equivalent to Spring Boot EmailService
 */
class Email_service {
    
    protected $CI;
    
    public function __construct()
    {
        $this->CI =& get_instance();
        $this->CI->load->library('email');
        
        // Configure email settings
        $config = array(
            'protocol' => 'smtp',
            'smtp_host' => 'smtp.gmail.com',
            'smtp_port' => 587,
            'smtp_user' => 'your-email@gmail.com', // Configure this
            'smtp_pass' => 'your-app-password',     // Configure this
            'smtp_crypto' => 'tls',
            'mailtype' => 'html',
            'charset' => 'utf-8',
            'wordwrap' => TRUE
        );
        
        $this->CI->email->initialize($config);
    }
    
    /**
     * Send simple email
     * 
     * @param string $to Recipient email
     * @param string $subject Email subject
     * @param string $message Email body
     * @param string $from Sender email (optional)
     * @return bool Success status
     */
    public function send($to, $subject, $message, $from = null)
    {
        try {
            $this->CI->email->clear();
            
            if ($from) {
                $this->CI->email->from($from);
            } else {
                $this->CI->email->from('noreply@vasbazaar.com', 'vasbazaar');
            }
            
            $this->CI->email->to($to);
            $this->CI->email->subject($subject);
            $this->CI->email->message($message);
            
            return $this->CI->email->send();
            
        } catch (Exception $e) {
            log_message('error', 'Email send error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send OTP email
     * 
     * @param string $to Recipient email
     * @param string $otp OTP code
     * @param string $name Recipient name (optional)
     * @return bool Success status
     */
    public function send_otp($to, $otp, $name = '')
    {
        $subject = 'vasbazaar - OTP Verification';
        
        $message = "
        <html>
        <body>
            <h2>vasbazaar OTP Verification</h2>
            " . (!empty($name) ? "<p>Hello {$name},</p>" : "<p>Hello,</p>") . "
            <p>Your OTP for verification is: <strong>{$otp}</strong></p>
            <p>This OTP is valid for 10 minutes only.</p>
            <p>Please do not share this OTP with anyone.</p>
            <br>
            <p>Best regards,<br>vasbazaar Team</p>
        </body>
        </html>
        ";
        
        return $this->send($to, $subject, $message);
    }
    
    /**
     * Send welcome email
     * 
     * @param string $to Recipient email
     * @param string $name Recipient name
     * @param string $mobile Mobile number
     * @return bool Success status
     */
    public function send_welcome_email($to, $name, $mobile)
    {
        $subject = 'Welcome to vasbazaar!';
        
        $message = "
        <html>
        <body>
            <h2>Welcome to vasbazaar!</h2>
            <p>Hello {$name},</p>
            <p>Thank you for registering with vasbazaar. Your account has been created successfully.</p>
            <p><strong>Account Details:</strong></p>
            <ul>
                <li>Name: {$name}</li>
                <li>Mobile: {$mobile}</li>
                <li>Email: {$to}</li>
            </ul>
            <p>You can now enjoy our services including:</p>
            <ul>
                <li>Mobile Recharges</li>
                <li>DTH Recharges</li>
                <li>Bill Payments</li>
                <li>Wallet Services</li>
            </ul>
            <p>If you have any questions, feel free to contact our support team.</p>
            <br>
            <p>Best regards,<br>vasbazaar Team</p>
        </body>
        </html>
        ";
        
        return $this->send($to, $subject, $message);
    }
    
    /**
     * Send transaction notification email
     * 
     * @param string $to Recipient email
     * @param array $transaction_data Transaction details
     * @return bool Success status
     */
    public function send_transaction_notification($to, $transaction_data)
    {
        $subject = 'vasbazaar - Transaction ' . $transaction_data['status'];
        
        $status_color = $transaction_data['status'] === 'SUCCESS' ? 'green' : 
                       ($transaction_data['status'] === 'FAILED' ? 'red' : 'orange');
        
        $message = "
        <html>
        <body>
            <h2>Transaction Update</h2>
            <p>Hello {$transaction_data['user_name']},</p>
            <p>Your transaction has been processed with the following details:</p>
            
            <table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse;'>
                <tr><td><strong>Transaction ID:</strong></td><td>{$transaction_data['transaction_id']}</td></tr>
                <tr><td><strong>Amount:</strong></td><td>₹{$transaction_data['amount']}</td></tr>
                <tr><td><strong>Service:</strong></td><td>{$transaction_data['service_type']}</td></tr>
                <tr><td><strong>Status:</strong></td><td style='color: {$status_color}'><strong>{$transaction_data['status']}</strong></td></tr>
                <tr><td><strong>Date:</strong></td><td>{$transaction_data['created_at']}</td></tr>
            </table>
            
            " . (!empty($transaction_data['remarks']) ? "<p><strong>Remarks:</strong> {$transaction_data['remarks']}</p>" : "") . "
            
            <p>Thank you for using vasbazaar services.</p>
            <br>
            <p>Best regards,<br>vasbazaar Team</p>
        </body>
        </html>
        ";
        
        return $this->send($to, $subject, $message);
    }
    
    /**
     * Send low balance alert
     * 
     * @param string $to Recipient email
     * @param string $name User name
     * @param float $balance Current balance
     * @return bool Success status
     */
    public function send_low_balance_alert($to, $name, $balance)
    {
        $subject = 'vasbazaar - Low Balance Alert';
        
        $message = "
        <html>
        <body>
            <h2>Low Balance Alert</h2>
            <p>Hello {$name},</p>
            <p>Your vasbazaar wallet balance is running low.</p>
            <p><strong>Current Balance: ₹{$balance}</strong></p>
            <p>Please add money to your wallet to continue using our services.</p>
            <p>You can add money through our app or website.</p>
            <br>
            <p>Best regards,<br>vasbazaar Team</p>
        </body>
        </html>
        ";
        
        return $this->send($to, $subject, $message);
    }
}