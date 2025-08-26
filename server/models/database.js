// models/database.js
const sqlite3 = require('sqlite3').verbose();
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

// Database configuration
const config = {
  sqlite: {
    path: path.join(__dirname, '../databases/farming_proposals.db')
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'm77ag'
  },
  // Default to SQLite but allow override via environment variable
  driver: process.env.DB_DRIVER || 'sqlite'
};

// Create databases directory if it doesn't exist
const dbDir = path.join(__dirname, '../databases');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// SQLite implementation
class SqliteDatabase {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(config.sqlite.path, (err) => {
        if (err) {
          console.error('Error connecting to SQLite database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async query(sql, params = []) {
    // Ensure database is initialized before any query
    if (!this.initialized) {
      await this.initSchema();
    }
    
    return new Promise((resolve, reject) => {
      const isSelect = sql.trim().toLowerCase().startsWith('select');
      
      if (isSelect) {
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            console.error('Error executing query:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        });
      } else {
        this.db.run(sql, params, function(err) {
          if (err) {
            console.error('Error executing query:', err);
            reject(err);
          } else {
            resolve({ 
              lastID: this.lastID, 
              changes: this.changes,
              insertId: this.lastID // For compatibility with MongoDB implementation
            });
          }
        });
      }
    });
  }

  async initSchema() {
    if (this.initialized) return;
    
    try {
      // Create tables if they don't exist
      const tables = [
        `CREATE TABLE IF NOT EXISTS proposals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER,
          customer_name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          service_type TEXT NOT NULL,
          acres REAL NOT NULL,
          application_rate TEXT,
          notes TEXT,
          discount REAL DEFAULT 0,
          total_cost REAL NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          zip TEXT,
          notes TEXT,
          total_acres REAL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS chemicals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          quantity REAL NOT NULL,
          unit_of_measure TEXT NOT NULL,
          cost_per_unit REAL NOT NULL,
          markup_percentage REAL DEFAULT 0,
          min_stock_level REAL DEFAULT 0,
          supplier TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS programs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          crop_type TEXT NOT NULL,
          season TEXT,
          application_method TEXT NOT NULL,
          application_rate TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS program_chemicals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          program_id INTEGER NOT NULL,
          chemical_id INTEGER NOT NULL,
          rate REAL NOT NULL,
          unit TEXT NOT NULL,
          FOREIGN KEY (program_id) REFERENCES programs (id),
          FOREIGN KEY (chemical_id) REFERENCES chemicals (id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          order_date DATE NOT NULL,
          status TEXT DEFAULT 'pending',
          payment_method TEXT,
          payment_status TEXT DEFAULT 'unpaid',
          shipping_address TEXT,
          notes TEXT,
          total_amount REAL NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          chemical_id INTEGER NOT NULL,
          quantity REAL NOT NULL,
          price REAL NOT NULL,
          unit TEXT NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders (id),
          FOREIGN KEY (chemical_id) REFERENCES chemicals (id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS farm_costs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          description TEXT,
          amount REAL NOT NULL,
          date DATE NOT NULL,
          field_id TEXT,
          crop_type TEXT,
          payment_method TEXT,
          receipt_image TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        )`
      ];

      // Execute each CREATE TABLE statement
      for (const tableQuery of tables) {
        await new Promise((resolve, reject) => {
          this.db.run(tableQuery, (err) => {
            if (err) {
              console.error('Error creating table:', err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }

      // Create default admin user if it doesn't exist
      const adminPassword = process.env.ADMIN_PASSWORD || 'M77admin2024!';
      await new Promise((resolve, reject) => {
        this.db.run(`
          INSERT OR IGNORE INTO users (username, email, password, role)
          VALUES ('admin', 'admin@m77ag.com', ?, 'admin')
        `, [adminPassword], (err) => {
          if (err) {
            console.error('Error creating admin user:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      this.initialized = true;
      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Error initializing schema:', error);
      throw error;
    }
  }

  async close() {
    if (!this.db) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing SQLite database:', err);
          reject(err);
        } else {
          console.log('SQLite database connection closed');
          this.db = null;
          this.initialized = false;
          resolve();
        }
      });
    });
  }
}

// MongoDB implementation
class MongoDatabase {
  constructor() {
    this.client = null;
    this.db = null;
    this.initialized = false;
  }

  async connect() {
    try {
      this.client = await MongoClient.connect(config.mongodb.uri);
      this.db = this.client.db(config.mongodb.dbName);
      console.log('Connected to MongoDB database');
      return this.db;
    } catch (err) {
      console.error('Error connecting to MongoDB database:', err);
      throw err;
    }
  }

  async query(sql, params = []) {
    // Ensure database is initialized before any query
    if (!this.initialized) {
      await this.initSchema();
    }
    
    // This is a simplified SQL-to-MongoDB adapter
    // In a real application, you would use a proper SQL parser
    
    // Extract collection name from SQL
    const sqlLower = sql.toLowerCase();
    let collection = '';
    
    if (sqlLower.includes('from ')) {
      collection = sql.split('from ')[1].split(' ')[0].replace(/`|\[|\]|"/g, '');
    } else if (sqlLower.includes('into ')) {
      collection = sql.split('into ')[1].split(' ')[0].replace(/`|\[|\]|"/g, '');
    } else if (sqlLower.includes('update ')) {
      collection = sql.split('update ')[1].split(' ')[0].replace(/`|\[|\]|"/g, '');
    } else if (sqlLower.includes('delete from ')) {
      collection = sql.split('delete from ')[1].split(' ')[0].replace(/`|\[|\]|"/g, '');
    }

    // Basic operation detection
    if (sqlLower.startsWith('select')) {
      return this.handleSelect(collection, sql, params);
    } else if (sqlLower.startsWith('insert')) {
      return this.handleInsert(collection, sql, params);
    } else if (sqlLower.startsWith('update')) {
      return this.handleUpdate(collection, sql, params);
    } else if (sqlLower.startsWith('delete')) {
      return this.handleDelete(collection, sql, params);
    } else if (sqlLower.startsWith('create table')) {
      // No-op for MongoDB as collections are created implicitly
      return { ok: 1 };
    } else {
      throw new Error(`Unsupported SQL operation: ${sql}`);
    }
  }

  async handleSelect(collection, sql, params) {
    // Very simplified - would need proper SQL parsing in production
    let filter = {};
    
    // Extract WHERE clause if it exists
    if (sql.toLowerCase().includes('where ')) {
      const whereClause = sql.split(/where /i)[1].split(/order by|group by|limit/i)[0].trim();
      
      // Handle basic ID lookups
      if (whereClause.includes('id = ?')) {
        filter = { _id: params[0] };
      }
      // Handle other WHERE conditions here...
    }
    
    return this.db.collection(collection).find(filter).toArray();
  }

  async handleInsert(collection, sql, params) {
    // Extract columns and values from SQL
    // This is a simplified approach
    const document = {};
    
    // For parameterized queries, match placeholders with params
    if (sql.includes('(') && sql.includes(')') && sql.includes('VALUES')) {
      const columnsStr = sql.split('(')[1].split(')')[0];
      const columns = columnsStr.split(',').map(col => col.trim());
      
      for (let i = 0; i < columns.length; i++) {
        document[columns[i]] = params[i];
      }
    }
    
    // Add created_at timestamp
    document.created_at = new Date();
    
    const result = await this.db.collection(collection).insertOne(document);
    return { insertId: result.insertedId, ok: 1 };
  }

  async handleUpdate(collection, sql, params) {
    // Extract SET and WHERE clauses
    const setClause = sql.split(/set /i)[1].split(/where/i)[0].trim();
    let filter = {};
    
    // Handle WHERE clause
    if (sql.toLowerCase().includes('where ')) {
      const whereClause = sql.split(/where /i)[1].trim();
      
      // Handle basic ID lookups
      if (whereClause.includes('id = ?')) {
        filter = { _id: params[params.length - 1] }; // Assuming ID is the last parameter
      }
    }
    
    // Build update document
    const updateDoc = { $set: {} };
    
    // Add updated_at timestamp
    updateDoc.$set.updated_at = new Date();
    
    // Add other fields from SET clause
    const setParts = setClause.split(',');
    let paramIndex = 0;
    
    for (const part of setParts) {
      if (part.includes('=')) {
        const [field, value] = part.split('=').map(s => s.trim());
        if (value === '?') {
          updateDoc.$set[field] = params[paramIndex++];
        }
      }
    }
    
    const result = await this.db.collection(collection).updateOne(filter, updateDoc);
    return { changes: result.modifiedCount, ok: 1 };
  }

  async handleDelete(collection, sql, params) {
    let filter = {};
    
    // Extract WHERE clause
    if (sql.toLowerCase().includes('where ')) {
      const whereClause = sql.split(/where /i)[1].trim();
      
      // Handle basic ID lookups
      if (whereClause.includes('id = ?')) {
        filter = { _id: params[0] };
      }
    }
    
    const result = await this.db.collection(collection).deleteOne(filter);
    return { changes: result.deletedCount, ok: 1 };
  }

  async initSchema() {
    if (this.initialized) return;
    
    try {
      // Create collections implicitly when used
      // Create indexes for performance
      await this.db.collection('proposals').createIndex({ customer_id: 1 });
      await this.db.collection('proposals').createIndex({ status: 1 });
      await this.db.collection('customers').createIndex({ email: 1 }, { unique: true });
      await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await this.db.collection('users').createIndex({ username: 1 }, { unique: true });
      
      // Create default admin user if it doesn't exist
      const adminPassword = process.env.ADMIN_PASSWORD || 'M77admin2024!';
      await this.db.collection('users').updateOne(
        { email: 'admin@m77ag.com' },
        { 
          $setOnInsert: { 
            username: 'admin',
            email: 'admin@m77ag.com',
            password: adminPassword, // In a real application, hash this password
            role: 'admin',
            created_at: new Date()
          }
        },
        { upsert: true }
      );
      
      this.initialized = true;
      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Error initializing schema:', error);
      throw error;
    }
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('MongoDB database connection closed');
      this.client = null;
      this.db = null;
      this.initialized = false;
    }
  }
}

// Create database instance based on configured driver
let database;
if (config.driver === 'mongodb') {
  database = new MongoDatabase();
} else {
  database = new SqliteDatabase();
}

// Ensure database is initialized before export
const initDatabase = async () => {
  try {
    await database.connect();
    await database.initSchema();
    console.log('Database initialized successfully');
    return database;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Export an object with async initialization
module.exports = database;