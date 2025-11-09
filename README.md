# WhatsApp Ticketing Chatbot 🎫

A complete WhatsApp-based event ticketing chatbot built with Node.js, Express, and SQLite. Users can search events, book tickets, receive QR codes, and manage bookings through simple WhatsApp messages.

## 🎯 Features

### User Features
- **Event Search**: Free-text search by city, event name, or date
- **Step-by-Step Booking**: Guided booking flow with seat reservation
- **Temporary Holds**: 5-minute TTL on seat reservations
- **QR Code Tickets**: Automatic QR code generation for confirmed bookings
- **Booking Management**: Retrieve and view previous bookings
- **Simple Commands**: SEARCH, BOOK, CANCEL, HELP

### Admin Features
- **Event Management**: Create, edit, and list events
- **Booking Management**: View and cancel bookings
- **Metrics Dashboard**: System statistics and revenue tracking

### Technical Features
- **Dual WhatsApp Support**: Twilio Sandbox & WhatsApp Cloud API
- **State Machine**: Session-based conversation flow
- **SQLite Database**: Lightweight, file-based persistence
- **Cron Jobs**: Automatic reservation expiration
- **RESTful Admin API**: Protected with simple auth

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [WhatsApp Setup](#whatsapp-setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Architecture](#architecture)

## 🚀 Installation

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- WhatsApp Business Account (for production) OR Twilio account (for development)

### Quick Start

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd metro_chatbot
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database**
```bash
npm run db:init
```

5. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

The server will start on `http://localhost:3000`

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Admin Authentication
ADMIN_SECRET=your-super-secret-admin-password

# Twilio Configuration (for Sandbox)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# WhatsApp Cloud API (for Production)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# WhatsApp Provider (twilio or cloud)
WHATSAPP_PROVIDER=twilio

# Application Settings
RESERVATION_TTL_MINUTES=5
MAX_SEARCH_RESULTS=3
SESSION_TIMEOUT_MINUTES=30
```

## 📱 WhatsApp Setup

### Option 1: Twilio Sandbox (Development)

**Quick setup for testing:**

1. **Create Twilio Account**
   - Sign up at https://www.twilio.com/try-twilio
   - Get free trial credits

2. **Access WhatsApp Sandbox**
   - Go to Twilio Console → Messaging → Try it out → WhatsApp
   - Note your sandbox number (e.g., +1 415 523 8886)

3. **Join Sandbox**
   - Send "join <your-code>" to the sandbox number from WhatsApp
   - Example: "join happy-tiger"

4. **Configure Webhook**
   - In Twilio Console, set webhook URL to: `https://your-domain.com/webhook`
   - For local testing, use ngrok:
   ```bash
   ngrok http 3000
   # Use the https URL as webhook
   ```

5. **Update .env**
   ```env
   WHATSAPP_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

### Option 2: WhatsApp Cloud API (Production)

**For production deployment:**

1. **Create Meta Business Account**
   - Go to https://developers.facebook.com/
   - Create an app with WhatsApp product

2. **Get Phone Number ID**
   - In WhatsApp → API Setup
   - Note your Phone Number ID

3. **Generate Access Token**
   - Create a permanent access token
   - Store it securely

4. **Configure Webhook**
   - Set webhook URL: `https://your-domain.com/webhook`
   - Verify token: Set in .env as `WEBHOOK_VERIFY_TOKEN`
   - Subscribe to messages

5. **Update .env**
   ```env
   WHATSAPP_PROVIDER=cloud
   WHATSAPP_PHONE_NUMBER_ID=123456789
   WHATSAPP_ACCESS_TOKEN=EAAxxxx...
   ```

## 💬 Usage

### User Commands

**Search Events**
```
User: search mumbai concerts
Bot: [Shows search results]

User: 1
Bot: [Shows event details]
```

**Book Tickets**
```
User: 2
Bot: How many tickets? (1-10)

User: 2
Bot: Please enter your full name

User: John Doe
Bot: [Shows booking summary]

User: YES
Bot: ✅ Booking confirmed! [Sends QR code]
```

**View Bookings**
```
User: my bookings
Bot: [Lists all bookings]
```

**Retrieve Booking**
```
User: BKG-57RF1A
Bot: [Shows booking details + QR code]
```

**Get Help**
```
User: help
Bot: [Shows command menu]
```

**Cancel Operation**
```
User: cancel
Bot: ❌ Operation cancelled
```

### Conversation Flow

```
NONE (Start)
  ↓
SEARCH (Search events)
  ↓
EVENT_SELECTED (View details)
  ↓
QTY (Select quantity)
  ↓
HOLD (Temporary reservation)
  ↓
USER_NAME (Enter name)
  ↓
CONFIRMED (Booking complete)
  ↓
NONE (Reset)
```

## 🔧 API Documentation

### Admin Endpoints

All admin endpoints require authentication:
```
Authorization: Bearer your-admin-secret
```

#### Events

**List Events**
```http
GET /admin/events?activeOnly=true
```

**Get Event**
```http
GET /admin/events/:id
```

**Create Event**
```http
POST /admin/events
Content-Type: application/json

{
  "title": "Rock Concert 2025",
  "description": "Amazing concert",
  "city": "Mumbai",
  "venue": "Stadium",
  "event_date": "2025-12-15 19:00:00",
  "total_seats": 5000,
  "price": 1500.00
}
```

**Update Event**
```http
PUT /admin/events/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "price": 1800.00
}
```

#### Bookings

**List Bookings**
```http
GET /admin/bookings?page=1&limit=20
```

**Get Booking**
```http
GET /admin/bookings/BKG-57RF1A
```

**Cancel Booking**
```http
DELETE /admin/bookings/BKG-57RF1A
```

#### Metrics

**Get System Metrics**
```http
GET /admin/metrics
```

Response:
```json
{
  "success": true,
  "data": {
    "totalEvents": 5,
    "totalBookings": 150,
    "activeReservations": 3,
    "totalRevenue": "225000.00"
  }
}
```

### Examples with cURL

**Create Event**
```bash
curl -X POST http://localhost:3000/admin/events \
  -H "Authorization: Bearer your-admin-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Conference 2025",
    "city": "Bangalore",
    "venue": "Convention Center",
    "event_date": "2025-11-25 09:00:00",
    "total_seats": 2000,
    "price": 2500.00
  }'
```

**Cancel Booking**
```bash
curl -X DELETE http://localhost:3000/admin/bookings/BKG-57RF1A \
  -H "Authorization: Bearer your-admin-secret"
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

### Test Files

Located in `tests/` directory:
- `unit/util.test.js` - Utility functions
- `unit/parser.test.js` - Message parsing
- `integration/booking.test.js` - Booking flow
- `integration/search.test.js` - Search functionality
- `integration/expiration.test.js` - Reservation expiration

### Manual Testing

**Test Webhook Locally**
```bash
# Start server
npm run dev

# In another terminal, use ngrok
ngrok http 3000

# Send test message via Twilio/WhatsApp
```

**Test Admin API**
```bash
# Get events
curl http://localhost:3000/admin/events \
  -H "Authorization: Bearer your-admin-secret"
```

## 🚀 Deployment

### Deploy to Render

1. **Create Render Account**
   - Sign up at https://render.com

2. **Create New Web Service**
   - Connect your GitHub repository
   - Select Node.js environment

3. **Configure Build**
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Set Environment Variables**
   - Add all variables from `.env`
   - Set `NODE_ENV=production`

5. **Deploy**
   - Render will auto-deploy on push

### Deploy to Railway

1. **Create Railway Account**
   - Sign up at https://railway.app

2. **New Project from GitHub**
   - Connect repository
   - Select branch

3. **Configure**
   - Add environment variables
   - Set custom domain (optional)

4. **Deploy**
   - Automatic deployment on push

### Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set ADMIN_SECRET=your-secret
heroku config:set WHATSAPP_PROVIDER=twilio
# ... set all other variables

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Using Docker

```bash
# Build image
docker build -t whatsapp-chatbot .

# Run container
docker run -p 3000:3000 \
  --env-file .env \
  whatsapp-chatbot
```

## 🏗️ Architecture

### Project Structure

```
metro_chatbot/
├── index.js                 # Main Express application
├── package.json             # Dependencies and scripts
├── .env.example            # Environment template
├── README.md               # This file
├── Dockerfile              # Docker configuration
├── Procfile                # Heroku/Railway process file
├── db/
│   ├── db.js              # Database initialization
│   ├── schema.sql         # Database schema
│   └── queries.js         # Database operations
├── services/
│   ├── whatsapp.js        # WhatsApp messaging
│   ├── tickets.js         # Ticket creation
│   ├── qrcode.js          # QR code generation
│   ├── session.js         # Session management
│   └── util.js            # Utility functions
├── flows/
│   ├── router.js          # Message routing & state machine
│   ├── searchFlow.js      # Search functionality
│   ├── bookingFlow.js     # Booking process
│   ├── helpFlow.js        # Help messages
│   └── parser.js          # Message parsing
├── admin/
│   ├── adminRoutes.js     # Admin API endpoints
│   └── validator.js       # Input validation
├── cron/
│   └── expireReservations.js  # Reservation expiration job
└── tests/
    ├── unit/              # Unit tests
    └── integration/       # Integration tests
```

### Database Schema

**Events Table**
- Stores event information (title, date, venue, seats, price)

**Reservations Table**
- Temporary seat holds with TTL
- Auto-expired by cron job

**Bookings Table**
- Confirmed tickets with QR codes
- Linked to events and users

**Sessions Table**
- User conversation state
- Context data for flows

### State Machine

```
NONE → SEARCH → EVENT_SELECTED → QTY → HOLD → USER_NAME → CONFIRMED → NONE
  ↑                                                                      ↓
  └────────────────────────── CANCEL/ERROR ──────────────────────────────┘
```

## 🛠️ Development

### Adding New Events

```javascript
// Via Admin API
POST /admin/events
{
  "title": "New Event",
  "city": "Delhi",
  "venue": "Stadium",
  "event_date": "2025-12-01 20:00:00",
  "total_seats": 3000,
  "price": 800.00,
  "description": "Event description"
}
```

### Customizing Messages

Edit message templates in:
- `flows/helpFlow.js` - Help and error messages
- `flows/searchFlow.js` - Search results format
- `flows/bookingFlow.js` - Booking confirmations

### Adjusting Reservation TTL

```env
# In .env
RESERVATION_TTL_MINUTES=5  # Change to desired minutes
```

### Database Queries

All queries are in `db/queries.js`. Examples:
```javascript
const { searchEvents, createBooking } = require('./db/queries');

// Search
const results = searchEvents('mumbai');

// Create booking
const id = createBooking({
  bookingId: 'BKG-ABC123',
  eventId: 1,
  phone: '919876543210',
  userName: 'John Doe',
  quantity: 2,
  totalPrice: 3000.00
});
```

## 📝 License

MIT License - feel free to use for your projects!

## 🤝 Support

For issues or questions:
1. Check the documentation above
2. Review error logs
3. Test with simple commands (HELP)
4. Verify environment variables

## 🎉 Credits

Built with:
- Express.js
- better-sqlite3
- Twilio WhatsApp API
- qrcode library
- node-cron

---

**Happy Ticketing! 🎫**