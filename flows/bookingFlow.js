/**
 * Booking flow
 * Handles the step-by-step booking process
 */

const { createReservation, getActiveReservation, confirmReservation } = require('../db/queries');
const { createTicket } = require('../services/tickets');
const { formatEventDate, formatCurrency, formatTimeRemaining, getTimeUntilExpiration } = require('../services/util');

/**
 * Create temporary reservation
 */
function createTempReservation(eventId, phone, quantity) {
    try {
        const ttlMinutes = parseInt(process.env.RESERVATION_TTL_MINUTES) || 5;
        const reservationId = createReservation(eventId, phone, quantity, ttlMinutes);
        
        return {
            success: true,
            reservationId,
            ttlMinutes
        };
    } catch (error) {
        console.error('Reservation failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get reservation details for user
 */
function getUserReservation(phone) {
    try {
        return getActiveReservation(phone);
    } catch (error) {
        console.error('Failed to get reservation:', error);
        return null;
    }
}

/**
 * Format quantity confirmation message
 */
function formatQuantityConfirmation(event, quantity) {
    const totalPrice = event.price * quantity;
    
    return `✅ *Quantity Selected: ${quantity} ticket(s)*

🎭 Event: ${event.title}
📍 Location: ${event.city}
📅 Date: ${formatEventDate(event.event_date)}
💰 Price per ticket: ${formatCurrency(event.price)}

*Total: ${formatCurrency(totalPrice)}*

━━━━━━━━━━━━━━━━

Please reply with your *full name* for the booking.

Example: "John Doe"`;
}

/**
 * Format reservation hold message
 */
function formatReservationHold(reservation, ttlMinutes) {
    const totalPrice = reservation.price * reservation.quantity;
    
    return `⏳ *Seats Reserved!*

🎫 ${reservation.quantity} ticket(s) held for you
🎭 ${reservation.title}
📍 ${reservation.venue}, ${reservation.city}

💰 Total: ${formatCurrency(totalPrice)}

⚠️ *This hold expires in ${formatTimeRemaining(ttlMinutes)}*

━━━━━━━━━━━━━━━━

Please reply with your *full name* to confirm the booking.`;
}

/**
 * Format name confirmation message
 */
function formatNameConfirmation(userName, reservation) {
    const totalPrice = reservation.price * reservation.quantity;
    const timeLeft = getTimeUntilExpiration(reservation.expires_at);
    
    return `📝 *Booking Summary*

👤 Name: ${userName}
🎭 Event: ${reservation.title}
📍 Venue: ${reservation.venue}, ${reservation.city}
📅 Date: ${formatEventDate(reservation.event_date)}
🎫 Tickets: ${reservation.quantity}
💰 Total: ${formatCurrency(totalPrice)}

⏱️ Time remaining: ${timeLeft}

━━━━━━━━━━━━━━━━

Reply *YES* to confirm or *NO* to cancel.`;
}

/**
 * Complete booking and create ticket
 */
async function completeBooking(reservation, userName) {
    try {
        // Confirm the reservation in DB
        const confirmed = confirmReservation(reservation.id);
        
        if (!confirmed) {
            throw new Error('Failed to confirm reservation');
        }
        
        // Create ticket with QR code
        const ticket = await createTicket({
            eventId: reservation.event_id,
            phone: reservation.phone,
            userName: userName,
            quantity: reservation.quantity,
            event: {
                title: reservation.title,
                city: reservation.city,
                venue: reservation.venue,
                event_date: reservation.event_date,
                price: reservation.price
            }
        });
        
        return {
            success: true,
            ticket
        };
    } catch (error) {
        console.error('Booking completion failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Format reservation expired message
 */
function formatReservationExpired() {
    return `⏰ *Reservation Expired*

Your seat reservation has expired and the seats have been released.

No worries! You can:
• Search again for the same event
• Look for other events

Type *SEARCH* to start over.`;
}

/**
 * Format insufficient seats message
 */
function formatInsufficientSeats(available, requested) {
    return `❌ *Not Enough Seats*

You requested ${requested} ticket(s), but only ${available} seat(s) are available.

Please:
• Try a smaller quantity
• Search for another event

Type *SEARCH* to start over.`;
}

/**
 * Format invalid quantity message
 */
function formatInvalidQuantity() {
    return `❌ *Invalid Quantity*

Please enter a number between 1 and 10.

How many tickets would you like?`;
}

/**
 * Format invalid name message
 */
function formatInvalidName() {
    return `❌ *Invalid Name*

Please enter a valid name:
• 2-50 characters
• Letters and spaces only
• No numbers or special characters

Example: "John Doe"

What's your full name?`;
}

module.exports = {
    createTempReservation,
    getUserReservation,
    formatQuantityConfirmation,
    formatReservationHold,
    formatNameConfirmation,
    completeBooking,
    formatReservationExpired,
    formatInsufficientSeats,
    formatInvalidQuantity,
    formatInvalidName
};
