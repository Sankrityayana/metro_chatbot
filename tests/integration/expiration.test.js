/**
 * Integration test for reservation expiration
 */

const {
    createReservation,
    expireOldReservations,
    getEventById
} = require('../../db/queries');
const { initializeDatabase, getDatabase } = require('../../db/db');

describe('Reservation Expiration Integration Tests', () => {
    beforeAll(() => {
        process.env.DB_PATH = ':memory:';
        initializeDatabase();
    });

    describe('Expiration Logic', () => {
        test('should not expire active reservations', () => {
            const phone = '919876543210';
            
            // Create reservation with 5 minute TTL
            createReservation(1, phone, 2, 5);
            
            // Run expiration
            const expiredCount = expireOldReservations();
            
            // Should not expire
            expect(expiredCount).toBe(0);
        });

        test('should expire old reservations', () => {
            const db = getDatabase();
            const phone = '919876543211';
            
            // Create reservation
            const result = db.prepare(`
                INSERT INTO reservations (event_id, phone, quantity, expires_at, status)
                VALUES (1, ?, 2, datetime('now', '-10 minutes'), 'active')
            `).run(phone);
            
            // Manually decrease seats to simulate reservation
            db.prepare(`
                UPDATE events 
                SET available_seats = available_seats - 2
                WHERE id = 1
            `).run();
            
            const eventBefore = getEventById(1);
            const seatsBefore = eventBefore.available_seats;
            
            // Run expiration
            const expiredCount = expireOldReservations();
            
            expect(expiredCount).toBeGreaterThan(0);
            
            // Check seats were released
            const eventAfter = getEventById(1);
            expect(eventAfter.available_seats).toBe(seatsBefore + 2);
            
            // Check reservation status
            const reservation = db.prepare(`
                SELECT * FROM reservations WHERE phone = ?
            `).get(phone);
            
            expect(reservation.status).toBe('expired');
        });
    });
});
