/**
 * Session management service
 * Manages user conversation state across messages
 */

const { getOrCreateSession, updateSession, resetSession } = require('../db/queries');

// State machine states
const STATES = {
    NONE: 'NONE',
    SEARCH: 'SEARCH',
    EVENT_SELECTED: 'EVENT_SELECTED',
    QTY: 'QTY',
    HOLD: 'HOLD',
    USER_NAME: 'USER_NAME',
    CONFIRMED: 'CONFIRMED'
};

/**
 * Get user session
 */
function getUserSession(phone) {
    try {
        return getOrCreateSession(phone);
    } catch (error) {
        console.error('Error getting session:', error);
        return {
            phone,
            state: STATES.NONE,
            context: {}
        };
    }
}

/**
 * Update user session state
 */
function setSessionState(phone, state, context = {}) {
    try {
        // Merge existing context with new context
        const session = getUserSession(phone);
        const mergedContext = { ...session.context, ...context };
        
        return updateSession(phone, state, mergedContext);
    } catch (error) {
        console.error('Error updating session:', error);
        return false;
    }
}

/**
 * Get session context value
 */
function getContextValue(phone, key) {
    const session = getUserSession(phone);
    return session.context[key];
}

/**
 * Set session context value
 */
function setContextValue(phone, key, value) {
    const session = getUserSession(phone);
    const newContext = { ...session.context, [key]: value };
    return updateSession(phone, session.state, newContext);
}

/**
 * Clear user session
 */
function clearSession(phone) {
    try {
        return resetSession(phone);
    } catch (error) {
        console.error('Error clearing session:', error);
        return false;
    }
}

/**
 * Check if user is in a flow
 */
function isInFlow(phone) {
    const session = getUserSession(phone);
    return session.state !== STATES.NONE;
}

/**
 * Get current state
 */
function getCurrentState(phone) {
    const session = getUserSession(phone);
    return session.state;
}

/**
 * Transition to next state
 */
function transitionTo(phone, newState, context = {}) {
    console.log(`State transition: ${getCurrentState(phone)} -> ${newState}`);
    return setSessionState(phone, newState, context);
}

/**
 * Reset to initial state
 */
function resetToInitial(phone) {
    console.log(`Resetting session for ${phone}`);
    return clearSession(phone);
}

/**
 * Get session summary for debugging
 */
function getSessionSummary(phone) {
    const session = getUserSession(phone);
    return {
        phone: session.phone,
        state: session.state,
        contextKeys: Object.keys(session.context),
        lastActivity: session.last_activity
    };
}

module.exports = {
    STATES,
    getUserSession,
    setSessionState,
    getContextValue,
    setContextValue,
    clearSession,
    isInFlow,
    getCurrentState,
    transitionTo,
    resetToInitial,
    getSessionSummary
};
