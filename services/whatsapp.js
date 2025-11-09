/**
 * WhatsApp messaging service
 * Handles sending messages via Twilio or WhatsApp Cloud API
 */

const axios = require('axios');
const twilio = require('twilio');
const { normalizePhone } = require('./util');

// Initialize Twilio client (lazy initialization)
let twilioClient = null;

function getTwilioClient() {
    if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
    return twilioClient;
}

/**
 * Send text message via Twilio
 */
async function sendViaTwilio(to, message) {
    try {
        const client = getTwilioClient();
        
        if (!client) {
            throw new Error('Twilio client not configured');
        }
        
        const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
        const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
        
        const result = await client.messages.create({
            body: message,
            from: from,
            to: toNumber
        });
        
        console.log(`✅ Message sent via Twilio: ${result.sid}`);
        return { success: true, messageId: result.sid };
    } catch (error) {
        console.error('❌ Twilio send failed:', error.message);
        throw error;
    }
}

/**
 * Send text message via WhatsApp Cloud API
 */
async function sendViaCloudAPI(to, message) {
    try {
        const url = `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalizePhone(to),
            type: 'text',
            text: {
                preview_url: false,
                body: message
            }
        };
        
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`✅ Message sent via Cloud API: ${response.data.messages[0].id}`);
        return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
        console.error('❌ Cloud API send failed:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Send media message (image) via WhatsApp Cloud API
 */
async function sendMediaViaCloudAPI(to, mediaUrl, caption = '') {
    try {
        const url = `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalizePhone(to),
            type: 'image',
            image: {
                link: mediaUrl,
                caption: caption
            }
        };
        
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`✅ Media sent via Cloud API: ${response.data.messages[0].id}`);
        return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
        console.error('❌ Cloud API media send failed:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Send media message via Twilio
 */
async function sendMediaViaTwilio(to, mediaUrl) {
    try {
        const client = getTwilioClient();
        
        if (!client) {
            throw new Error('Twilio client not configured');
        }
        
        const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
        const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
        
        const result = await client.messages.create({
            from: from,
            to: toNumber,
            mediaUrl: [mediaUrl]
        });
        
        console.log(`✅ Media sent via Twilio: ${result.sid}`);
        return { success: true, messageId: result.sid };
    } catch (error) {
        console.error('❌ Twilio media send failed:', error.message);
        throw error;
    }
}

/**
 * Main send message function (provider-agnostic)
 */
async function sendMessage(to, message) {
    const provider = process.env.WHATSAPP_PROVIDER || 'twilio';
    
    try {
        if (provider === 'cloud') {
            return await sendViaCloudAPI(to, message);
        } else {
            return await sendViaTwilio(to, message);
        }
    } catch (error) {
        console.error(`Failed to send message to ${to}:`, error.message);
        // Don't throw - log and continue
        return { success: false, error: error.message };
    }
}

/**
 * Send media message (provider-agnostic)
 */
async function sendMedia(to, mediaUrl, caption = '') {
    const provider = process.env.WHATSAPP_PROVIDER || 'twilio';
    
    try {
        if (provider === 'cloud') {
            return await sendMediaViaCloudAPI(to, mediaUrl, caption);
        } else {
            return await sendMediaViaTwilio(to, mediaUrl);
        }
    } catch (error) {
        console.error(`Failed to send media to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Parse incoming webhook from Twilio
 */
function parseTwilioWebhook(body) {
    return {
        phone: body.From?.replace('whatsapp:', '') || '',
        message: body.Body || '',
        waMessageId: body.MessageSid || '',
        provider: 'twilio'
    };
}

/**
 * Parse incoming webhook from WhatsApp Cloud API
 */
function parseCloudAPIWebhook(body) {
    try {
        const entry = body.entry?.[0];
        const change = entry?.changes?.[0];
        const message = change?.value?.messages?.[0];
        
        if (!message) {
            return null;
        }
        
        return {
            phone: message.from || '',
            message: message.text?.body || '',
            waMessageId: message.id || '',
            provider: 'cloud'
        };
    } catch (error) {
        console.error('Failed to parse Cloud API webhook:', error);
        return null;
    }
}

/**
 * Unified webhook parser
 */
function parseIncomingMessage(body) {
    // Check if it's Cloud API format (has 'entry' field)
    if (body.entry) {
        return parseCloudAPIWebhook(body);
    }
    
    // Otherwise assume Twilio format
    return parseTwilioWebhook(body);
}

/**
 * Verify webhook signature (Twilio)
 */
function verifyTwilioSignature(signature, url, params) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!authToken) {
        return true; // Skip verification if no token configured
    }
    
    try {
        return twilio.validateRequest(authToken, signature, url, params);
    } catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
}

module.exports = {
    sendMessage,
    sendMedia,
    parseIncomingMessage,
    parseTwilioWebhook,
    parseCloudAPIWebhook,
    verifyTwilioSignature
};
