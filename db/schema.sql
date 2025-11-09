-- Metro Routes Table (replaces Events)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL, -- Route name like "Purple Line - North-South"
    description TEXT, -- Route description
    city TEXT NOT NULL, -- Always "Bangalore" for this system
    venue TEXT NOT NULL, -- From Station → To Station (e.g., "Nagasandra → Yelachenahalli")
    event_date TEXT NOT NULL, -- Departure time in ISO8601 format: YYYY-MM-DD HH:MM:SS
    total_seats INTEGER NOT NULL DEFAULT 0, -- Total capacity per train
    available_seats INTEGER NOT NULL DEFAULT 0, -- Available seats
    price REAL NOT NULL DEFAULT 0.00, -- Ticket price in INR
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1 -- 1 = active, 0 = inactive
);

-- Reservations Table (Temporary holds with TTL)
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    phone TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reserved_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, expired, confirmed
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Bookings Table (Confirmed tickets)
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT NOT NULL UNIQUE, -- Friendly ID like BKG-57RF1A
    event_id INTEGER NOT NULL,
    phone TEXT NOT NULL,
    user_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    total_price REAL NOT NULL,
    qr_code_data TEXT, -- JSON encoded data for QR
    qr_code_url TEXT, -- URL or path to QR image
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, cancelled
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Sessions Table (User conversation state)
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL DEFAULT 'NONE', -- NONE, SEARCH, EVENT_SELECTED, QTY, HOLD, USER_NAME, CONFIRMED
    context TEXT, -- JSON encoded context data
    last_activity TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_reservations_phone ON reservations(phone);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_sessions_phone ON sessions(phone);

-- Insert Bangalore Metro routes for testing
-- Purple Line (North-South): Challaghatta - Whitefield (Baiyappanahalli)
-- Green Line (East-West): Nagasandra - Silk Institute
-- Note: Using 'venue' field for route (From → To), 'title' for line name
INSERT INTO events (title, description, city, venue, event_date, total_seats, available_seats, price)
VALUES 
    ('Purple Line Express', 'Baiyappanahalli to MG Road - Fast service', 'Bangalore', 'Baiyappanahalli → MG Road', '2025-11-09 08:00:00', 300, 300, 30.00),
    ('Green Line Morning', 'Yeshwanthpur to Majestic - Peak hour service', 'Bangalore', 'Yeshwanthpur → Majestic', '2025-11-09 09:00:00', 350, 350, 25.00),
    ('Purple Line Peak', 'Indiranagar to Cubbon Park - Morning rush', 'Bangalore', 'Indiranagar → Cubbon Park', '2025-11-09 08:30:00', 300, 300, 20.00),
    ('Green Line Express', 'Rajajinagar to Vidhana Soudha - Fast service', 'Bangalore', 'Rajajinagar → Vidhana Soudha', '2025-11-09 10:00:00', 350, 350, 25.00),
    ('Purple Line Afternoon', 'MG Road to Jayanagar - Afternoon service', 'Bangalore', 'MG Road → Jayanagar', '2025-11-09 14:00:00', 300, 300, 30.00),
    ('Green Line Evening', 'Majestic to Peenya Industry - Evening service', 'Bangalore', 'Majestic → Peenya Industry', '2025-11-09 18:00:00', 350, 350, 35.00),
    ('Purple Line Late', 'Cubbon Park to Baiyappanahalli - Late evening', 'Bangalore', 'Cubbon Park → Baiyappanahalli', '2025-11-09 20:00:00', 300, 300, 30.00),
    ('Green Line Night', 'Sandal Soap Factory to Yeshwanthpur - Night service', 'Bangalore', 'Sandal Soap Factory → Yeshwanthpur', '2025-11-09 21:00:00', 350, 350, 25.00);
