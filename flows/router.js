/**
 * Flow router
 * Main message routing logic with state machine
 */

const { getCurrentState, transitionTo, resetToInitial, getContextValue, STATES } = require('../services/session');
const { sendMessage, sendMedia } = require('../services/whatsapp');
const { parseMessage, extractSearchKeywords, parseEventSelection, parseQuantity, parseUserName, extractBookingId, parseConfirmation } = require('./parser');
const { performSearch, formatSearchResults, formatEventDetails, getInvalidSelectionMessage } = require('./searchFlow');
const { createTempReservation, getUserReservation, formatQuantityConfirmation, formatReservationHold, formatNameConfirmation, completeBooking, formatReservationExpired, formatInsufficientSeats, formatInvalidQuantity, formatInvalidName } = require('./bookingFlow');
const { getHelpMessage, getUnknownCommandMessage, getCancelMessage, getWelcomeMessage } = require('./helpFlow');
const { getEventById } = require('../db/queries');
const { formatTicketConfirmation, retrieveTicket, formatTicketDetails } = require('../services/tickets');
const { getBookingsByPhone } = require('../db/queries');
const { formatCurrency, formatShortDate } = require('../services/util');

/**
 * Main message router
 * Routes incoming messages based on current state
 */
async function routeMessage(phone, message) {
    try {
        const parsed = parseMessage(message);
        const currentState = getCurrentState(phone);
        
        console.log(`Routing message from ${phone} in state ${currentState}: "${message}"`);
        
        // Handle global commands that work in any state
        if (parsed.intent === 'HELP') {
            await resetToInitial(phone);
            return await sendMessage(phone, getHelpMessage());
        }
        
        if (parsed.intent === 'CANCEL') {
            await resetToInitial(phone);
            return await sendMessage(phone, getCancelMessage());
        }
        
        // Handle booking ID retrieval
        if (parsed.intent === 'RETRIEVE_BOOKING') {
            return await handleBookingRetrieval(phone, extractBookingId(message));
        }
        
        // Handle "my bookings" command
        if (parsed.intent === 'MY_BOOKINGS') {
            return await handleMyBookings(phone);
        }
        
        // Route based on current state
        switch (currentState) {
            case STATES.NONE:
                return await handleNoneState(phone, parsed);
                
            case STATES.SEARCH:
                return await handleSearchState(phone, parsed);
                
            case STATES.EVENT_SELECTED:
                return await handleEventSelectedState(phone, parsed);
                
            case STATES.QTY:
                return await handleQtyState(phone, parsed);
                
            case STATES.HOLD:
                return await handleHoldState(phone, parsed);
                
            case STATES.USER_NAME:
                return await handleUserNameState(phone, parsed);
                
            default:
                await resetToInitial(phone);
                return await sendMessage(phone, getWelcomeMessage());
        }
    } catch (error) {
        console.error('Routing error:', error);
        await resetToInitial(phone);
        return await sendMessage(phone, 'An error occurred. Please try again.');
    }
}

/**
 * Handle NONE state (initial state)
 */
async function handleNoneState(phone, parsed) {
    if (parsed.intent === 'SEARCH' || (!parsed.isCommand && parsed.cleaned.length > 0)) {
        // Extract search keywords
        const keywords = parsed.intent === 'SEARCH' 
            ? extractSearchKeywords(parsed.cleaned)
            : parsed.cleaned;
        
        if (keywords.length === 0) {
            return await sendMessage(phone, 'Please provide search keywords.\n\nExample: "search mumbai concerts"');
        }
        
        // Perform search
        const results = performSearch(keywords);
        const message = formatSearchResults(results, keywords);
        
        if (results.length > 0) {
            // Store search results in context and transition to SEARCH state
            await transitionTo(phone, STATES.SEARCH, { searchResults: results, keywords });
        }
        
        return await sendMessage(phone, message);
    }
    
    // Unknown command - show welcome
    return await sendMessage(phone, getWelcomeMessage());
}

/**
 * Handle SEARCH state (user viewing search results)
 */
async function handleSearchState(phone, parsed) {
    const searchResults = getContextValue(phone, 'searchResults') || [];
    
    // Parse event selection
    const selection = parseEventSelection(parsed.cleaned);
    
    if (selection && selection <= searchResults.length) {
        const selectedEvent = searchResults[selection - 1];
        
        // Store selected event and transition to EVENT_SELECTED
        await transitionTo(phone, STATES.EVENT_SELECTED, { 
            selectedEvent,
            selectedEventId: selectedEvent.id 
        });
        
        const message = formatEventDetails(selectedEvent);
        return await sendMessage(phone, message);
    }
    
    // Invalid selection
    const message = getInvalidSelectionMessage(searchResults.length);
    return await sendMessage(phone, message);
}

/**
 * Handle EVENT_SELECTED state (user viewing event details)
 */
async function handleEventSelectedState(phone, parsed) {
    const quantity = parseQuantity(parsed.cleaned);
    
    if (!quantity) {
        return await sendMessage(phone, formatInvalidQuantity());
    }
    
    const selectedEventId = getContextValue(phone, 'selectedEventId');
    const selectedEvent = getEventById(selectedEventId);
    
    if (!selectedEvent) {
        await resetToInitial(phone);
        return await sendMessage(phone, 'Event not found. Please search again.');
    }
    
    // Check seat availability
    if (selectedEvent.available_seats < quantity) {
        return await sendMessage(phone, formatInsufficientSeats(selectedEvent.available_seats, quantity));
    }
    
    // Store quantity and transition to QTY
    await transitionTo(phone, STATES.QTY, { quantity });
    
    const message = formatQuantityConfirmation(selectedEvent, quantity);
    return await sendMessage(phone, message);
}

/**
 * Handle QTY state (quantity selected, waiting for name)
 */
async function handleQtyState(phone, parsed) {
    const userName = parseUserName(parsed.cleaned);
    
    if (!userName) {
        return await sendMessage(phone, formatInvalidName());
    }
    
    // Create reservation
    const selectedEventId = getContextValue(phone, 'selectedEventId');
    const quantity = getContextValue(phone, 'quantity');
    
    const result = createTempReservation(selectedEventId, phone, quantity);
    
    if (!result.success) {
        await resetToInitial(phone);
        return await sendMessage(phone, `❌ Reservation failed: ${result.error}\n\nPlease try again.`);
    }
    
    // Store reservation info and transition to HOLD
    await transitionTo(phone, STATES.HOLD, { 
        userName,
        reservationId: result.reservationId
    });
    
    // Get reservation details
    const reservation = getUserReservation(phone);
    
    if (!reservation) {
        await resetToInitial(phone);
        return await sendMessage(phone, 'Reservation failed. Please try again.');
    }
    
    const message = formatNameConfirmation(userName, reservation);
    return await sendMessage(phone, message);
}

/**
 * Handle HOLD state (reservation created, waiting for confirmation)
 */
async function handleHoldState(phone, parsed) {
    const confirmation = parseConfirmation(parsed.cleaned);
    
    if (confirmation === null) {
        return await sendMessage(phone, '❌ Please reply *YES* to confirm or *NO* to cancel.');
    }
    
    if (!confirmation) {
        await resetToInitial(phone);
        return await sendMessage(phone, getCancelMessage());
    }
    
    // Get reservation
    const reservation = getUserReservation(phone);
    
    if (!reservation) {
        await resetToInitial(phone);
        return await sendMessage(phone, formatReservationExpired());
    }
    
    // Complete booking
    const userName = getContextValue(phone, 'userName');
    const result = await completeBooking(reservation, userName);
    
    if (!result.success) {
        await resetToInitial(phone);
        return await sendMessage(phone, `❌ Booking failed: ${result.error}\n\nPlease try again.`);
    }
    
    // Send confirmation message
    const confirmMessage = formatTicketConfirmation(result.ticket);
    await sendMessage(phone, confirmMessage);
    
    // Send QR code if available
    if (result.ticket.qrCodeUrl) {
        await sendMedia(phone, result.ticket.qrCodeUrl, `QR Code for ${result.ticket.bookingId}`);
    }
    
    // Reset session
    await resetToInitial(phone);
    
    return { success: true };
}

/**
 * Handle USER_NAME state (alternative flow)
 */
async function handleUserNameState(phone, parsed) {
    // Similar to QTY state
    return await handleQtyState(phone, parsed);
}

/**
 * Handle booking retrieval by ID
 */
async function handleBookingRetrieval(phone, bookingId) {
    if (!bookingId) {
        return await sendMessage(phone, '❌ Invalid booking ID format.\n\nExample: BKG-57RF1A');
    }
    
    const ticket = retrieveTicket(bookingId);
    
    if (!ticket) {
        return await sendMessage(phone, `❌ Booking ${bookingId} not found.\n\nPlease check the ID and try again.`);
    }
    
    const message = formatTicketDetails(ticket);
    await sendMessage(phone, message);
    
    // Send QR code if available
    if (ticket.qrCodeUrl) {
        await sendMedia(phone, ticket.qrCodeUrl, `QR Code for ${bookingId}`);
    }
    
    return { success: true };
}

/**
 * Handle "my bookings" request
 */
async function handleMyBookings(phone) {
    const bookings = getBookingsByPhone(phone);
    
    if (bookings.length === 0) {
        return await sendMessage(phone, '📭 You have no bookings yet.\n\nType *SEARCH* to find events!');
    }
    
    let message = `📋 *Your Bookings (${bookings.length})*\n\n`;
    
    bookings.forEach((booking, index) => {
        message += `${index + 1}. *${booking.booking_id}*\n`;
        message += `   🎭 ${booking.title}\n`;
        message += `   📅 ${formatShortDate(booking.event_date)}\n`;
        message += `   🎫 ${booking.quantity} ticket(s) • ${formatCurrency(booking.total_price)}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━\n\n`;
    message += `To view details, send the booking ID.\nExample: ${bookings[0].booking_id}`;
    
    return await sendMessage(phone, message);
}

module.exports = {
    routeMessage
};
