/**
 * QR Code generation service
 * Generates QR codes as PNG buffers for ticket stubs
 */

const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate QR code as PNG buffer
 * @param {Object} data - Data to encode in QR code
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateQRCode(data) {
    try {
        const qrData = typeof data === 'string' ? data : JSON.stringify(data);
        
        const options = {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: parseInt(process.env.QR_CODE_MARGIN) || 2,
            width: parseInt(process.env.QR_CODE_SIZE) || 300,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        };
        
        const buffer = await QRCode.toBuffer(qrData, options);
        
        console.log('✅ QR code generated successfully');
        return buffer;
    } catch (error) {
        console.error('❌ QR code generation failed:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Generate QR code and save to file
 * @param {Object} data - Data to encode
 * @param {String} filePath - Path to save the QR code image
 * @returns {Promise<String>} File path
 */
async function generateQRCodeFile(data, filePath) {
    try {
        const buffer = await generateQRCode(data);
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        // Write file
        await fs.writeFile(filePath, buffer);
        
        console.log(`✅ QR code saved to: ${filePath}`);
        return filePath;
    } catch (error) {
        console.error('❌ QR code file save failed:', error);
        throw error;
    }
}

/**
 * Generate QR code data URL (base64 encoded)
 * @param {Object} data - Data to encode
 * @returns {Promise<String>} Data URL
 */
async function generateQRCodeDataURL(data) {
    try {
        const qrData = typeof data === 'string' ? data : JSON.stringify(data);
        
        const options = {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 2,
            width: 300
        };
        
        const dataURL = await QRCode.toDataURL(qrData, options);
        
        return dataURL;
    } catch (error) {
        console.error('❌ QR code data URL generation failed:', error);
        throw error;
    }
}

/**
 * Create booking QR code data object
 * @param {Object} booking - Booking details
 * @returns {Object} QR code data
 */
function createBookingQRData(booking) {
    return {
        bookingId: booking.booking_id || booking.bookingId,
        eventId: booking.event_id || booking.eventId,
        eventTitle: booking.title || booking.eventTitle,
        quantity: booking.quantity,
        userName: booking.user_name || booking.userName,
        issuedAt: new Date().toISOString(),
        verificationCode: booking.booking_id || booking.bookingId
    };
}

module.exports = {
    generateQRCode,
    generateQRCodeFile,
    generateQRCodeDataURL,
    createBookingQRData
};
