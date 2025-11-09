/**
 * Integration test for booking flow
 */

const {
    createReservation,
    getActiveReservation,
    confirmReservation,
    getEventById
} = require('../../db/queries');
const { createTempReservation, completeBooking } = require('../../flows/bookingFlow');
const { initializeDatabase } = require('../../db/db');

describe('Booking Flow Integration Tests', () => {
    const testPhone = '919876543210';
    
    beforeAll(() => {
        process.env.DB_PATH = ':memory:';
        initializeDatabase();
    });

    describe('Reservation Creation', () => {
        test('should create temporary reservation', () => {
            const result = createTempReservation(1, testPhone, 2);
            
            expect(result.success).toBe(true);
            expect(result.reservationId).toBeDefined();
            expect(result.ttlMinutes).toBeGreaterThan(0);
        });

        test('should prevent double reservations for same user', () => {
            createTempReservation(1, testPhone + '1', 2);
            
            // Try to create another reservation
            const result = createTempReservation(2, testPhone + '1', 1);
            
            // Should still succeed but cancel previous one
            expect(result.success).toBe(true);
        });

        test('should fail when insufficient seats', () => {
            const result = createTempReservation(1, testPhone + '2', 10000);
            expect(result.success).toBe(false);
        });
    });

    describe('Reservation Retrieval', () => {
        test('should get active reservation', () => {
            createTempReservation(1, testPhone + '3', 1);
            const reservation = getActiveReservation(testPhone + '3');
            
            expect(reservation).toBeDefined();
            expect(reservation.phone).toBe(testPhone + '3');
            expect(reservation.status).toBe('active');
        });

        test('should return null for user with no reservation', () => {
            const reservation = getActiveReservation('999999999');
            expect(reservation).toBeNull();
        });
    });

    describe('Booking Completion', () => {
        test('should complete booking successfully', async () => {
            const phone = testPhone + '4';
            createTempReservation(1, phone, 2);
            
            const reservation = getActiveReservation(phone);
            expect(reservation).toBeDefined();
            
            const result = await completeBooking(reservation, 'Test User');
            
            expect(result.success).toBe(true);
            expect(result.ticket).toBeDefined();
            expect(result.ticket.bookingId).toMatch(/^BKG-/);
        });
    });
});
