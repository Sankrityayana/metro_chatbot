/**
 * Database queries module
 * All database operations for events, reservations, bookings, and sessions
 */

const { getDatabase } = require('./db');

// ============================================
// EVENT QUERIES
// ============================================

/**
 * Search events by keyword (matches title, city, description)
 */
function searchEvents(keyword, limit = 10) {
    const db = getDatabase();
    const query = `
        SELECT * FROM events
        WHERE is_active = 1
        AND available_seats > 0
        AND (
            title LIKE ? OR
            city LIKE ? OR
            description LIKE ? OR
            venue LIKE ?
        )
        ORDER BY event_date ASC
        LIMIT ?
    `;
    const searchPattern = `%${keyword}%`;
    return db.prepare(query).all(searchPattern, searchPattern, searchPattern, searchPattern, limit);
}

/**
 * Get event by ID
 */
function getEventById(eventId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
}

/**
 * Get all active events
 */
function getAllEvents(activeOnly = true) {
    const db = getDatabase();
    const query = activeOnly 
        ? 'SELECT * FROM events WHERE is_active = 1 ORDER BY event_date ASC'
        : 'SELECT * FROM events ORDER BY event_date ASC';
    return db.prepare(query).all();
}

/**
 * Create new event
 */
function createEvent(eventData) {
    const db = getDatabase();
    const { title, description, city, venue, event_date, total_seats, price } = eventData;
    
    const result = db.prepare(`
        INSERT INTO events (title, description, city, venue, event_date, total_seats, available_seats, price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, city, venue, event_date, total_seats, total_seats, price);
    
    return result.lastInsertRowid;
}

/**
 * Update event
 */
function updateEvent(eventId, eventData) {
    const db = getDatabase();
    const { title, description, city, venue, event_date, total_seats, price, is_active } = eventData;
    
    const result = db.prepare(`
        UPDATE events 
        SET title = ?, description = ?, city = ?, venue = ?, 
            event_date = ?, total_seats = ?, price = ?, is_active = ?,
            updated_at = datetime('now')
        WHERE id = ?
    `).run(title, description, city, venue, event_date, total_seats, price, is_active, eventId);
    
    return result.changes > 0;
}

/**
 * Update available seats (for reservations/bookings)
 */
function updateAvailableSeats(eventId, quantity, operation = 'decrease') {
    const db = getDatabase();
    const operator = operation === 'decrease' ? '-' : '+';
    
    const result = db.prepare(`
        UPDATE events 
        SET available_seats = available_seats ${operator} ?,
            updated_at = datetime('now')
        WHERE id = ? AND available_seats ${operation === 'decrease' ? '>=' : '+'} ?
    `).run(quantity, eventId, operation === 'decrease' ? quantity : 0);
    
    return result.changes > 0;
}

// ============================================
// RESERVATION QUERIES
// ============================================

/**
 * Create reservation (temporary hold)
 */
function createReservation(eventId, phone, quantity, ttlMinutes = 5) {
    const db = getDatabase();
    
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    
    try {
        // Start transaction
        const transaction = db.transaction(() => {
            // Check seat availability
            const event = getEventById(eventId);
            if (!event || event.available_seats < quantity) {
                throw new Error('Insufficient seats available');
            }
            
            // Cancel any existing active reservations for this user
            db.prepare(`
                UPDATE reservations 
                SET status = 'expired' 
                WHERE phone = ? AND status = 'active'
            `).run(phone);
            
            // Decrease available seats
            if (!updateAvailableSeats(eventId, quantity, 'decrease')) {
                throw new Error('Failed to reserve seats');
            }
            
            // Create reservation
            const result = db.prepare(`
                INSERT INTO reservations (event_id, phone, quantity, expires_at)
                VALUES (?, ?, ?, ?)
            `).run(eventId, phone, quantity, expiresAt);
            
            return result.lastInsertRowid;
        });
        
        return transaction();
    } catch (error) {
        console.error('Reservation creation failed:', error);
        throw error;
    }
}

/**
 * Get active reservation for user
 */
function getActiveReservation(phone) {
    const db = getDatabase();
    return db.prepare(`
        SELECT r.*, e.title, e.city, e.venue, e.event_date, e.price
        FROM reservations r
        JOIN events e ON r.event_id = e.id
        WHERE r.phone = ? AND r.status = 'active'
        AND datetime(r.expires_at) > datetime('now')
        ORDER BY r.reserved_at DESC
        LIMIT 1
    `).get(phone);
}

/**
 * Confirm reservation (convert to booking)
 */
function confirmReservation(reservationId) {
    const db = getDatabase();
    const result = db.prepare(`
        UPDATE reservations 
        SET status = 'confirmed' 
        WHERE id = ? AND status = 'active'
    `).run(reservationId);
    
    return result.changes > 0;
}

/**
 * Cancel reservation and release seats
 */
function cancelReservation(reservationId) {
    const db = getDatabase();
    
    try {
        const transaction = db.transaction(() => {
            const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId);
            
            if (!reservation) {
                throw new Error('Reservation not found');
            }
            
            // Release seats back to event
            updateAvailableSeats(reservation.event_id, reservation.quantity, 'increase');
            
            // Mark reservation as expired
            db.prepare(`
                UPDATE reservations 
                SET status = 'expired' 
                WHERE id = ?
            `).run(reservationId);
            
            return true;
        });
        
        return transaction();
    } catch (error) {
        console.error('Reservation cancellation failed:', error);
        return false;
    }
}

/**
 * Expire old reservations (called by cron job)
 */
function expireOldReservations() {
    const db = getDatabase();
    
    try {
        const transaction = db.transaction(() => {
            // Get all expired reservations
            const expiredReservations = db.prepare(`
                SELECT * FROM reservations 
                WHERE status = 'active' 
                AND datetime(expires_at) <= datetime('now')
            `).all();
            
            let expiredCount = 0;
            
            for (const reservation of expiredReservations) {
                // Release seats
                updateAvailableSeats(reservation.event_id, reservation.quantity, 'increase');
                
                // Mark as expired
                db.prepare(`
                    UPDATE reservations 
                    SET status = 'expired' 
                    WHERE id = ?
                `).run(reservation.id);
                
                expiredCount++;
            }
            
            return expiredCount;
        });
        
        return transaction();
    } catch (error) {
        console.error('Expiration job failed:', error);
        return 0;
    }
}

// ============================================
// BOOKING QUERIES
// ============================================

/**
 * Create booking with friendly ID
 */
function createBooking(bookingData) {
    const db = getDatabase();
    const { bookingId, eventId, phone, userName, quantity, totalPrice, qrCodeData, qrCodeUrl } = bookingData;
    
    const result = db.prepare(`
        INSERT INTO bookings (booking_id, event_id, phone, user_name, quantity, total_price, qr_code_data, qr_code_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bookingId, eventId, phone, userName, quantity, totalPrice, qrCodeData, qrCodeUrl);
    
    return result.lastInsertRowid;
}

/**
 * Get booking by friendly ID
 */
function getBookingByFriendlyId(bookingId) {
    const db = getDatabase();
    return db.prepare(`
        SELECT b.*, e.title, e.city, e.venue, e.event_date
        FROM bookings b
        JOIN events e ON b.event_id = e.id
        WHERE b.booking_id = ?
    `).get(bookingId);
}

/**
 * Get all bookings for a phone number
 */
function getBookingsByPhone(phone) {
    const db = getDatabase();
    return db.prepare(`
        SELECT b.*, e.title, e.city, e.venue, e.event_date
        FROM bookings b
        JOIN events e ON b.event_id = e.id
        WHERE b.phone = ? AND b.status = 'confirmed'
        ORDER BY b.created_at DESC
    `).all(phone);
}

/**
 * Get all bookings (admin)
 */
function getAllBookings(limit = 100) {
    const db = getDatabase();
    return db.prepare(`
        SELECT b.*, e.title, e.city, e.venue, e.event_date
        FROM bookings b
        JOIN events e ON b.event_id = e.id
        ORDER BY b.created_at DESC
        LIMIT ?
    `).all(limit);
}

/**
 * Cancel booking
 */
function cancelBooking(bookingId) {
    const db = getDatabase();
    
    try {
        const transaction = db.transaction(() => {
            const booking = db.prepare('SELECT * FROM bookings WHERE booking_id = ?').get(bookingId);
            
            if (!booking || booking.status === 'cancelled') {
                throw new Error('Booking not found or already cancelled');
            }
            
            // Release seats back
            updateAvailableSeats(booking.event_id, booking.quantity, 'increase');
            
            // Mark as cancelled
            db.prepare(`
                UPDATE bookings 
                SET status = 'cancelled' 
                WHERE booking_id = ?
            `).run(bookingId);
            
            return true;
        });
        
        return transaction();
    } catch (error) {
        console.error('Booking cancellation failed:', error);
        return false;
    }
}

// ============================================
// SESSION QUERIES
// ============================================

/**
 * Get or create session for user
 */
function getOrCreateSession(phone) {
    const db = getDatabase();
    
    let session = db.prepare('SELECT * FROM sessions WHERE phone = ?').get(phone);
    
    if (!session) {
        db.prepare(`
            INSERT INTO sessions (phone, state, context, last_activity)
            VALUES (?, 'NONE', '{}', datetime('now'))
        `).run(phone);
        
        session = db.prepare('SELECT * FROM sessions WHERE phone = ?').get(phone);
    }
    
    // Parse context JSON
    session.context = session.context ? JSON.parse(session.context) : {};
    
    return session;
}

/**
 * Update session state and context
 */
function updateSession(phone, state, context = {}) {
    const db = getDatabase();
    
    const result = db.prepare(`
        UPDATE sessions 
        SET state = ?, context = ?, last_activity = datetime('now')
        WHERE phone = ?
    `).run(state, JSON.stringify(context), phone);
    
    return result.changes > 0;
}

/**
 * Reset session to initial state
 */
function resetSession(phone) {
    return updateSession(phone, 'NONE', {});
}

/**
 * Clean up old sessions
 */
function cleanupOldSessions(timeoutMinutes = 30) {
    const db = getDatabase();
    
    const result = db.prepare(`
        DELETE FROM sessions 
        WHERE datetime(last_activity) <= datetime('now', '-' || ? || ' minutes')
    `).run(timeoutMinutes);
    
    return result.changes;
}

// ============================================
// METRICS QUERIES
// ============================================

/**
 * Get system metrics
 */
function getMetrics() {
    const db = getDatabase();
    
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events WHERE is_active = 1').get().count;
    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status = "confirmed"').get().count;
    const activeReservations = db.prepare('SELECT COUNT(*) as count FROM reservations WHERE status = "active"').get().count;
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE status = "confirmed"').get().total;
    
    return {
        totalEvents,
        totalBookings,
        activeReservations,
        totalRevenue: parseFloat(totalRevenue).toFixed(2)
    };
}

module.exports = {
    // Events
    searchEvents,
    getEventById,
    getAllEvents,
    createEvent,
    updateEvent,
    updateAvailableSeats,
    
    // Reservations
    createReservation,
    getActiveReservation,
    confirmReservation,
    cancelReservation,
    expireOldReservations,
    
    // Bookings
    createBooking,
    getBookingByFriendlyId,
    getBookingsByPhone,
    getAllBookings,
    cancelBooking,
    
    // Sessions
    getOrCreateSession,
    updateSession,
    resetSession,
    cleanupOldSessions,
    
    // Metrics
    getMetrics
};
