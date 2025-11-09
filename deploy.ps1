# Quick Deploy Script
# Run this to deploy your chatbot to production

Write-Host "🚀 WhatsApp Chatbot - Quick Deploy to Render" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is initialized
if (-not (Test-Path .git)) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit - WhatsApp Ticketing Chatbot"
    git branch -M main
    Write-Host "✅ Git initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git already initialized" -ForegroundColor Green
    
    # Commit any changes
    Write-Host "📦 Committing latest changes..." -ForegroundColor Yellow
    git add .
    $commitMsg = Read-Host "Enter commit message (or press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        $commitMsg = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    git commit -m $commitMsg
    Write-Host "✅ Changes committed" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Push to GitHub:" -ForegroundColor Yellow
Write-Host "   git remote add origin https://github.com/Sankrityayana/metro_chatbot.git" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  Deploy to Render.com:" -ForegroundColor Yellow
Write-Host "   a. Go to: https://render.com" -ForegroundColor White
Write-Host "   b. Click 'New +' → 'Web Service'" -ForegroundColor White
Write-Host "   c. Connect GitHub repo: Sankrityayana/metro_chatbot" -ForegroundColor White
Write-Host "   d. Auto-detected settings:" -ForegroundColor White
Write-Host "      - Build Command: npm install" -ForegroundColor Gray
Write-Host "      - Start Command: npm start" -ForegroundColor Gray
Write-Host "   e. Click 'Create Web Service'" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  Add Environment Variables in Render:" -ForegroundColor Yellow
Write-Host "   Copy-paste these in Render dashboard → Environment tab:" -ForegroundColor White
Write-Host ""
Write-Host "   ADMIN_SECRET=your-super-secret-admin-password-here" -ForegroundColor Gray
Write-Host "   TWILIO_ACCOUNT_SID=ACd7d263a00040d768cb29965883f88ccc" -ForegroundColor Gray
Write-Host "   TWILIO_AUTH_TOKEN=37800fbb9726194c838668e89dc7b9da" -ForegroundColor Gray
Write-Host "   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886" -ForegroundColor Gray
Write-Host "   WHATSAPP_PROVIDER=twilio" -ForegroundColor Gray
Write-Host "   WHATSAPP_PHONE_NUMBER_ID=796036273603821" -ForegroundColor Gray
Write-Host "   WHATSAPP_ACCESS_TOKEN=EAAc8xMdoZCFkBPxsWblbamZCgyyBEqFYVUoNJ4RiKxZAyoO9YZA9jmExeP85NHPCnf20j51n0Vc1pnxZCa3EfmKRqJj4ZBsOxBUcgQvCzh2baOOrF8GZAnjzZC0kF3v7GHZAGBGqLaoYsaPHlo0gEgUDCEg0q0aagNIYZAPtlADUvdNrNiWwyb3VaM4V12Q85VxYt8iuMrjhZCy0mVM9dHgXbEOZBmojzLrC3J5wYEpxFAsCilaUd24tZBOQuQiOiZAmHK5PZBBAst6ZAwWZBTrf9ZCdaiFTDZAEF3rIQZDZD" -ForegroundColor Gray
Write-Host "   WEBHOOK_VERIFY_TOKEN=metro_verify_token_2025" -ForegroundColor Gray
Write-Host "   RESERVATION_TTL_MINUTES=5" -ForegroundColor Gray
Write-Host "   MAX_SEARCH_RESULTS=3" -ForegroundColor Gray
Write-Host "   NODE_ENV=production" -ForegroundColor Gray
Write-Host ""

Write-Host "4️⃣  Configure Twilio Webhook:" -ForegroundColor Yellow
Write-Host "   a. Go to: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox" -ForegroundColor White
Write-Host "   b. Set 'WHEN A MESSAGE COMES IN' to:" -ForegroundColor White
Write-Host "      https://your-render-url.onrender.com/webhook" -ForegroundColor Cyan
Write-Host "   c. Method: POST" -ForegroundColor White
Write-Host "   d. Click 'Save'" -ForegroundColor White
Write-Host ""

Write-Host "5️⃣  Join WhatsApp Sandbox:" -ForegroundColor Yellow
Write-Host "   a. Send WhatsApp message to: +1 415 523 8886" -ForegroundColor White
Write-Host "   b. Message: join <your-sandbox-code>" -ForegroundColor White
Write-Host "   c. Wait for confirmation" -ForegroundColor White
Write-Host ""

Write-Host "6️⃣  Test Your Bot:" -ForegroundColor Yellow
Write-Host "   Send to your WhatsApp: search mumbai" -ForegroundColor Cyan
Write-Host ""

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ Deployment preparation complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to push to GitHub now
$pushNow = Read-Host "Do you want to push to GitHub now? (y/n)"
if ($pushNow -eq 'y' -or $pushNow -eq 'Y') {
    Write-Host ""
    Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
    
    # Check if remote exists
    $remoteExists = git remote -v | Select-String "origin"
    if (-not $remoteExists) {
        git remote add origin https://github.com/Sankrityayana/metro_chatbot.git
    }
    
    git push -u origin main
    Write-Host ""
    Write-Host "✅ Pushed to GitHub successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Go to https://render.com to deploy!" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📚 For detailed guide, see: DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
