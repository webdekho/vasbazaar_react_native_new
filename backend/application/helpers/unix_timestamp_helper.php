<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Unix Timestamp Helper
 * 
 * Provides Unix timestamp utility functions
 */

if (!function_exists('get_current_timestamp')) {
    /**
     * Get current Unix timestamp
     * 
     * @return int Current Unix timestamp
     */
    function get_current_timestamp()
    {
        return time();
    }
}

if (!function_exists('get_timestamp_from_date')) {
    /**
     * Convert date to Unix timestamp
     * 
     * @param string $date Date string (Y-m-d H:i:s format)
     * @return int Unix timestamp
     */
    function get_timestamp_from_date($date)
    {
        return strtotime($date);
    }
}

if (!function_exists('get_date_from_timestamp')) {
    /**
     * Convert Unix timestamp to date string
     * 
     * @param int $timestamp Unix timestamp
     * @param string $format Date format (default: Y-m-d H:i:s)
     * @return string Formatted date string
     */
    function get_date_from_timestamp($timestamp, $format = 'Y-m-d H:i:s')
    {
        return date($format, $timestamp);
    }
}

if (!function_exists('is_timestamp_expired')) {
    /**
     * Check if timestamp is expired
     * 
     * @param int $timestamp Timestamp to check
     * @param int $current_timestamp Current timestamp (optional)
     * @return bool True if expired, false otherwise
     */
    function is_timestamp_expired($timestamp, $current_timestamp = null)
    {
        if ($current_timestamp === null) {
            $current_timestamp = get_current_timestamp();
        }
        
        return $current_timestamp > $timestamp;
    }
}

if (!function_exists('add_minutes_to_timestamp')) {
    /**
     * Add minutes to timestamp
     * 
     * @param int $timestamp Base timestamp
     * @param int $minutes Minutes to add
     * @return int New timestamp
     */
    function add_minutes_to_timestamp($timestamp, $minutes)
    {
        return $timestamp + ($minutes * 60);
    }
}

if (!function_exists('add_hours_to_timestamp')) {
    /**
     * Add hours to timestamp
     * 
     * @param int $timestamp Base timestamp
     * @param int $hours Hours to add
     * @return int New timestamp
     */
    function add_hours_to_timestamp($timestamp, $hours)
    {
        return $timestamp + ($hours * 3600);
    }
}

if (!function_exists('add_days_to_timestamp')) {
    /**
     * Add days to timestamp
     * 
     * @param int $timestamp Base timestamp
     * @param int $days Days to add
     * @return int New timestamp
     */
    function add_days_to_timestamp($timestamp, $days)
    {
        return $timestamp + ($days * 86400);
    }
}