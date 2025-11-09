-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    city TEXT NOT NULL,
    venue TEXT NOT NULL,
    event_date TEXT NOT NULL, -- ISO8601 format: YYYY-MM-DD HH:MM:SS
    total_seats INTEGER NOT NULL DEFAULT 0,
    available_seats INTEGER NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0.00,
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

-- Insert sample events for testing
INSERT INTO events (title, description, city, venue, event_date, total_seats, available_seats, price)
VALUES 
    ('Rock Concert 2025', 'Amazing rock concert featuring top bands', 'Mumbai', 'DY Patil Stadium', '2025-12-15 19:00:00', 5000, 5000, 1500.00),
    ('Tech Conference', 'Annual technology conference with industry leaders', 'Bangalore', 'KTPO Convention Center', '2025-11-25 09:00:00', 2000, 2000, 2500.00),
    ('Comedy Night Live', 'Stand-up comedy show with famous comedians', 'Delhi', 'Jawaharlal Nehru Stadium', '2025-12-01 20:00:00', 3000, 3000, 800.00),
    ('Classical Music Evening', 'Traditional Indian classical music performance', 'Chennai', 'Music Academy', '2025-11-20 18:30:00', 1500, 1500, 500.00),
    ('Food Festival', 'Street food festival with cuisines from across India', 'Pune', 'Koregaon Park Grounds', '2025-12-10 11:00:00', 10000, 10000, 200.00);
