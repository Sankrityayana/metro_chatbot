/**
 * Input validation middleware and helpers
 */

/**
 * Validate admin authentication
 */
function validateAdminAuth(req, res, next) {
    const adminSecret = process.env.ADMIN_SECRET;
    
    if (!adminSecret) {
        return res.status(500).json({ error: 'Admin authentication not configured' });
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }
    
    // Support "Bearer <token>" or just "<token>"
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;
    
    if (token !== adminSecret) {
        return res.status(403).json({ error: 'Invalid admin credentials' });
    }
    
    next();
}

/**
 * Validate event creation/update data
 */
function validateEventData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate || data.title !== undefined) {
        if (!data.title || data.title.trim().length < 3) {
            errors.push('Title must be at least 3 characters');
        }
    }
    
    if (!isUpdate || data.city !== undefined) {
        if (!data.city || data.city.trim().length < 2) {
            errors.push('City is required');
        }
    }
    
    if (!isUpdate || data.venue !== undefined) {
        if (!data.venue || data.venue.trim().length < 3) {
            errors.push('Venue is required');
        }
    }
    
    if (!isUpdate || data.event_date !== undefined) {
        if (!data.event_date) {
            errors.push('Event date is required');
        } else {
            const date = new Date(data.event_date);
            if (isNaN(date.getTime())) {
                errors.push('Invalid event date format');
            }
        }
    }
    
    if (!isUpdate || data.total_seats !== undefined) {
        const seats = parseInt(data.total_seats);
        if (isNaN(seats) || seats < 1) {
            errors.push('Total seats must be a positive number');
        }
    }
    
    if (!isUpdate || data.price !== undefined) {
        const price = parseFloat(data.price);
        if (isNaN(price) || price < 0) {
            errors.push('Price must be a non-negative number');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate pagination parameters
 */
function validatePagination(query) {
    let page = parseInt(query.page) || 1;
    let limit = parseInt(query.limit) || 20;
    
    // Constraints
    page = Math.max(1, page);
    limit = Math.min(100, Math.max(1, limit));
    
    return { page, limit };
}

/**
 * Validate booking ID format
 */
function validateBookingId(bookingId) {
    return /^BKG-[A-Z0-9]{6}$/.test(bookingId);
}

module.exports = {
    validateAdminAuth,
    validateEventData,
    validatePagination,
    validateBookingId
};
