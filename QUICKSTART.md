# Quick Start Guide 🚀

Get your WhatsApp Ticketing Chatbot running in 5 minutes!

## Step 1: Install Dependencies

```powershell
npm install
```

## Step 2: Set Up Environment

```powershell
# Copy the example environment file
Copy-Item .env.example .env

# Open .env in notepad and edit
notepad .env
```

**Minimum required settings:**
```env
PORT=3000
ADMIN_SECRET=my-secret-password-123
WHATSAPP_PROVIDER=twilio
```

## Step 3: Initialize Database

```powershell
npm run db:init
```

This creates the SQLite database with sample events.

## Step 4: Start the Server

```powershell
npm start
```

You should see:
```
✅ Server running on port 3000
📱 WhatsApp Provider: twilio
```

## Step 5: Test Locally (Optional)

### Test Health Check
```powershell
curl http://localhost:3000/health
```

### Test Admin API
```powershell
curl http://localhost:3000/admin/events -H "Authorization: Bearer my-secret-password-123"
```

## Step 6: Connect to WhatsApp (Twilio Sandbox)

1. **Sign up at Twilio**: https://www.twilio.com/try-twilio

2. **Go to WhatsApp Sandbox**:
   - Console → Messaging → Try it out → Send a WhatsApp message

3. **Join the sandbox**:
   - Send the join code to the Twilio number
   - Example: Send "join happy-tiger" to +1 415 523 8886

4. **Set up ngrok for local testing**:
```powershell
# Install ngrok from https://ngrok.com/download
ngrok http 3000
```

5. **Configure webhook in Twilio**:
   - Copy the ngrok HTTPS URL (e.g., https://abc123.ngrok.io)
   - In Twilio Console, set webhook to: `https://abc123.ngrok.io/webhook`

6. **Update .env with Twilio credentials**:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

7. **Restart the server**:
```powershell
npm start
```

## Step 7: Test the Bot!

Send WhatsApp messages to the Twilio sandbox number:

```
You: help
Bot: [Shows help menu]

You: search mumbai
Bot: [Shows events in Mumbai]

You: 1
Bot: [Shows event details]

You: 2
Bot: [Asks for your name]

You: John Doe
Bot: [Shows booking confirmation]

You: yes
Bot: ✅ Booking confirmed! [Sends QR code]
```

## Common Commands

```powershell
# Development with auto-reload
npm run dev

# Run tests
npm test

# Initialize database
npm run db:init

# Check logs
# Logs appear in the console where you ran npm start
```

## Testing Without WhatsApp

You can test the admin API without WhatsApp setup:

```powershell
# List events
curl http://localhost:3000/admin/events -H "Authorization: Bearer my-secret-password-123"

# Create event
curl -X POST http://localhost:3000/admin/events ^
  -H "Authorization: Bearer my-secret-password-123" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Test Event\",\"city\":\"Mumbai\",\"venue\":\"Test Venue\",\"event_date\":\"2025-12-31 19:00:00\",\"total_seats\":100,\"price\":500}"

# Get metrics
curl http://localhost:3000/admin/metrics -H "Authorization: Bearer my-secret-password-123"
```

## Troubleshooting

**Port already in use?**
```powershell
# Change PORT in .env to a different number
PORT=3001
```

**Database errors?**
```powershell
# Delete old database and reinitialize
Remove-Item db\ticketing.db
npm run db:init
```

**Can't install packages?**
```powershell
# Clear npm cache
npm cache clean --force
npm install
```

**Twilio webhook not working?**
- Make sure ngrok is running
- Use the HTTPS URL (not HTTP)
- Check that your server is running
- Verify the webhook URL is correct in Twilio Console

## Next Steps

1. ✅ Bot is working locally
2. 📱 Connected to WhatsApp sandbox
3. 🔧 Customize event data in `db/schema.sql`
4. 🎨 Customize messages in `flows/` directory
5. 🚀 Deploy to production (see README.md)

## Production Deployment

When ready for production:

1. Sign up for hosting (Render, Railway, or Heroku)
2. Push code to GitHub
3. Connect repository to hosting platform
4. Set environment variables
5. Deploy!

See full deployment instructions in README.md.

---

**Questions?** Check the main README.md for detailed documentation!
