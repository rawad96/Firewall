import pool from '../config/db';

const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS firewall_rules (
      id SERIAL PRIMARY KEY,
      category VARCHAR(10) NOT NULL,
      type VARCHAR(10) NOT NULL,
      value VARCHAR(255) NOT NULL,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      password_enc_cipher TEXT,
      password_enc_iv TEXT,
      password_enc_tag TEXT,
      full_name VARCHAR(255),
      phone VARCHAR(50),
      role VARCHAR(50) DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Add new columns if they don't exist (for existing databases)
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`);
  } catch (error) {
    console.log("Columns might already exist or error occurred:", error);
  }

  console.log("Table created!");
}

export default createTable;