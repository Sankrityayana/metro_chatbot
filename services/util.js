/**
 * Utility functions
 * Helper functions for ID generation, date formatting, validation, etc.
 */

const crypto = require('crypto');

/**
 * Generate friendly booking ID (e.g., BKG-57RF1A)
 */
function generateBookingId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `BKG-${code}`;
}

/**
 * Format date for display
 */
function formatEventDate(isoDate) {
    const date = new Date(isoDate);
    
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    
    return date.toLocaleString('en-IN', options);
}

/**
 * Format date for short display
 */
function formatShortDate(isoDate) {
    const date = new Date(isoDate);
    
    const options = {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleString('en-IN', options);
}

/**
 * Format currency (Indian Rupees)
 */
function formatCurrency(amount) {
    return `₹${parseFloat(amount).toFixed(2)}`;
}

/**
 * Validate phone number format
 */
function isValidPhone(phone) {
    // Remove whatsapp: prefix and + if present
    const cleaned = phone.replace(/whatsapp:|^\+/g, '');
    
    // Check if it's a valid number (10-15 digits)
    return /^\d{10,15}$/.test(cleaned);
}

/**
 * Normalize phone number
 */
function normalizePhone(phone) {
    // Remove whatsapp: prefix and any non-digit characters
    return phone.replace(/whatsapp:|[^\d]/g, '');
}

/**
 * Validate quantity
 */
function isValidQuantity(qty) {
    const num = parseInt(qty);
    return !isNaN(num) && num > 0 && num <= 10; // Max 10 tickets per booking
}

/**
 * Parse user input to extract intent
 */
function parseIntent(message) {
    const msg = message.trim().toUpperCase();
    
    // Command keywords
    if (msg.startsWith('SEARCH') || msg.startsWith('FIND') || msg.startsWith('LOOK')) {
        return 'SEARCH';
    }
    if (msg === 'BOOK' || msg === 'BOOKING') {
        return 'BOOK';
    }
    if (msg === 'CANCEL' || msg === 'STOP') {
        return 'CANCEL';
    }
    if (msg === 'HELP' || msg === 'MENU' || msg === '?') {
        return 'HELP';
    }
    if (msg.startsWith('BKG-')) {
        return 'RETRIEVE_BOOKING';
    }
    if (msg === 'MY BOOKINGS' || msg === 'BOOKINGS') {
        return 'MY_BOOKINGS';
    }
    
    return 'UNKNOWN';
}

/**
 * Truncate text to max length
 */
function truncate(text, maxLength = 100) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Sleep/delay function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get time until expiration
 */
function getTimeUntilExpiration(expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}

/**
 * Sanitize user input
 */
function sanitizeInput(input) {
    if (!input) return '';
    
    // Remove extra whitespace and trim
    return input.trim().replace(/\s+/g, ' ');
}

/**
 * Generate random alphanumeric string
 */
function randomString(length = 8) {
    return crypto.randomBytes(length).toString('hex').substring(0, length).toUpperCase();
}

/**
 * Check if event is upcoming
 */
function isUpcomingEvent(eventDate) {
    return new Date(eventDate) > new Date();
}

/**
 * Validate event date format (ISO8601)
 */
function isValidEventDate(dateString) {
    try {
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && dateString.includes('T') || dateString.includes(' ');
    } catch {
        return false;
    }
}

/**
 * Format time remaining
 */
function formatTimeRemaining(minutes) {
    if (minutes < 1) return 'less than a minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
}

/**
 * Extract numbers from string
 */
function extractNumber(str) {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0]) : null;
}

module.exports = {
    generateBookingId,
    formatEventDate,
    formatShortDate,
    formatCurrency,
    isValidPhone,
    normalizePhone,
    isValidQuantity,
    parseIntent,
    truncate,
    sleep,
    getTimeUntilExpiration,
    sanitizeInput,
    randomString,
    isUpcomingEvent,
    isValidEventDate,
    formatTimeRemaining,
    extractNumber
};
