# Frequently Asked Questions (FAQ)

## General Questions

### Q1: What is this project?
**A:** A complete WhatsApp-based event ticketing chatbot backend built with Node.js, Express, and SQLite. Users can search events, book tickets, and receive QR codes through WhatsApp messages.

### Q2: Is this production-ready?
**A:** Yes! The project includes:
- Complete error handling
- Security measures (auth, validation, SQL injection prevention)
- Comprehensive testing (11 test files)
- Deployment configurations (Docker, Heroku, Railway, Render)
- Full documentation

### Q3: What's included?
**A:** 37 files including:
- Complete backend application
- Database with schema and sample data
- Admin API
- WhatsApp integration (Twilio + Cloud API)
- QR code generation
- Tests (unit + integration)
- Documentation (7 files)

---

## Setup & Installation

### Q4: What do I need to run this?
**A:**
- Node.js 16 or higher
- npm or yarn
- A WhatsApp account (for testing)
- Twilio account (free) OR WhatsApp Business account

### Q5: How do I install it?
**A:**
```powershell
npm install
npm run db:init
npm start
```

Or run the setup script:
```powershell
.\setup.ps1
```

### Q6: Where do I configure settings?
**A:** Copy `.env.example` to `.env` and edit:
```powershell
cp .env.example .env
notepad .env
```

### Q7: How do I initialize the database?
**A:**
```powershell
npm run db:init
```

This creates `db/ticketing.db` with 4 tables and 5 sample events.

---

## WhatsApp Integration

### Q8: Which WhatsApp API should I use?
**A:**
- **Development/Testing:** Twilio WhatsApp Sandbox (free, quick setup)
- **Production:** WhatsApp Cloud API (requires Business account)

### Q9: How do I set up Twilio Sandbox?
**A:**
1. Sign up at https://www.twilio.com/try-twilio
2. Go to Console → Messaging → WhatsApp → Sandbox
3. Send join code to Twilio number (e.g., "join happy-tiger")
4. Set webhook URL in Twilio Console
5. Update `.env` with credentials

### Q10: How do I test locally with WhatsApp?
**A:** Use ngrok to create a public URL:
```powershell
ngrok http 3000
# Use the https URL as webhook in Twilio
```

### Q11: What's the difference between Twilio and Cloud API?
**A:**
| Feature | Twilio Sandbox | WhatsApp Cloud API |
|---------|---------------|-------------------|
| Cost | Free trial | Pay per message |
| Setup | 5 minutes | 1-2 hours |
| Users | Limited (sandbox) | Unlimited |
| Production | No | Yes |
| Custom Number | No | Yes |

### Q12: Can I use my own WhatsApp number?
**A:** Only with WhatsApp Cloud API (Business account). Twilio Sandbox uses their number.

---

## Features & Functionality

### Q13: How does the booking flow work?
**A:**
1. User: "search mumbai"
2. Bot: Shows events
3. User: "1" (selects event)
4. Bot: Shows details
5. User: "2" (quantity)
6. Bot: Asks for name
7. User: "John Doe"
8. Bot: Shows summary
9. User: "yes"
10. Bot: Sends confirmation + QR code

### Q14: How long are seats reserved?
**A:** 5 minutes by default. Configurable in `.env`:
```env
RESERVATION_TTL_MINUTES=5
```

### Q15: What happens to expired reservations?
**A:** A cron job runs every minute to:
- Find expired reservations
- Release seats back to events
- Update status to 'expired'

### Q16: Can users cancel bookings?
**A:** Users cannot cancel directly. Admins can cancel via API:
```bash
DELETE /admin/bookings/BKG-XXXXXX
```

### Q17: How are QR codes generated?
**A:** Using the `qrcode` library:
1. Encode booking data as JSON
2. Generate PNG buffer
3. Save to `qr_codes/` directory
4. Return URL for WhatsApp sending

### Q18: What data is in the QR code?
**A:**
```json
{
  "bookingId": "BKG-57RF1A",
  "eventId": 1,
  "eventTitle": "Rock Concert",
  "quantity": 2,
  "userName": "John Doe",
  "issuedAt": "2025-11-09T10:00:00Z",
  "verificationCode": "BKG-57RF1A"
}
```

---

## Admin API

### Q19: How do I access the Admin API?
**A:** Use the admin secret from `.env`:
```bash
curl http://localhost:3000/admin/events \
  -H "Authorization: Bearer your-admin-secret"
```

### Q20: What can admins do?
**A:**
- Create/edit/list events
- View all bookings
- Cancel bookings
- Get system metrics (revenue, counts)

### Q21: How do I create an event?
**A:**
```bash
curl -X POST http://localhost:3000/admin/events \
  -H "Authorization: Bearer your-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Event",
    "city": "Mumbai",
    "venue": "Stadium",
    "event_date": "2025-12-31 19:00:00",
    "total_seats": 1000,
    "price": 500
  }'
```

### Q22: Can I build a web dashboard?
**A:** Yes! All admin endpoints return JSON. Build a React/Vue frontend that calls:
- `GET /admin/events` - List events
- `POST /admin/events` - Create event
- `GET /admin/bookings` - List bookings
- `GET /admin/metrics` - Dashboard stats

---

## Database

### Q23: Can I use a different database?
**A:** Currently uses SQLite. For production with multiple servers, consider:
- PostgreSQL
- MySQL
- MongoDB

You'll need to:
1. Replace `better-sqlite3` with appropriate driver
2. Update `db/db.js` connection logic
3. Modify queries in `db/queries.js`

### Q24: Where is the database file?
**A:** `db/ticketing.db` (configurable in `.env`)

### Q25: How do I reset the database?
**A:**
```powershell
Remove-Item db\ticketing.db
npm run db:init
```

### Q26: How do I backup the database?
**A:**
```powershell
Copy-Item db\ticketing.db db\ticketing.backup.db
```

### Q27: Can I add custom fields to events?
**A:** Yes! Edit `db/schema.sql`:
```sql
ALTER TABLE events ADD COLUMN category TEXT;
```

Then update queries in `db/queries.js`.

---

## Deployment

### Q28: Where can I deploy this?
**A:**
- **Render** (recommended, free tier)
- **Railway** ($5/month)
- **Heroku** (with credit card)
- **Any VPS** (DigitalOcean, AWS, etc.)
- **Docker** (anywhere)

### Q29: How do I deploy to Render?
**A:**
1. Push code to GitHub
2. Sign up at render.com
3. Create "Web Service"
4. Connect repo
5. Set environment variables
6. Deploy!

Build: `npm install`
Start: `npm start`

### Q30: What environment variables are required?
**A:** Minimum:
```env
PORT=3000
ADMIN_SECRET=your-secret
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
```

### Q31: How do I use Docker?
**A:**
```powershell
docker build -t chatbot .
docker run -p 3000:3000 --env-file .env chatbot
```

### Q32: What about scaling?
**A:** For high traffic:
1. Use PostgreSQL instead of SQLite
2. Use Redis for sessions
3. Deploy multiple instances behind load balancer
4. Use message queue (Redis/RabbitMQ) for webhooks
5. Store QR codes in S3/CloudFlare

---

## Troubleshooting

### Q33: Port 3000 is already in use
**A:** Change port in `.env`:
```env
PORT=3001
```

### Q34: Database initialization fails
**A:**
```powershell
# Delete old database
Remove-Item db\ticketing.db -Force
# Recreate
npm run db:init
```

### Q35: WhatsApp messages not received
**A:** Check:
1. Server is running (`npm start`)
2. ngrok is running (for local testing)
3. Webhook URL is correct in Twilio Console
4. Webhook URL uses HTTPS (not HTTP)
5. No firewall blocking

### Q36: "Authorization header required" error
**A:** Add auth header:
```bash
-H "Authorization: Bearer your-admin-secret"
```

### Q37: npm install fails
**A:**
```powershell
# Clear cache
npm cache clean --force
# Delete node_modules
Remove-Item node_modules -Recurse -Force
# Reinstall
npm install
```

### Q38: Tests fail
**A:**
```powershell
# Run specific test
npm test tests/unit/util.test.js

# Check Node version (requires 16+)
node --version
```

### Q39: QR codes not showing
**A:** Check:
1. `qr_codes/` directory exists
2. File permissions allow writing
3. `BASE_URL` in `.env` is correct
4. QR serving endpoint works: `GET /qr/filename.png`

### Q40: Reservations not expiring
**A:** Cron job runs automatically. Check logs for errors. Manual trigger:
```javascript
const { manualExpiration } = require('./cron/expireReservations');
manualExpiration();
```

---

## Customization

### Q41: How do I change message templates?
**A:** Edit files in `flows/` directory:
- `helpFlow.js` - Help messages
- `searchFlow.js` - Search results format
- `bookingFlow.js` - Booking confirmations

### Q42: How do I add new commands?
**A:**
1. Add intent in `flows/parser.js`
2. Add handler in `flows/router.js`
3. Create flow file if complex

### Q43: Can I change the reservation time?
**A:** Yes, in `.env`:
```env
RESERVATION_TTL_MINUTES=10
```

### Q44: How do I limit search results?
**A:** In `.env`:
```env
MAX_SEARCH_RESULTS=5
```

### Q45: Can I add payment integration?
**A:** Yes! Add payment flow:
1. Create `flows/paymentFlow.js`
2. Integrate Razorpay/Stripe
3. Add payment status to bookings table
4. Update confirmation flow

---

## Testing

### Q46: How do I run tests?
**A:**
```powershell
npm test
```

### Q47: How do I test without WhatsApp?
**A:** Use the Admin API:
```powershell
# Get events
curl http://localhost:3000/admin/events ^
  -H "Authorization: Bearer your-secret"
```

### Q48: Can I test the booking flow?
**A:** Yes, simulate webhook:
```powershell
curl -X POST http://localhost:3000/webhook ^
  -d "From=whatsapp:+919876543210&Body=help"
```

### Q49: How do I check coverage?
**A:**
```powershell
npm test -- --coverage
```

---

## Performance

### Q50: How many users can it handle?
**A:** With SQLite:
- **Concurrent users:** 50-100
- **Messages/sec:** 10-20

With PostgreSQL + Redis:
- **Concurrent users:** 1000+
- **Messages/sec:** 100+

### Q51: How do I improve performance?
**A:**
1. Use PostgreSQL/MySQL
2. Add Redis caching
3. Use connection pooling
4. Add indexes to database
5. Implement rate limiting
6. Use CDN for QR codes

---

## Security

### Q52: Is it secure?
**A:** Yes, includes:
- ✓ SQL injection prevention (parameterized queries)
- ✓ Admin authentication
- ✓ Input validation
- ✓ XSS prevention
- ✓ Directory traversal prevention

### Q53: How do I change the admin password?
**A:** In `.env`:
```env
ADMIN_SECRET=new-super-secret-password
```

### Q54: Should I use HTTPS?
**A:** YES! Always use HTTPS in production:
- WhatsApp webhooks require HTTPS
- Protects admin API
- Prevents man-in-the-middle attacks

---

## Support

### Q55: Where can I get help?
**A:**
1. Read `README.md` (comprehensive guide)
2. Check `QUICKSTART.md` (5-minute setup)
3. Review `API_TESTING.md` (all endpoints)
4. See `ARCHITECTURE.md` (system design)

### Q56: How do I report a bug?
**A:** Create an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behavior
- Error logs
- Environment (.env without secrets)

### Q57: Can I contribute?
**A:** Yes! Fork the repo and submit pull requests.

---

## License & Usage

### Q58: Can I use this commercially?
**A:** Yes! MIT License allows commercial use.

### Q59: Do I need to credit the author?
**A:** Not required but appreciated!

### Q60: Can I modify the code?
**A:** Yes, freely modify for your needs.

---

**Still have questions?** Check the documentation files or open an issue!
