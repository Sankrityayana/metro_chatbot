/**
 * Unit tests for message parser
 */

const {
    parseMessage,
    extractSearchKeywords,
    parseEventSelection,
    parseQuantity,
    parseUserName,
    isBookingId,
    extractBookingId,
    parseConfirmation
} = require('../../flows/parser');

describe('Message Parser', () => {
    describe('parseMessage', () => {
        test('should parse search command', () => {
            const result = parseMessage('search mumbai concerts');
            expect(result.intent).toBe('SEARCH');
            expect(result.isCommand).toBe(true);
        });

        test('should detect numbers', () => {
            const result = parseMessage('5');
            expect(result.isNumber).toBe(true);
            expect(result.number).toBe(5);
        });

        test('should handle empty messages', () => {
            const result = parseMessage('   ');
            expect(result.isEmpty).toBe(true);
        });
    });

    describe('extractSearchKeywords', () => {
        test('should extract keywords from search command', () => {
            expect(extractSearchKeywords('search mumbai concerts')).toBe('mumbai concerts');
            expect(extractSearchKeywords('FIND tech conference')).toBe('tech conference');
        });

        test('should handle plain text', () => {
            expect(extractSearchKeywords('just some keywords')).toBe('just some keywords');
        });
    });

    describe('parseEventSelection', () => {
        test('should parse valid selections', () => {
            expect(parseEventSelection('1')).toBe(1);
            expect(parseEventSelection('3')).toBe(3);
        });

        test('should reject invalid selections', () => {
            expect(parseEventSelection('0')).toBe(null);
            expect(parseEventSelection('-1')).toBe(null);
            expect(parseEventSelection('abc')).toBe(null);
        });
    });

    describe('parseQuantity', () => {
        test('should parse valid quantities', () => {
            expect(parseQuantity('2')).toBe(2);
            expect(parseQuantity('10')).toBe(10);
        });

        test('should reject invalid quantities', () => {
            expect(parseQuantity('0')).toBe(null);
            expect(parseQuantity('11')).toBe(null);
            expect(parseQuantity('abc')).toBe(null);
        });
    });

    describe('parseUserName', () => {
        test('should parse valid names', () => {
            expect(parseUserName('John Doe')).toBe('John Doe');
            expect(parseUserName('Alice Smith')).toBe('Alice Smith');
        });

        test('should reject invalid names', () => {
            expect(parseUserName('A')).toBe(null); // Too short
            expect(parseUserName('John123')).toBe(null); // Contains numbers
            expect(parseUserName('John@Doe')).toBe(null); // Contains special chars
        });
    });

    describe('isBookingId', () => {
        test('should validate booking ID format', () => {
            expect(isBookingId('BKG-ABC123')).toBe(true);
            expect(isBookingId('BKG-XYZ789')).toBe(true);
        });

        test('should reject invalid formats', () => {
            expect(isBookingId('BKG-AB')).toBe(false); // Too short
            expect(isBookingId('ABC-123456')).toBe(false); // Wrong prefix
            expect(isBookingId('BKG123456')).toBe(false); // No dash
        });
    });

    describe('extractBookingId', () => {
        test('should extract booking ID', () => {
            expect(extractBookingId('BKG-ABC123')).toBe('BKG-ABC123');
            expect(extractBookingId('bkg-xyz789')).toBe('BKG-XYZ789');
        });

        test('should return null if not found', () => {
            expect(extractBookingId('no booking id here')).toBe(null);
        });
    });

    describe('parseConfirmation', () => {
        test('should parse positive confirmations', () => {
            expect(parseConfirmation('yes')).toBe(true);
            expect(parseConfirmation('YES')).toBe(true);
            expect(parseConfirmation('confirm')).toBe(true);
            expect(parseConfirmation('ok')).toBe(true);
        });

        test('should parse negative confirmations', () => {
            expect(parseConfirmation('no')).toBe(false);
            expect(parseConfirmation('NO')).toBe(false);
            expect(parseConfirmation('cancel')).toBe(false);
        });

        test('should return null for ambiguous input', () => {
            expect(parseConfirmation('maybe')).toBe(null);
            expect(parseConfirmation('123')).toBe(null);
        });
    });
});
