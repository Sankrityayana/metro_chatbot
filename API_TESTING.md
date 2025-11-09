# API Testing Guide

This document contains all API endpoints with example requests for testing.

## Environment Setup

Set these variables for testing:
```bash
BASE_URL=http://localhost:3000
ADMIN_SECRET=your-admin-secret
```

---

## 🏥 Health & Status Endpoints

### 1. Health Check
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T10:30:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

### 2. Service Info
```bash
curl http://localhost:3000/
```

**Expected Response:**
```json
{
  "service": "WhatsApp Ticketing Chatbot",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "webhook": "/webhook",
    "admin": "/admin",
    "health": "/health"
  }
}
```

---

## 🎭 Event Management (Admin)

### 3. List All Events
```bash
curl http://localhost:3000/admin/events ^
  -H "Authorization: Bearer your-admin-secret"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "title": "Rock Concert 2025",
      "city": "Mumbai",
      "venue": "DY Patil Stadium",
      "event_date": "2025-12-15 19:00:00",
      "total_seats": 5000,
      "available_seats": 5000,
      "price": 1500.00
    }
  ]
}
```

### 4. Get Single Event
```bash
curl http://localhost:3000/admin/events/1 ^
  -H "Authorization: Bearer your-admin-secret"
```

### 5. Create New Event
```bash
curl -X POST http://localhost:3000/admin/events ^
  -H "Authorization: Bearer your-admin-secret" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"New Year Party 2026\",\"description\":\"Grand celebration\",\"city\":\"Goa\",\"venue\":\"Beach Resort\",\"event_date\":\"2025-12-31 23:00:00\",\"total_seats\":1000,\"price\":3000.00}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": 6,
    "title": "New Year Party 2026",
    "city": "Goa",
    "total_seats": 1000,
    "available_seats": 1000,
    "price": 3000.00
  }
}
```

### 6. Update Event
```bash
curl -X PUT http://localhost:3000/admin/events/1 ^
  -H "Authorization: Bearer your-admin-secret" ^
  -H "Content-Type: application/json" ^
  -d "{\"price\":1800.00,\"is_active\":1}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "id": 1,
    "title": "Rock Concert 2025",
    "price": 1800.00
  }
}
```

---

## 🎫 Booking Management (Admin)

### 7. List All Bookings
```bash
curl http://localhost:3000/admin/bookings ^
  -H "Authorization: Bearer your-admin-secret"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 10,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "booking_id": "BKG-57RF1A",
      "title": "Rock Concert 2025",
      "user_name": "John Doe",
      "quantity": 2,
      "total_price": 3000.00,
      "status": "confirmed",
      "created_at": "2025-11-09 10:00:00"
    }
  ]
}
```

### 8. Get Single Booking
```bash
curl http://localhost:3000/admin/bookings/BKG-57RF1A ^
  -H "Authorization: Bearer your-admin-secret"
```

### 9. Cancel Booking
```bash
curl -X DELETE http://localhost:3000/admin/bookings/BKG-57RF1A ^
  -H "Authorization: Bearer your-admin-secret"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "bookingId": "BKG-57RF1A"
}
```

---

## 📊 Metrics (Admin)

### 10. Get System Metrics
```bash
curl http://localhost:3000/admin/metrics ^
  -H "Authorization: Bearer your-admin-secret"
```

**Expected Response:**
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

---

## 📱 WhatsApp Webhook (Testing)

### 11. Test Twilio Webhook Format
```bash
curl -X POST http://localhost:3000/webhook ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "From=whatsapp:+919876543210&Body=help&MessageSid=SM123456"
```

### 12. Test WhatsApp Cloud API Format
```bash
curl -X POST http://localhost:3000/webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"entry\":[{\"changes\":[{\"value\":{\"messages\":[{\"from\":\"919876543210\",\"text\":{\"body\":\"help\"},\"id\":\"msg123\"}]}}]}]}"
```

**Note:** Actual responses depend on the message content and current user state.

---

## 🖼️ QR Code Access

### 13. Access QR Code
```bash
curl http://localhost:3000/qr/BKG-57RF1A.png --output ticket.png
```

This downloads the QR code image for the specified booking.

---

## ❌ Error Scenarios

### 14. Unauthorized Access (No Auth)
```bash
curl http://localhost:3000/admin/events
```

**Expected Response:**
```json
{
  "error": "Authorization header required"
}
```

### 15. Invalid Auth Token
```bash
curl http://localhost:3000/admin/events ^
  -H "Authorization: Bearer wrong-secret"
```

**Expected Response:**
```json
{
  "error": "Invalid admin credentials"
}
```

### 16. Invalid Booking ID Format
```bash
curl http://localhost:3000/admin/bookings/INVALID-ID ^
  -H "Authorization: Bearer your-admin-secret"
```

**Expected Response:**
```json
{
  "error": "Invalid booking ID format"
}
```

### 17. Event Not Found
```bash
curl http://localhost:3000/admin/events/9999 ^
  -H "Authorization: Bearer your-admin-secret"
```

**Expected Response:**
```json
{
  "error": "Event not found"
}
```

### 18. Validation Error
```bash
curl -X POST http://localhost:3000/admin/events ^
  -H "Authorization: Bearer your-admin-secret" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"AB\"}"
```

**Expected Response:**
```json
{
  "error": "Validation failed",
  "details": [
    "Title must be at least 3 characters",
    "City is required",
    "Venue is required"
  ]
}
```

---

## 🧪 Testing Workflow

### Complete Booking Flow Test

**1. Search for events (user sends message)**
```bash
# Simulate: "search mumbai"
curl -X POST http://localhost:3000/webhook ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "From=whatsapp:+919876543210&Body=search mumbai&MessageSid=SM1"
```

**2. Select event (user replies with number)**
```bash
# Simulate: "1"
curl -X POST http://localhost:3000/webhook ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "From=whatsapp:+919876543210&Body=1&MessageSid=SM2"
```

**3. Choose quantity**
```bash
# Simulate: "2"
curl -X POST http://localhost:3000/webhook ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "From=whatsapp:+919876543210&Body=2&MessageSid=SM3"
```

**4. Provide name**
```bash
# Simulate: "John Doe"
curl -X POST http://localhost:3000/webhook ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "From=whatsapp:+919876543210&Body=John Doe&MessageSid=SM4"
```

**5. Confirm booking**
```bash
# Simulate: "yes"
curl -X POST http://localhost:3000/webhook ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "From=whatsapp:+919876543210&Body=yes&MessageSid=SM5"
```

---

## 📋 Admin Workflow Test

### Create Event → Get Event → Update → List

```bash
# 1. Create
curl -X POST http://localhost:3000/admin/events ^
  -H "Authorization: Bearer your-admin-secret" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Test Event\",\"city\":\"Mumbai\",\"venue\":\"Test Venue\",\"event_date\":\"2025-12-31 19:00:00\",\"total_seats\":100,\"price\":500}"

# 2. Get (use ID from response, e.g., 6)
curl http://localhost:3000/admin/events/6 ^
  -H "Authorization: Bearer your-admin-secret"

# 3. Update
curl -X PUT http://localhost:3000/admin/events/6 ^
  -H "Authorization: Bearer your-admin-secret" ^
  -H "Content-Type: application/json" ^
  -d "{\"price\":600}"

# 4. List all
curl http://localhost:3000/admin/events ^
  -H "Authorization: Bearer your-admin-secret"
```

---

## 🔍 PowerShell Testing Examples

### Get Events (PowerShell)
```powershell
$headers = @{
    "Authorization" = "Bearer your-admin-secret"
}
Invoke-RestMethod -Uri "http://localhost:3000/admin/events" -Headers $headers
```

### Create Event (PowerShell)
```powershell
$headers = @{
    "Authorization" = "Bearer your-admin-secret"
    "Content-Type" = "application/json"
}
$body = @{
    title = "PowerShell Event"
    city = "Delhi"
    venue = "Test Venue"
    event_date = "2025-12-25 20:00:00"
    total_seats = 500
    price = 1000.00
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/admin/events" -Method Post -Headers $headers -Body $body
```

### Get Metrics (PowerShell)
```powershell
$headers = @{
    "Authorization" = "Bearer your-admin-secret"
}
Invoke-RestMethod -Uri "http://localhost:3000/admin/metrics" -Headers $headers
```

---

## 📝 Notes

- Replace `your-admin-secret` with your actual admin secret from `.env`
- All timestamps are in ISO8601 format or SQLite datetime format
- Prices are in rupees (₹)
- Phone numbers should be in international format without '+'
- Booking IDs follow format: `BKG-XXXXXX` (6 alphanumeric characters)

---

## 🚀 Quick Test Script

Save this as `test-api.ps1`:

```powershell
$BASE_URL = "http://localhost:3000"
$ADMIN_SECRET = "your-admin-secret"

Write-Host "Testing WhatsApp Ticketing Chatbot API..." -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$BASE_URL/health"

# Test 2: List Events
Write-Host "`n2. Listing Events..." -ForegroundColor Yellow
$events = Invoke-RestMethod -Uri "$BASE_URL/admin/events" -Headers @{
    "Authorization" = "Bearer $ADMIN_SECRET"
}
Write-Host "Found $($events.count) events" -ForegroundColor Green

# Test 3: Get Metrics
Write-Host "`n3. Getting Metrics..." -ForegroundColor Yellow
$metrics = Invoke-RestMethod -Uri "$BASE_URL/admin/metrics" -Headers @{
    "Authorization" = "Bearer $ADMIN_SECRET"
}
Write-Host "Total Bookings: $($metrics.data.totalBookings)" -ForegroundColor Green
Write-Host "Total Revenue: ₹$($metrics.data.totalRevenue)" -ForegroundColor Green

Write-Host "`nAll tests completed! ✓" -ForegroundColor Green
```

Run with: `.\test-api.ps1`

---

**End of API Testing Guide**
