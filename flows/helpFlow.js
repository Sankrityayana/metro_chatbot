/**
 * Help flow
 * Handles help menu and unknown commands
 */

/**
 * Get help menu message
 */
function getHelpMessage() {
    return `🤖 *Welcome to Event Booking Bot!*

Here's what I can help you with:

*🔍 SEARCH EVENTS*
Send: "search [keyword]"
Example: "search mumbai" or "search concert"

*🎫 MY BOOKINGS*
Send: "my bookings"
View all your confirmed bookings

*📋 RETRIEVE BOOKING*
Send your booking ID
Example: "BKG-57RF1A"

*❌ CANCEL*
Send: "cancel"
Cancel current booking flow

*❓ HELP*
Send: "help"
Show this menu

*Quick Tips:*
• Search by city, event name, or date
• Follow the step-by-step booking process
• Save your booking IDs for future reference
• QR codes are valid for entry

Need assistance? Just type your question!`;
}

/**
 * Get unknown command message
 */
function getUnknownCommandMessage() {
    return `❓ I didn't understand that command.

Type *HELP* to see available commands.

Or try:
• "search concert" - to find events
• "my bookings" - to view your tickets
• Send your booking ID to retrieve it`;
}

/**
 * Get welcome message for new users
 */
function getWelcomeMessage() {
    return `👋 *Welcome to Event Booking Bot!*

I can help you discover and book tickets for amazing events!

🎭 Search thousands of events
🎫 Book tickets instantly
📱 Get QR code tickets
✅ Manage your bookings

Type *HELP* to get started or search for an event!

Example: "search rock concert"`;
}

/**
 * Get error message
 */
function getErrorMessage() {
    return `😕 Oops! Something went wrong.

Please try again or type *HELP* for assistance.

If the problem persists, please contact support.`;
}

/**
 * Get session expired message
 */
function getSessionExpiredMessage() {
    return `⏱️ Your session has expired due to inactivity.

No worries! Just start fresh:
• Search for events
• View your bookings
• Or type HELP for options`;
}

/**
 * Get cancel confirmation message
 */
function getCancelMessage() {
    return `❌ Current operation cancelled.

What would you like to do next?
• Search for events
• View bookings
• Type HELP for options`;
}

module.exports = {
    getHelpMessage,
    getUnknownCommandMessage,
    getWelcomeMessage,
    getErrorMessage,
    getSessionExpiredMessage,
    getCancelMessage
};
