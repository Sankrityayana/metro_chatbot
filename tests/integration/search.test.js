/**
 * Integration test for search functionality
 */

const { searchEvents } = require('../../db/queries');
const { performSearch, formatSearchResults } = require('../../flows/searchFlow');
const { initializeDatabase } = require('../../db/db');

describe('Search Integration Tests', () => {
    beforeAll(() => {
        // Initialize test database
        process.env.DB_PATH = ':memory:'; // Use in-memory database for testing
        initializeDatabase();
    });

    describe('Event Search', () => {
        test('should find events by city', () => {
            const results = searchEvents('Mumbai');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].city).toContain('Mumbai');
        });

        test('should find events by title keyword', () => {
            const results = searchEvents('concert');
            expect(results.length).toBeGreaterThan(0);
        });

        test('should return empty array for no matches', () => {
            const results = searchEvents('nonexistent event xyz');
            expect(results).toEqual([]);
        });

        test('should respect result limit', () => {
            const results = searchEvents('concert', 2);
            expect(results.length).toBeLessThanOrEqual(2);
        });
    });

    describe('Search Flow', () => {
        test('performSearch should return results', () => {
            const results = performSearch('Mumbai');
            expect(Array.isArray(results)).toBe(true);
        });

        test('formatSearchResults should create proper message', () => {
            const results = searchEvents('concert', 2);
            const message = formatSearchResults(results, 'concert');
            
            expect(message).toContain('Search Results');
            expect(message).toContain('concert');
            
            if (results.length > 0) {
                expect(message).toContain('1.');
            }
        });

        test('formatSearchResults should handle no results', () => {
            const message = formatSearchResults([], 'xyz');
            expect(message).toContain('No events found');
        });
    });
});
