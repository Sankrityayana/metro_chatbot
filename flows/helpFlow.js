/**
 * Help flow
 * Handles help menu and unknown commands
 */

/**
 * Get help menu message
 */
function getHelpMessage() {
    return `🚇 *Welcome to Bangalore Metro Booking Bot!*

Here's what I can help you with:

*🎫 BOOK TICKET*
Send: "book"
Quick metro ticket booking with instant payment

*🔍 SEARCH TRAINS*
Send: "search [station/route/time]"
Example: "search majestic" or "search purple line"

*📋 MY BOOKINGS*
Send: "my bookings"
View all your metro tickets

*🎟️ RETRIEVE TICKET*
Send your booking ID
Example: "BKG-57RF1A"

*❌ CANCEL*
Send: "cancel"
Cancel current booking flow

*❓ HELP*
Send: "help"
Show this menu

*Quick Start:*
Just type *BOOK* and follow the steps!

Need help? Just ask!`;
}

/**
 * Get unknown command message
 */
function getUnknownCommandMessage() {
    return `❓ I didn't understand that command.

Type *HELP* to see available commands.

Or try:
• "search majestic" - to find trains
• "my bookings" - to view your tickets
• Send your booking ID to retrieve it`;
}

/**
 * Get welcome message for new users
 */
function getWelcomeMessage() {
    return `👋 *Welcome to Bangalore Metro Booking Bot!*

Book your metro tickets instantly via WhatsApp!

🚇 Quick booking with "BOOK" command
🎫 Instant payment from metro balance
📱 Get QR code for metro entry
✅ View and manage bookings

*To get started:*
Type *BOOK* to book a ticket now!

Or type *HELP* for all options.`;
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
• Search for trains
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
