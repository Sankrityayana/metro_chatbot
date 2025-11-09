/**
 * Message parser
 * Parses user input to extract commands, keywords, and numbers
 */

const { parseIntent, sanitizeInput, extractNumber } = require('../services/util');

/**
 * Parse user message and determine action
 */
function parseMessage(message) {
    const cleaned = sanitizeInput(message);
    const intent = parseIntent(cleaned);
    
    return {
        original: message,
        cleaned,
        intent,
        isCommand: intent !== 'UNKNOWN',
        isNumber: /^\d+$/.test(cleaned),
        number: extractNumber(cleaned),
        isEmpty: cleaned.length === 0
    };
}

/**
 * Extract search keywords from message
 */
function extractSearchKeywords(message) {
    const cleaned = sanitizeInput(message);
    
    // Remove common command words
    const keywords = cleaned
        .replace(/^(search|find|look\s+for)\s+/i, '')
        .trim();
    
    return keywords;
}

/**
 * Parse event selection (expects number like "1", "2", etc.)
 */
function parseEventSelection(message) {
    const num = parseInt(message.trim());
    
    if (isNaN(num) || num < 1) {
        return null;
    }
    
    return num;
}

/**
 * Parse quantity selection
 */
function parseQuantity(message) {
    const num = parseInt(message.trim());
    
    if (isNaN(num) || num < 1 || num > 10) {
        return null;
    }
    
    return num;
}

/**
 * Validate user name
 */
function parseUserName(message) {
    const cleaned = sanitizeInput(message);
    
    // Name should be 2-50 characters, letters and spaces only
    if (cleaned.length < 2 || cleaned.length > 50) {
        return null;
    }
    
    if (!/^[a-zA-Z\s]+$/.test(cleaned)) {
        return null;
    }
    
    return cleaned;
}

/**
 * Check if message is a booking ID
 */
function isBookingId(message) {
    return /^BKG-[A-Z0-9]{6}$/i.test(message.trim().toUpperCase());
}

/**
 * Extract booking ID
 */
function extractBookingId(message) {
    const match = message.trim().toUpperCase().match(/BKG-[A-Z0-9]{6}/);
    return match ? match[0] : null;
}

/**
 * Check if message is confirmation (yes/no)
 */
function parseConfirmation(message) {
    const cleaned = message.trim().toLowerCase();
    
    const yesWords = ['yes', 'y', 'confirm', 'ok', 'sure', 'proceed'];
    const noWords = ['no', 'n', 'cancel', 'stop', 'abort'];
    
    if (yesWords.includes(cleaned)) {
        return true;
    }
    
    if (noWords.includes(cleaned)) {
        return false;
    }
    
    return null;
}

module.exports = {
    parseMessage,
    extractSearchKeywords,
    parseEventSelection,
    parseQuantity,
    parseUserName,
    isBookingId,
    extractBookingId,
    parseConfirmation
};
