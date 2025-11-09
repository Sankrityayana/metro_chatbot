/**
 * New Book Flow
 * Handles the complete metro booking journey with balance deduction
 */

const { searchTrainsByStation, getEventById, getMetroBalance, deductMetroBalance, updateMetroAccountName } = require('../db/queries');
const { createTicket } = require('../services/tickets');
const { formatEventDate, formatCurrency } = require('../services/util');
const { sendMessage, sendMedia } = require('../services/whatsapp');
const { getContextValue, setContextValue, transitionTo, resetToInitial } = require('../services/session');

// States
const STATES = {
    NONE: 'NONE',
    WAITING_STATION: 'WAITING_STATION',
    WAITING_TRAIN: 'WAITING_TRAIN',
    WAITING_QTY: 'WAITING_QTY',
    WAITING_NAME: 'WAITING_NAME',
    WAITING_CONFIRM: 'WAITING_CONFIRM'
};

/**
 * Start booking flow - ask for station
 */
async function startBooking(phone) {
    await transitionTo(phone, STATES.WAITING_STATION);
    
    const message = `🚇 *Bangalore Metro Booking*

📍 *Which station are you traveling from?*

Popular stations:
• Majestic
• MG Road
• Indiranagar
• Cubbon Park
• Yeshwanthpur
• Baiyappanahalli

Type the station name:`;
    
    return await sendMessage(phone, message);
}

/**
 * Handle station input - show available trains
 */
async function handleStationInput(phone, stationName) {
    const trains = searchTrainsByStation(stationName, 5);
    
    if (trains.length === 0) {
        return await sendMessage(phone, `😕 No trains found from "${stationName}"

Please try:
• Different station name
• Check spelling
• Try popular stations (Majestic, MG Road, etc.)

Or type *CANCEL* to start over.`);
    }
    
    // Store trains in context
    await setContextValue(phone, 'trains', trains);
    await setContextValue(phone, 'station', stationName);
    await transitionTo(phone, STATES.WAITING_TRAIN);
    
    // Format trains list
    let message = `🚇 *Available Trains from "${stationName}"*\n\n`;
    
    trains.forEach((train, index) => {
        message += `*${index + 1}. ${train.title}*\n`;
        message += `🚉 ${train.venue}\n`;
        message += `🕐 ${formatEventDate(train.event_date)}\n`;
        message += `💰 ${formatCurrency(train.price)} per ticket\n`;
        message += `🎫 ${train.available_seats} seats available\n\n`;
    });
    
    message += `Reply with *number (1-${trains.length})* to select train.`;
    
    return await sendMessage(phone, message);
}

/**
 * Handle train selection - ask for quantity
 */
async function handleTrainSelection(phone, selection) {
    const trains = getContextValue(phone, 'trains');
    
    if (!trains || trains.length === 0) {
        await resetToInitial(phone);
        return await sendMessage(phone, '⏱️ Session expired. Type *BOOK* to start again.');
    }
    
    const index = parseInt(selection) - 1;
    
    if (isNaN(index) || index < 0 || index >= trains.length) {
        return await sendMessage(phone, `❌ Invalid selection. Please reply with a number between 1 and ${trains.length}.`);
    }
    
    const selectedTrain = trains[index];
    
    // Store selected train
    await setContextValue(phone, 'selectedTrain', selectedTrain);
    await transitionTo(phone, STATES.WAITING_QTY);
    
    const message = `✅ *Train Selected*

🚇 ${selectedTrain.title}
🚉 ${selectedTrain.venue}
🕐 ${formatEventDate(selectedTrain.event_date)}
💰 ${formatCurrency(selectedTrain.price)} per ticket

━━━━━━━━━━━━━━━━

📝 *How many tickets do you need?*

Enter a number (1-10):`;
    
    return await sendMessage(phone, message);
}

/**
 * Handle quantity input - ask for name
 */
async function handleQuantityInput(phone, quantity) {
    const qty = parseInt(quantity);
    
    if (isNaN(qty) || qty < 1 || qty > 10) {
        return await sendMessage(phone, '❌ Invalid quantity. Please enter a number between 1 and 10.');
    }
    
    const selectedTrain = getContextValue(phone, 'selectedTrain');
    
    if (!selectedTrain) {
        await resetToInitial(phone);
        return await sendMessage(phone, '⏱️ Session expired. Type *BOOK* to start again.');
    }
    
    if (qty > selectedTrain.available_seats) {
        return await sendMessage(phone, `❌ Only ${selectedTrain.available_seats} seats available. Please enter a lower number.`);
    }
    
    // Store quantity
    await setContextValue(phone, 'quantity', qty);
    await transitionTo(phone, STATES.WAITING_NAME);
    
    const totalPrice = selectedTrain.price * qty;
    
    const message = `✅ *${qty} Ticket(s) Selected*

💰 Total Fare: ${formatCurrency(totalPrice)}

━━━━━━━━━━━━━━━━

👤 *Please enter your full name:*

Example: Rahul Kumar`;
    
    return await sendMessage(phone, message);
}

/**
 * Handle name input - show confirmation with balance
 */
async function handleNameInput(phone, name) {
    if (!name || name.trim().length < 3) {
        return await sendMessage(phone, '❌ Please enter a valid full name (at least 3 characters).');
    }
    
    const selectedTrain = getContextValue(phone, 'selectedTrain');
    const quantity = getContextValue(phone, 'quantity');
    
    if (!selectedTrain || !quantity) {
        await resetToInitial(phone);
        return await sendMessage(phone, '⏱️ Session expired. Type *BOOK* to start again.');
    }
    
    // Store name and update metro account
    await setContextValue(phone, 'userName', name.trim());
    updateMetroAccountName(phone, name.trim());
    await transitionTo(phone, STATES.WAITING_CONFIRM);
    
    // Get current balance
    const balance = getMetroBalance(phone);
    const totalPrice = selectedTrain.price * quantity;
    const balanceAfter = balance - totalPrice;
    
    let message = `📋 *Booking Confirmation*\n\n`;
    message += `👤 *Passenger:* ${name.trim()}\n`;
    message += `🚇 *Train:* ${selectedTrain.title}\n`;
    message += `🚉 *Route:* ${selectedTrain.venue}\n`;
    message += `🕐 *Departure:* ${formatEventDate(selectedTrain.event_date)}\n`;
    message += `🎫 *Tickets:* ${quantity}\n`;
    message += `💰 *Fare:* ${formatCurrency(totalPrice)}\n\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    message += `💳 *Metro Account Balance*\n`;
    message += `Current: ${formatCurrency(balance)}\n`;
    
    if (balanceAfter >= 0) {
        message += `After booking: ${formatCurrency(balanceAfter)}\n\n`;
        message += `✅ *Sufficient balance!*\n\n`;
        message += `Reply *YES* to confirm and complete booking.\n`;
        message += `Reply *NO* to cancel.`;
    } else {
        message += `Required: ${formatCurrency(totalPrice)}\n`;
        message += `Shortfall: ${formatCurrency(Math.abs(balanceAfter))}\n\n`;
        message += `❌ *Insufficient balance!*\n\n`;
        message += `Please add ₹${Math.abs(balanceAfter).toFixed(2)} to your metro account.\n`;
        message += `Contact support or visit metro station to recharge.\n\n`;
        message += `Reply *CANCEL* to abort booking.`;
    }
    
    return await sendMessage(phone, message);
}

/**
 * Handle confirmation - complete booking with balance deduction
 */
async function handleConfirmation(phone, response) {
    const answer = response.trim().toUpperCase();
    
    if (answer === 'NO' || answer === 'CANCEL') {
        await resetToInitial(phone);
        return await sendMessage(phone, '❌ Booking cancelled. Type *BOOK* to start a new booking.');
    }
    
    if (answer !== 'YES') {
        return await sendMessage(phone, '❓ Please reply *YES* to confirm or *NO* to cancel.');
    }
    
    // Get booking details
    const selectedTrain = getContextValue(phone, 'selectedTrain');
    const quantity = getContextValue(phone, 'quantity');
    const userName = getContextValue(phone, 'userName');
    
    if (!selectedTrain || !quantity || !userName) {
        await resetToInitial(phone);
        return await sendMessage(phone, '⏱️ Session expired. Type *BOOK* to start again.');
    }
    
    const totalPrice = selectedTrain.price * quantity;
    const balance = getMetroBalance(phone);
    
    // Check balance again
    if (balance < totalPrice) {
        await resetToInitial(phone);
        return await sendMessage(phone, `❌ Insufficient balance (₹${balance.toFixed(2)}). Please recharge and try again.`);
    }
    
    try {
        // Create ticket
        const ticket = await createTicket({
            eventId: selectedTrain.id,
            phone: phone,
            userName: userName,
            quantity: quantity,
            event: selectedTrain
        });
        
        // Deduct balance
        const newBalance = deductMetroBalance(
            phone, 
            totalPrice, 
            `Metro ticket - ${selectedTrain.title}`,
            ticket.bookingId
        );
        
        // Send confirmation
        let confirmMsg = `🎉 *BOOKING CONFIRMED!*\n\n`;
        confirmMsg += `📋 *Booking ID:* ${ticket.bookingId}\n`;
        confirmMsg += `👤 *Passenger:* ${userName}\n`;
        confirmMsg += `🚇 *Train:* ${selectedTrain.title}\n`;
        confirmMsg += `🚉 *Route:* ${selectedTrain.venue}\n`;
        confirmMsg += `🕐 *Departure:* ${formatEventDate(selectedTrain.event_date)}\n`;
        confirmMsg += `🎫 *Tickets:* ${quantity}\n`;
        confirmMsg += `💰 *Fare Paid:* ${formatCurrency(totalPrice)}\n`;
        confirmMsg += `💳 *New Balance:* ${formatCurrency(newBalance)}\n\n`;
        confirmMsg += `━━━━━━━━━━━━━━━━\n\n`;
        confirmMsg += `✅ Amount deducted from your metro account\n`;
        confirmMsg += `📱 QR code sent separately below\n\n`;
        confirmMsg += `*Scan QR at metro entry gate*\n\n`;
        confirmMsg += `Save Booking ID: *${ticket.bookingId}*\n\n`;
        confirmMsg += `Happy journey! 🚇`;
        
        await sendMessage(phone, confirmMsg);
        
        // Send QR code
        if (ticket.qrCodeUrl) {
            console.log(`📤 Sending QR code: ${ticket.qrCodeUrl}`);
            await sendMedia(phone, ticket.qrCodeUrl, `Scan at Metro - ${ticket.bookingId}`);
        }
        
        // Reset session
        await resetToInitial(phone);
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Booking failed:', error);
        await resetToInitial(phone);
        return await sendMessage(phone, `❌ Booking failed: ${error.message}\n\nPlease try again.`);
    }
}

module.exports = {
    STATES,
    startBooking,
    handleStationInput,
    handleTrainSelection,
    handleQuantityInput,
    handleNameInput,
    handleConfirmation
};
