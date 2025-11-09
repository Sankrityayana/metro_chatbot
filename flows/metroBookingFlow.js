/**
 * Metro Booking Flow
 * New simplified booking flow: book -> station -> train -> qty -> name -> confirm -> pay
 */

const { searchTrainsByStation, getEventById, getMetroBalance, deductMetroBalance, createBooking } = require('../db/queries');
const { formatEventDate, formatCurrency, generateBookingId } = require('../services/util');
const { createTicket } = require('../services/tickets');

/**
 * Get station prompt message
 */
function getStationPromptMessage() {
    return `🚇 *Book Bangalore Metro Ticket*

Which station are you traveling from?

*Popular Stations:*
• Majestic
• MG Road
• Indiranagar
• Yeshwanthpur
• Cubbon Park
• Baiyappanahalli
• Jayanagar

Type the station name:`;
}

/**
 * Search and format trains by station
 */
function searchAndFormatTrainsByStation(stationName) {
    const trains = searchTrainsByStation(stationName, 5);
    
    if (trains.length === 0) {
        return {
            success: false,
            message: `😕 No trains found from "${stationName}"

Try:
• Check spelling
• Use station names like: Majestic, MG Road, Indiranagar
• Or type *CANCEL* to start over`
        };
    }
    
    let message = `🚇 *Trains from ${stationName}*\n\n`;
    message += `Found ${trains.length} train(s):\n\n`;
    
    trains.forEach((train, index) => {
        message += `*${index + 1}. ${train.title}*\n`;
        message += `🚉 ${train.venue}\n`;
        message += `🕐 ${formatEventDate(train.event_date)}\n`;
        message += `💰 ₹${train.price} per ticket\n`;
        message += `🎫 ${train.available_seats} seats\n\n`;
    });
    
    message += `Reply with number (1-${trains.length}) to select train.`;
    
    return {
        success: true,
        message,
        trains
    };
}

/**
 * Format quantity prompt
 */
function getQuantityPromptMessage(train) {
    return `🚇 *${train.title}*
🚉 ${train.venue}
🕐 ${formatEventDate(train.event_date)}
💰 ₹${train.price} per ticket

How many tickets? (1-10)`;
}

/**
 * Format name prompt
 */
function getNamePromptMessage(train, quantity) {
    const total = train.price * quantity;
    return `✅ *${quantity} ticket(s) selected*

🚇 ${train.title}
🚉 ${train.venue}
💰 Total: ₹${formatCurrency(total)}

Please enter your *full name* for the booking:

Example: "Rahul Kumar"`;
}

/**
 * Format confirmation message with balance check
 */
async function getConfirmationMessage(phone, train, quantity, userName) {
    const total = train.price * quantity;
    const balance = getMetroBalance(phone);
    
    let message = `📋 *Confirm Booking Details*\n\n`;
    message += `👤 Name: ${userName}\n`;
    message += `🚇 Train: ${train.title}\n`;
    message += `🚉 Route: ${train.venue}\n`;
    message += `🕐 Departure: ${formatEventDate(train.event_date)}\n`;
    message += `🎫 Tickets: ${quantity}\n`;
    message += `💰 Total Fare: ₹${formatCurrency(total)}\n\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    message += `💳 *Your Metro Balance*\n`;
    message += `Current: ₹${formatCurrency(balance)}\n`;
    
    if (balance >= total) {
        message += `After Deduction: ₹${formatCurrency(balance - total)}\n\n`;
        message += `✅ Sufficient balance!\n\n`;
        message += `Reply *YES* to confirm and pay\nReply *NO* to cancel`;
    } else {
        const shortfall = total - balance;
        message += `Shortfall: ₹${formatCurrency(shortfall)}\n\n`;
        message += `❌ Insufficient balance!\n\n`;
        message += `Please recharge your metro account and try again.\n`;
        message += `Type *CANCEL* to exit.`;
    }
    
    return {
        message,
        hasBalance: balance >= total,
        balance,
        total
    };
}

/**
 * Process booking payment and create ticket
 */
async function processBookingPayment(phone, train, quantity, userName) {
    const total = train.price * quantity;
    const balance = getMetroBalance(phone);
    
    // Check balance again
    if (balance < total) {
        return {
            success: false,
            error: 'Insufficient balance'
        };
    }
    
    try {
        // Deduct amount from metro account
        const deducted = deductMetroBalance(phone, total, `Ticket booking - ${train.title}`);
        
        if (!deducted) {
            return {
                success: false,
                error: 'Payment failed'
            };
        }
        
        // Create ticket with QR code
        const ticket = await createTicket({
            eventId: train.id,
            phone: phone,
            userName: userName,
            quantity: quantity,
            event: {
                title: train.title,
                city: train.city,
                venue: train.venue,
                event_date: train.event_date,
                price: train.price
            }
        });
        
        const newBalance = getMetroBalance(phone);
        
        return {
            success: true,
            ticket,
            amountDeducted: total,
            newBalance
        };
    } catch (error) {
        console.error('Payment processing failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Format successful booking message
 */
function formatBookingSuccess(ticket, amountDeducted, newBalance) {
    return `🎉 *BOOKING CONFIRMED!*

✅ Payment successful!
💰 Amount deducted: ₹${formatCurrency(amountDeducted)}
💳 Remaining balance: ₹${formatCurrency(newBalance)}

━━━━━━━━━━━━━━━━

📋 *Booking ID:* ${ticket.bookingId}
🚇 *Train:* ${ticket.eventTitle}
🚉 *Route:* ${ticket.venue}
🕐 *Departure:* ${formatEventDate(ticket.eventDate)}
👤 *Passenger:* ${ticket.userName}
🎫 *Tickets:* ${ticket.quantity}

━━━━━━━━━━━━━━━━

*QR Code will be sent next →*

📱 Show this QR code at metro entry
⏰ Arrive 10 minutes before departure
💾 Save Booking ID: *${ticket.bookingId}*

Happy journey! 🚇`;
}

/**
 * Parse train selection number
 */
function parseTrainSelection(message, maxNumber) {
    const num = parseInt(message.trim());
    if (isNaN(num) || num < 1 || num > maxNumber) {
        return null;
    }
    return num - 1; // Return 0-indexed
}

/**
 * Parse quantity
 */
function parseQuantity(message) {
    const qty = parseInt(message.trim());
    if (isNaN(qty) || qty < 1 || qty > 10) {
        return null;
    }
    return qty;
}

/**
 * Parse confirmation (YES/NO)
 */
function parseConfirmation(message) {
    const cleaned = message.trim().toUpperCase();
    if (cleaned === 'YES' || cleaned === 'Y' || cleaned === 'CONFIRM') {
        return true;
    }
    if (cleaned === 'NO' || cleaned === 'N' || cleaned === 'CANCEL') {
        return false;
    }
    return null;
}

/**
 * Validate name
 */
function validateName(name) {
    const cleaned = name.trim();
    if (cleaned.length < 2) {
        return { valid: false, error: 'Name too short' };
    }
    if (cleaned.length > 50) {
        return { valid: false, error: 'Name too long' };
    }
    // Allow letters, spaces, and common name characters
    if (!/^[a-zA-Z\s.'-]+$/.test(cleaned)) {
        return { valid: false, error: 'Invalid characters in name' };
    }
    return { valid: true, name: cleaned };
}

module.exports = {
    getStationPromptMessage,
    searchAndFormatTrainsByStation,
    getQuantityPromptMessage,
    getNamePromptMessage,
    getConfirmationMessage,
    processBookingPayment,
    formatBookingSuccess,
    parseTrainSelection,
    parseQuantity,
    parseConfirmation,
    validateName
};
