/**
 * Unit tests for utility functions
 */

const {
    generateBookingId,
    formatCurrency,
    isValidPhone,
    normalizePhone,
    isValidQuantity,
    parseIntent,
    extractNumber
} = require('../../services/util');

describe('Utility Functions', () => {
    describe('generateBookingId', () => {
        test('should generate booking ID in correct format', () => {
            const id = generateBookingId();
            expect(id).toMatch(/^BKG-[A-Z0-9]{6}$/);
        });

        test('should generate unique IDs', () => {
            const id1 = generateBookingId();
            const id2 = generateBookingId();
            expect(id1).not.toBe(id2);
        });
    });

    describe('formatCurrency', () => {
        test('should format currency correctly', () => {
            expect(formatCurrency(1500)).toBe('₹1500.00');
            expect(formatCurrency(99.99)).toBe('₹99.99');
            expect(formatCurrency(0)).toBe('₹0.00');
        });

        test('should handle string input', () => {
            expect(formatCurrency('1500')).toBe('₹1500.00');
        });
    });

    describe('isValidPhone', () => {
        test('should validate correct phone numbers', () => {
            expect(isValidPhone('919876543210')).toBe(true);
            expect(isValidPhone('+919876543210')).toBe(true);
            expect(isValidPhone('whatsapp:+919876543210')).toBe(true);
        });

        test('should reject invalid phone numbers', () => {
            expect(isValidPhone('123')).toBe(false);
            expect(isValidPhone('abcdefghij')).toBe(false);
            expect(isValidPhone('')).toBe(false);
        });
    });

    describe('normalizePhone', () => {
        test('should normalize phone numbers', () => {
            expect(normalizePhone('whatsapp:+919876543210')).toBe('919876543210');
            expect(normalizePhone('+919876543210')).toBe('919876543210');
            expect(normalizePhone('919876543210')).toBe('919876543210');
        });
    });

    describe('isValidQuantity', () => {
        test('should validate correct quantities', () => {
            expect(isValidQuantity(1)).toBe(true);
            expect(isValidQuantity(5)).toBe(true);
            expect(isValidQuantity(10)).toBe(true);
        });

        test('should reject invalid quantities', () => {
            expect(isValidQuantity(0)).toBe(false);
            expect(isValidQuantity(11)).toBe(false);
            expect(isValidQuantity(-1)).toBe(false);
            expect(isValidQuantity('abc')).toBe(false);
        });
    });

    describe('parseIntent', () => {
        test('should parse search intent', () => {
            expect(parseIntent('search mumbai')).toBe('SEARCH');
            expect(parseIntent('FIND concerts')).toBe('SEARCH');
        });

        test('should parse help intent', () => {
            expect(parseIntent('help')).toBe('HELP');
            expect(parseIntent('HELP')).toBe('HELP');
            expect(parseIntent('?')).toBe('HELP');
        });

        test('should parse booking ID', () => {
            expect(parseIntent('BKG-ABC123')).toBe('RETRIEVE_BOOKING');
            expect(parseIntent('bkg-xyz789')).toBe('RETRIEVE_BOOKING');
        });

        test('should return UNKNOWN for unrecognized input', () => {
            expect(parseIntent('random text')).toBe('UNKNOWN');
        });
    });

    describe('extractNumber', () => {
        test('should extract numbers from strings', () => {
            expect(extractNumber('I want 5 tickets')).toBe(5);
            expect(extractNumber('123')).toBe(123);
            expect(extractNumber('book 2')).toBe(2);
        });

        test('should return null if no number found', () => {
            expect(extractNumber('no numbers here')).toBe(null);
        });
    });
});
