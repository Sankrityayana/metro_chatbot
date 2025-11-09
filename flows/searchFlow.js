/**
 * Search flow
 * Handles event search functionality
 */

const { searchEvents } = require('../db/queries');
const { formatEventDate, formatCurrency, truncate } = require('../services/util');

/**
 * Search for events by keyword
 */
function performSearch(keyword) {
    try {
        const maxResults = parseInt(process.env.MAX_SEARCH_RESULTS) || 3;
        const results = searchEvents(keyword, maxResults);
        
        return results;
    } catch (error) {
        console.error('Search failed:', error);
        return [];
    }
}

/**
 * Format search results for WhatsApp message
 */
function formatSearchResults(results, keyword) {
    if (results.length === 0) {
        return getNoResultsMessage(keyword);
    }
    
    let message = `� *Metro Trains for "${keyword}"*\n\n`;
    message += `Found ${results.length} train(s):\n\n`;
    
    results.forEach((event, index) => {
        message += `*${index + 1}. ${event.title}*\n`;
        message += `� ${event.venue}\n`;
        message += `� Departure: ${formatEventDate(event.event_date)}\n`;
        message += `💰 ${formatCurrency(event.price)} per ticket\n`;
        message += `🎫 ${event.available_seats} seats available\n`;
        
        if (event.description) {
            message += `ℹ️ ${truncate(event.description, 80)}\n`;
        }
        
        message += `\n`;
    });
    
    message += `Reply with the number (1-${results.length}) to book your ticket.`;
    
    return message;
}

/**
 * Format single event details
 */
function formatEventDetails(event) {
    let message = `🚇 *${event.title}*\n\n`;
    
    if (event.description) {
        message += `${event.description}\n\n`;
    }
    
    message += `� *Route:*\n${event.venue}\n\n`;
    message += `� *Departure Time:*\n${formatEventDate(event.event_date)}\n\n`;
    message += `💰 *Fare:* ${formatCurrency(event.price)} per ticket\n`;
    message += `🎫 *Available Seats:* ${event.available_seats}\n\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    message += `Ready to book? Reply with number of tickets (1-10).`;
    
    return message;
}

/**
 * Get no results message
 */
function getNoResultsMessage(keyword) {
    return `😕 No trains found for "${keyword}"

Try:
• Station names (Majestic, Indiranagar, MG Road)
• Metro lines (Purple Line, Green Line)
• Route names

Or type *HELP* to see all options.`;
}

/**
 * Get invalid selection message
 */
function getInvalidSelectionMessage(maxNumber) {
    return `❌ Invalid selection.

Please reply with a number between 1 and ${maxNumber}.

Or type *CANCEL* to start over.`;
}

/**
 * Get search prompt message
 */
function getSearchPromptMessage() {
    return `🔍 *Search Metro Trains*

Which train are you looking for?

Examples:
• "majestic"
• "purple line"
• "mg road"
• "indiranagar"

Type your search:`;
}

module.exports = {
    performSearch,
    formatSearchResults,
    formatEventDetails,
    getNoResultsMessage,
    getInvalidSelectionMessage,
    getSearchPromptMessage
};
