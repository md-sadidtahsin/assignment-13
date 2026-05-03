const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if can't connect
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

// Check if measurements table exists
const checkTableExists = async () => {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'measurements'
      );
    `);
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking if table exists:', error);
    return false;
  }
};

// Run migration to create measurements table
const runMigration = async () => {
  try {
    // Run first migration (create table)
    const migration1Path = path.join(__dirname, '..', 'migrations', '001_create_measurements.sql');
    const migration1SQL = fs.readFileSync(migration1Path, 'utf8');
    await pool.query(migration1SQL);
    console.log('✅ Measurements table created successfully via migration 001');

    // Run second migration (add measurement_date column if needed)
    const migration2Path = path.join(__dirname, '..', 'migrations', '002_add_measurement_date.sql');
    const migration2SQL = fs.readFileSync(migration2Path, 'utf8');
    await pool.query(migration2SQL);
    console.log('✅ Migration 002 completed successfully');
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
};

// Test connection and run migrations if needed
pool.query('SELECT NOW()', async (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);

    // Check if measurements table exists
    const tableExists = await checkTableExists();
    if (!tableExists) {
      console.log('📋 Measurements table not found, running migration...');
      await runMigration();
    } else {
      console.log('✅ Measurements table already exists');
    }
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};