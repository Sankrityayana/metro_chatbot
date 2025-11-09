/**
 * Database initialization and connection module
 * Uses better-sqlite3 for synchronous SQLite operations
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './db/ticketing.db';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

/**
 * Initialize database connection and run migrations
 */
function initializeDatabase() {
    try {
        // Ensure db directory exists
        const dbDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Create or open database
        db = new Database(DB_PATH, { verbose: console.log });
        
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        
        console.log('✅ Database connected successfully');

        // Run schema migrations
        runMigrations();

        return db;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

/**
 * Run database migrations from schema.sql
 */
function runMigrations() {
    try {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            db.exec(statement);
        }

        console.log('✅ Database migrations completed');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

/**
 * Get database instance
 */
function getDatabase() {
    if (!db) {
        return initializeDatabase();
    }
    return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('Database connection closed');
    }
}

// Initialize database on module load
if (require.main === module) {
    // Run as standalone script
    initializeDatabase();
    console.log('Database initialized successfully');
    process.exit(0);
} else {
    // Imported as module
    initializeDatabase();
}

module.exports = {
    getDatabase,
    closeDatabase,
    initializeDatabase
};
