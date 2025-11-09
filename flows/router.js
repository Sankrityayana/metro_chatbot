/**
 * Flow router
 * Main message routing logic with state machine
 */

const { getCurrentState, transitionTo, resetToInitial, getContextValue, setContextValue, STATES } = require('../services/session');
const { sendMessage, sendMedia } = require('../services/whatsapp');
const { parseMessage, extractSearchKeywords, parseEventSelection, parseQuantity, parseUserName, extractBookingId, parseConfirmation } = require('./parser');
const { performSearch, formatSearchResults, formatEventDetails, getInvalidSelectionMessage } = require('./searchFlow');
const { createTempReservation, getUserReservation, formatQuantityConfirmation, formatReservationHold, formatNameConfirmation, completeBooking, formatReservationExpired, formatInsufficientSeats, formatInvalidQuantity, formatInvalidName } = require('./bookingFlow');
const { getHelpMessage, getUnknownCommandMessage, getCancelMessage, getWelcomeMessage } = require('./helpFlow');
const { getEventById } = require('../db/queries');
const { formatTicketConfirmation, retrieveTicket, formatTicketDetails } = require('../services/tickets');
const { getBookingsByPhone } = require('../db/queries');
const { formatCurrency, formatShortDate } = require('../services/util');

// Import new metro booking flow
const {
    getStationPromptMessage,
    searchAndFormatTrainsByStation,
    getQuantityPromptMessage,
    getNamePromptMessage,
    getConfirmationMessage,
    processBookingPayment,
    formatBookingSuccess,
    parseTrainSelection,
    parseQuantity: parseQty,
    parseConfirmation: parseConfirm,
    validateName
} = require('./metroBookingFlow');

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
        
        // Handle BOOK command - start new booking flow
        if (parsed.intent === 'BOOK' || message.trim().toLowerCase() === 'book') {
            await resetToInitial(phone);
            await transitionTo(phone, STATES.BOOK_STATION, {});
            return await sendMessage(phone, getStationPromptMessage());
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
            
            case STATES.BOOK_STATION:
                return await handleBookStationState(phone, parsed);
            
            case STATES.BOOK_TRAIN:
                return await handleBookTrainState(phone, parsed);
            
            case STATES.BOOK_QTY:
                return await handleBookQtyState(phone, parsed);
            
            case STATES.BOOK_NAME:
                return await handleBookNameState(phone, parsed);
            
            case STATES.BOOK_CONFIRM:
                return await handleBookConfirmState(phone, parsed);
                
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
    
    // Send QR code - try URL first, fallback to buffer
    try {
        if (result.ticket.qrCodeUrl) {
            console.log(`📤 Sending QR code URL: ${result.ticket.qrCodeUrl}`);
            await sendMedia(phone, result.ticket.qrCodeUrl, `QR Code - ${result.ticket.bookingId}`);
        } else {
            console.log('⚠️ No QR code URL available, QR code should be saved locally');
        }
    } catch (error) {
        console.error('❌ Failed to send QR code:', error.message);
        await sendMessage(phone, `⚠️ QR code generation issue. Your booking ${result.ticket.bookingId} is confirmed. Please contact support.`);
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
        return await sendMessage(phone, '📭 You have no bookings yet.\n\nType *BOOK* to book a ticket!');
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

// ============================================
// NEW METRO BOOKING FLOW HANDLERS
// ============================================

/**
 * Handle BOOK_STATION state - User enters station name
 */
async function handleBookStationState(phone, parsed) {
    const stationName = parsed.cleaned;
    
    if (!stationName || stationName.length < 2) {
        return await sendMessage(phone, '❌ Please enter a valid station name.\n\nExample: Majestic, MG Road, Indiranagar');
    }
    
    // Search trains from this station
    const result = searchAndFormatTrainsByStation(stationName);
    
    if (!result.success) {
        return await sendMessage(phone, result.message);
    }
    
    // Store trains in context and move to BOOK_TRAIN state
    await transitionTo(phone, STATES.BOOK_TRAIN, { 
        trains: result.trains,
        stationName 
    });
    
    return await sendMessage(phone, result.message);
}

/**
 * Handle BOOK_TRAIN state - User selects train number
 */
async function handleBookTrainState(phone, parsed) {
    const trains = getContextValue(phone, 'trains');
    
    if (!trains || trains.length === 0) {
        await resetToInitial(phone);
        return await sendMessage(phone, '❌ Session expired. Type *BOOK* to start again.');
    }
    
    const selection = parseTrainSelection(parsed.cleaned, trains.length);
    
    if (selection === null) {
        return await sendMessage(phone, `❌ Invalid selection.\n\nPlease reply with a number between 1 and ${trains.length}.`);
    }
    
    const selectedTrain = trains[selection];
    
    // Store selected train and move to quantity state
    await transitionTo(phone, STATES.BOOK_QTY, { 
        selectedTrain,
        trains: null  // Clear trains array
    });
    
    return await sendMessage(phone, getQuantityPromptMessage(selectedTrain));
}

/**
 * Handle BOOK_QTY state - User enters number of tickets
 */
async function handleBookQtyState(phone, parsed) {
    const quantity = parseQty(parsed.cleaned);
    
    if (quantity === null) {
        return await sendMessage(phone, '❌ Invalid quantity.\n\nPlease enter a number between 1 and 10.');
    }
    
    const selectedTrain = getContextValue(phone, 'selectedTrain');
    
    if (!selectedTrain) {
        await resetToInitial(phone);
        return await sendMessage(phone, '❌ Session expired. Type *BOOK* to start again.');
    }
    
    // Check if enough seats available
    if (quantity > selectedTrain.available_seats) {
        return await sendMessage(phone, `❌ Only ${selectedTrain.available_seats} seats available.\n\nPlease enter a smaller number.`);
    }
    
    // Store quantity and move to name state
    await transitionTo(phone, STATES.BOOK_NAME, { quantity });
    
    return await sendMessage(phone, getNamePromptMessage(selectedTrain, quantity));
}

/**
 * Handle BOOK_NAME state - User enters their name
 */
async function handleBookNameState(phone, parsed) {
    const validation = validateName(parsed.cleaned);
    
    if (!validation.valid) {
        return await sendMessage(phone, `❌ ${validation.error}\n\nPlease enter your full name.\nExample: "Rahul Kumar"`);
    }
    
    const userName = validation.name;
    const selectedTrain = getContextValue(phone, 'selectedTrain');
    const quantity = getContextValue(phone, 'quantity');
    
    if (!selectedTrain || !quantity) {
        await resetToInitial(phone);
        return await sendMessage(phone, '❌ Session expired. Type *BOOK* to start again.');
    }
    
    // Get confirmation message with balance check
    const confirmResult = await getConfirmationMessage(phone, selectedTrain, quantity, userName);
    
    // Store user name
    await transitionTo(phone, STATES.BOOK_CONFIRM, { userName });
    
    // Send confirmation message
    await sendMessage(phone, confirmResult.message);
    
    // If insufficient balance, reset session
    if (!confirmResult.hasBalance) {
        await resetToInitial(phone);
    }
    
    return { success: true };
}

/**
 * Handle BOOK_CONFIRM state - User confirms booking (YES/NO)
 */
async function handleBookConfirmState(phone, parsed) {
    const confirmation = parseConfirm(parsed.cleaned);
    
    if (confirmation === null) {
        return await sendMessage(phone, '❌ Please reply *YES* to confirm or *NO* to cancel.');
    }
    
    if (!confirmation) {
        await resetToInitial(phone);
        return await sendMessage(phone, '❌ Booking cancelled.\n\nType *BOOK* to start a new booking.');
    }
    
    // Get booking details from context
    const selectedTrain = getContextValue(phone, 'selectedTrain');
    const quantity = getContextValue(phone, 'quantity');
    const userName = getContextValue(phone, 'userName');
    
    if (!selectedTrain || !quantity || !userName) {
        await resetToInitial(phone);
        return await sendMessage(phone, '❌ Session expired. Type *BOOK* to start again.');
    }
    
    // Process payment and create booking
    const result = await processBookingPayment(phone, selectedTrain, quantity, userName);
    
    if (!result.success) {
        await resetToInitial(phone);
        return await sendMessage(phone, `❌ Booking failed: ${result.error}\n\nPlease try again.`);
    }
    
    // Send success message
    const successMessage = formatBookingSuccess(result.ticket, result.amountDeducted, result.newBalance);
    await sendMessage(phone, successMessage);
    
    // Send QR code
    try {
        if (result.ticket.qrCodeUrl) {
            console.log(`📤 Sending QR code URL: ${result.ticket.qrCodeUrl}`);
            await sendMedia(phone, result.ticket.qrCodeUrl, `QR Code - ${result.ticket.bookingId}`);
        } else {
            console.log('⚠️ No QR code URL available');
        }
    } catch (error) {
        console.error('❌ Failed to send QR code:', error.message);
        await sendMessage(phone, `⚠️ QR code will be available shortly. Use booking ID: ${result.ticket.bookingId}`);
    }
    
    // Reset session
    await resetToInitial(phone);
    
    return { success: true };
}

module.exports = {
    routeMessage
};
