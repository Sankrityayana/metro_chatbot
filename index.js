/**
 * Main Express application
 * WhatsApp Ticketing Chatbot Backend
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Import services
const { parseIncomingMessage } = require('./services/whatsapp');
const { routeMessage } = require('./flows/router');
const { startExpirationJob } = require('./cron/expireReservations');
const adminRoutes = require('./admin/adminRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// ============================================
// WEBHOOK ENDPOINT
// ============================================

/**
 * POST /webhook
 * Receives incoming WhatsApp messages from Twilio or Cloud API
 */
app.post('/webhook', async (req, res) => {
    try {
        console.log('📩 Incoming webhook:', JSON.stringify(req.body, null, 2));
        
        // Parse incoming message (supports both Twilio and Cloud API)
        const inbound = parseIncomingMessage(req.body);
        
        if (!inbound || !inbound.phone || !inbound.message) {
            console.warn('Invalid webhook payload - missing phone or message');
            return res.status(200).send('OK'); // Return 200 to avoid retries
        }
        
        console.log(`📱 Message from ${inbound.phone}: "${inbound.message}"`);
        
        // Route message through flow logic
        await routeMessage(inbound.phone, inbound.message);
        
        // Always return 200 OK to acknowledge receipt
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        
        // Still return 200 to avoid webhook retries
        res.status(200).send('OK');
    }
});

/**
 * GET /webhook
 * WhatsApp Cloud API webhook verification
 */
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    // Verify token (you can set this in .env)
    const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'your_verify_token_here';
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

// ============================================
// ADMIN API ROUTES
// ============================================

app.use('/admin', adminRoutes);

// ============================================
// QR CODE SERVING
// ============================================

/**
 * GET /qr/:filename
 * Serve QR code images
 */
app.get('/qr/:filename', (req, res) => {
    try {
        const qrDir = path.join(__dirname, 'qr_codes');
        const filePath = path.join(qrDir, req.params.filename);
        
        // Security check - prevent directory traversal
        if (!filePath.startsWith(qrDir)) {
            return res.status(403).send('Forbidden');
        }
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('QR code not found');
        }
        
        res.sendFile(filePath);
    } catch (error) {
        console.error('QR code serving error:', error);
        res.status(500).send('Error serving QR code');
    }
});

// ============================================
// HEALTH CHECK
// ============================================

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * GET /
 * Root endpoint
 */
app.get('/', (req, res) => {
    res.json({
        service: 'WhatsApp Ticketing Chatbot',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            webhook: '/webhook',
            admin: '/admin',
            health: '/health'
        }
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// START SERVER
// ============================================

// Ensure QR codes directory exists
const qrDir = path.join(__dirname, 'qr_codes');
if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true });
}

// Start cron jobs
startExpirationJob();

// Start server
app.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 WhatsApp Ticketing Chatbot');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
    console.log(`📱 WhatsApp Provider: ${process.env.WHATSAPP_PROVIDER || 'twilio'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Endpoints:');
    console.log(`  POST /webhook - WhatsApp webhook`);
    console.log(`  GET  /admin/events - Event management`);
    console.log(`  GET  /admin/bookings - Booking management`);
    console.log(`  GET  /health - Health check`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
