<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class JwtToken {
    private $key;
    private $algo = 'HS256';
    private $leeway = 0;

    public function __construct() {
        $CI =& get_instance();
        $CI->load->config('config');
        $this->key = $CI->config->item('encryption_key');
    }

    public function generate($payload, $ttlSeconds = 86400) {
        $issuedAt = time();
        $payload['iat'] = $issuedAt;
        $payload['exp'] = $issuedAt + $ttlSeconds;
        return $this->encode($payload);
    }

    public function validate($token) {
        $payload = $this->decode($token);
        if (!$payload) return null;
        $now = time();
        if (isset($payload['exp']) && $payload['exp'] + $this->leeway < $now) {
            return array('_error' => 'EXPIRED');
        }
        return $payload;
    }

    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode($data) {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $data .= str_repeat('=', $padlen);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    private function encode($payload) {
        $header = array('typ' => 'JWT', 'alg' => $this->algo);
        $segments = array(
            $this->base64UrlEncode(json_encode($header)),
            $this->base64UrlEncode(json_encode($payload))
        );
        $signingInput = implode('.', $segments);
        $signature = hash_hmac('sha256', $signingInput, $this->key, true);
        $segments[] = $this->base64UrlEncode($signature);
        return implode('.', $segments);
    }

    private function decode($token) {
        $segments = explode('.', $token);
        if (count($segments) !== 3) return null;
        list($headb64, $bodyb64, $sigb64) = $segments;
        $header = json_decode($this->base64UrlDecode($headb64), true);
        $payload = json_decode($this->base64UrlDecode($bodyb64), true);
        $signature = $this->base64UrlDecode($sigb64);
        if (!$header || !$payload || !$signature) return null;
        if (!isset($header['alg']) || $header['alg'] !== $this->algo) return null;
        $signingInput = $headb64 . '.' . $bodyb64;
        $expected = hash_hmac('sha256', $signingInput, $this->key, true);
        if (!hash_equals($expected, $signature)) return null;
        return $payload;
    }
}


