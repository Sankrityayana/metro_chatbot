/**
 * Cron job to expire old reservations
 * Runs every 1 minute to release expired seat holds
 */

const cron = require('node-cron');
const { expireOldReservations } = require('../db/queries');

/**
 * Start the reservation expiration cron job
 */
function startExpirationJob() {
    // Run every 1 minute
    const job = cron.schedule('* * * * *', () => {
        try {
            const expiredCount = expireOldReservations();
            
            if (expiredCount > 0) {
                console.log(`✅ Expired ${expiredCount} reservation(s) and released seats`);
            }
        } catch (error) {
            console.error('❌ Expiration cron job failed:', error);
        }
    });
    
    console.log('✅ Reservation expiration cron job started (runs every 1 minute)');
    
    return job;
}

/**
 * Manually trigger expiration (for testing)
 */
function manualExpiration() {
    try {
        const expiredCount = expireOldReservations();
        console.log(`Manually expired ${expiredCount} reservation(s)`);
        return expiredCount;
    } catch (error) {
        console.error('Manual expiration failed:', error);
        return 0;
    }
}

module.exports = {
    startExpirationJob,
    manualExpiration
};
