# 🚀 24/7 Deployment Guide

## Quick Deploy Options (Choose One)

### ⭐ Option 1: Render.com (Recommended - Easiest)

**Free tier includes:**
- 750 hours/month (24/7 for one service)
- Auto-deploy from GitHub
- Free SSL certificate
- Free PostgreSQL (if needed)

**Steps:**

1. **Push to GitHub** (if not already)
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/Sankrityayana/metro_chatbot.git
   git push -u origin main
   ```

2. **Deploy to Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repo: `Sankrityayana/metro_chatbot`
   - Render auto-detects settings:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
   - Click "Create Web Service"

3. **Add Environment Variables**
   In Render dashboard, go to "Environment" tab and add:
   ```
   ADMIN_SECRET=your-super-secret-admin-password-here
   TWILIO_ACCOUNT_SID=ACd7d263a00040d768cb29965883f88ccc
   TWILIO_AUTH_TOKEN=37800fbb9726194c838668e89dc7b9da
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   WHATSAPP_PROVIDER=twilio
   WHATSAPP_PHONE_NUMBER_ID=796036273603821
   WHATSAPP_ACCESS_TOKEN=EAAc8xMdoZCFkBPxsWblbamZCgyyBEqFYVUoNJ4RiKxZAyoO9YZA9jmExeP85NHPCnf20j51n0Vc1pnxZCa3EfmKRqJj4ZBsOxBUcgQvCzh2baOOrF8GZAnjzZC0kF3v7GHZAGBGqLaoYsaPHlo0gEgUDCEg0q0aagNIYZAPtlADUvdNrNiWwyb3VaM4V12Q85VxYt8iuMrjhZCy0mVM9dHgXbEOZBmojzLrC3J5wYEpxFAsCilaUd24tZBOQuQiOiZAmHK5PZBBAst6ZAwWZBTrf9ZCdaiFTDZAEF3rIQZDZD
   RESERVATION_TTL_MINUTES=5
   MAX_SEARCH_RESULTS=3
   NODE_ENV=production
   ```

4. **Get Your Public URL**
   - Render gives you: `https://metro-chatbot-xxxx.onrender.com`
   - Save this URL for WhatsApp webhook setup

**✅ Done! Your app runs 24/7 for FREE**

---

### Option 2: Railway.app

**Free tier:**
- $5 credit/month (enough for small apps)
- Auto-deploy from GitHub

**Steps:**

1. Go to https://railway.app
2. Click "Start a New Project" → "Deploy from GitHub"
3. Select `Sankrityayana/metro_chatbot`
4. Railway auto-detects Node.js
5. Add environment variables (same as Render)
6. Get your public URL: `https://metro-chatbot-production.up.railway.app`

---

### Option 3: Heroku

**Free tier ended, but first 5 apps = $5/month**

```powershell
# Install Heroku CLI
# Then:
heroku login
heroku create metro-chatbot-india
git push heroku main
heroku config:set TWILIO_ACCOUNT_SID=ACd7d263a00040d768cb29965883f88ccc
# ... add all env vars
heroku open
```

---

## 📱 Part 2: Connect WhatsApp Messages

### For Development (Twilio Sandbox)

1. **Configure Twilio Webhook**
   - Go to: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
   - Set "WHEN A MESSAGE COMES IN":
     ```
     https://your-render-url.onrender.com/webhook
     ```
   - Method: `POST`
   - Click "Save"

2. **Join Sandbox**
   - Send WhatsApp message to: `+1 415 523 8886`
   - Message: `join <your-sandbox-code>`
   - You'll get confirmation

3. **Test It!**
   - Send: `search mumbai`
   - Bot should respond with event list!

---

### For Production (WhatsApp Cloud API)

You already have credentials! Let's activate them:

1. **Switch to Cloud API**
   Update your `.env` on Render:
   ```
   WHATSAPP_PROVIDER=cloud
   ```

2. **Configure Webhook in Meta**
   - Go to: https://developers.facebook.com/apps
   - Your App → WhatsApp → Configuration
   - Set Webhook URL:
     ```
     https://your-render-url.onrender.com/webhook
     ```
   - Verify Token: Use any string (e.g., `metro_verify_token`)
   - Subscribe to: `messages`

3. **Update code to handle verification**
   Your `index.js` already has webhook verification code!

4. **Send Test Message**
   - Message your WhatsApp Business number
   - Bot responds instantly!

---

## 🎯 Quick Setup (Do This Now)

### Step 1: Deploy to Render (5 minutes)

```powershell
# In your project folder
git init
git add .
git commit -m "Deploy WhatsApp Chatbot"
git branch -M main
git remote add origin https://github.com/Sankrityayana/metro_chatbot.git
git push -u origin main
```

Then go to Render.com → Deploy from GitHub

### Step 2: Get Public URL

After deployment, Render gives you:
```
https://metro-chatbot-xxxx.onrender.com
```

### Step 3: Configure Twilio

- Webhook URL: `https://metro-chatbot-xxxx.onrender.com/webhook`
- Join sandbox
- Send test message!

---

## ✅ Verification Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Render/Railway
- [ ] Environment variables added
- [ ] Public URL obtained
- [ ] Twilio webhook configured
- [ ] Sandbox joined
- [ ] Test message sent
- [ ] Bot responded!

---

## 🔧 Troubleshooting

### Bot Not Responding?

1. **Check Logs** (Render Dashboard → Logs)
2. **Verify Webhook URL** (must be HTTPS)
3. **Check Environment Variables**
4. **Test Health Endpoint:**
   ```
   https://your-url.onrender.com/health
   ```

### Database Issues?

Render free tier has ephemeral storage. For persistence:
- Upgrade to paid tier ($7/month)
- OR use external SQLite hosting
- OR switch to PostgreSQL (Render provides free)

---

## 💡 Pro Tips

1. **Keep Alive** (Render free tier sleeps after 15 min)
   - Use UptimeRobot to ping `/health` every 5 minutes
   - OR upgrade to paid tier

2. **Monitor Usage**
   - Check Render metrics
   - Monitor Twilio usage
   - Set up alerts

3. **Backup Database**
   ```powershell
   # Download from Render
   # OR commit to GitHub
   ```

---

## 🎉 Done!

Your chatbot is now:
- ✅ Running 24/7
- ✅ Receiving WhatsApp messages
- ✅ Auto-deploying from GitHub
- ✅ Free (on Render)

**Test it:** Send "search mumbai" to your WhatsApp number!
