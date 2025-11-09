# PowerShell Setup Script for WhatsApp Ticketing Chatbot
# Run this script in PowerShell to set up the project

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   WhatsApp Ticketing Chatbot - Setup Script   " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm installation
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 1: Installing Dependencies" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 2: Setting up Environment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "⚠ .env file already exists. Skipping..." -ForegroundColor Yellow
} else {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "⚠ Please edit .env file with your configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 3: Initializing Database" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Create db directory if it doesn't exist
if (-not (Test-Path "db")) {
    New-Item -ItemType Directory -Path "db" | Out-Null
}

# Initialize database
npm run db:init

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to initialize database!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Database initialized with sample events" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 4: Creating Required Directories" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Create qr_codes directory
if (-not (Test-Path "qr_codes")) {
    New-Item -ItemType Directory -Path "qr_codes" | Out-Null
    Write-Host "✓ Created qr_codes directory" -ForegroundColor Green
} else {
    Write-Host "⚠ qr_codes directory already exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Edit .env file with your configuration:" -ForegroundColor White
Write-Host "   notepad .env" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Or start the production server:" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test the health endpoint:" -ForegroundColor White
Write-Host "   curl http://localhost:3000/health" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Read the documentation:" -ForegroundColor White
Write-Host "   - README.md - Full documentation" -ForegroundColor Gray
Write-Host "   - QUICKSTART.md - 5-minute guide" -ForegroundColor Gray
Write-Host "   - ARCHITECTURE.md - System design" -ForegroundColor Gray
Write-Host ""

Write-Host "For WhatsApp setup, see:" -ForegroundColor Cyan
Write-Host "https://www.twilio.com/try-twilio (Sandbox)" -ForegroundColor Gray
Write-Host ""

Write-Host "Happy coding! 🎉" -ForegroundColor Green
