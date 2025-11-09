/**
 * Admin API routes
 * Protected endpoints for event and booking management
 */

const express = require('express');
const router = express.Router();
const { validateAdminAuth, validateEventData, validatePagination, validateBookingId } = require('./validator');
const {
    getAllEvents,
    createEvent,
    updateEvent,
    getEventById,
    getAllBookings,
    getBookingByFriendlyId,
    cancelBooking,
    getMetrics
} = require('../db/queries');

// Apply admin authentication to all routes
router.use(validateAdminAuth);

// ============================================
// EVENT MANAGEMENT
// ============================================

/**
 * GET /admin/events
 * List all events
 */
router.get('/events', (req, res) => {
    try {
        const { activeOnly } = req.query;
        const events = getAllEvents(activeOnly !== 'false');
        
        res.json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        console.error('Failed to fetch events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

/**
 * GET /admin/events/:id
 * Get single event by ID
 */
router.get('/events/:id', (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const event = getEventById(eventId);
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error('Failed to fetch event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

/**
 * POST /admin/events
 * Create new event
 */
router.post('/events', (req, res) => {
    try {
        const validation = validateEventData(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: validation.errors 
            });
        }
        
        const eventId = createEvent(req.body);
        const event = getEventById(eventId);
        
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: event
        });
    } catch (error) {
        console.error('Failed to create event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

/**
 * PUT /admin/events/:id
 * Update event
 */
router.put('/events/:id', (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const validation = validateEventData(req.body, true);
        
        if (!validation.valid) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: validation.errors 
            });
        }
        
        const updated = updateEvent(eventId, req.body);
        
        if (!updated) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        const event = getEventById(eventId);
        
        res.json({
            success: true,
            message: 'Event updated successfully',
            data: event
        });
    } catch (error) {
        console.error('Failed to update event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// ============================================
// BOOKING MANAGEMENT
// ============================================

/**
 * GET /admin/bookings
 * List all bookings
 */
router.get('/bookings', (req, res) => {
    try {
        const { page, limit } = validatePagination(req.query);
        const bookings = getAllBookings(limit);
        
        res.json({
            success: true,
            count: bookings.length,
            page,
            limit,
            data: bookings
        });
    } catch (error) {
        console.error('Failed to fetch bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

/**
 * GET /admin/bookings/:bookingId
 * Get single booking by friendly ID
 */
router.get('/bookings/:bookingId', (req, res) => {
    try {
        const { bookingId } = req.params;
        
        if (!validateBookingId(bookingId)) {
            return res.status(400).json({ error: 'Invalid booking ID format' });
        }
        
        const booking = getBookingByFriendlyId(bookingId);
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Failed to fetch booking:', error);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});

/**
 * DELETE /admin/bookings/:bookingId
 * Cancel booking
 */
router.delete('/bookings/:bookingId', (req, res) => {
    try {
        const { bookingId } = req.params;
        
        if (!validateBookingId(bookingId)) {
            return res.status(400).json({ error: 'Invalid booking ID format' });
        }
        
        const cancelled = cancelBooking(bookingId);
        
        if (!cancelled) {
            return res.status(404).json({ error: 'Booking not found or already cancelled' });
        }
        
        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            bookingId
        });
    } catch (error) {
        console.error('Failed to cancel booking:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

// ============================================
// METRICS
// ============================================

/**
 * GET /admin/metrics
 * Get system metrics
 */
router.get('/metrics', (req, res) => {
    try {
        const metrics = getMetrics();
        
        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('Failed to fetch metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

module.exports = router;
