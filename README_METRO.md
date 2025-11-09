# 🚇 Bangalore Metro Booking Bot

**Book Bangalore Metro (Namma Metro) tickets instantly via WhatsApp!**

This WhatsApp chatbot allows passengers to search metro trains, book tickets, and receive QR codes for metro entry - all through simple WhatsApp messages.

---

## ✨ Features

### 🎫 For Passengers
- 🔍 **Search Trains** - Find metro trains by station, route, or line
- 📱 **Instant Booking** - Book tickets in seconds via WhatsApp
- ⏳ **Seat Reservation** - Temporary holds (5 minutes) while you complete booking
- 🎟️ **QR Code Tickets** - Get scannable QR codes for metro entry gates
- 💳 **Booking Management** - View and retrieve your tickets anytime
- 🚇 **Real-time Availability** - See available seats before booking

### 👨‍💼 For Admins
- ➕ **Manage Routes** - Add/edit metro routes and schedules
- 📊 **View Analytics** - Track bookings and revenue metrics
- ❌ **Cancel Tickets** - Manage cancellations and refunds
- 🔒 **Secure API** - Protected admin endpoints with authentication

---

## 🚇 Supported Metro Lines

### Purple Line (Baiyappanahalli - Whitefield)
- Baiyappanahalli → MG Road
- Indiranagar → Cubbon Park
- Cubbon Park → Baiyappanahalli
- MG Road → Jayanagar

### Green Line (Nagasandra - Silk Institute)
- Yeshwanthpur → Majestic
- Rajajinagar → Vidhana Soudha
- Majestic → Peenya Industry
- Sandal Soap Factory → Yeshwanthpur

*More routes being added!*

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- WhatsApp Business Account (or Twilio Sandbox for testing)
- Git

### Installation

```powershell
# Clone the repository
git clone https://github.com/Sankrityayana/metro_chatbot.git
cd metro_chatbot

# Install dependencies
npm install

# Set up environment variables
copy .env.example .env
# Edit .env with your credentials

# Initialize database with metro routes
npm run db:init

# Start the server
npm start
```

**Server runs on:** `http://localhost:3000`

---

## 📱 How to Use (For Passengers)

### 1. Search for Trains
```
search majestic
search purple line
search mg road
```

### 2. Select Train
```
1  (or 2, 3 depending on results)
```

### 3. Enter Number of Tickets
```
2  (1-10 tickets)
```

### 4. Provide Your Name
```
Rahul Kumar
```

### 5. Receive QR Code! 🎉
You'll get:
- Booking confirmation
- Booking ID (e.g., BKG-ABC123)
- QR code for metro entry

### Other Commands
```
my bookings    - View all your tickets
BKG-ABC123     - Retrieve specific ticket
help           - Show help menu
cancel         - Cancel current operation
```

---

## 🔧 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Admin
ADMIN_SECRET=your-secret-password

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
WHATSAPP_PROVIDER=twilio

# WhatsApp Cloud API (Production)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PROVIDER=cloud

# Application Settings
BASE_URL=http://localhost:3000
RESERVATION_TTL_MINUTES=5
MAX_SEARCH_RESULTS=3

# Database
DB_PATH=./db/ticketing.db
```

---

## 📊 Admin API

### Authentication
All admin endpoints require bearer token:
```
Authorization: Bearer your-secret-password
```

### Endpoints

#### Get All Metro Routes
```powershell
curl http://localhost:3000/admin/events `
  -H "Authorization: Bearer your-secret-password"
```

#### Add New Metro Route
```powershell
curl -X POST http://localhost:3000/admin/events `
  -H "Authorization: Bearer your-secret-password" `
  -H "Content-Type: application/json" `
  -d '{
    "title": "Purple Line Morning",
    "description": "Trinity to MG Road - Peak service",
    "city": "Bangalore",
    "venue": "Trinity → MG Road",
    "event_date": "2025-11-10 08:00:00",
    "total_seats": 300,
    "price": 25
  }'
```

#### View All Bookings
```powershell
curl http://localhost:3000/admin/bookings `
  -H "Authorization: Bearer your-secret-password"
```

#### Get Metrics
```powershell
curl http://localhost:3000/admin/metrics `
  -H "Authorization: Bearer your-secret-password"
```

**Full API documentation:** See `API_TESTING.md`

---

## 🚀 Deployment (24/7 Operation)

### Option 1: Render.com (Recommended - Free)

1. **Push to GitHub**
   ```powershell
   git init
   git add .
   git commit -m "Bangalore Metro Booking Bot"
   git remote add origin https://github.com/Sankrityayana/metro_chatbot.git
   git push -u origin main
   ```

2. **Deploy to Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect repo: `Sankrityayana/metro_chatbot`
   - Auto-detected build: `npm install`
   - Auto-detected start: `npm start`
   - Add environment variables from `.env`
   - Deploy!

3. **Configure WhatsApp Webhook**
   - Go to Twilio Console
   - Set webhook: `https://your-app.onrender.com/webhook`
   - Method: POST
   - Save

**You're live! 🎉**

### Option 2: Railway.app
Same steps, use https://railway.app instead.

### Option 3: Docker
```powershell
docker build -t bangalore-metro-bot .
docker run -p 3000:3000 --env-file .env bangalore-metro-bot
```

**Detailed deployment guide:** See `DEPLOYMENT_GUIDE.md`

---

## 🧪 Testing

### Run All Tests
```powershell
npm test
```

### Test Specific Features
```powershell
npm test -- search.test.js
npm test -- booking.test.js
```

### Test Admin API Locally
```powershell
# List routes
curl http://localhost:3000/admin/events `
  -H "Authorization: Bearer your-super-secret-admin-password-here"

# Add route
curl -X POST http://localhost:3000/admin/events `
  -H "Authorization: Bearer your-super-secret-admin-password-here" `
  -H "Content-Type: application/json" `
  -d '{"title":"Test Route","city":"Bangalore","venue":"A → B","event_date":"2025-12-01 10:00:00","total_seats":100,"price":20}'
```

---

## 📁 Project Structure

```
metro_chatbot/
├── db/
│   ├── db.js              # Database connection
│   ├── schema.sql         # Metro routes schema + sample data
│   └── queries.js         # Database operations
├── services/
│   ├── whatsapp.js        # WhatsApp integration
│   ├── tickets.js         # Ticket & QR generation
│   ├── qrcode.js          # QR code service
│   ├── session.js         # Session management
│   └── util.js            # Helper functions
├── flows/
│   ├── router.js          # Message routing & state machine
│   ├── searchFlow.js      # Train search logic
│   ├── bookingFlow.js     # Booking process
│   ├── helpFlow.js        # Help messages
│   └── parser.js          # Input parsing
├── admin/
│   ├── adminRoutes.js     # Admin API endpoints
│   └── validator.js       # Authentication & validation
├── cron/
│   └── expireReservations.js  # Auto-expire seats
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── index.js               # Main Express server
├── package.json           # Dependencies
└── .env                   # Configuration
```

---

## 🎯 Sample Conversation Flow

```
User: search majestic
Bot: 🚇 Metro Trains for "majestic"
     Found 2 train(s):
     
     1. Green Line Morning
     🚉 Yeshwanthpur → Majestic
     🕐 Departure: Nov 9, 2025 9:00 AM
     💰 ₹25.00 per ticket
     🎫 350 seats available
     
     2. Green Line Evening
     🚉 Majestic → Peenya Industry
     🕐 Departure: Nov 9, 2025 6:00 PM
     💰 ₹35.00 per ticket
     🎫 350 seats available
     
     Reply with the number (1-2) to book your ticket.

User: 1
Bot: ✅ Quantity Selected: 1 ticket(s)
     Ready to book? Reply with number of tickets (1-10).

User: 2
Bot: ⏳ Seats Reserved!
     🎫 2 ticket(s) held for you
     Please reply with your full name for the booking.

User: Priya Sharma
Bot: 🎉 METRO TICKET CONFIRMED!
     📋 Booking ID: BKG-XYZ789
     🚇 Train: Green Line Morning
     🚉 Route: Yeshwanthpur → Majestic
     🕐 Departure: Nov 9, 2025 9:00 AM
     👤 Passenger: Priya Sharma
     🎫 Tickets: 2
     💰 Total Fare: ₹50.00
     
     [QR Code Image Sent]
     
     Happy journey with Bangalore Metro! 🚇
```

---

## 🔒 Security Features

- ✅ Bearer token authentication for admin API
- ✅ Input validation and sanitization
- ✅ Rate limiting (recommended for production)
- ✅ Webhook signature verification
- ✅ SQL injection protection (prepared statements)
- ✅ Environment variable security

---

## 🛠️ Customization

### Change Reservation Hold Time
Edit `.env`:
```env
RESERVATION_TTL_MINUTES=10  # Default: 5
```

### Add More Metro Routes
Use Admin API or edit `db/schema.sql`:
```sql
INSERT INTO events (title, description, city, venue, event_date, total_seats, available_seats, price)
VALUES ('Yellow Line', 'New route', 'Bangalore', 'Station A → Station B', '2025-12-01 10:00:00', 400, 400, 30.00);
```

### Customize Messages
Edit files in `flows/`:
- `helpFlow.js` - Help and welcome messages
- `searchFlow.js` - Search results formatting
- `bookingFlow.js` - Booking confirmations
- `tickets.js` - Ticket messages

---

## 📞 Support

- 📧 Issues: https://github.com/Sankrityayana/metro_chatbot/issues
- 📚 Documentation: See `FAQ.md` for common questions
- 🔧 API Reference: See `API_TESTING.md`

---

## 📄 License

MIT License - see LICENSE file

---

## 🎉 Credits

Built for **Bangalore Metro (Namma Metro)** passengers.

**Technologies:**
- Node.js + Express
- SQLite (better-sqlite3)
- Twilio / WhatsApp Cloud API
- QR Code generation
- Cron jobs for automation

---

## 🚀 Next Steps

1. ✅ Set up `.env` file
2. ✅ Run `npm run db:init`
3. ✅ Start with `npm start`
4. ✅ Configure WhatsApp webhook
5. ✅ Test with sample messages
6. ✅ Deploy to Render/Railway
7. ✅ Go live! 🎉

**Happy Metro Travels! 🚇**
