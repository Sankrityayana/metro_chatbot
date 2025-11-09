/**
 * Ticket service
 * Handles ticket creation, QR code generation, and booking management
 */

const { generateBookingId, formatEventDate, formatCurrency } = require('./util');
const { createBookingQRData, generateQRCode, generateQRCodeFile } = require('./qrcode');
const { createBooking, getBookingByFriendlyId } = require('../db/queries');
const path = require('path');

/**
 * Create a confirmed booking with QR code
 * @param {Object} bookingDetails - Booking information
 * @returns {Promise<Object>} Created booking with QR code
 */
async function createTicket(bookingDetails) {
    try {
        const { eventId, phone, userName, quantity, event } = bookingDetails;
        
        // Generate friendly booking ID
        const bookingId = generateBookingId();
        
        // Calculate total price
        const totalPrice = event.price * quantity;
        
        // Create QR code data
        const qrData = createBookingQRData({
            bookingId,
            eventId,
            eventTitle: event.title,
            quantity,
            userName
        });
        
        // Generate QR code buffer
        const qrBuffer = await generateQRCode(qrData);
        
        // Optional: Save QR code to file (for hosted URL)
        const qrFileName = `${bookingId}.png`;
        const qrFilePath = path.join(__dirname, '..', 'qr_codes', qrFileName);
        
        let qrUrl = null;
        try {
            await generateQRCodeFile(qrData, qrFilePath);
            qrUrl = `${process.env.BASE_URL}/qr/${qrFileName}`;
        } catch (error) {
            console.warn('QR file save failed, using buffer only:', error.message);
        }
        
        // Create booking in database
        const dbBookingId = createBooking({
            bookingId,
            eventId,
            phone,
            userName,
            quantity,
            totalPrice,
            qrCodeData: JSON.stringify(qrData),
            qrCodeUrl: qrUrl
        });
        
        console.log(`✅ Ticket created: ${bookingId} for user ${userName}`);
        
        return {
            id: dbBookingId,
            bookingId,
            eventId,
            eventTitle: event.title,
            venue: event.venue,
            city: event.city,
            eventDate: event.event_date,
            userName,
            quantity,
            totalPrice,
            qrCodeBuffer: qrBuffer,
            qrCodeUrl: qrUrl,
            qrData
        };
    } catch (error) {
        console.error('❌ Ticket creation failed:', error);
        throw new Error('Failed to create ticket');
    }
}

/**
 * Retrieve ticket by booking ID
 * @param {String} bookingId - Friendly booking ID
 * @returns {Object|null} Booking details or null
 */
function retrieveTicket(bookingId) {
    try {
        const booking = getBookingByFriendlyId(bookingId);
        
        if (!booking) {
            return null;
        }
        
        return {
            bookingId: booking.booking_id,
            eventTitle: booking.title,
            venue: booking.venue,
            city: booking.city,
            eventDate: booking.event_date,
            userName: booking.user_name,
            quantity: booking.quantity,
            totalPrice: booking.total_price,
            status: booking.status,
            createdAt: booking.created_at,
            qrCodeUrl: booking.qr_code_url
        };
    } catch (error) {
        console.error('Error retrieving ticket:', error);
        return null;
    }
}

/**
 * Format ticket confirmation message
 * @param {Object} ticket - Ticket details
 * @returns {String} Formatted message
 */
function formatTicketConfirmation(ticket) {
    return `🎉 *BOOKING CONFIRMED!*

📋 *Booking ID:* ${ticket.bookingId}
🎭 *Event:* ${ticket.eventTitle}
📍 *Venue:* ${ticket.venue}, ${ticket.city}
📅 *Date:* ${formatEventDate(ticket.eventDate)}
👤 *Name:* ${ticket.userName}
🎫 *Tickets:* ${ticket.quantity}
💰 *Total:* ${formatCurrency(ticket.totalPrice)}

✅ Your tickets are confirmed! A QR code has been sent separately.

*Important:*
• Save your Booking ID: *${ticket.bookingId}*
• Show the QR code at the venue entrance
• Arrive 30 minutes before the event

To view this booking again, send: *${ticket.bookingId}*

Thank you for booking with us! 🎉`;
}

/**
 * Format ticket retrieval message
 * @param {Object} ticket - Ticket details
 * @returns {String} Formatted message
 */
function formatTicketDetails(ticket) {
    const statusEmoji = ticket.status === 'confirmed' ? '✅' : '❌';
    
    return `${statusEmoji} *BOOKING DETAILS*

📋 *Booking ID:* ${ticket.bookingId}
🎭 *Event:* ${ticket.eventTitle}
📍 *Venue:* ${ticket.venue}, ${ticket.city}
📅 *Date:* ${formatEventDate(ticket.eventDate)}
👤 *Name:* ${ticket.userName}
🎫 *Tickets:* ${ticket.quantity}
💰 *Total:* ${formatCurrency(ticket.totalPrice)}
📌 *Status:* ${ticket.status.toUpperCase()}

Booked on: ${formatEventDate(ticket.createdAt)}`;
}

module.exports = {
    createTicket,
    retrieveTicket,
    formatTicketConfirmation,
    formatTicketDetails
};
